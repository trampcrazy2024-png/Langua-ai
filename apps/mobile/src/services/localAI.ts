import { registerPlugin } from '@capacitor/core';

export interface LocalAIPingResult {
  ok: boolean;
  engine: string;
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
  engine: string;
}

export interface LocalAIModelPickerResult {
  ok: boolean;
  uri: string;
  path: string;
  name: string;
  size: number;
}

export interface LocalAILoadResult {
  ok: boolean;
  loaded: boolean;
  path: string;
  engine: string;
}

export interface LocalAIUnloadResult {
  ok: boolean;
  loaded: boolean;
  engine: string;
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

  pickModel(): Promise<LocalAIModelPickerResult>;

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
