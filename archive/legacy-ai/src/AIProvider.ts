import type {
  AIRequest,
  AIResponse,
  DeviceProfile,
  LocalModel
} from './types';

export interface AIProvider {
  readonly type: 'local' | 'ollama';

  isAvailable(): Promise<boolean>;

  getRecommendedModel(
    device: DeviceProfile
  ): Promise<LocalModel | null>;

  loadModel(model: LocalModel): Promise<void>;

  unloadModel(): Promise<void>;

  generate(
    request: AIRequest
  ): AsyncGenerator<string>;

  generateComplete(
    request: AIRequest
  ): Promise<AIResponse>;

  healthCheck(): Promise<boolean>;

  /*
   * Review fix #4 (optional at the interface level): not every
   * provider can necessarily interrupt a request already in
   * flight (e.g. a simple request/response cloud provider), so
   * this stays optional rather than forcing every implementation
   * to support it. LocalLLMProvider does implement it.
   */
  cancel?(): Promise<void>;
}
