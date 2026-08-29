export type AIModelSize = '0.5B' | '1.5B' | '3B' | '7B';

export type AIProviderType = 'local' | 'ollama';

export interface GenerateOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string[];
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  options?: GenerateOptions;
}

export interface AIResponse {
  text: string;
  model: string;
  provider: AIProviderType;
  latencyMs: number;
}

export interface LocalModel {
  id: string;
  name: string;
  size: AIModelSize;
  path: string;
  quantization: string;
  installed: boolean;
  loaded: boolean;
  ramRequiredMb: number;
}

export interface DeviceProfile {
  ramMb: number;
  batteryPercent: number;
  charging: boolean;
}
