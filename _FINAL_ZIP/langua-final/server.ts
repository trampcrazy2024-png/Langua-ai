/**
 * TravelApp backend server.
 *
 * Implements the application's /api/* endpoints (translate, chat,
 * scenario-report, generate-phrases, daily-phrases, planner, ocr, quiz).
 *
 * MIGRATION IN PROGRESS: this server can source AI completions from
 * either backend, controlled by AI_BACKEND:
 *
 *   AI_BACKEND=gateway (default, unchanged from before) - calls the
 *     Python Smart Router gateway (gateway/gateway.py) over HTTP.
 *   AI_BACKEND=node - calls aiRouter.ts directly, in-process, with no
 *     Python process involved. Same routing rules (capability-based,
 *     failover, cooldown), reading the same env vars as
 *     gateway/.env.example.
 *
 * The goal is to retire gateway/gateway.py once AI_BACKEND=node has
 * been exercised enough to trust as the default - see README.md. Until
 * then both exist side by side; gateway.py is unchanged.
 *
 * Either way, no specific model name is required; see
 * MODEL_ARCHITECTURE.md.
 *
 * Run:  node --experimental-strip-types server.ts
 * (or)  npm run server
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { routeChat, routeChatStream, describeProviders, type ChatMessage } from "./aiRouter.ts";

const AI_BACKEND = (process.env.AI_BACKEND ?? "gateway").toLowerCase();
const GATEWAY_URL =
  process.env.GATEWAY_URL ?? "http://localhost:8080/v1/chat/completions";
const HOST = process.env.SERVER_HOST ?? "0.0.0.0";
const PORT = Number(process.env.SERVER_PORT ?? 3000);
const DEFAULT_MAX_TOKENS = Number(process.env.SERVER_MAX_TOKENS ?? 1200);
/*
 * Bug fix: TRAVELAPP_SHARED_SECRET / VITE_TRAVELAPP_SHARED_SECRET existed as
 * env vars and the frontend (see apps/mobile/src/lib/net.ts) already sent an
 * `x-travelapp-secret` header whenever configured, but this server never
 * actually read or checked that header - the "secret" did nothing. Also
 * fixed: Access-Control-Allow-Headers below did not include
 * x-travelapp-secret, so a browser would have blocked the header from ever
 * reaching the server anyway, even after this check was added.
 */
const SHARED_SECRET = process.env.TRAVELAPP_SHARED_SECRET ?? "";
const CORS_HEADERS = "Content-Type, x-travelapp-secret";

export function jsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => {
      raw += chunk;
      if (raw.length > 20 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error(`Invalid JSON: ${String(err)}`));
      }
    });
    req.on("error", reject);
  });
}

export function send(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": CORS_HEADERS,
  });
  res.end(body);
}

/** Call the Python gateway (OpenAI-compatible chat completion). Only
 * used when AI_BACKEND=gateway; see gatewayChat() below for the
 * AI_BACKEND=node path. */
async function callPythonGateway(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; task?: string } = {}
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Number(process.env.GATEWAY_CALL_TIMEOUT ?? 120000)
  );

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "smart-router",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        // Extra, non-standard field alongside the OpenAI-compatible ones
        // above - ignored by any strict OpenAI client, but read by
        // gateway.py's route() for the same task-aware model scoring
        // aiRouter.ts does in AI_BACKEND=node (see gateway/gateway.py).
        task: options.task ?? "chat",
      }),
    });

    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? `Gateway returned ${res.status}`);
    }
    const content: string =
      data?.choices?.[0]?.message?.content ?? "";
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Single entry point every handler below calls for a completion.
 * Dispatches to whichever backend AI_BACKEND selects; callers don't
 * need to know or care which one actually answered.
 */
export async function gatewayChat(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; task?: string } = {}
): Promise<string> {
  if (AI_BACKEND === "node") {
    const routeOptions: { temperature?: number; max_tokens?: number; task?: string } = {
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      task: options.task ?? "chat",
    };
    if (options.temperature !== undefined) routeOptions.temperature = options.temperature;
    const result = await routeChat(messages, routeOptions);
    return result.text;
  }
  return callPythonGateway(messages, options);
}

// ---------------------------------------------------------------------------
// Prompt builders per endpoint
// ---------------------------------------------------------------------------

/** Shared by handleChat() and the /api/chat/stream route below, so the
 * streaming and non-streaming paths can never drift into building
 * different prompts for what should be the same conversation turn. */
function buildChatPrompt(body: any): { prompt: string; task: "chat" | "speaking" } {
  const { message, dialect, personaName, personaTrait, personaOccupation, scenario, history, task, knownMistakes, levelHint, conversationSummary } = body;
  const transcript = (history ?? [])
    .map((h: any) => `${h.sender === "user" ? "Learner" : personaName ?? "Companion"}: ${h.text}`)
    .join("\n");

  const prompt = [
    `You are ${personaName ?? "a travel companion"}, a language conversation partner for a learner of ${dialect ?? "the target dialect"}.`,
    personaTrait ? `Persona trait: ${personaTrait}.` : "",
    personaOccupation ? `Your occupation: ${personaOccupation}.` : "",
    scenario
      ? `Scenario: ${scenario.titleFa ?? ""} — ${scenario.location ?? ""}. Goal: ${scenario.objectiveFa ?? ""}.`
      : "",
    // Adaptive Difficulty: levelHint is computed client-side from the
    // learner's real logged practice scores (see progressStore.ts /
    // levelStore.ts), not chosen arbitrarily here.
    levelHint ? `The learner's current level is ${levelHint}; keep your vocabulary and grammar at that level.` : "",
    // Language Memory: knownMistakes are the learner's own recurring
    // corrections (see languageMemoryStore.ts), so the model can watch
    // for them instead of the learner having to repeat the correction.
    Array.isArray(knownMistakes) && knownMistakes.length > 0
      ? `The learner has recurring mistakes to watch for and gently correct if they reappear: ${knownMistakes.join(" | ")}`
      : "",
    // Context Manager: conversationSummary covers turns older than what's
    // in `history` below (see conversationContext.ts client-side), so
    // long sessions don't just lose earlier context once it's trimmed.
    conversationSummary ? `Earlier in this conversation (summary): ${conversationSummary}` : "",
    task === "speaking"
      ? "This is a spoken conversation practice turn: keep your reply short (1-2 sentences) and conversational, like real speech, not a written paragraph."
      : "",
    "Reply naturally in the target dialect/language as the character.",
    "After your natural reply, on separate lines provide:",
    "فارسی: a concise Persian meaning of your reply.",
    "اصلاح: only if the learner made a meaningful language mistake; otherwise write اصلاح: بدون اصلاح.",
    "If the scenario objective was fully achieved, append the marker [OBJECTIVE_COMPLETE] at the very end.",
    transcript ? `Conversation so far:\n${transcript}` : "",
    `Learner: ${message}`,
    `${personaName ?? "Companion"}:`,
  ]
    .filter(Boolean)
    .join("\n");

  return { prompt, task: task === "speaking" ? "speaking" : "chat" };
}

export async function handleChat(body: any): Promise<unknown> {
  const { prompt, task } = buildChatPrompt(body);
  const text = await gatewayChat([{ role: "user", content: prompt }], { task });
  return { response: text };
}

export async function handleScenarioReport(body: any): Promise<unknown> {
  const { transcript, scenarioTitle, objectiveFa, dialect } = body;
  const transcriptText = (transcript ?? [])
    .map((t: any) => `${t.sender === "user" ? "Learner" : "Companion"}: ${t.text}`)
    .join("\n");

  const prompt = [
    `Analyze this ${dialect ?? "Arabic"} learning conversation. Scenario: ${scenarioTitle ?? ""}.`,
    `Objective: ${objectiveFa ?? ""}.`,
    `Transcript:\n${transcriptText}`,
    "Return STRICT JSON with exactly this shape:",
    `{"objectiveAchieved": boolean, "summaryFa": "string", "strengthsFa": ["string"], "improvementsFa": ["string"], "newVocabulary": [{"phrase": "string", "meaningFa": "string"}]}`,
    "All prose in Persian. newVocabulary: at most 5 items.",
  ].join("\n");

  const raw = await gatewayChat([{ role: "user", content: prompt }], { temperature: 0.2 });
  return extractJson(raw, {
    objectiveAchieved: false,
    summaryFa: "",
    strengthsFa: [],
    improvementsFa: [],
    newVocabulary: [],
  });
}

export async function handleTranslate(body: any): Promise<unknown> {
  const { text, targetDialect, sourceLang } = body;
  const prompt = [
    `You are a ${sourceLang ?? "Persian/English"} -> ${targetDialect ?? "Arabic"} dialect translator for travelers.`,
    `Translate this to ${targetDialect ?? "the target dialect"}: "${text}"`,
    "Return STRICT JSON with exactly this shape:",
    `{"translation": "string", "pronunciation": "string", "audioPronunciationTips": "string", "literalMeaning": "string", "culturalNote": "string"}`,
    "All explanations in Persian.",
  ].join("\n");

  const raw = await gatewayChat([{ role: "user", content: prompt }], { temperature: 0.3 });
  return extractJson(raw, {
    translation: "",
    pronunciation: "",
    audioPronunciationTips: "",
    literalMeaning: "",
    culturalNote: "",
  });
}

export async function handleGeneratePhrases(body: any): Promise<unknown> {
  const { scenario, dialect, speakerGender, listenerGender } = body;
  const prompt = [
    `Generate 5 golden travel phrases in ${dialect ?? "Arabic"} for this scenario: "${scenario}".`,
    `Speaker gender: ${speakerGender ?? "unisex"}. Listener gender: ${listenerGender ?? "unisex"}.`,
    "Return STRICT JSON with exactly this shape:",
    `{"phrases": [{"arabic": "string", "arabicPhonetic": "string", "arabicPhoneticLatin": "string", "farsi": "string", "english": "string", "audioTips": "string"}]}`,
    "audioTips is a Persian pronunciation/usage tip.",
  ].join("\n");

  const raw = await gatewayChat([{ role: "user", content: prompt }], { temperature: 0.5 });
  const parsed = extractJson(raw, { phrases: [] });
  return parsed;
}

export async function handleDailyPhrases(body: any): Promise<unknown> {
  const { dialects, date } = body;
  const prompt = [
    `Today's date: ${date ?? "today"}.`,
    `For each of these dialects, create 3 daily conversational phrases a traveler would use: ${(dialects ?? []).join(", ")}`,
    "Return STRICT JSON with exactly this shape:",
    `{"groups": [{"dialect": "string", "phrases": [{"text": "string", "phonetic": "string", "phoneticLatin": "string", "farsi": "string", "english": "string"}]}]}`,
  ].join("\n");

  const raw = await gatewayChat([{ role: "user", content: prompt }], { temperature: 0.6 });
  return extractJson(raw, { groups: [] });
}

export async function handlePlanner(body: any): Promise<unknown> {
  const { destination, duration, type } = body;
  const prompt = [
    `Create a ${type ?? "Dialect Immersion"} travel plan for ${destination ?? "the destination"} over ${duration ?? 3} days.`,
    "Return STRICT JSON with exactly this shape:",
    `{"packingItems": ["string"], "culturalTips": ["string"], "dailyRecommendations": [{"day": number, "activity": "string", "localDialectChallenge": "string"}]}`,
    "All prose in Persian.",
  ].join("\n");

  const raw = await gatewayChat([{ role: "user", content: prompt }], { temperature: 0.5 });
  return extractJson(raw, { packingItems: [], culturalTips: [], dailyRecommendations: [] });
}

/*
 * Bug fix: this used to build a text-only prompt containing just the
 * first 80 characters of the base64 image string as a "hint" - the
 * model never received the actual photo, so any transcription it
 * returned was necessarily invented, not real OCR. This now sends
 * the full image as a proper multimodal message.
 *
 * HONESTY NOTE: sending the image correctly only helps if whichever
 * provider ends up serving the request is actually vision-capable.
 * Most common local/cloud chat models (whatever is currently
 * installed in Ollama, or the default DeepSeek/MiniMax/GLM/Kimi
 * fallbacks) are text-only. The gateway already restricts OCR/image
 * requests to providers it detected as vision-capable (see
 * needs_vision() in gateway/gateway.py) and fails clearly instead of
 * silently guessing - but real OCR results still require that at
 * least one installed model actually advertises vision support
 * (e.g. an Ollama vision-capable tag such as a `-vl` variant).
 */
export async function handleOcr(body: any): Promise<unknown> {
  const { image } = body;
  const instructions = [
    "The attached photo shows an Arabic street sign / menu / label.",
    "Return STRICT JSON with exactly this shape:",
    `{"transcription": "string", "translation": "string", "pronunciation": "string", "travelContext": "string"}`,
    "transcription = the Arabic text exactly as written in the photo, translation = English, pronunciation = Latin phonetic, travelContext = a Persian explanation.",
  ].join("\n");

  const messages: ChatMessage[] = image
    ? [
        {
          role: "user",
          content: [
            { type: "text", text: instructions },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ]
    : [{ role: "user", content: instructions + "\n(No image was attached.)" }];

  const raw = await gatewayChat(messages, { temperature: 0.2 });
  return extractJson(raw, {
    transcription: "",
    translation: "",
    pronunciation: "",
    travelContext: "",
  });
}

export async function handleQuiz(body: any): Promise<unknown> {
  const { category, level, mistakes } = body;
  const targeted = Array.isArray(mistakes) && mistakes.length > 0;
  const prompt = [
    targeted
      ? `Create a short multiple-choice quiz that specifically targets these recurring mistakes a language learner keeps making: ${mistakes.join(" | ")}. Category/dialect context: ${category ?? "general"}.`
      : `Create a multiple-choice quiz. Category: ${category ?? "Arabic Colloquial Idioms"}. Level: ${level ?? "Intermediate"}.`,
    targeted ? "Create exactly 3 questions, one per mistake, each testing whether the learner now gets it right." : "Create exactly 5 questions.",
    "Return STRICT JSON with exactly this shape:",
    `{"questions": [{"question": "string", "options": ["string", "string", "string", "string"], "answerIndex": number, "explanation": "string"}]}`,
    "The correct answer must be at answerIndex. Explanations in Persian.",
  ].join("\n");

  const raw = await gatewayChat([{ role: "user", content: prompt }], { temperature: 0.4 });
  return extractJson(raw, { questions: [] });
}

// ---------------------------------------------------------------------------
// JSON extraction from model output (with graceful fallback)
// ---------------------------------------------------------------------------

export function extractJson(raw: string, fallback: any): any {
  const cleaned = (raw ?? "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  // Find first { ... } block.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // fall through
    }
  }
  // Best effort: repair if it is valid JSON but wrapped.
  try {
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const routes: Record<string, (body: any) => Promise<unknown>> = {
  "/api/chat": handleChat,
  "/api/scenario-report": handleScenarioReport,
  "/api/translate": handleTranslate,
  "/api/generate-phrases": handleGeneratePhrases,
  "/api/daily-phrases": handleDailyPhrases,
  "/api/planner": handlePlanner,
  "/api/ocr": handleOcr,
  "/api/quiz": handleQuiz,
};

export const server = createServer(async (req, res) => {
  const url = (req.url ?? "/").split("?")[0];

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": CORS_HEADERS,
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url === "/health") {
    if (AI_BACKEND === "node") {
      const providers = await describeProviders();
      send(res, 200, { status: "ok", service: "travelapp-server", aiBackend: "node", providers });
    } else {
      send(res, 200, { status: "ok", service: "travelapp-server", aiBackend: "gateway", gateway: GATEWAY_URL });
    }
    return;
  }

  // Model Manager: lets the frontend show which models are actually
  // available right now (installed Ollama models by capability, plus
  // which optional cloud fallbacks are configured) instead of assuming a
  // fixed model exists - the whole point of being model-agnostic.
  if (req.method === "GET" && url === "/api/models") {
    if (AI_BACKEND === "node") {
      send(res, 200, { providers: await describeProviders() });
    } else {
      try {
        const gatewayBase = GATEWAY_URL.replace(/\/v1\/chat\/completions$/, "");
        const healthRes = await fetch(`${gatewayBase}/health`);
        const data: any = await healthRes.json();
        send(res, 200, { providers: data.providers ?? [] });
      } catch (e) {
        send(res, 503, { error: `Could not reach gateway for model list: ${(e as Error).message}` });
      }
    }
    return;
  }

  // Streaming chat: same prompt as /api/chat (buildChatPrompt), but the
  // reply is delivered as it's generated (Server-Sent Events) instead of
  // waiting for the full completion - real end-to-end streaming for
  // perceived latency, especially with a small local model. Handled
  // separately from the generic `routes` dispatch below because it needs
  // to write the response incrementally instead of one send(res, 200, ...)
  // call.
  if (req.method === "POST" && url === "/api/chat/stream") {
    if (SHARED_SECRET && req.headers["x-travelapp-secret"] !== SHARED_SECRET) {
      send(res, 401, { error: "Unauthorized" });
      return;
    }
    let body: any;
    try {
      body = await jsonBody(req);
    } catch (err: any) {
      send(res, 400, { error: err?.message ?? "Invalid JSON" });
      return;
    }
    const { prompt, task } = buildChatPrompt(body);

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });

    if (AI_BACKEND === "node") {
      try {
        for await (const chunk of routeChatStream([{ role: "user", content: prompt }], { task })) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      } catch (e) {
        // Headers/some chunks may already be sent, so this can't become a
        // clean error status anymore - send it as one more SSE event so
        // the client at least learns why the stream stopped.
        res.write(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`);
      }
      res.end();
      return;
    }

    // AI_BACKEND=gateway: gateway.py already emits the exact same
    // {"delta","done","provider","model"} SSE event shape (see
    // route_stream() in gateway/gateway.py), so this is a straight
    // byte passthrough of its stream, not a reformatting step.
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Number(process.env.GATEWAY_CALL_TIMEOUT ?? 120000));
      const upstream = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ model: "smart-router", messages: [{ role: "user", content: prompt }], stream: true, task }),
      });
      clearTimeout(timer);
      if (!upstream.ok || !upstream.body) {
        throw new Error(`Gateway returned ${upstream.status}`);
      }
      const reader = upstream.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`);
    }
    res.end();
    return;
  }

  const handler = routes[url];
  if (!handler) {
    send(res, 404, { error: "Not found" });
    return;
  }

  if (SHARED_SECRET && req.headers["x-travelapp-secret"] !== SHARED_SECRET) {
    send(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const body = await jsonBody(req);
    const result = await handler(body);
    send(res, 200, result);
  } catch (err: any) {
    console.error(`[server] ${url} error:`, err?.message ?? err);
    send(res, 500, { error: err?.message ?? "Internal server error" });
  }
});

/*
 * Bug fix: this file used to call server.listen() unconditionally at
 * module load, which meant simply *importing* server.ts (e.g. from a
 * test) bound a real socket on PORT as a side effect. Only start
 * listening when this file is actually the entry point being run
 * (`node server.ts` / `npm run server`), not when it's imported.
 */
const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  server.listen(PORT, HOST, () => {
    console.log(`[server] TravelApp server listening on http://${HOST}:${PORT}`);
    console.log(`[server] Routing AI requests to gateway: ${GATEWAY_URL}`);
  });
}
