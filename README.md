# Lingua Assistant — local-first dialect learning

A personal, offline-first language-learning application for learning
dialects and practicing spoken conversation. This is the confirmed
final architecture direction (see decision log in
`FINAL_RELEASE_REPORT.md`) — the shape below is settled; remaining
work is finishing and hardening within it, not further architecture
changes.

```
                    Language Coach UI (ChatTab.tsx)
                              |
                     AiProvider abstraction (aiProviders.ts)
                              |
              +---------------+----------------+
              |               |                |
          autoProvider   nativeProvider   gatewayProvider
        (native-first,    (llama.cpp,       (server.ts ->
         auto-fallback)    on-device)      aiRouter.ts/gateway.py)
                                                  |
                                    +-------------+-------------+
                                    |             |             |
                              Ollama (local)  DeepSeek/MiniMax/GLM/Kimi
                                              (optional cloud fallback)
```

Priority is Native llama.cpp -> local Ollama -> cloud, in that order,
never the reverse. No specific model name is a hard dependency
anywhere in this chain.

## No model is a hard dependency

The gateway layer (`gateway/gateway.py`, mirrored by `aiRouter.ts`)
auto-discovers every chat-capable model already installed in Ollama
(`OLLAMA_BASE_URL`, default `http://localhost:11434`) and routes to
whichever one is available and capable of the request (e.g. only
vision-tagged models are sent image requests; for live "speaking"
turns, the smallest/fastest installed model is preferred for latency -
see "Smart routing" below). `OLLAMA_MODEL_PREFERENCE` is only a
tie-breaking preference, not a requirement.

Optional, purely-fallback cloud providers (DeepSeek, MiniMax, GLM,
Kimi, or any other OpenAI-compatible endpoint via `PROVIDERS_JSON`) are
tried only if no local model (native or Ollama) is available or a
request needs a capability neither has. None of them are required, and
none of them can be honestly guaranteed to stay free — quotas/pricing
are controlled by their operators.

## AIProvider abstraction (frontend)

`apps/mobile/src/lib/aiProviders.ts` is the only thing `ChatTab.tsx`
talks to for a chat completion - it never imports the native plugin or
the HTTP client directly. Three providers:

- **`autoProvider`** (default) — tries `nativeProvider` first if a
  model is actually loaded on-device; on any failure (or if nothing is
  loaded), falls back to `gatewayProvider` automatically. This is what
  makes Native -> Ollama -> Cloud priority real without ever leaving
  the learner stuck.
- **`nativeProvider`** — calls the Capacitor `LocalAI` plugin
  (llama.cpp, on-device). `ChatTab.tsx` includes a Model Manager
  sub-panel to pick, load, and unload a GGUF file for this
  (`pickAndLoadNativeModel()` / `unloadNativeModel()` in
  `aiProviders.ts`).
- **`gatewayProvider`** — calls `server.ts` over HTTP, which is itself
  backed by either the Python gateway or `aiRouter.ts` (see below).

Adding a fourth provider later, or changing how any existing one
works, is a change to `aiProviders.ts` only.

## Smart routing: capability + task aware, not just capability aware

Routing considers what capability a request needs (vision vs. plain
chat) **and** what kind of turn it is:

- `task: "chat"` (typed conversation, reports, quizzes, etc.) keeps the
  existing preference-name-then-size ranking.
- `task: "speaking"` (a live spoken-conversation turn from Speaking
  Mode) re-ranks local Ollama candidates by size ascending, since
  latency matters more than matching `OLLAMA_MODEL_PREFERENCE` exactly
  for a real-time back-and-forth.

This is implemented identically in `aiRouter.ts` (Node) and
`gateway/gateway.py` (Python) - see `build_chain(task)` /
`buildChain(task)` in each - with matching tests
(`aiRouter.test.ts` / `gateway/test_gateway.py`).

## Speaking Mode vs. typed Chat

`ChatTab.tsx` has two distinct interaction modes:

- **Typed Chat** (default) — type or tap the mic once per turn, review
  the reply, tap Send again.
- **Speaking Mode** (`شروع مکالمه` button) — a continuous loop: listen
  -> reply -> speak the reply out loud -> listen again, with no Send
  button in the loop. Ends when the learner taps `پایان مکالمه`.

**Honesty note on Speaking Mode:** it is built on the same browser
`SpeechRecognition` / `speechSynthesis` APIs already used elsewhere in
this app (the per-message mic and play buttons) - not a dedicated
offline STT/TTS engine (e.g. whisper.cpp/piper) and not a dedicated
VAD algorithm. "Listening stopped" is the browser's own
end-of-speech/no-speech detection. On Android, `SpeechRecognition`
typically depends on Google's on-device or cloud speech service
depending on the device/browser, so treat Speaking Mode's voice
recognition as "works using whatever speech engine the device/browser
already provides," not as a new offline capability this app adds.
Building genuinely offline, in-app STT/TTS would need new native
plugins (like `LocalAI` is for text generation) and real-device
testing this environment cannot do - a real next step, not something
already delivered here.

## Language Memory and Adaptive Difficulty

Both are derived from real logged data, not placeholders:

- **Language Memory** (`apps/mobile/src/languageMemoryStore.ts`) logs
  the model's own "اصلاح:" (correction) line per dialect whenever it
  isn't the "no correction" marker, and feeds the most-repeated ones
  back into future prompts (`knownMistakes` in `ChatRequest`) so the
  coach can watch for a mistake instead of the learner re-explaining
  it every conversation.
- **Adaptive Difficulty** (`apps/mobile/src/levelStore.ts`) computes a
  level label from the learner's real pronunciation-practice scores
  already logged in `progressStore.ts` (5+ attempts required before it
  moves off "Beginner"), and passes it as `levelHint` so replies match
  demonstrated ability. This is a transparent heuristic over attempt
  count and average score, not a validated CEFR placement test - treat
  it as a reasonable default, not a certified grading.

Both flow into `buildFlatPrompt()` (native path) and `handleChat()` in
`server.ts` (gateway path) identically.

## Accent Coach

A small collapsible panel in `ChatTab.tsx` (`accentCoach.ts`) with a
handful of genuinely accurate, well-established tips (pronunciation,
common vocabulary, one recurring expression, rhythm/grammar) **only**
for the dialects this app actually has personas/voices for (Iraqi,
Lebanese, Gulf, Egyptian Arabic; American and British English) - it
does not invent coverage for accents (e.g. Australian, Canadian) the
app has no persona for.

## Model Manager

`ChatTab.tsx` has two model-management surfaces:

- **Native**: pick/load/unload a GGUF file on-device (see
  "AIProvider abstraction" above).
- **Gateway**: a "مدیریت مدل‌ها" panel that fetches `/api/models` on
  `server.ts` (which proxies to whichever `AI_BACKEND` is active) and
  shows the real, currently-available models and optional cloud
  fallbacks with their live availability - never a hardcoded list.

## Two backend processes today, by design (not yet merged)

Two local processes currently work together:

1. **Gateway** (`gateway/gateway.py`, Python stdlib only, default
   `:8080`) — discovers models, does capability+task-aware routing and
   failover, exposes an OpenAI-compatible `/v1/chat/completions`.
2. **App server** (`server.ts`, Node, default `:3000`) — implements the
   application's own `/api/*` contract, builds the actual prompts, and
   either calls the gateway over HTTP or routes in-process via
   `aiRouter.ts`, controlled by `AI_BACKEND`:
   - `AI_BACKEND=gateway` (default) — calls `gateway/gateway.py`.
   - `AI_BACKEND=node` — calls `aiRouter.ts` in-process, no Python
     needed. Check `/health` to see which backend answered.

**This is intentionally not being collapsed further right now.**
Until the native provider has been exercised on a real Android device
and `AI_BACKEND=node` has been run against real usage, keeping all
three layers (Python gateway, Node router, native provider) is a
deliberate safety net against a single change breaking the one
conversation flow this whole app exists for. After real-device
testing of Speaking Mode and the native model picker/loader, and after
`AI_BACKEND=node` has earned trust in practice, `gateway/gateway.py`
can be taken out of the production path - but its code stays in the
repo/checkpoints either way, and is never deleted as part of this
plan.

`gateway/gateway.py` also exposes its own simpler versions of the same
`/api/*` task routes directly, for standalone use without `server.ts`.
In the normal run (`npm run server` + `npm run gateway` + `npm run
dev`), the frontend only ever reaches `server.ts`'s versions.

## Run locally

```bash
npm install
python3 -m unittest discover -s gateway -p "test_*.py" -v
node --experimental-strip-types --test aiRouter.test.ts
npm run gateway   # terminal 1
npm run server    # terminal 2
npm run dev        # terminal 3
```

Make sure Ollama is running with at least one chat-capable model
pulled; no specific model name is required. Copy `.env.example` to
`.env` for the app server and `gateway/.env.example` to `gateway/.env`
for provider credentials (all optional). `GATEWAY_URL` in the root env
must point at the same host/port the gateway is actually listening on.

## Troubleshooting: "Unexpected token '<' ... is not valid JSON" on first launch

This means the app tried to call `/api/...` and got its own
`index.html` back instead of a real API response - because no backend
is reachable at all yet. It happens on a fresh install before either
of these is set up:

- **Fastest fix:** in AI Chat, switch to "روی خود گوشی" and use Model
  Manager to load a GGUF model - no server needed at all.
- **Or:** run `gateway` + `server` (see "Run locally" below) on a PC
  on the same network, and set `VITE_AI_BASE_URL` (before building the
  APK) to that PC's address, e.g. `http://192.168.1.20:3000`.

As of this fix, hitting this situation now shows a clear Persian error
message instead of the raw JSON-parse text (`lib/net.ts`'s `apiFetch`,
`aiProviders.ts`'s `streamGatewayChat`, and this file's own gateway
health check all check the response's actual Content-Type before
parsing it as JSON) - but the app still can't answer a chat message
until one of the two options above is set up; that part isn't a bug,
it's what "no configured backend yet" means.

## Important: real offline-on-a-phone needs the native path

The gateway path (`server.ts` -> Python gateway or `aiRouter.ts` ->
Ollama) needs Ollama, which does not run on Android. On an installed
APK, that path needs `VITE_AI_BASE_URL` pointed at a reachable gateway
machine (e.g. a PC on the same network). The native path
(`nativeProvider` / llama.cpp) is the one that works with zero
companion device - `autoProvider` (the default) already prefers it
whenever a model is loaded. What's still needed for that promise to
hold in practice: real-device testing of the pick/load/unload flow and
of Speaking Mode's mic/TTS behavior on Android specifically (not
verifiable from this development environment).

## llama.cpp

`third-party/llama.cpp` is intentionally not vendored; upstream is a
large external repository. `scripts/install-llama.sh` clones current
upstream and builds it (CMake, with a `make` compatibility attempt
first).

```bash
./scripts/install-llama.sh
```

## Android

```bash
npm run build
npm run android:sync
npm run android:build
```

## Archived code

`archive/legacy-ai/` (formerly `packages/ai`) is a superseded earlier
AI-abstraction attempt, confirmed to have zero live references
anywhere in the app (see `archive/legacy-ai/ARCHIVED.md` for exactly
what was checked) and moved out of the npm workspace rather than
deleted, in case its prompt/model-selection abstractions are useful
reference later.

## Data

Existing local stores for progress, SRS, media, backups, vocabulary,
conversations, Language Memory, and Adaptive Difficulty
(`apps/mobile/src/*Store.ts`, `packages/database/`) are preserved and
are independent of which model answers a request.
