/**
 * Run with: node --experimental-strip-types --test aiRouter.test.ts
 *
 * Uses node:test (built-in, no npm install required) and mocks the
 * global fetch used by aiRouter.ts, so this exercises the same
 * behaviors gateway/test_gateway.py checks in the Python router:
 * fallback ordering through failing providers, and skipping
 * non-vision providers for image requests.
 */
import test from "node:test";
import assert from "node:assert/strict";

process.env.OLLAMA_BASE_URL = "http://fake-ollama:11434";
process.env.DEEPSEEK_API_KEY = "test-key";
process.env.DEEPSEEK_MODEL = "deepseek-chat";
process.env.PROVIDER_COOLDOWN = "20";

const { routeChat, routeChatStream, _resetDiscoveryCacheForTests } = await import("./aiRouter.ts");

function mockFetch(handlers: Record<string, (init?: RequestInit) => any>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: RequestInit) => {
    const url = String(input);
    for (const [key, handler] of Object.entries(handlers)) {
      if (url.includes(key)) {
        const body = handler(init);
        return new Response(JSON.stringify(body), { status: 200 });
      }
    }
    return new Response(JSON.stringify({ error: "unhandled url in test: " + url }), { status: 404 });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

test("falls back to the next provider when the first (local model) fails", async () => {
  _resetDiscoveryCacheForTests();
  const restore = mockFetch({
    "/api/tags": () => ({ models: [{ name: "some-local-model", size: 100 }] }),
    "/api/show": () => ({ details: {} }),
    "fake-ollama:11434/v1/chat/completions": () => {
      throw new Error("simulated local failure");
    },
    "api.deepseek.com/chat/completions": () => ({ choices: [{ message: { content: "ok from deepseek" } }] }),
  });
  try {
    const result = await routeChat([{ role: "user", content: "hi" }]);
    assert.equal(result.provider, "deepseek");
    assert.equal(result.text, "ok from deepseek");
  } finally {
    restore();
  }
});

test("skips a text-only local model for an image request and uses the vision-capable fallback", async () => {
  _resetDiscoveryCacheForTests();
  // Only PROVIDERS_JSON entries can declare vision (same as gateway.py's
  // env_provider(): the built-in cloud fallbacks are always chat-only by
  // default), so use a custom vision-capable provider for this check.
  const previousProvidersJson = process.env.PROVIDERS_JSON;
  process.env.PROVIDERS_JSON = JSON.stringify([
    { name: "custom-vision", base_url: "https://vision.example.com/v1", model: "vision-model", api_key: "k", capabilities: ["chat", "vision"] },
  ]);
  const restore = mockFetch({
    "/api/tags": () => ({ models: [{ name: "text-only-model", size: 100 }] }),
    "/api/show": () => ({ details: {} }), // no vision capability reported
    "fake-ollama:11434/v1/chat/completions": () => {
      throw new Error("should never be called for a vision request");
    },
    "vision.example.com/v1/chat/completions": () => ({ choices: [{ message: { content: "described the image" } }] }),
  });
  try {
    const result = await routeChat([
      { role: "user", content: [{ type: "image_url", image_url: { url: "data:image/png;base64,x" } }] },
    ]);
    assert.equal(result.provider, "custom-vision");
  } finally {
    restore();
    process.env.PROVIDERS_JSON = previousProvidersJson;
  }
});

test("throws with a clear message when every provider fails", async () => {
  _resetDiscoveryCacheForTests();
  const restore = mockFetch({
    "/api/tags": () => ({ models: [] }),
    "api.deepseek.com/chat/completions": () => {
      throw new Error("simulated cloud failure");
    },
  });
  try {
    await assert.rejects(() => routeChat([{ role: "user", content: "hi" }]), /All suitable AI providers failed/);
  } finally {
    restore();
  }
});

test("a 'speaking' task prefers the smallest installed local model for latency", async () => {
  _resetDiscoveryCacheForTests();
  const restore = mockFetch({
    "/api/tags": () => ({
      models: [
        { name: "big-model", size: 8_000_000_000 },
        { name: "small-model", size: 900_000_000 },
      ],
    }),
    "/api/show": () => ({ details: {} }),
    "fake-ollama:11434/v1/chat/completions": (init) => {
      const body = JSON.parse(String((init as any).body));
      return { choices: [{ message: { content: `answered by ${body.model}` } }] };
    },
  });
  try {
    const result = await routeChat([{ role: "user", content: "hi" }], { task: "speaking" });
    assert.equal(result.model, "small-model");
  } finally {
    restore();
  }
});

test("a normal 'chat' task keeps the default preference/size ordering (not forced to the smallest model)", async () => {
  _resetDiscoveryCacheForTests();
  const previousPref = process.env.OLLAMA_MODEL_PREFERENCE;
  process.env.OLLAMA_MODEL_PREFERENCE = "big-model";
  const restore = mockFetch({
    "/api/tags": () => ({
      models: [
        { name: "big-model", size: 8_000_000_000 },
        { name: "small-model", size: 900_000_000 },
      ],
    }),
    "/api/show": () => ({ details: {} }),
    "fake-ollama:11434/v1/chat/completions": (init) => {
      const body = JSON.parse(String((init as any).body));
      return { choices: [{ message: { content: `answered by ${body.model}` } }] };
    },
  });
  try {
    const result = await routeChat([{ role: "user", content: "hi" }], { task: "chat" });
    assert.equal(result.model, "big-model");
  } finally {
    restore();
    process.env.OLLAMA_MODEL_PREFERENCE = previousPref;
  }
});

function mockFetchStream(handlers: Record<string, (init?: RequestInit) => string[] | null>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: RequestInit) => {
    const url = String(input);
    for (const [key, handler] of Object.entries(handlers)) {
      if (url.includes(key)) {
        const sseLines = handler(init);
        if (sseLines === null) return new Response("not found", { status: 404 });
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            for (const line of sseLines) controller.enqueue(encoder.encode(line + "\n"));
            controller.close();
          },
        });
        return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
      }
    }
    return new Response(JSON.stringify({ error: "unhandled url in test: " + url }), { status: 404 });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

test("routeChatStream yields deltas as they arrive and a final done chunk", async () => {
  _resetDiscoveryCacheForTests();
  const restore = mockFetchStream({
    "/api/tags": () => null,
    "fake-ollama:11434/v1/chat/completions": () => [
      `data: ${JSON.stringify({ choices: [{ delta: { content: "Hel" } }] })}`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: "lo!" } }] })}`,
      "data: [DONE]",
    ],
  });
  try {
    const chunks: { delta: string; done: boolean; provider?: string }[] = [];
    for await (const chunk of routeChatStream([{ role: "user", content: "hi" }])) chunks.push(chunk);
    const fullText = chunks.map((c) => c.delta).join("");
    assert.equal(fullText, "Hello!");
    assert.equal(chunks[chunks.length - 1].done, true);
  } finally {
    restore();
  }
});

test("routeChatStream falls back to the next provider if the first stream never yields any text", async () => {
  _resetDiscoveryCacheForTests();
  process.env.DEEPSEEK_API_KEY = "test-key";
  const restore = mockFetchStream({
    "/api/tags": () => null,
    "fake-ollama:11434/v1/chat/completions": () => [], // connects, but never sends any data: line
    "api.deepseek.com/chat/completions": () => [
      `data: ${JSON.stringify({ choices: [{ delta: { content: "from deepseek" } }] })}`,
      "data: [DONE]",
    ],
  });
  try {
    const chunks: { delta: string; done: boolean; provider?: string }[] = [];
    for await (const chunk of routeChatStream([{ role: "user", content: "hi" }])) chunks.push(chunk);
    assert.equal(chunks.map((c) => c.delta).join(""), "from deepseek");
    assert.equal(chunks[0].provider, "deepseek");
  } finally {
    restore();
  }
});
