// Language Memory: every time ChatTab parses a real "اصلاح:" (correction)
// line out of a reply - not a placeholder, the model's own correction note
// for that turn - it's logged here per dialect. getFrequentMistakes() then
// feeds the most repeated ones back into future prompts (see
// aiProviders.ts's buildFlatPrompt / server.ts's handleChat) so the coach
// can watch for and reinforce them instead of the learner having to repeat
// the same correction conversation after conversation.

const STORAGE_KEY = "travelapp_language_memory";
const MAX_ENTRIES_PER_DIALECT = 200; // keep localStorage bounded

export interface MistakeEntry {
  note: string; // the correction text, as the model actually wrote it
  count: number;
  lastSeen: number; // epoch ms
}

type MistakeStore = Record<string, MistakeEntry[]>; // dialect -> entries

function readStore(): MistakeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: MistakeStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable/full - Language Memory is best-effort only.
  }
}

/**
 * Logs one correction note for a dialect. Dedupes on the exact trimmed
 * text (case-insensitive) and bumps its count instead of storing
 * duplicates, so a mistake the learner keeps making rises to the top of
 * getFrequentMistakes() naturally.
 */
export function logMistake(dialect: string, note: string): void {
  const trimmed = note.trim();
  if (!trimmed) return;
  const store = readStore();
  const entries = store[dialect] ?? [];
  const existing = entries.find((e) => e.note.trim().toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    existing.count += 1;
    existing.lastSeen = Date.now();
  } else {
    entries.push({ note: trimmed, count: 1, lastSeen: Date.now() });
  }
  entries.sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen);
  store[dialect] = entries.slice(0, MAX_ENTRIES_PER_DIALECT);
  writeStore(store);
}

/** Most-repeated corrections for a dialect, highest count first. */
export function getFrequentMistakes(dialect: string, limit = 3): string[] {
  const store = readStore();
  const entries = store[dialect] ?? [];
  return entries
    .slice()
    .sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen)
    .slice(0, limit)
    .map((e) => e.note);
}

export function getAllMistakes(dialect: string): MistakeEntry[] {
  const store = readStore();
  return (store[dialect] ?? []).slice().sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen);
}

export function clearMistakes(dialect: string): void {
  const store = readStore();
  delete store[dialect];
  writeStore(store);
}
