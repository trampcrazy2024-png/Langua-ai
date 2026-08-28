# Lingua Assistant — final architecture

## Product contract
Personal, offline-first dialect-learning and speaking coach. No model vendor is a compile-time dependency.

## AI model abstraction
The gateway discovers local Ollama models and routes by **capability**, not by model name. `OLLAMA_MODEL_PREFERENCE` is only a preference list. Any Ollama chat model can be used. OpenAI-compatible custom servers are supported through `PROVIDERS_JSON`.

## Routing
1. **Native llama.cpp on-device** (via `nativeProvider`/`autoProvider` in `apps/mobile/src/lib/aiProviders.ts`), when a GGUF model is actually loaded - tried first, per project priority.
2. Installed local Ollama model with `chat` capability (or `vision` for image requests) - reached via the gateway layer (`gateway.py` / `aiRouter.ts`) if native isn't available/loaded, or native itself failed.
3. Optional DeepSeek, MiniMax, GLM and Kimi fallbacks.
4. Optional arbitrary OpenAI-compatible providers (`PROVIDERS_JSON`).
5. Failed providers enter a short cooldown to avoid hammering unavailable services.

Within step 2-4 (the gateway layer), routing is also **task-aware**: a
`task: "speaking"` request (live spoken-conversation turn) re-ranks
local Ollama candidates by size ascending (fastest first), since
latency matters more than exact `OLLAMA_MODEL_PREFERENCE` match for a
real-time back-and-forth. Any other task keeps the previous
preference-name-then-size ranking. Implemented identically in
`aiRouter.ts` and `gateway/gateway.py` (`build_chain(task)` /
`buildChain(task)`), with matching tests in each.

Cloud credentials are optional and never required for either the
native or the local-Ollama path.

Note: `gateway/gateway.py` exposes both the low-level OpenAI-compatible
`/v1/chat/completions` router above and its own higher-level task
endpoints (`/api/chat`, `/api/translate`, etc.) for standalone use.
`server.ts` also implements those same task endpoints independently,
with its own prompts, and is what the frontend actually talks to (see
README.md). Keep that in mind before editing prompts in only one of
the two files.

## Honesty note: offline scope
`autoProvider` (the default) already prefers the native on-device path
whenever a model is loaded, which is what makes chat genuinely
self-contained on the phone with zero companion device. When no native
model is loaded (or native fails), it falls back to the gateway path
(`server.ts` -> `gateway/gateway.py` or `aiRouter.ts` -> Ollama), which
does need a reachable machine, since Ollama does not run on Android.
What still needs real-device verification, not yet done from this
development environment: the native model pick/load/unload flow
(`packages/ai/`, the `LocalAI` Capacitor plugin, the llama.cpp JNI
build under `android/app/src/main/cpp/`) and Speaking Mode's
mic/TTS behavior on an actual Android device.

## Speech-learning pipeline
The UI's existing speech/ASR modules remain provider-neutral. Speaking Mode (`ChatTab.tsx`) implements microphone -> browser SpeechRecognition -> conversation engine -> AI router -> browser speechSynthesis as a continuous loop, separate from typed Chat. This uses the device/browser's own speech engine, not a dedicated offline STT/TTS model or a dedicated VAD algorithm - see README.md's honesty note. Vosk remains an opt-in offline English ASR module for other parts of the app.

## Language Memory and Adaptive Difficulty
`apps/mobile/src/languageMemoryStore.ts` logs the model's own real correction notes per dialect and feeds the most-repeated ones back into future prompts. `apps/mobile/src/levelStore.ts` computes a level label purely from the learner's real logged pronunciation-practice scores (`progressStore.ts`) and feeds it in as well. Neither is a placeholder, a manual setting, or randomized.

## Accent Coach
`apps/mobile/src/accentCoach.ts` holds a small set of curated, accurate tips per dialect - only for dialects this app has personas/voices for, not a fabricated exhaustive linguistic database.

## Model Manager
`GET /api/models` on `server.ts` returns the real, currently-available provider/model list (proxying to whichever `AI_BACKEND` is active) for the frontend's "مدیریت مدل‌ها" panel; `apps/mobile/src/lib/aiProviders.ts`'s `pickAndLoadNativeModel()`/`unloadNativeModel()` manage the on-device GGUF model.

## Streaming
Typed Chat streams replies live via Server-Sent Events end to end (`gateway.py`'s `route_stream()` / `aiRouter.ts`'s `routeChatStream()` -> `server.ts`'s `POST /api/chat/stream` -> `aiProviders.ts`'s `streamGatewayChat()` -> `ChatTab.tsx`), with the same failover/vision/task-aware selection as the non-streaming path. Only used when "گیت‌وی" is explicitly selected; falls back to non-streaming automatically on any failure. Confirmed working end-to-end against a real local SSE test server for both `AI_BACKEND` modes in this environment - not yet verified against real Ollama or on a real device/browser.

## Crash Recovery
`TabErrorBoundary` (`apps/mobile/src/components/TabErrorBoundary.tsx`) wraps the tab content area in `App.tsx`, keyed by the active tab, so a rendering-time error in one tab doesn't take down the whole app.

## Quiz folded into the learning loop
`MistakePracticeCard` in `ChatTab.tsx` offers a short quiz built from the session's real logged mistakes (`languageMemoryStore.ts`) via `/api/quiz`'s new `mistakes` field (handled in both `server.ts` and `gateway.py`), once 2+ mistakes have been logged. The standalone `Lingo Quiz` tab is unchanged and still available for open-ended practice.

## Navigation reprioritized
`App.tsx`'s tab bar splits into always-visible core tabs (AI Chat, Scenario, Compare) and a "بیشتر" (More) group for everything travel-useful but not part of the speaking/pronunciation loop (Translator, Lingo Quiz, Matrix, Podcast, Planner, Sign OCR, SOS Safety) - nothing deleted, just reprioritized. Default tab changed from Translator to AI Chat. This app never had Game/Leaderboard/Achievement features to strip out (checked, zero matches).

## Data and learning
Existing local stores for progress, SRS, media, backups, vocabulary and conversations are preserved. Model choice is runtime configuration, so changing a model does not require a database migration or application update.

## llama.cpp
`scripts/install-llama.sh` retrieves the current upstream repository and builds it. Upstream has moved away from GNU Make as its primary build system, so the script attempts `make` for compatibility and then uses the supported CMake build.

## Security
API keys are environment-only. They are not committed, logged or returned by health endpoints. The gateway is intended for personal/local use; if exposed beyond localhost, put it behind authentication/TLS.
