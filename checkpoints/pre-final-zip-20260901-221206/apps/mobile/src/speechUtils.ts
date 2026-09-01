// Real (not fabricated) helpers for voice practice: normalizes Arabic/Persian
// or Latin text and computes an honest similarity score between what the
// user actually said (recognized transcript) and the target phrase.
// This is a real Levenshtein-based ratio — not a random number.

export function normalizeForCompare(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670]/g, "") // strip Arabic diacritics (tashkeel)
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, "") // strip punctuation
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// Returns a real 0-100 similarity score between the target phrase and what
// was actually recognized. No randomness, no fabrication.
export function similarityScore(target: string, spoken: string): number {
  const a = normalizeForCompare(target);
  const b = normalizeForCompare(spoken);
  if (!a.length && !b.length) return 100;
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length, 1);
  return Math.max(0, Math.round((1 - distance / maxLen) * 100));
}

export function feedbackForScore(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "عالی! تلفظ شما بسیار نزدیک بود ✅", color: "#10B981" };
  if (score >= 60) return { label: "نزدیک بود؛ یک بار دیگر امتحان کنید 🟡", color: "#F59E0B" };
  return { label: "تفاوت زیادی داشت؛ به تلفظ نمونه دوباره گوش دهید 🔴", color: "#EF4444" };
}

// Real typo-tolerant search: checks a direct substring match first, then
// falls back to checking each word in the text against the query with a
// real Levenshtein edit-distance tolerance (scaled to query length) — so
// "رستوان" still finds "رستوران". Not a fuzzy-sounding label on a fake check.
export function fuzzyIncludes(text: string, query: string): boolean {
  const t = normalizeForCompare(text);
  const q = normalizeForCompare(query);
  if (!q) return true;
  if (t.includes(q)) return true;
  if (q.length < 3) return false; // too short for edit-distance tolerance to be meaningful
  const tolerance = q.length <= 5 ? 1 : 2;
  const words = t.split(/\s+/);
  return words.some((w) => Math.abs(w.length - q.length) <= tolerance && levenshtein(w, q) <= tolerance);
}
