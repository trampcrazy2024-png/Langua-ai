# Lingua AI Gateway

Local-first router for the personal dialect-learning app.

## Routing order

1. **Qwen3-4B via local Ollama** — `http://127.0.0.1:11434`
2. **DeepSeek API** — only when `DEEPSEEK_API_KEY` is configured
3. **MiniMax -> GLM -> Kimi** — only when their API keys are configured

The fallback services are configurable OpenAI-compatible providers. Their free/trial quotas are provider-controlled and can change; the gateway never embeds credentials.

## Run

```bash
python3 gateway/gateway.py
```

Then run the API proxy (`server.ts`) on port 3000. The mobile app talks only to the API proxy, never directly to cloud providers.

## Ollama

Make sure Ollama is running and the Qwen3-4B model is available. The gateway automatically checks `/api/tags` and will use the first local Qwen3 4B tag if `QWEN_MODEL` is not present.
