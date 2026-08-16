import { registerPlugin } from '@capacitor/core';

export interface LocalAIPingResult {
  ok: boolean;
  engine: string;
  native?: boolean;
}

export interface LocalAIAvailabilityResult {
  value: boolean;
  engine: string;
  runtime: string;
  loaded: boolean;
}

export interface LocalAIHealthResult {
  available: boolean;
  modelLoaded: boolean;
  modelPath: string | null;
}

export interface LocalAILoadResult {
  ok: boolean;
  loaded: boolean;
  modelPath: string;
}

export interface LocalAIUnloadResult {
  ok: boolean;
  loaded: boolean;
}

export interface LocalAIGenerateResult {
  value: string;
  modelLoaded: boolean;
  modelPath: string | null;
  engine: string;
}

export interface LocalAIPlugin {
  ping(): Promise<LocalAIPingResult>;

  isAvailable(): Promise<LocalAIAvailabilityResult>;

  healthCheck(): Promise<LocalAIHealthResult>;

  loadModel(options: {
    path: string;
  }): Promise<LocalAILoadResult>;

  unloadModel(): Promise<LocalAIUnloadResult>;

  generate(options: {
    prompt: string;
  }): Promise<LocalAIGenerateResult>;

  chat(options: {
    message: string;
  }): Promise<LocalAIGenerateResult>;
}

const LocalAI = registerPlugin<LocalAIPlugin>('LocalAI');

export default LocalAI;
