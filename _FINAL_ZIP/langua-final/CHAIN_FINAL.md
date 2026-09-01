# Langua AI — Final mobile AI chain

## Runtime order

`Native GGUF (llama.cpp) → Ollama (optional direct URL) → OpenRouter Free → Gemini Free → optional Gateway → clear error`

- **Native GGUF** is tried first when a model is loaded in the APK.
- **Ollama** is optional and is configured from the AI Chat settings. It is only attempted when an Ollama base URL is present.
- **OpenRouter Free** is a real direct HTTPS call from the APK using the user's own API key. The app uses `openrouter/free`, which currently routes among OpenRouter's free models.
- **Gemini Free** is the second direct internet fallback when a Gemini API key is supplied. The implementation uses the current stable `gemini-2.5-flash` endpoint.
- **Gateway** remains optional for users who still want a LAN/server backend.
- No shared API key is embedded in the APK or repository.

## Scenario

Scenario start, scenario turns, and scenario reports use the same direct internet fallback instead of requiring `/api/*` or a running gateway. This removes the previous `AI Gateway not setup` dependency from the Scenario flow.

## Native speech

The unavailable `@capacitor-community/text-to-speech@7.0.0` dependency was removed. Android TTS is now provided by the app's own `NativeTTS` Capacitor plugin, while speech recognition continues to use the installed community speech-recognition plugin.

## Android fixes

- `MainActivity` now passes Capacitor's `Bridge` to `BridgeWebChromeClient`, matching Capacitor 7.x.
- Runtime microphone permission handling is preserved.
- The existing Android back-button tab history is preserved.
- Quiz, Memory, More, Translator, Planner, OCR, Podcast and Safety tabs are not removed.

## CMake / llama.cpp

The Android CMake project continues to consume `third-party/llama.cpp` directly. The installer uses the current upstream CMake-based build; it does not rely on the removed legacy `make` build path.
