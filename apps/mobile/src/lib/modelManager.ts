import { apiFetch } from "./net";

export interface ModelInfo {
  name: string;
  model: string;
  kind?: string;
  configured: boolean;
  available: boolean;
  capabilities: string[];
}

/** Real, live list of what the gateway can currently route to - installed
 * Ollama models plus whichever optional cloud fallbacks are configured -
 * never a hardcoded model name. Throws on failure; callers should show
 * that failure rather than a fake/empty list. */
export async function listAvailableModels(): Promise<ModelInfo[]> {
  const result = await apiFetch<{ providers?: ModelInfo[] }>("/api/models", { method: "GET" });
  return result.providers ?? [];
}
