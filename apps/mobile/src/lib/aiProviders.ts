// AIProvider abstraction.
//
//   UI (ChatTab.tsx)
//     |
//     v
//   AiProvider  <-- this file
//     |             |                \
//  autoProvider  gatewayProvider   nativeProvider
//     |             |                |
//  tries native   server.ts (HTTP) LocalAI Capacitor plugin (llama.cpp)
//  then gateway
//
// The UI only ever calls provider.chat(...) - it never imports
// ../services/localAI or ../lib/net directly for chat. This is what makes
// adding a third provider later (or changing how any existing one works) a
// change to this file only, not to ChatTab.tsx.
//
// Priority order (per project direction): on-device llama.cpp first when a
// model is loaded, then the gateway (which itself prefers local Ollama
// before any optional cloud fallback - see aiRouter.ts / gateway/gateway.py).
// Cloud is always the last resort, never the default.

import LocalAI from "../services/localAI";
import { localAIChat } from "./localAIChat";
import { apiUrl, getOpenRouterApiKey, getGeminiApiKey, getOllamaBaseUrl } from "./config";

export type AiProviderKey = "auto" | "gateway" | "native" | "cloud";

export interface ChatTurn {
  sender: "user" | "companion";
  text: string;
}

export interface ChatRequest {
  message: string;
  history: ChatTurn[];
  dialect: string;
  personaName: string;
  personaTrait: string;
  /** Task hint for capability-aware routing (see aiRouter.ts / gateway.py
   * scoring). Defaults to "chat" server-side when omitted. */
  task?: "chat" | "speaking";
  /** Language Memory: the learner's own recurring mistakes for this
   * dialect (see languageMemoryStore.ts), so the model can watch for and
   * reinforce them instead of the learner having to repeat the correction
   * every time. */
  knownMistakes?: string[];
  /** Adaptive Difficulty: a CEFR-ish level computed from real practice
   * history (see levelStore.ts), so the reply's vocabulary/grammar
   * complexity matches the learner instead of a fixed difficulty. */
  levelHint?: string;
  /** Context Manager: a rolling summary of conversation turns older than
   * what's included verbatim in `history` (see conversationContext.ts),
   * so long sessions don't lose earlier context just because it was
   * trimmed out of the raw history sent this turn. */
  conversationSummary?: string;
}

export interface AiProvider {
  key: AiProviderKey;
  label: string;
  description: string;
  chat(payload: ChatRequest): Promise<string>;
}

/**
 * Same prompt shape as server.ts's handleChat() (natural reply, then
 * "فارسی:" / "اصلاح:" lines), flattened into one message. Kept in sync
 * by hand for now so a native reply and a gateway reply are formatted
 * the same way for ChatTab.tsx to parse.
 */
function buildFlatPrompt(payload: ChatRequest): string {
  const transcript = payload.history
    .map((h) => `${h.sender === "user" ? "Learner" : payload.personaName || "Companion"}: ${h.text}`)
    .join("\n");
  return [
    `You are ${payload.personaName || "a travel companion"}, a language conversation partner for a learner of ${payload.dialect || "the target dialect"}.`,
    payload.personaTrait ? `Persona trait: ${payload.personaTrait}.` : "",
    payload.levelHint ? `The learner's current level is ${payload.levelHint}; keep your vocabulary and grammar at that level.` : "",
    payload.knownMistakes && payload.knownMistakes.length > 0
      ? `The learner has recurring mistakes to watch for and gently correct if they reappear: ${payload.knownMistakes.join(" | ")}`
      : "",
    payload.conversationSummary ? `Earlier in this conversation (summary): ${payload.conversationSummary}` : "",
    "Reply naturally in the target dialect/language as the character.",
    "After your natural reply, on separate lines provide:",
    "فارسی: a concise Persian meaning of your reply.",
    "اصلاح: only if the learner made a meaningful language mistake; otherwise write اصلاح: بدون اصلاح.",
    transcript ? `Conversation so far:\n${transcript}` : "",
    `Learner: ${payload.message}`,
    `${payload.personaName || "Companion"}:`,
  ]
    .filter(Boolean)
    .join("\n");
}


const CLOUD_TIMEOUT_MS = 25_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = CLOUD_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function openRouterText(prompt: string, maxTokens = 900): Promise<string> {
  const key = getOpenRouterApiKey();
  if (!key) throw new Error("OPENROUTER_KEY_MISSING");
  const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://github.com/trampcrazy2024-png/Langua-ai",
      "X-OpenRouter-Title": "Langua AI",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${data?.error?.message ?? "request failed"}`);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenRouter returned an empty response");
  return text.trim();
}

async function geminiText(prompt: string, maxTokens = 900): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) throw new Error("GEMINI_KEY_MISSING");
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${data?.error?.message ?? "request failed"}`);
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

async function freeCloudText(prompt: string, maxTokens = 900): Promise<string> {
  const errors: string[] = [];
  if (getOpenRouterApiKey()) {
    try { return await openRouterText(prompt, maxTokens); }
    catch (e) { errors.push(String(e)); }
  }
  if (getGeminiApiKey()) {
    try { return await geminiText(prompt, maxTokens); }
    catch (e) { errors.push(String(e)); }
  }
  if (!getOpenRouterApiKey() && !getGeminiApiKey()) {
    throw new Error("برای مسیر اینترنتی مستقیم، کلید OpenRouter یا Gemini را در تنظیمات وارد کنید.");
  }
  throw new Error(`سرویس اینترنتی در دسترس نبود؛ مسیر بعدی را امتحان کنید. ${errors.join(" | ")}`);
}

async function ollamaText(prompt: string, maxTokens = 900): Promise<string> {
  const base = getOllamaBaseUrl();
  if (!base) throw new Error("OLLAMA_NOT_CONFIGURED");
  const model = localStorage.getItem("travelapp_ollama_model") || "qwen3:4b";
  const res = await fetchWithTimeout(`${base.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
  }, 20_000);
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Ollama returned an empty response");
  return String(text).trim();
}

async function freeCloudChat(payload: ChatRequest): Promise<string> {
  return freeCloudText(buildFlatPrompt(payload));
}

function buildScenarioPrompt(payload: { message: string; history: ChatTurn[]; dialect: string; personaName: string; personaTrait: string; personaOccupation?: string; scenario: any }): string {
  const transcript = payload.history.map((h) => `${h.sender === "user" ? "Learner" : payload.personaName || "Companion"}: ${h.text}`).join("\n");
  return [
    `You are ${payload.personaName || "a travel companion"}, a language conversation partner for a learner of ${payload.dialect || "the target dialect"}.`,
    payload.personaTrait ? `Persona trait: ${payload.personaTrait}.` : "",
    payload.personaOccupation ? `Your occupation: ${payload.personaOccupation}.` : "",
    payload.scenario ? `Scenario: ${payload.scenario.titleFa || ""} — ${payload.scenario.location || ""}. Goal: ${payload.scenario.objectiveFa || ""}.` : "",
    "Reply naturally in the target dialect/language as the character.",
    "After your natural reply, on separate lines provide: فارسی: a concise Persian meaning. اصلاح: only if needed, otherwise اصلاح: بدون اصلاح.",
    "If the scenario objective was fully achieved, append [OBJECTIVE_COMPLETE] at the very end.",
    transcript ? `Conversation so far:\n${transcript}` : "",
    `Learner: ${payload.message}`,
    `${payload.personaName || "Companion"}:`,
  ].filter(Boolean).join("\n");
}

export async function internetScenarioChat(payload: { message: string; history: ChatTurn[]; dialect: string; personaName: string; personaTrait: string; personaOccupation?: string; scenario: any }): Promise<string> {
  return freeCloudText(buildScenarioPrompt(payload));
}

export async function internetScenarioReport(payload: { transcript: ChatTurn[]; scenarioTitle: string; objectiveFa: string; dialect: string }): Promise<any> {
  const transcriptText = payload.transcript.map((t) => `${t.sender === "user" ? "Learner" : "Companion"}: ${t.text}`).join("\n");
  const prompt = [
    `Analyze this ${payload.dialect || "Arabic"} learning conversation. Scenario: ${payload.scenarioTitle || ""}.`,
    `Objective: ${payload.objectiveFa || ""}.`,
    `Transcript:\n${transcriptText}`,
    'Return STRICT JSON with exactly this shape: {"objectiveAchieved": boolean, "summaryFa": "string", "strengthsFa": ["string"], "improvementsFa": ["string"], "newVocabulary": [{"phrase": "string", "meaningFa": "string"}]}',
    "All prose in Persian. newVocabulary: at most 5 items.",
  ].join("\n");
  const raw = await freeCloudText(prompt, 1200);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("گزارش سناریو از سرویس اینترنتی قابل پردازش نبود.");
  try { return JSON.parse(match[0]); } catch { throw new Error("گزارش سناریو JSON معتبر برنگرداند."); }
}

export const cloudProvider: AiProvider = {
  key: "cloud",
  label: "اینترنت رایگان",
  description: "بدون سرور شخصی؛ ابتدا OpenRouter Free و سپس Gemini با سهمیه رایگان را امتحان می‌کند. کلیدها فقط روی همین دستگاه ذخیره می‌شوند.",
  chat: freeCloudChat,
};

export const gatewayProvider: AiProvider = {
  key: "gateway",
  label: "گیت‌وی",
  description: "ارسال به سرور/گیت‌وی محلی شما (که خودش ابتدا Ollama و سپس در صورت نیاز Cloud را امتحان می‌کند) — نیاز به یک گیت‌وی در دسترس دارد.",
  async chat(payload) {
    return localAIChat(payload);
  },
};

// Bug fix (Android device testing, issue #2): "GGUF model loads but no
// reply ever comes" traced to nativeProvider.chat() having no timeout at
// all - CPU-only inference for a multi-billion-parameter model on a phone
// (n_threads=4, see android/app/src/main/cpp/localai_jni.cpp) can
// legitimately take a long time per reply, and with autoProvider's silent
// fallback-on-failure only triggering on a *thrown* error, a slow-but-not-
// failing native call just left the loading spinner running with no
// feedback and no way to distinguish "still working" from "actually
// stuck" - indistinguishable from a hang from the learner's side. This
// caps it at a generous but finite duration so it always resolves one way
// or another, and autoProvider's existing fallback-to-gateway still kicks
// in normally when this timeout fires.
const NATIVE_GENERATION_TIMEOUT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

export const nativeProvider: AiProvider = {
  key: "native",
  label: "روی خود گوشی",
  description: "اجرای کامل روی دستگاه با llama.cpp — بدون نیاز به هیچ سرور یا اینترنتی، اما نیاز به بارگذاری یک مدل GGUF دارد.",
  async chat(payload) {
    let health;
    try {
      health = await LocalAI.healthCheck();
    } catch {
      throw new Error("موتور هوش مصنوعی محلی (llama.cpp) روی این دستگاه در دسترس نیست.");
    }
    if (!health.available) {
      throw new Error("موتور محلی روی این دستگاه/پلتفرم پشتیبانی نمی‌شود؛ به «گیت‌وی» تغییر دهید.");
    }
    if (!health.modelLoaded) {
      throw new Error("هنوز مدلی روی دستگاه بارگذاری نشده — یک فایل مدل GGUF انتخاب و بارگذاری کنید، یا به «گیت‌وی» تغییر دهید.");
    }
    const result: any = await withTimeout(
      LocalAI.chat({ message: buildFlatPrompt(payload) }),
      NATIVE_GENERATION_TIMEOUT_MS,
      "مدل محلی روی این گوشی بیش از حد انتظار طول کشید (ممکن است دستگاه برای این مدل ضعیف باشد) — به «گیت‌وی» تغییر دهید یا یک مدل کوچکتر امتحان کنید.",
    );
    if (result.status === "error" || !result.value) {
      throw new Error("مدل محلی پاسخی تولید نکرد.");
    }
    return result.value;
  },
};

/**
 * Default provider: native-first, per project priority (Native llama.cpp ->
 * Ollama -> Cloud). Tries the on-device model when one is actually loaded;
 * silently falls back to the gateway otherwise (or if the native call
 * itself fails), so switching this on never leaves the learner stuck -
 * it only ever adds a path, never removes the existing one.
 */
export const autoProvider: AiProvider = {
  key: "auto",
  label: "خودکار",
  description: "ابتدا مدل روی خود گوشی را امتحان می‌کند، سپس سرویس‌های اینترنتی رایگانِ تنظیم‌شده (OpenRouter/Gemini)، و در نهایت گیت‌وی را امتحان می‌کند.",
  async chat(payload) {
    const status = await getNativeStatus();
    if (status.available && status.modelLoaded) {
      try {
        return await nativeProvider.chat(payload);
      } catch (e) {
        console.warn("[ai-providers] native attempt failed, falling back to gateway:", e);
        // fall through to gateway below
      }
    }
    try { return await ollamaText(buildFlatPrompt(payload)); } catch (ollamaError) {
      console.warn("[ai-providers] direct Ollama unavailable, falling back to internet cloud:", ollamaError);
    }
    try { return await cloudProvider.chat(payload); } catch (cloudError) {
      console.warn("[ai-providers] free cloud failed, falling back to gateway:", cloudError);
    }
    return gatewayProvider.chat(payload);
  },
};

export function listProviders(): AiProvider[] {
  return [autoProvider, nativeProvider, cloudProvider, gatewayProvider];
}

/**
 * Streaming counterpart to gatewayProvider.chat(), for typed Chat's live
 * "typing" preview. Only implemented for the gateway path - the native
 * llama.cpp path (see NativeProvider) does not have a streaming Capacitor
 * plugin call, so Speaking Mode and the native provider still use the
 * regular non-streaming chat() (a partial spoken sentence being read by
 * TTS mid-generation would sound broken anyway). Consumes the same SSE
 * shape server.ts's /api/chat/stream emits from either backend
 * ({"delta","done","provider","model"} or {"error"}). Falls through to a
 * plain thrown error (for the caller to fall back to non-streaming chat())
 * if the browser/runtime has no streaming fetch support.
 */
export async function* streamGatewayChat(
  payload: ChatRequest
): AsyncGenerator<{ delta: string; done: boolean }> {
  const secret = import.meta.env.VITE_TRAVELAPP_SHARED_SECRET || "";
  const res = await fetch(apiUrl("/api/chat/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-travelapp-secret": secret } : {}),
    },
    body: JSON.stringify({ task: payload.task ?? "chat", ...payload }),
  });
  if (!res.ok || !res.body) throw new Error(`API ${res.status}`);
  // Note: unlike net.ts's apiFetch, an HTML-fallback response here still
  // fails safely - the SSE parsing loop below only acts on lines starting
  // with "data:", so an HTML body simply yields no chunks and the caller's
  // canStream/streamedOk check in ChatTab.tsx falls back to the regular
  // non-streaming chat() automatically, same as any other stream failure.

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
      if (!dataStr) continue;
      let json: any;
      try {
        json = JSON.parse(dataStr);
      } catch {
        continue;
      }
      if (json.error) throw new Error(json.error);
      if (json.delta) yield { delta: json.delta, done: false };
      if (json.done) {
        yield { delta: "", done: true };
        return;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Native model management (pick a GGUF file from device storage, load/unload
// it into llama.cpp). Separate from chat() above because ChatTab needs to
// drive this as its own multi-step flow with progress feedback, not as part
// of a single chat request.

export interface NativeStatus {
  available: boolean;
  modelLoaded: boolean;
  modelPath: string | null;
}

export async function getNativeStatus(): Promise<NativeStatus> {
  try {
    const health = await LocalAI.healthCheck();
    return { available: health.available, modelLoaded: health.modelLoaded, modelPath: health.modelPath };
  } catch {
    return { available: false, modelLoaded: false, modelPath: null };
  }
}

/** Opens the system file picker, imports the chosen file into app
 * storage, then loads it into llama.cpp. Rejects at whichever step
 * failed (including if the user cancels the picker). */
export async function pickAndLoadNativeModel(): Promise<{ path: string; name: string }> {
  const picked = await LocalAI.pickModel();
  const loadResult = await LocalAI.loadModel({ path: picked.path });
  if (!loadResult.loaded) throw new Error("بارگذاری مدل در حافظه ناموفق بود.");
  return { path: picked.path, name: picked.name };
}

export async function unloadNativeModel(): Promise<void> {
  await LocalAI.unloadModel();
}

const PROVIDER_STORAGE_KEY = "travelapp_ai_provider";

export function getPreferredProviderKey(): AiProviderKey {
  try {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (stored === "native" || stored === "gateway" || stored === "cloud" || stored === "auto") return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing) - fall through to default
  }
  // Default is "auto": native-first per project priority, with an automatic,
  // invisible fallback to the gateway so this is always at least as capable
  // as picking "gateway" outright.
  return "auto";
}

export function setPreferredProviderKey(key: AiProviderKey): void {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, key);
  } catch {
    // best-effort only; the in-memory choice for this session still works
  }
}

export function getPreferredProvider(): AiProvider {
  const key = getPreferredProviderKey();
  if (key === "native") return nativeProvider;
  if (key === "gateway") return gatewayProvider;
  if (key === "cloud") return cloudProvider;
  return autoProvider;
}
