import LocalAI from './localAI';

export interface LocalAIStatus {
  available: boolean;
  engine: string;
  native: boolean;
  modelLoaded: boolean;
  modelPath: string | null;
}

export async function checkLocalAI(): Promise<LocalAIStatus> {
  try {
    const health = await LocalAI.healthCheck();
    const ping = await LocalAI.ping();

    return {
      available: ping.ok === true && health.available === true,
      engine: ping.engine || 'LocalAI',
      native: ping.native === true,
      modelLoaded: health.modelLoaded === true,
      modelPath: health.modelPath ?? null,
    };
  } catch {
    return {
      available: false,
      engine: 'LocalAI',
      native: false,
      modelLoaded: false,
      modelPath: null,
    };
  }
}
