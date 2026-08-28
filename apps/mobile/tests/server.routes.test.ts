import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/*
 * Bug fix: this test used to import `GoogleGenAI` from "@google/genai"
 * and only assert that the import was a function - it didn't test any
 * of this project's own code, and kept a Gemini SDK dependency alive
 * in the project even after server.ts itself was moved onto the
 * Python gateway. Replaced with a real test of the actual routing
 * code in ../../server.ts (root-level - that file, not any per-app
 * copy, is what `npm run server` executes).
 */
import { gatewayChat, handleChat, routes } from "../../../server";

describe("server -> gateway integration", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("gatewayChat posts an OpenAI-style payload and returns the reply text", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "  hello from the gateway  " } }]
      })
    });

    const reply = await gatewayChat([{ role: "user", content: "hi" }]);

    expect(reply).toBe("hello from the gateway");
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(String(url)).toContain("/v1/chat/completions");

    const body = JSON.parse(init.body);
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("gatewayChat surfaces a gateway-reported error instead of swallowing it", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: "all providers failed" })
    });

    await expect(
      gatewayChat([{ role: "user", content: "hi" }])
    ).rejects.toThrow("all providers failed");
  });

  it("handleChat builds a dialect-aware prompt and returns the gateway's reply", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "أهلاً" } }]
      })
    });

    const result = await handleChat({
      message: "مرحبا",
      dialect: "Baghdadi Arabic",
      personaName: "Ali"
    });

    expect(result).toEqual({ response: "أهلاً" });

    const [, init] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.messages[0].content).toContain("Baghdadi Arabic");
    expect(body.messages[0].content).toContain("Ali");
  });

  it("registers every documented /api/* route", () => {
    expect(Object.keys(routes).sort()).toEqual(
      [
        "/api/chat",
        "/api/daily-phrases",
        "/api/generate-phrases",
        "/api/ocr",
        "/api/planner",
        "/api/quiz",
        "/api/scenario-report",
        "/api/translate"
      ].sort()
    );
  });
});
