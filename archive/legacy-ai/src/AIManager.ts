import type {
  AIProvider
} from './AIProvider';

import type {
  AIRequest,
  AIResponse,
  DeviceProfile
} from './types';

import { ModelManager } from './ModelManager';

export class AIManager {
  private activeProvider: AIProvider | null = null;

  constructor(
    private readonly localProvider: AIProvider,
    private readonly modelManager: ModelManager
  ) {}

  async initialize(
    device: DeviceProfile
  ): Promise<void> {
    if (
      await this.localProvider.healthCheck()
    ) {
      const model =
        await this.modelManager.selectModel(device);

      if (model) {
        this.activeProvider =
          this.localProvider;

        return;
      }
    }

    this.activeProvider = null;
  }

  async generate(
    request: AIRequest
  ): Promise<AIResponse> {
    if (!this.activeProvider) {
      throw new Error(
        'No local AI provider is available'
      );
    }

    return this.activeProvider.generateComplete(
      request
    );
  }

  async *stream(
    request: AIRequest
  ): AsyncGenerator<string> {
    if (!this.activeProvider) {
      throw new Error(
        'No local AI provider is available'
      );
    }

    yield* this.activeProvider.generate(request);
  }

  async cancel(): Promise<void> {
    await this.activeProvider?.cancel?.();
  }

  async shutdown(): Promise<void> {
    await this.modelManager.unload();
    this.activeProvider = null;
  }
}
