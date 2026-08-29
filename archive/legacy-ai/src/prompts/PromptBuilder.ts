import { BASE_SYSTEM_PROMPT } from './SystemPrompt';

export type Dialect =
  | 'en-US'
  | 'ar-IQ'
  | 'ar-LB';

export type CEFR =
  | 'A1'
  | 'A2'
  | 'B1'
  | 'B2'
  | 'C1'
  | 'C2';

const dialectPrompts: Record<Dialect, string> = {
  'en-US': `
Use natural American English.
Prefer common modern American vocabulary.
Use realistic conversational expressions.
`,

  'ar-IQ': `
Use natural Iraqi Arabic.
Prefer commonly spoken Iraqi vocabulary.
Avoid Modern Standard Arabic unless necessary.
`,

  'ar-LB': `
Use natural Lebanese Arabic.
Prefer commonly spoken Lebanese vocabulary.
Avoid overly formal Modern Standard Arabic.
`
};

export function buildSystemPrompt(
  dialect: Dialect,
  level: CEFR,
  memory: string[] = []
): string {
  const memoryBlock =
    memory.length > 0
      ? `\nRelevant user memory:\n${memory.join('\n')}\n`
      : '';

  return `
${BASE_SYSTEM_PROMPT}

Target dialect:
${dialect}

CEFR level:
${level}

Dialect instructions:
${dialectPrompts[dialect]}

${memoryBlock}
`;
}
