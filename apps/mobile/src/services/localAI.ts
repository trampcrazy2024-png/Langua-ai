import { registerPlugin } from '@capacitor/core';export interface LocalAIPlugin {
  ping(): Promise<{
    ok: boolean;
    engine: string;
  }>;
}

const LocalAI = registerPlugin<LocalAIPlugin>('LocalAI');

export default LocalAI;
EOF
