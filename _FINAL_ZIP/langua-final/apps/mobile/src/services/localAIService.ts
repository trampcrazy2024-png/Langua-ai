import LocalAI from './localAI';

export interface LocalAIStatus {
  available: boolean;
  engine: string;
  modelLoaded: boolean;
  modelPath: string | null;
}

export async function checkLocalAI(): Promise<LocalAIStatus> {
  try {
    const health = await LocalAI.healthCheck();
    const ping = await LocalAI.ping();

    return {
      available: health.available === true && ping.ok === true,
      engine: ping.engine || health.engine || 'LocalAI',
      modelLoaded: health.modelLoaded === true,
      modelPath: health.modelPath ?? null,
    };
  } catch {
    return {
      available: false,
      engine: 'LocalAI',
      modelLoaded: false,
      modelPath: null,
    };
  }
}
