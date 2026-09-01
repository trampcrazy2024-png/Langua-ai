// A real implementation of the SM-2 spaced-repetition algorithm (the same
// method used by Anki/SuperMemo). Every phrase the user practices gets a
// scheduling "card" here; the interval before its next review grows only
// when the user actually pronounces it well, and resets when they don't.
// Nothing here is simulated — every date and interval is computed from
// real practice attempts logged via recordSrsReview().

const SRS_KEY = "travelapp_srs_cards";

export interface SrsCard {
  phraseId: string;
  easeFactor: number; // starts at 2.5, like classic SM-2
  interval: number; // days until next review
  repetitions: number; // consecutive successful reviews
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewDate: string; // YYYY-MM-DD
  lastScore: number; // last similarity score (0-100), for display only
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getAllSrsCards(): Record<string, SrsCard> {
  try {
    const raw = localStorage.getItem(SRS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllSrsCards(cards: Record<string, SrsCard>): void {
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(cards));
  } catch {
    // best-effort only
  }
}

// Converts our 0-100 pronunciation-similarity score into SM-2's 0-5 quality
// scale. This mapping is a reasonable, transparent linear split — not a
// black box: 0-39 -> 0-1 (fail, reset), 40-59 -> 2 (hard fail), 60-100 -> 3-5
// scaled by how close to perfect the match was.
function scoreToQuality(score: number): number {
  if (score < 40) return 1;
  if (score < 60) return 2;
  // Map 60-100 onto 3-5
  return Math.round(3 + ((score - 60) / 40) * 2);
}

export function recordSrsReview(phraseId: string, score: number): SrsCard {
  const cards = getAllSrsCards();
  const quality = scoreToQuality(score);
  const existing = cards[phraseId];

  let easeFactor = existing?.easeFactor ?? 2.5;
  let interval = existing?.interval ?? 0;
  let repetitions = existing?.repetitions ?? 0;

  if (quality < 3) {
    // Failed recall — reset the schedule, review again tomorrow.
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const card: SrsCard = {
    phraseId,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    interval,
    repetitions,
    nextReviewDate: addDays(interval),
    lastReviewDate: todayStr(),
    lastScore: score
  };
  cards[phraseId] = card;
  saveAllSrsCards(cards);
  return card;
}

// Phrase IDs that are due for review today (or overdue) — only includes
// phrases that have been practiced at least once before.
export function getDueCardIds(): string[] {
  const cards = getAllSrsCards();
  const today = todayStr();
  return Object.values(cards)
    .filter((c) => c.nextReviewDate <= today)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))
    .map((c) => c.phraseId);
}

export function getSrsStats(): { totalCards: number; dueToday: number; matureCards: number } {
  const cards = Object.values(getAllSrsCards());
  const today = todayStr();
  return {
    totalCards: cards.length,
    dueToday: cards.filter((c) => c.nextReviewDate <= today).length,
    matureCards: cards.filter((c) => c.interval >= 21).length
  };
}
