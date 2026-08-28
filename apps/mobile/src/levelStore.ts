// Adaptive Difficulty: derives a level hint per dialect purely from the
// learner's own logged practice scores in progressStore.ts (real
// pronunciation-practice attempts, see speechUtils.ts similarityScore) -
// never a manual setting and never a random/placeholder value. ChatTab
// passes the result into the chat prompt (see aiProviders.ts's
// buildFlatPrompt / server.ts's handleChat: levelHint) so replies match the
// learner's demonstrated level instead of a fixed difficulty.
//
// HONESTY NOTE: this is a simple, transparent heuristic over attempt count
// and average pronunciation-match score - it is not a validated CEFR
// placement test. Treat the returned label as a reasonable starting point
// for the coach's tone, not a certified proficiency grading.

import { computeStats } from "./progressStore";

export type LevelLabel =
  | "Beginner (تازه‌کار)"
  | "Elementary (پایه)"
  | "Intermediate (متوسط)"
  | "Upper Intermediate (متوسط رو به بالا)"
  | "Advanced (پیشرفته)";

const MIN_ATTEMPTS_FOR_SIGNAL = 5; // below this, there isn't enough real data to move off Beginner

export function computeLevel(dialect: string): LevelLabel {
  const stats = computeStats();
  const dialectStats = stats.byDialect[dialect];
  if (!dialectStats || dialectStats.attempts < MIN_ATTEMPTS_FOR_SIGNAL) {
    return "Beginner (تازه‌کار)";
  }
  const score = dialectStats.avgScore;
  if (score < 50) return "Beginner (تازه‌کار)";
  if (score < 65) return "Elementary (پایه)";
  if (score < 80) return "Intermediate (متوسط)";
  if (score < 90) return "Upper Intermediate (متوسط رو به بالا)";
  return "Advanced (پیشرفته)";
}
