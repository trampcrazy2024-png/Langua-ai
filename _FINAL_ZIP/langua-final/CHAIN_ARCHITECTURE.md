# Final AI chain

The mobile app now has a real server-independent fallback chain:

1. **On-device GGUF / llama.cpp** — preferred when a model is loaded.
2. **OpenRouter Free** — direct HTTPS from the phone, using `openrouter/free`.
3. **Gemini Developer API free tier** — direct HTTPS from the phone.
4. **Configured Gateway** — optional; preserves Ollama and the existing DeepSeek/MiniMax/GLM/Kimi/custom-provider routing.

The app never embeds an API key. The learner enters their own optional free-tier
keys in AI Chat settings; keys are stored in localStorage on that device.

This avoids requiring a separate PC/server for the cloud fallback. Free service
availability and quotas remain controlled by the respective providers.
