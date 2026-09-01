import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

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

export type LocalAIGenerationStatus = 'done' | 'error' | 'cancelled';

export interface LocalAIGenerateResult {
  value: string;
  status?: LocalAIGenerationStatus;
  modelLoaded: boolean;
  modelPath: string | null;
  engine: string;
}

export interface LocalAIGenerationTokenEvent {
  token: string;
}

export interface LocalAIGenerationStatusEvent {
  status: 'start' | LocalAIGenerationStatus;
}

export interface LocalAICancelResult {
  ok: boolean;
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

  /*
   * Phase 8-D: same contract as chat(), but fires "generationToken"
   * events (batched every ~40ms, not one per token) as pieces are
   * produced, plus a "generationStatus" event at start/end, before
   * finally resolving with the full text and a status field.
   * Listen with addListener() BEFORE calling this, so no early
   * tokens are missed.
   */
  streamChat(options: {
    message: string;
  }): Promise<LocalAIGenerateResult>;

  /*
   * Review fix #4: stops an in-flight streamChat(). Cooperative -
   * takes effect on the next generated token, not instantly.
   */
  cancelGeneration(): Promise<LocalAICancelResult>;

  addListener(
    eventName: 'generationToken',
    listenerFunc: (event: LocalAIGenerationTokenEvent) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'generationStatus',
    listenerFunc: (event: LocalAIGenerationStatusEvent) => void
  ): Promise<PluginListenerHandle>;
}

const LocalAI = registerPlugin<LocalAIPlugin>('LocalAI');

export default LocalAI;
