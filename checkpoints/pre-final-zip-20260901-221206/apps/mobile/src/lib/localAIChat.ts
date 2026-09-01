import { apiFetch } from './net';

export interface LocalChatTurn {
  sender: 'user' | 'companion';
  text: string;
}

export async function localAIChat(options: {
  message: string;
  history: LocalChatTurn[];
  dialect: string;
  personaName: string;
  personaTrait: string;
  task?: 'chat' | 'speaking';
  knownMistakes?: string[];
  levelHint?: string;
  conversationSummary?: string;
}): Promise<string> {
  const result = await apiFetch<{ response?: string; text?: string; provider?: string; errors?: unknown[] }>(
    '/api/chat',
    {
      method: 'POST',
      body: {
        task: options.task ?? 'chat',
        message: options.message,
        history: options.history,
        dialect: options.dialect,
        personaName: options.personaName,
        personaTrait: options.personaTrait,
        knownMistakes: options.knownMistakes,
        levelHint: options.levelHint,
        conversationSummary: options.conversationSummary,
      },
    },
  );

  const text = result.response || result.text || '';
  if (!text) throw new Error('پاسخ Gateway هوش مصنوعی خالی بود.');
  return text;
}
