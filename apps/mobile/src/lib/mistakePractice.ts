import { apiFetch } from "./net";

export interface MistakeQuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

/**
 * Generates a short (typically 3-question) quiz targeting the learner's
 * own recurring mistakes for a dialect (see languageMemoryStore.ts),
 * instead of the generic category/level quiz QuizTab.tsx otherwise builds.
 * This is what turns Quiz from a standalone feature into part of the
 * conversation -> correction -> practice loop.
 */
export async function generateMistakePractice(
  dialect: string,
  mistakes: string[]
): Promise<MistakeQuizQuestion[]> {
  if (mistakes.length === 0) return [];
  const result = await apiFetch<{ questions?: MistakeQuizQuestion[] }>("/api/quiz", {
    method: "POST",
    body: { category: dialect, mistakes },
  });
  return result.questions ?? [];
}
