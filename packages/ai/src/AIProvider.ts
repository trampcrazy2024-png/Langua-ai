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
}
