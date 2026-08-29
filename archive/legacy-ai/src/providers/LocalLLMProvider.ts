import type {
  AIProvider
} from '../AIProvider';

import type {
  AIRequest,
  AIResponse,
  DeviceProfile,
  LocalModel
} from '../types';

import type { LocalAINativePlugin } from '../NativePlugin';

export class LocalLLMProvider implements AIProvider {
  readonly type = 'local' as const;

  private loadedModel: LocalModel | null = null;

  /*
   * Review fix #2: the plugin instance is injected instead of
   * reached for via `window.Capacitor.Plugins.LocalAI` on every
   * call. Pass in the same `LocalAI` object that
   * apps/mobile/src/services/localAI.ts registers via
   * registerPlugin() - it satisfies this interface structurally.
   */
  constructor(private readonly plugin: LocalAINativePlugin) {}

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.plugin.isAvailable();
      return result.value === true;
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
    const result = await this.plugin.loadModel({
      path: model.path
    });

    if (!result.ok || !result.loaded) {
      throw new Error(`Failed to load local model: ${model.id}`);
    }

    this.loadedModel = model;
  }

  async unloadModel(): Promise<void> {
    await this.plugin.unloadModel();
    this.loadedModel = null;
  }

  /*
   * Review fix #4: lets a caller (e.g. a Cancel button in the UI)
   * stop generation that's currently in flight via generate() /
   * generateComplete(). Cooperative on the native side - see
   * nativeCancelGeneration() in localai_jni.cpp.
   */
  async cancel(): Promise<void> {
    await this.plugin.cancelGeneration();
  }

  async *generate(
    request: AIRequest
  ): AsyncGenerator<string> {
    /*
     * Real Phase 8-D streaming: listen for native token events
     * while streamChat() runs on its own background executor
     * thread on the Android side, and yield each piece as it
     * arrives instead of waiting for the whole reply.
     */
    const queue: string[] = [];
    let wake: (() => void) | null = null;
    let finished = false;
    let failure: unknown = null;

    const handle = await this.plugin.addListener(
      'generationToken',
      (event: { token: string }) => {
        queue.push(event.token);

        if (wake) {
          const resume = wake;
          wake = null;
          resume();
        }
      }
    );

    const streamPromise = this.plugin
      .streamChat({ message: request.prompt })
      .catch((err: unknown) => {
        failure = err;
        return { value: '', status: 'error' as const };
      })
      .finally(() => {
        finished = true;

        if (wake) {
          const resume = wake;
          wake = null;
          resume();
        }
      });

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift() as string;
          continue;
        }

        if (finished) {
          break;
        }

        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }

      const result = await streamPromise;

      if (failure) {
        throw failure;
      }

      /*
       * A cancelled generation is not an error - the caller asked
       * for it to stop. Whatever text already streamed through the
       * queue above is kept; we just don't throw.
       */
      if (result && result.status === 'error') {
        throw new Error('Local generation ended with an error status');
      }
    } finally {
      await handle.remove();
    }
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
}
