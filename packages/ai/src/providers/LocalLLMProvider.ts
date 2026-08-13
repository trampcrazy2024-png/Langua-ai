import type {
  AIProvider
} from '../AIProvider';

import type {
  AIRequest,
  AIResponse,
  DeviceProfile,
  LocalModel
} from '../types';

export class LocalLLMProvider implements AIProvider {
  readonly type = 'local' as const;

  private loadedModel: LocalModel | null = null;

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.callNative<boolean>(
        'isAvailable'
      );

      return result;
    } catch {
      return false;
    }
  }

  async getRecommendedModel(
    device: DeviceProfile
  ): Promise<LocalModel | null> {
    const models = this.getModels();

    const battery = device.batteryPercent;

    let maximum: LocalModel['size'];

    if (battery < 15) {
      maximum = '0.5B';
    } else if (battery < 30) {
      maximum = '1.5B';
    } else if (device.ramMb >= 8000) {
      maximum = '7B';
    } else if (device.ramMb >= 5000) {
      maximum = '3B';
    } else {
      maximum = '1.5B';
    }

    const priority: LocalModel['size'][] = [
      '7B',
      '3B',
      '1.5B',
      '0.5B'
    ];

    const maxIndex = priority.indexOf(maximum);

    const candidates = models
      .filter((model) => model.installed)
      .filter(
        (model) =>
          priority.indexOf(model.size) >= maxIndex
      );

    return candidates.sort(
      (a, b) =>
        priority.indexOf(a.size) -
        priority.indexOf(b.size)
    )[0] ?? null;
  }

  async loadModel(model: LocalModel): Promise<void> {
    await this.callNative<void>(
      'loadModel',
      {
        path: model.path
      }
    );

    this.loadedModel = model;
  }

  async unloadModel(): Promise<void> {
    await this.callNative<void>('unloadModel');
    this.loadedModel = null;
  }

  async *generate(
    request: AIRequest
  ): AsyncGenerator<string> {
    const response = await this.callNative<string>(
      'generate',
      {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt ?? '',
        options: request.options ?? {}
      }
    );

    yield response;
  }

  async generateComplete(
    request: AIRequest
  ): Promise<AIResponse> {
    const started = performance.now();

    let text = '';

    for await (const chunk of this.generate(request)) {
      text += chunk;
    }

    return {
      text,
      model: this.loadedModel?.id ?? 'unknown',
      provider: 'local',
      latencyMs: performance.now() - started
    };
  }

  async healthCheck(): Promise<boolean> {
    return this.isAvailable();
  }

  private getModels(): LocalModel[] {
    return [
      {
        id: 'qwen2.5-0.5b-instruct-q4',
        name: 'Qwen 2.5 0.5B Instruct',
        size: '0.5B',
        path: 'models/qwen2.5-0.5b-instruct-q4.gguf',
        quantization: 'Q4_K_M',
        installed: false,
        loaded: false,
        ramRequiredMb: 700
      },
      {
        id: 'qwen2.5-1.5b-instruct-q4',
        name: 'Qwen 2.5 1.5B Instruct',
        size: '1.5B',
        path: 'models/qwen2.5-1.5b-instruct-q4.gguf',
        quantization: 'Q4_K_M',
        installed: false,
        loaded: false,
        ramRequiredMb: 1500
      },
      {
        id: 'qwen2.5-3b-instruct-q4',
        name: 'Qwen 2.5 3B Instruct',
        size: '3B',
        path: 'models/qwen2.5-3b-instruct-q4.gguf',
        quantization: 'Q4_K_M',
        installed: false,
        loaded: false,
        ramRequiredMb: 2800
      },
      {
        id: 'qwen2.5-7b-instruct-q4',
        name: 'Qwen 2.5 7B Instruct',
        size: '7B',
        path: 'models/qwen2.5-7b-instruct-q4.gguf',
        quantization: 'Q4_K_M',
        installed: false,
        loaded: false,
        ramRequiredMb: 5500
      }
    ];
  }

  private async callNative<T>(
    method: string,
    data?: Record<string, unknown>
  ): Promise<T> {
    const plugin = (
      window as Window & {
        Capacitor?: {
          Plugins?: {
            LocalAI?: {
              [key: string]: (
                data?: Record<string, unknown>
              ) => Promise<{ value?: T }>;
            };
          };
        };
      }
    ).Capacitor?.Plugins?.LocalAI;

    if (!plugin || typeof plugin[method] !== 'function') {
      throw new Error(
        `LocalAI native method unavailable: ${method}`
      );
    }

    const result = await plugin[method](data);

    return result.value as T;
  }
  }
