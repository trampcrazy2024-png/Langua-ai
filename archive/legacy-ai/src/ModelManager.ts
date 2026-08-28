import type {
  DeviceProfile,
  LocalModel
} from './types';

import type { AIProvider } from './AIProvider';

export class ModelManager {
  private activeModel: LocalModel | null = null;

  constructor(
    private readonly provider: AIProvider
  ) {}

  async selectModel(
    device: DeviceProfile
  ): Promise<LocalModel | null> {
    const model =
      await this.provider.getRecommendedModel(device);

    if (!model) {
      return null;
    }

    if (
      !this.activeModel ||
      this.activeModel.id !== model.id
    ) {
      if (this.activeModel) {
        await this.provider.unloadModel();
      }

      await this.provider.loadModel(model);

      this.activeModel = {
        ...model,
        loaded: true
      };
    }

    return this.activeModel;
  }

  async unload(): Promise<void> {
    await this.provider.unloadModel();
    this.activeModel = null;
  }

  getActiveModel(): LocalModel | null {
    return this.activeModel;
  }
}
