# Release report — Lingua Assistant (debugging/cleanup pass)

This pass reviewed the previous "final" model-agnostic rewrite against
the actual code (not just the accompanying docs), fixed several real
bugs and inconsistencies found in that review, and removed dead
duplicate code. Nothing here required `npm install` (blocked in this
environment); Python-side checks and TypeScript syntax/type checks
were run directly.

## Verified as actually working (re-confirmed, not just re-claimed)
- `gateway/gateway.py`: capability-based routing, vision-skip for
  text-only providers, and fallback ordering — unit tests pass (3/3).
- App-server toast timer fix in `App.tsx` (`useRef` instead of a
  plain object) — real fix, confirmed by reading the code.
- Real online/offline detection via browser events in `App.tsx` — real
  fix, confirmed.
- OCR image bug fix in `server.ts` (`handleOcr` now sends the image as
  a multimodal content part instead of a truncated base64 text hint) —
  real fix, confirmed, with an honest caveat already in the code that
  it still needs a vision-capable model configured.

## Newly found and fixed in this pass
- **`.env.example` didn't match what `server.ts` reads.** It defined
  `AI_GATEWAY_URL` / `AI_SERVER_HOST` / `AI_SERVER_PORT`; the code
  reads `GATEWAY_URL` / `SERVER_HOST` / `SERVER_PORT`. Copying the
  example file as `.env` configured nothing. Also its gateway port
  (8787) didn't match the gateway's own default (8080). Fixed.
- **The `TRAVELAPP_SHARED_SECRET` mechanism did nothing.** The
  frontend already sent an `x-travelapp-secret` header when
  configured, but `server.ts` never checked it, and the CORS
  `Access-Control-Allow-Headers` list didn't even permit the browser
  to send that header. `server.ts` now validates it (401 if set and
  mismatched) and allows the header through CORS.
- **UI copy and comments still named "Qwen" specifically** in
  `ChatTab.tsx` and `App.tsx`, contradicting the model-agnostic
  architecture. Reworded to be generic, and to stop claiming the main
  conversation loop needs no internet at all (see the offline caveat
  below — it needs a reachable local gateway, which is a narrower and
  more accurate claim).
- **`server.ts`'s own docstrings still hardcoded the old
  `Qwen3 4B -> DeepSeek -> ...` chain** description. Corrected to
  describe the actual capability-based/no-fixed-model routing.
- **`sourceLang` was accepted by `/api/translate` but silently
  dropped** — the frontend sends it, `handleTranslate` destructured it
  and never used it in the prompt. Now used.
- **Root `tsconfig.json` had no `include`/`exclude`**, so `tsc --noEmit`
  at the repo root (the `typecheck:server` script) recursively picked
  up `apps/mobile` and every `packages/*` workspace too — each of
  which has its own tsconfig with different compiler options (JSX,
  DOM lib) — producing irrelevant duplicate/incorrect errors on top of
  real ones. Scoped to `server.ts` only, which is the one standalone
  file this root config is actually for.
- **CI workflow (`.github/workflows/build-apk.yml`) never built the
  web app.** It ran `gradle assembleDebug` directly, without
  `npm run build` / `npx cap sync android` first, so the APK packaged
  whatever (possibly stale or absent) web assets happened to already
  be committed rather than the current `apps/mobile` build. Fixed;
  also renamed from "Build Android VPN APK" (leftover, unrelated name
  from a merged source archive) and corrected the artifact path.
- **Removed dead/duplicate code** that no longer matched the current
  monorepo layout and was actively confusing: an entire orphaned
  legacy app scaffold at the repo root (`src/`, `main.tsx`,
  `index.html`, `types.ts`, `vite.config.ts`, `metadata.json`,
  `assets/.aistudio/`), duplicate/orphaned database scaffolding at the
  root (`DatabaseManager.ts`, `*Repository.ts`, `migrations/`,
  `repositories/`) superseded by `packages/database/`, a second
  Android Java package with a typo (`com.lligua.assistant`, duplicate
  of the real `com.lingua.assistant.plugins.LocalAIPlugin`), and an
  orphaned `apps/mobile/android/` tree with yet a third, unused
  package name (`com.linguaai.assistant`) that was never part of the
  real Capacitor Android project (the one at repo-root `android/`,
  `appId: com.lingua.assistant`).
- **`README.md` was stale and directly contradicted
  `MODEL_ARCHITECTURE.md`** — it still said "the primary AI path is
  local Qwen3-4B via Ollama." Rewritten to match the actual
  architecture, and to document the two-process (gateway + app
  server) setup and its real requirements honestly (see below).

## Documented but not changed — needs a decision, not a guess
- **`server.ts` and `gateway/gateway.py` both implement the same
  `/api/*` endpoints independently**, with different prompts. In the
  normal run, the frontend only ever reaches `server.ts`'s versions
  (per `apps/mobile/vite.config.ts`'s proxy target), so
  `gateway.py`'s own task endpoints are dead code in that setup and
  only matter if the gateway is run standalone. This isn't broken,
  but it's a source of confusion and prompt drift if edited in only
  one place. Left as-is pending a decision on which layer should own
  prompt-building; documented in `README.md` and
  `MODEL_ARCHITECTURE.md` so it's no longer silently misleading.
- **The on-device native path (`packages/ai/`, the Capacitor `LocalAI`
  plugin, `android/app/src/main/cpp/` llama.cpp JNI build) is fully
  implemented but not wired into the UI.** `ChatTab.tsx` only calls
  the HTTP gateway path. This means the shipped app's "offline-first"
  claim currently means "no external internet required as long as a
  reachable local gateway machine is running Ollama" — not "works on
  the phone alone." That's a materially different claim from what
  earlier docs implied, and is now stated plainly in `README.md`
  rather than left implicit. Wiring the native plugin into `ChatTab`
  (or removing it, if it's not wanted) is a real feature decision, not
  a bug fix, and needs direction before touching it.

## Validation performed this pass
- `python3 -m py_compile gateway/gateway.py`: PASS
- `python3 -m unittest discover -s gateway`: 3/3 PASS (unchanged)
- `tsc --noEmit` on the now-scoped root `tsconfig.json`: no errors
  other than "`@types/node` not installed," which is expected since
  `npm install` could not reach the registry in this environment and
  will resolve on a normal `npm install`.
- `node --experimental-strip-types --check server.ts`: syntax OK.
- Manual read-through of `server.ts`, `gateway/gateway.py`,
  `apps/mobile/src/App.tsx`, `apps/mobile/src/components/ChatTab.tsx`,
  the Android project (root `android/`, `apps/mobile/android/`), CI
  workflow, and the `.env.example` files against the code that
  actually reads them.
- Full `npm install` / `vite build` / Android Gradle build could not
  be run here (network access to the npm registry and Android SDK is
  not available in this environment) — recommended as the next step
  in an environment with registry access.

## Operational truths carried over from the previous report
No cloud provider can be honestly guaranteed to remain free; quotas
and pricing are controlled by their operators, so they remain optional
fallbacks, not requirements. No model is declared universally "best" —
the application chooses by installed availability and capability.

## Stage 2 — gradual migration + AIProvider abstraction (per user direction)

Implemented exactly the two decisions above, staged (not a rewrite):

**1. server.ts / gateway.py merge — option A, gradual**
- Added `aiRouter.ts`: a Node-native reimplementation of gateway.py's
  public interface (Ollama model discovery by capability, vision-aware
  routing, failover through optional DeepSeek/MiniMax/GLM/Kimi/custom
  `PROVIDERS_JSON` providers, per-provider cooldown). It reads the same
  env var names as `gateway/.env.example` by design.
- Added `aiRouter.test.ts` (Node's built-in test runner, no install
  needed) mirroring `gateway/test_gateway.py`'s two behavioral checks
  (fallback order, vision-only routing) against mocked HTTP — all 3
  pass. Run with `npm run test:ai-router`.
- `server.ts` now supports `AI_BACKEND=gateway` (default, byte-for-byte
  the previous behavior - verified by booting it and hitting `/health`)
  or `AI_BACKEND=node` (routes in-process via `aiRouter.ts`, no Python
  needed - also booted and verified via `/health`, which now reports
  which backend answered and the live provider chain).
- `gateway/gateway.py` was **not modified or removed**. It remains the
  default and the safety net; `README.md` documents this as step 1 of
  3 and spells out when NOT to remove it (a future provider needing a
  Python-only dependency with no solid Node equivalent).

**2. Native/llama.cpp path — option A, wired into the UI**
- Added `apps/mobile/src/lib/aiProviders.ts`: the `AIProvider`
  abstraction (`UI -> AiProvider -> {NativeProvider, GatewayProvider}`)
  exactly as sketched, replacing the old 7-line unused stub of the same
  name. `gatewayProvider` wraps the existing HTTP path; `nativeProvider`
  wraps the existing (previously unused) `LocalAI` Capacitor plugin and
  fails with a clear Persian message (pointing back to the gateway
  option) if the native engine isn't available or no model is loaded
  yet, rather than pretending to work.
- `ChatTab.tsx` now depends only on this abstraction - it no longer
  imports the gateway HTTP client or the native plugin directly - and
  has a small segmented control ("گیت‌وی" / "روی خود گوشی") to switch
  providers per the requested design. The choice persists across
  restarts via `localStorage` (`getPreferredProviderKey` /
  `setPreferredProviderKey`), same pattern already used by
  `progressStore.ts` etc. elsewhere in this app.
- Not done in this pass: a dedicated Settings tab (none existed; the
  toggle lives directly in Chat, where it's used) and a first-run UI
  for picking/downloading a GGUF model file (the plugin already
  exposes `pickModel()`/`loadModel()` for this - wiring an onboarding
  flow for it is a follow-up, not a blocker for the abstraction itself).

**Bug caught and fixed during this stage:** the earlier root
`tsconfig.json` scoping fix (Stage 1) used `"exclude": ["apps",
"packages", ...]` to stop a bare `tsc --noEmit` at the repo root from
also recursing into the workspaces. That exclude, once inherited by
`apps/mobile/tsconfig.json` and every `packages/*/tsconfig.json` (all
of which `extends` the root config and don't set their own
`"exclude"`), resolved relative to the repo root and matched each
workspace's own source directory - silently emptying their builds
("No inputs were found"). Caught by actually running `tsc --noEmit`
from inside `apps/mobile` and `packages/database`, not just from the
root. Fixed by dropping `"exclude"` entirely; `"include": ["server.ts"]`
alone is sufficient and doesn't have this inheritance problem.

**Validation performed:** `gateway/test_gateway.py` (3/3, unchanged),
`aiRouter.test.ts` via `node --test` (3/3, new), `server.ts` booted
live in both `AI_BACKEND` modes with `/health` checked in each,
`tsc --noEmit` run separately from the repo root, `apps/mobile`, and
`packages/database` (each workspace typechecks its own files again;
remaining errors in `apps/mobile` are exclusively missing
`@types/react`/`@types/node`/`lucide-react` type packages, unresolved
because `npm install` cannot reach the registry in this environment -
same pre-existing category as before, not new).

## Stage 3 — completed the native model management flow

The native provider previously had nowhere for a user to actually load
a model - `LocalAI.pickModel()`/`loadModel()`/`unloadModel()` existed
in the plugin but nothing in the UI ever called them, so switching to
"روی خود گوشی" would always just say "no model loaded" with no way
forward. Added:
- `getNativeStatus()`, `pickAndLoadNativeModel()`, `unloadNativeModel()`
  in `aiProviders.ts` (separate from `chat()`, since this is its own
  multi-step flow with progress feedback).
- A small status panel in `ChatTab.tsx`, shown only when "روی خود گوشی"
  is selected: checks status on selection, and shows either "engine
  unavailable on this platform," a پیک/لود button when no model is
  loaded, or the loaded model's filename with an unload button.

This was verified by static/type review only (opening the system file
picker and loading a real GGUF file needs an actual Android device,
which this environment doesn't have) - flagging that as the one part
of this stage that still needs a real-device smoke test before you
rely on it.

## Stage 4 — confirmed final architecture: full feature set

Per direction: architecture is now locked (no further architecture
changes planned), all three layers (Python gateway, Node router,
native provider) stay in place as a deliberate safety net, and
`gateway/gateway.py` is **not** being removed. The following were
implemented as real, tested code within that locked architecture:

**1. Native -> Ollama -> Cloud priority (real, not aspirational)**
`autoProvider` added to `aiProviders.ts` and made the default: tries
the on-device model first when one is actually loaded, and falls back
to the gateway automatically on any failure or absence. This is the
mechanism that makes the requested priority order real rather than a
manual per-session toggle.

**2. Task-aware Smart Routing (capability + task, not just capability)**
Both `aiRouter.ts` and `gateway/gateway.py` now accept a `task`
("chat" vs "speaking") that changes local-model ranking: "speaking"
prefers the smallest/fastest installed Ollama model (latency matters
more than exact preference match for a live back-and-forth); any other
task keeps the previous preference-name-then-size ranking. Implemented
identically in both languages, each with new passing tests
(`aiRouter.test.ts`: 5/5, `gateway/test_gateway.py`: 5/5). `server.ts`
threads `task` through both the raw `/v1/chat/completions` call (as an
extra, non-standard JSON field gateway.py now reads) and its own
`/api/chat` prompt builder.

**3. Speaking Mode as a first-class, separate mode**
`ChatTab.tsx` now has a continuous voice loop (listen -> reply -> speak
-> listen) distinct from typed Chat, with no Send-button requirement
inside the loop, start/stop controls, and a live phase indicator
(listening/thinking/speaking). Built entirely on the same browser
SpeechRecognition/speechSynthesis APIs already used elsewhere in this
app (extended `playSpeech()` in `App.tsx` with an optional `onEnd`
callback to drive the loop) - **not** a new offline STT/TTS engine and
**not** a dedicated VAD algorithm; this is stated plainly in
`README.md` so it isn't mistaken for more than it is. Genuinely
offline in-app STT/TTS (e.g. whisper.cpp/piper) would be new native
plugins and real-device testing, not delivered here.

**4. Language Memory**
New `apps/mobile/src/languageMemoryStore.ts`: logs the model's own
"اصلاح:" correction line per dialect (deduped, counted, skips the
explicit "no correction" marker), and `getFrequentMistakes()` feeds the
top few back into the prompt (`knownMistakes` in `ChatRequest`,
threaded through both `aiProviders.ts`'s native-path prompt builder and
`server.ts`'s `handleChat`).

**5. Adaptive Difficulty**
New `apps/mobile/src/levelStore.ts`: `computeLevel(dialect)` derives a
level label purely from real logged pronunciation-practice scores
already in `progressStore.ts` (average score + attempt count, with a
5-attempt minimum before leaving "Beginner") - explicitly documented as
a transparent heuristic, not a validated CEFR placement test. Threaded
through as `levelHint` the same way as Language Memory.

**6. Accent Coach**
New `apps/mobile/src/accentCoach.ts` + a collapsible panel in
`ChatTab.tsx`. Scoped deliberately to the 6 dialect groups this app's
`PERSONAS` actually cover (Iraqi, Lebanese, Gulf, Egyptian Arabic;
American, British English) with a handful of well-established,
accurate tips each (pronunciation, vocabulary, one expression,
rhythm/grammar) - not an invented exhaustive linguistic database, and
not fabricated coverage for accents (e.g. Australian, Canadian) with
no persona/voice in this app.

**7. Model Manager**
New `GET /api/models` on `server.ts` (proxies to `describeProviders()`
for `AI_BACKEND=node`, or to the gateway's own `/health` for
`AI_BACKEND=gateway`) + `apps/mobile/src/lib/modelManager.ts` +
a "مدیریت مدل‌ها" panel in `ChatTab.tsx` showing the real, live
provider/model list and availability - never a hardcoded list. Native
model management (pick/load/unload a GGUF file) was already added in
Stage 3 and is unchanged here.

**What still needs real-device verification (not possible from this
development environment, flagged rather than glossed over):**
- The native model pick/load/unload flow end-to-end on an actual
  Android device (system file picker, JNI load, inference latency).
- Speaking Mode's mic/TTS behavior on Android specifically - browser
  SpeechRecognition support and quality vary by device/WebView/Google
  services availability in ways this sandboxed environment cannot
  exercise.
- Whether `autoProvider`'s native-first behavior actually feels
  responsive enough in practice to prefer over the gateway once a
  model is loaded (a latency/quality tradeoff only real usage answers).

**Validation performed this stage:** `python3 -m unittest discover -s
gateway` (5/5, 2 new), `node --test aiRouter.test.ts` (5/5, 2 new),
`tsc --noEmit` run separately from the repo root, `apps/mobile`, and
`packages/database` (all clean beyond the pre-existing
missing-`@types/node`/`@types/react`/`lucide-react` cascade from this
environment's blocked npm registry access), and `server.ts` booted
live with `AI_BACKEND=node` to confirm `/api/models` returns real data
end-to-end.

## Stage 5 — reprioritization + Streaming + Crash Recovery + Quiz-in-loop

Per direction: deprioritize peripheral features (without deleting
anything), fold Quiz into the learning loop, and finish the
before-testing checklist items (Context Manager done in Stage 4;
Streaming, Crash Recovery done here).

**Self-caught bug this stage:** an earlier edit adding
`routeChatStream()` to `aiRouter.ts` accidentally left the *old*
`routeChat()` function's body orphaned without its function signature
(the signature got overwritten instead of preserved), which broke
`aiRouter.ts` entirely - it would fail to even load
(`ERR_INVALID_TYPESCRIPT_SYNTAX: Expression expected`). Caught by
actually trying to import the file (`node --experimental-strip-types
-e 'import("./aiRouter.ts")'`), not just by `--check`, which had
passed despite the corruption. Fixed by restoring the missing
signature; all tests re-confirmed passing afterward.

**1. Navigation reprioritized (not deleted)**
Checked first: this repo has zero Game/Leaderboard/Achievement/social
features to strip out. Tab bar in `App.tsx` now has core tabs (AI
Chat, Scenario, Compare) always visible, everything else behind a
"⋯ بیشتر" toggle - Translator, Lingo Quiz, Matrix, Podcast, Planner,
Sign OCR, SOS Safety. Nothing removed from the codebase. Default tab
changed from Translator to AI Chat.

**2. Quiz folded into the learning loop**
New `MistakePracticeCard` in `ChatTab.tsx`: once a session has 2+ real
logged mistakes, offers a 3-question quiz built specifically from them
via `/api/quiz`'s new `mistakes` field - implemented identically in
`server.ts`'s `handleQuiz` and `gateway.py`'s `task_response`
(Python syntax-checked and existing test suite re-confirmed passing).
The standalone `QuizTab.tsx` is unchanged and still reachable from
"بیشتر" for open-ended practice, per the "don't remove Quiz entirely"
direction.

**3. Streaming (real, end-to-end, not simulated)**
- `aiRouter.ts`: `routeChatStream()` - same provider selection/failover
  as `routeChat()`, yields text as it arrives via SSE parsing. 2 new
  tests (happy path, fallback on an empty stream) - both pass.
- `gateway/gateway.py`: `try_provider_stream()` / `route_stream()` -
  same design, proxying the upstream SSE response line-by-line via a
  new `http_stream_lines()` helper. 2 new tests with a mocked HTTP
  layer - both pass. `/v1/chat/completions` now branches on
  `body.get("stream")`.
- `server.ts`: refactored `handleChat`'s prompt-building into a shared
  `buildChatPrompt()` (used by both the streaming and non-streaming
  paths, so they can't drift into different prompts), and added
  `POST /api/chat/stream`, which streams from whichever `AI_BACKEND`
  is active as Server-Sent Events.
- `aiProviders.ts`: `streamGatewayChat()` consumes it; `ChatTab.tsx`
  updates the reply bubble live as chunks arrive, for typed Chat only
  (not Speaking Mode - a partial sentence being read by TTS mid-stream
  would sound broken) and only when "گیت‌وی" is explicitly selected
  (not "خودکار"/"روی خود گوشی" - streaming here would bypass auto's
  native-first decision, which happens inside the non-streaming path).
  Falls back to the regular non-streaming call automatically on any
  streaming failure.
- **Real end-to-end verification performed in this environment:**
  started an actual local HTTP server standing in for Ollama (real SSE
  responses, not mocked at the fetch layer), ran the actual
  `gateway/gateway.py` process against it, and hit `server.ts`'s
  `/api/chat/stream` over real sockets for **both** `AI_BACKEND=node`
  and `AI_BACKEND=gateway` - confirmed real incremental chunks flow
  through the whole stack end to end, not just passing isolated unit
  tests. **Not yet verified against a real Ollama instance or on a
  real Android device/browser** - flagged as the one remaining check
  before trusting this in production.

**4. Crash Recovery (UI level)**
New `apps/mobile/src/components/TabErrorBoundary.tsx`, wrapping the
tab content area in `App.tsx` (keyed by `activeTab`, so switching tabs
clears any prior crash state). Confirmed the pre-existing `key`-prop
TypeScript error this introduced is the same missing-`@types/react`
cascade already present elsewhere in the codebase (checked: an
identical `key does not exist on type 'PhraseCardProps'` error already
existed before this change), not a new issue.

**Still not done from the full priority list (explicitly deferred, not
silently skipped):**
- Formal Model Capability Registry / Model Profiles as a named,
  documented concept (the underlying mechanism - per-provider
  capability sets, task-aware ranking - already exists in
  `aiRouter.ts`/`gateway.py` since Stage 4, but hasn't been pulled into
  one clearly-labeled "registry" the rest of the app references).
- Benchmark + Diagnostics panel (real device tokens/sec, latency
  history, RAM).
- Battery/Temperature Guard, Offline Queue - both need new native
  Capacitor plugins (e.g. `@capacitor/device`), which is a new
  dependency decision not made unilaterally here; needs your
  confirmation before adding.

**Validation performed this stage:** `python3 -m unittest discover -s
gateway` (7/7, 2 new), `node --test aiRouter.test.ts` (7/7, 2 new),
`tsc --noEmit` clean (root/apps/mobile/packages, same pre-existing
missing-type-package cascade only), and the real end-to-end streaming
test described above against both backends.

## Stage 6 — archived the orphaned legacy AI package

Independently re-verified the finding (dependency search in every
`package.json`, a repo-wide code search for its exported symbols, and
a check of every `tsconfig.json`'s `references`) that `packages/ai`
(`AIManager`/`ModelManager`/`LocalLLMProvider`/`PromptBuilder`/
`NativePlugin`) has zero live references anywhere - superseded by the
current `apps/mobile/src/services/localAI.ts` +
`apps/mobile/src/lib/aiProviders.ts` design, which the old package's
own `NativePlugin.ts` even has a comment noting. The two apparent
matches on a quick grep are both false positives, confirmed by
inspection: `package-lock.json` lists every npm workspace regardless
of whether anything imports it, and `ChatTab.tsx`'s `ModelManagerPanel`
is an unrelated same-named React component added for the current Model
Manager feature, not this package's `ModelManager` class.

Moved `packages/ai` -> `archive/legacy-ai` (out of the npm workspace
glob `packages/*`, so no explicit `package.json` edit was needed) with
a new `ARCHIVED.md` documenting exactly what was checked and why it
was kept rather than deleted (its model-selection and CEFR/dialect
prompt abstractions may be a useful reference if the native path is
ever formalized into its own package again). `README.md` now points to
it. Re-ran the full validation suite after the move (7/7 Python, 7/7
Node, all three TypeScript workspaces unchanged) to confirm the move
itself broke nothing - it didn't, since nothing referenced it.

## Stage 6 — packages/ai archive: found and fixed a lockfile break it left behind

The `packages/ai` -> `archive/legacy-ai` move (unused legacy AI
abstraction layer, superseded by `apps/mobile/src/services/localAI.ts`
+ `apps/mobile/src/lib/aiProviders.ts` - verified via zero imports and
zero `package.json` dependents outside itself, documented in
`archive/legacy-ai/ARCHIVED.md`) was already done and already reflected
in `README.md`.

**What was missed and is fixed now:** `package-lock.json` still had a
`"packages/ai"` workspace entry and a `"node_modules/@lingua/ai"` link
entry pointing at a directory that no longer exists. Left in place,
this would make `npm install`/`npm ci` fail or error for the next
person to check out this repo, since npm expects a workspace path
listed in the lockfile to actually exist on disk. Removed both stale
entries directly from `package-lock.json` (hand-edited via a small
Python script for a clean, validated JSON diff, since `npm install`
itself can't be run in this environment to regenerate it) and
confirmed no other entry in the lockfile still references
`@lingua/ai`.

**Validation:** lockfile re-parsed successfully as JSON after the
edit; `python3 -m unittest discover -s gateway` (7/7), `node --test
aiRouter.test.ts` (7/7), and `tsc --noEmit` across root/apps/mobile/
packages/database all re-confirmed clean (same pre-existing
missing-type-package cascade only) - the archive move itself broke
nothing beyond the lockfile.

## Stage 7 — real bug reported from an actual device install, fixed

First real-device signal: after installing the APK, the home screen
showed `Unexpected token '<', "<!doctype "... is not valid JSON`.

**Root cause, confirmed:** this is exactly the gap flagged as a risk
back in Stage 1/2 ("real offline-on-a-phone needs the native path") -
on a fresh install with neither a native model loaded nor
`VITE_AI_BASE_URL` pointed at a reachable gateway, any `fetch("/api/...")`
resolves to the app's own static-asset origin. Many WebView/static
file servers (including Capacitor's) respond to any unmatched path
with `index.html` as an SPA fallback - often with a `200 OK` status -
so a bare `!res.ok` check doesn't catch it, and calling `.json()` on
that HTML body throws exactly this message. It was leaking straight to
the user instead of being turned into a clear error anywhere.

**Fixed at every call site that parses a fetch response as JSON:**
- `apps/mobile/src/lib/net.ts`'s `apiFetch` (used by nearly every
  `/api/*` call in the app) now checks the response's actual
  `Content-Type` before calling `.json()`, and also wraps the `fetch()`
  call itself in a try/catch (for the "never even reached a server"
  case, e.g. no network at all) - both now throw one clear, actionable
  Persian message pointing at the two real fixes (use "روی خود گوشی،"
  or configure `VITE_AI_BASE_URL`) instead of a raw parse error.
- `apps/mobile/src/lib/aiProviders.ts`'s `streamGatewayChat` - confirmed
  already safe by construction (an HTML body just yields zero SSE
  chunks, so `ChatTab.tsx`'s existing streaming-failure fallback to the
  non-streaming call already handles it) - documented why, not changed.
- `App.tsx`'s gateway health check - hardened with the same
  Content-Type guard for consistency, even though it was already
  wrapped in try/catch and couldn't have been the actual source of a
  screen-visible crash.
- Added a global `unhandledrejection` listener in `App.tsx` as defense
  in depth - converts any *other* future uncaught async error anywhere
  in the app into a friendly toast instead of whatever raw
  browser/WebView default would otherwise show, rather than relying
  solely on every call site remembering to catch its own errors.

**Verified with a real reproduction, not just reasoning about it:**
started an actual local HTTP server that serves `<!doctype html>...`
with a `200 OK` for any path (i.e. exactly what a Capacitor WebView's
static server does when nothing else is configured), pointed the
hardened `apiFetch` logic at it, and confirmed it now throws the clear
Persian message instead of the raw JSON-parse error.

**Added to README.md:** a "Troubleshooting" section naming this exact
error message and the two real fixes (native model, or point
`VITE_AI_BASE_URL` at a reachable gateway) - since fixing the error
*message* doesn't make chat work without one of those two being set
up; that part is inherent to a fresh install with nothing configured
yet, not a bug.

**Validation:** `python3 -m unittest discover -s gateway` (7/7, no
Python touched this stage), `node --test aiRouter.test.ts` (7/7, no
Node router touched this stage), `tsc --noEmit` clean across
root/apps/mobile/packages (same pre-existing missing-type-package
cascade only), and the real HTTP-server reproduction above.
