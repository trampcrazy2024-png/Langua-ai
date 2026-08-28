/**
 * Node-native mirror of gateway/gateway.py's capability-based router.
 *
 * MIGRATION STATUS (step 1 of a gradual server.ts <- gateway.py merge):
 * this module reimplements the same interface gateway.py exposes over
 * HTTP (discover Ollama models, route by capability, fail over to
 * optional cloud providers, per-provider cooldown) as a plain
 * in-process TypeScript function, callable directly from server.ts.
 *
 * It reads the exact same environment variables as gateway/.env.example
 * (OLLAMA_BASE_URL, OLLAMA_MODEL_PREFERENCE, DEEPSEEK_*, MINIMAX_*,
 * GLM_*, KIMI_*, PROVIDERS_JSON, PROVIDER_COOLDOWN) so a single .env
 * can configure either backend without translation.
 *
 * server.ts picks between this module and the Python gateway via
 * AI_BACKEND=node|gateway (see server.ts). Nothing here deletes or
 * changes gateway/gateway.py - both implementations exist side by side
 * until AI_BACKEND=node has been exercised enough to trust as the
 * default, at which point gateway.py can be retired.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

export interface RouteOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  /** "speaking" = live spoken-conversation turn, where latency matters
   * more than picking the exact preferred model name; anything else
   * (including omitted) keeps the previous quality-first ranking. */
  task?: string;
}

export interface RouteResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  capabilities: string[];
}

interface Provider {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  kind: "ollama" | "openai";
  priority: number;
  capabilities: Set<string>;
  metadata: Record<string, unknown>;
  failedUntil: number;
}

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
function getPreferred(): string[] {
  return (process.env.OLLAMA_MODEL_PREFERENCE ?? "qwen3:4b,qwen3-4b")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
const ROUTER_TIMEOUT_MS = Number(process.env.GATEWAY_TIMEOUT ?? 45) * 1000;
const COOLDOWN_MS = Number(process.env.PROVIDER_COOLDOWN ?? 20) * 1000;
const DISCOVERY_CACHE_MS = 10_000;

function configured(p: Provider): boolean {
  return p.kind === "ollama" || Boolean(p.apiKey);
}
function available(p: Provider): boolean {
  return configured(p) && Date.now() >= p.failedUntil;
}

async function fetchJson(
  method: string,
  url: string,
  payload?: unknown,
  headers?: Record<string, string>,
  timeoutMs: number = ROUTER_TIMEOUT_MS,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const init: RequestInit = {
      method,
      headers: {
        Accept: "application/json",
        ...(payload !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
      signal: controller.signal,
    };
    if (payload !== undefined) init.body = JSON.stringify(payload);
    const res = await fetch(url, init);
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
    return raw ? JSON.parse(raw) : {};
  } finally {
    clearTimeout(timer);
  }
}

let ollamaCache: { at: number; providers: Provider[] } = { at: 0, providers: [] };

/** Test-only: forces the next discoverOllamaModels() call to re-fetch
 * instead of serving the 10s cache. Not used by the running app. */
export function _resetDiscoveryCacheForTests(): void {
  ollamaCache = { at: 0, providers: [] };
}

/** Mirrors gateway.py's ollama_models(): discover installed models and
 * best-effort inspect each for vision/embedding capability via /api/show. */
async function discoverOllamaModels(): Promise<Provider[]> {
  const now = Date.now();
  if (now - ollamaCache.at < DISCOVERY_CACHE_MS) return ollamaCache.providers;

  const found: Provider[] = [];
  try {
    const tags = await fetchJson("GET", `${OLLAMA_BASE}/api/tags`, undefined, undefined, Math.min(ROUTER_TIMEOUT_MS, 8000));
    for (const item of tags.models ?? []) {
      const name: string | undefined = item.name ?? item.model;
      if (!name) continue;
      const caps = new Set<string>(["chat"]);
      const meta: Record<string, unknown> = { size: item.size, digest: item.digest };
      try {
        const show = await fetchJson("POST", `${OLLAMA_BASE}/api/show`, { name }, undefined, 5000);
        const details = show.details ?? {};
        const families = String(details.families ?? "");
        const capsStr = String(show.capabilities ?? "").toLowerCase();
        if (families.toLowerCase().includes("clip") || capsStr.includes("vision")) caps.add("vision");
        if (capsStr.includes("embedding")) caps.add("embedding");
        meta.parameter_size = details.parameter_size;
        meta.quantization = details.quantization_level;
        meta.families = families;
      } catch {
        // best-effort; older Ollama versions may omit /api/show fields
      }
      found.push({
        name: `ollama:${name}`,
        baseUrl: `${OLLAMA_BASE}/v1`,
        model: name,
        apiKey: "",
        kind: "ollama",
        priority: 10,
        capabilities: caps,
        metadata: meta,
        failedUntil: 0,
      });
    }
  } catch (e) {
    console.error(`[ai-router] Ollama discovery failed: ${(e as Error).message}`);
  }

  const rank = new Map<string, number>(getPreferred().map((n, i): [string, number] => [n, i]));
  found.sort((a, b) => {
    const ra = rank.get(a.model) ?? 999;
    const rb = rank.get(b.model) ?? 999;
    if (ra !== rb) return ra - rb;
    const sa = Number(a.metadata.size ?? Number.MAX_SAFE_INTEGER);
    const sb = Number(b.metadata.size ?? Number.MAX_SAFE_INTEGER);
    if (sa !== sb) return sa - sb;
    return a.model.localeCompare(b.model);
  });

  ollamaCache = { at: now, providers: found };
  return found;
}

function envProvider(
  name: string,
  baseEnv: string,
  defaultBase: string,
  modelEnv: string,
  defaultModel: string,
  keyEnv: string,
  priority: number,
): Provider {
  return {
    name,
    baseUrl: (process.env[baseEnv] ?? defaultBase).replace(/\/$/, ""),
    model: process.env[modelEnv] ?? defaultModel,
    apiKey: process.env[keyEnv] ?? "",
    kind: "openai",
    priority,
    capabilities: new Set(["chat"]),
    metadata: {},
    failedUntil: 0,
  };
}

/** Mirrors gateway.py's build_chain(), plus task-aware re-ranking of the
 * local candidates: for a "speaking" turn (live spoken conversation),
 * latency matters more than matching OLLAMA_MODEL_PREFERENCE exactly, so
 * the smallest installed model goes first instead. Any other task keeps
 * discoverOllamaModels()'s default (preference-name, then size) order. */
async function buildChain(task: string = "chat"): Promise<Provider[]> {
  let local = await discoverOllamaModels();
  if (local.length === 0) {
    // Ollama discovery temporarily unavailable: keep an explicit
    // configured model as a probe, same as gateway.py does.
    const fallbackModel = process.env.OLLAMA_MODEL || getPreferred()[0] || "qwen3:4b";
    local = [
      {
        name: `ollama:${fallbackModel}`,
        baseUrl: `${OLLAMA_BASE}/v1`,
        model: fallbackModel,
        apiKey: "",
        kind: "ollama",
        priority: 10,
        capabilities: new Set(["chat"]),
        metadata: {},
        failedUntil: 0,
      },
    ];
  } else if (task === "speaking") {
    local = [...local].sort((a, b) => {
      const sa = Number(a.metadata.size ?? Number.MAX_SAFE_INTEGER);
      const sb = Number(b.metadata.size ?? Number.MAX_SAFE_INTEGER);
      if (sa !== sb) return sa - sb;
      return a.model.localeCompare(b.model);
    });
  }

  const chain: Provider[] = [
    ...local,
    envProvider("deepseek", "DEEPSEEK_BASE_URL", "https://api.deepseek.com", "DEEPSEEK_MODEL", "deepseek-chat", "DEEPSEEK_API_KEY", 30),
    envProvider("minimax", "MINIMAX_BASE_URL", "https://api.minimaxi.com", "MINIMAX_MODEL", "MiniMax-M2.7", "MINIMAX_API_KEY", 40),
    envProvider("glm", "GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4", "GLM_MODEL", "glm-4-flash", "GLM_API_KEY", 50),
    envProvider("kimi", "KIMI_BASE_URL", "https://api.moonshot.cn/v1", "KIMI_MODEL", "moonshot-v1-8k", "KIMI_API_KEY", 60),
  ];

  try {
    const extra = JSON.parse(process.env.PROVIDERS_JSON ?? "[]");
    if (Array.isArray(extra)) {
      extra.forEach((x: any, i: number) => {
        if (!x || typeof x !== "object" || !x.base_url || !x.model) return;
        chain.push({
          name: String(x.name ?? `custom-${i + 1}`),
          baseUrl: String(x.base_url).replace(/\/$/, ""),
          model: String(x.model),
          apiKey: String(x.api_key ?? ""),
          kind: "openai",
          priority: 100 + i,
          capabilities: new Set(x.capabilities ?? ["chat"]),
          metadata: {},
          failedUntil: 0,
        });
      });
    }
  } catch {
    // malformed PROVIDERS_JSON is ignored, same as gateway.py
  }

  return chain.sort((a, b) => a.priority - b.priority);
}

function needsVision(messages: ChatMessage[]): boolean {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((part) => part.type === "image_url"),
  );
}

function providerHeaders(p: Provider): Record<string, string> {
  return p.kind === "ollama" ? { Authorization: "Bearer ollama" } : { Authorization: `Bearer ${p.apiKey}` };
}

async function tryProvider(p: Provider, messages: ChatMessage[], options: RouteOptions): Promise<any | null> {
  const payload: Record<string, unknown> = {
    model: p.model,
    messages,
    temperature: options.temperature ?? 0.7,
    top_p: options.top_p ?? 0.9,
  };
  if (options.max_tokens) payload.max_tokens = options.max_tokens;
  try {
    const result = await fetchJson("POST", `${p.baseUrl}/chat/completions`, payload, providerHeaders(p));
    if (result.choices) return result;
    throw new Error("empty choices");
  } catch (e) {
    p.failedUntil = Date.now() + COOLDOWN_MS;
    console.error(`[ai-router] ${p.name} failed: ${(e as Error).message}`);
    return null;
  }
}

export interface StreamChunk {
  /** Newly-arrived text since the last chunk (empty on the final "done" chunk). */
  delta: string;
  done: boolean;
  provider?: string;
  model?: string;
}

/**
 * Streaming counterpart to routeChat(): same provider selection/failover
 * (vision filtering, cooldown, task-aware ranking), but yields text as it
 * arrives instead of waiting for the full completion - real end-to-end
 * streaming for perceived-latency, not a fake typing effect over an
 * already-complete response. If a provider's stream ends with no text at
 * all (e.g. connection drop before any token arrived), falls through to
 * the next provider exactly like routeChat() does; once even one chunk of
 * real text has been yielded from a provider, this commits to that
 * provider for the rest of the reply rather than silently switching mid-
 * stream to a different one.
 */
export async function* routeChatStream(
  messages: ChatMessage[],
  options: RouteOptions = {}
): AsyncGenerator<StreamChunk> {
  const vision = needsVision(messages);
  const errors: string[] = [];
  const chain = await buildChain(options.task ?? "chat");

  for (const p of chain) {
    if (!available(p)) {
      errors.push(`${p.name}: unavailable`);
      continue;
    }
    if (vision && !p.capabilities.has("vision")) {
      errors.push(`${p.name}: no vision`);
      continue;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ROUTER_TIMEOUT_MS);
    let gotAnyText = false;
    try {
      const payload: Record<string, unknown> = {
        model: p.model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        stream: true,
      };
      if (options.max_tokens) payload.max_tokens = options.max_tokens;

      const res = await fetch(`${p.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...providerHeaders(p) },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) continue;
          let json: any;
          try {
            json = JSON.parse(dataStr);
          } catch {
            continue; // malformed/partial SSE line - skip it, don't abort the whole stream
          }
          const delta: string = json?.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            gotAnyText = true;
            yield { delta, done: false, provider: p.name, model: p.model };
          }
        }
      }

      if (gotAnyText) {
        yield { delta: "", done: true, provider: p.name, model: p.model };
        return;
      }
      errors.push(`${p.name}: empty stream`);
    } catch (e) {
      if (gotAnyText) {
        // We already committed to this provider and yielded real text to
        // the caller; a broken connection now can't be silently retried
        // on a different provider without corrupting what's already been
        // shown, so surface it instead of guessing.
        throw new Error(`${p.name} stream interrupted: ${(e as Error).message}`);
      }
      p.failedUntil = Date.now() + COOLDOWN_MS;
      errors.push(`${p.name}: failed (${(e as Error).message})`);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`All suitable AI providers failed: ${errors.join("; ")}`);
}


/** Mirrors gateway.py's route(): try each eligible provider in priority
 * order until one returns real content, honoring vision-capability
 * filtering and per-provider cooldown. */
export async function routeChat(messages: ChatMessage[], options: RouteOptions = {}): Promise<RouteResult> {
  const vision = needsVision(messages);
  const errors: string[] = [];
  const chain = await buildChain(options.task ?? "chat");

  for (const p of chain) {
    if (!available(p)) {
      errors.push(`${p.name}: unavailable`);
      continue;
    }
    if (vision && !p.capabilities.has("vision")) {
      errors.push(`${p.name}: no vision`);
      continue;
    }
    const started = Date.now();
    const result = await tryProvider(p, messages, options);
    if (result) {
      const text = String(result.choices?.[0]?.message?.content ?? "").trim();
      if (!text) {
        errors.push(`${p.name}: empty content`);
        continue;
      }
      return {
        text,
        provider: p.name,
        model: p.model,
        latencyMs: Date.now() - started,
        capabilities: [...p.capabilities].sort(),
      };
    }
    errors.push(`${p.name}: failed`);
  }

  throw new Error(`All suitable AI providers failed: ${errors.join("; ")}`);
}

/** For /health: same shape as gateway.py's Provider.describe(), so the
 * two backends are comparable while both exist. */
export async function describeProviders(task: string = "chat"): Promise<Array<Record<string, unknown>>> {
  const chain = await buildChain(task);
  return chain.map((p) => ({
    name: p.name,
    model: p.model,
    kind: p.kind,
    configured: configured(p),
    available: available(p),
    capabilities: [...p.capabilities].sort(),
  }));
}
