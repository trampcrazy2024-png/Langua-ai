# Archived: legacy `@lingua/ai` package

This was an earlier attempt at an AI abstraction layer
(`AIManager`/`ModelManager`/`LocalLLMProvider`/`PromptBuilder`/
`NativePlugin`) as its own workspace package. It was superseded by a
later, simpler design built directly inside `apps/mobile` - the
`LocalAI` Capacitor plugin (`apps/mobile/src/services/localAI.ts`) and
the `AIProvider` abstraction (`apps/mobile/src/lib/aiProviders.ts`) -
without a separate cross-package import. See `NativePlugin.ts` in this
folder for a comment noting that exact architecture change.

**Verified before archiving (not just assumed):**
- Not listed as a dependency of `apps/mobile`, `packages/core`,
  `packages/database`, or `packages/shared` (`package.json` search).
- Zero imports anywhere outside this folder of `AIManager`,
  `ModelManager`, `LocalLLMProvider`, `PromptBuilder`, `SystemPrompt`,
  or `NativePlugin` (repo-wide code search).
- Not referenced by any `tsconfig.json`'s `references`.
- The only mentions elsewhere are `package-lock.json` (lists every npm
  workspace regardless of whether anything imports it) and an
  unrelated same-named `ModelManagerPanel` React component in
  `ChatTab.tsx` (a UI panel added later for the current Model Manager
  feature - not this package's `ModelManager` class).

**Why archived, not deleted:** `LocalLLMProvider.ts`'s battery/RAM-
aware model-selection logic and `PromptBuilder.ts`/`SystemPrompt.ts`'s
CEFR/dialect prompt abstraction are reasonably clean and may be a
useful reference if the native on-device path is ever formalized into
its own package again. Nothing here should be imported as-is without
re-checking it against the current architecture in
`MODEL_ARCHITECTURE.md` first - it predates the model-agnostic gateway
routing, the `AiProvider` abstraction, Language Memory, Adaptive
Difficulty, and Speaking Mode, none of which it knows about.
