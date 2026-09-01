// Daily AI-generated phrases: calls /api/daily-phrases at most ONCE per
// calendar day (needs internet + a reachable AI gateway that one time),
// then caches the result in localStorage so it's available offline for the
// rest of the day — and every previous day's cache stays in localStorage too,
// so your daily phrase history keeps building up over time.

import { apiFetch } from "./lib/net";

export interface DailyPhraseItem {
  text: string;
  phonetic: string;
  phoneticLatin: string;
  farsi: string;
  english: string;
}

export interface DailyPhraseGroup {
  dialect: string;
  phrases: DailyPhraseItem[];
}

const CACHE_KEY_PREFIX = "daily_phrases_";
const DEFAULT_DIALECTS = [
  "لهجه عراقی",
  "لهجه لبنانی (شامی)",
  "انگلیسی آمریکایی",
  "انگلیسی بریتانیایی/استاندارد"
];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCachedDailyPhrases(date: string = todayKey()): DailyPhraseGroup[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + date);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function listCachedDailyDates(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_KEY_PREFIX)) {
      dates.push(key.replace(CACHE_KEY_PREFIX, ""));
    }
  }
  return dates.sort().reverse();
}

// Fetches fresh phrases from the server only if today isn't cached yet.
// Throws if the network/API call fails — caller should catch and fall back
// to any previously cached day (or the static dictionary).
export async function fetchOrGetTodayPhrases(
  dialects: string[] = DEFAULT_DIALECTS
): Promise<{ groups: DailyPhraseGroup[]; fromCache: boolean }> {
  const date = todayKey();
  const cached = getCachedDailyPhrases(date);
  if (cached) {
    return { groups: cached, fromCache: true };
  }

  // Bug fix: was a raw fetch("/api/daily-phrases", ...) with a hardcoded
  // same-origin path - see the note in OcrTab.tsx for why that's wrong
  // once VITE_AI_BASE_URL/the shared-secret header matter.
  const data = await apiFetch<{ groups?: DailyPhraseGroup[] }>("/api/daily-phrases", {
    method: "POST",
    body: { dialects, date },
  });
  const groups: DailyPhraseGroup[] = data.groups || [];
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + date, JSON.stringify(groups));
  } catch {
    // Storage full or unavailable — still return the fetched result.
  }
  return { groups, fromCache: false };
}
