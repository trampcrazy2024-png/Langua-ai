import LocalAI from './localAI';
export interface LocalAIStatus {
  available: boolean;
  engine: string;
}

export async function checkLocalAI(): Promise<LocalAIStatus> {
  try {
    const result = await LocalAI.ping();

    return {
      available: result.ok === true,
      engine: result.engine || 'LocalAI',
    };
  } catch {
    return {
      available: false,
      engine: 'LocalAI',
    };
  }
}
