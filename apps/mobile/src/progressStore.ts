// Real progress tracking: every time the user completes a pronunciation
// practice attempt (see speechUtils.ts similarityScore), we log the actual
// result here. All stats shown in the UI are derived directly from this log
// — nothing here is a placeholder or random number.

const LOG_KEY = "travelapp_practice_log";
const MAX_LOG_ENTRIES = 2000; // keep localStorage bounded

export interface PracticeLogEntry {
  phraseId: string;
  dialect: string;
  score: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export function logPracticeAttempt(phraseId: string, dialect: string, score: number): void {
  try {
    const log = getPracticeLog();
    log.push({
      phraseId,
      dialect,
      score,
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now()
    });
    const trimmed = log.length > MAX_LOG_ENTRIES ? log.slice(log.length - MAX_LOG_ENTRIES) : log;
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable/full — progress tracking is best-effort only.
  }
}

export function getPracticeLog(): PracticeLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface PracticeStats {
  totalAttempts: number;
  uniquePhrasesAttempted: number;
  averageScore: number;
  bestStreakDays: number;
  currentStreakDays: number;
  byDialect: Record<string, { attempts: number; avgScore: number }>;
}

// Every number here is computed directly from logged attempts — no
// hardcoded or randomized values.
export function computeStats(): PracticeStats {
  const log = getPracticeLog();
  if (log.length === 0) {
    return {
      totalAttempts: 0,
      uniquePhrasesAttempted: 0,
      averageScore: 0,
      bestStreakDays: 0,
      currentStreakDays: 0,
      byDialect: {}
    };
  }

  const uniquePhrases = new Set(log.map((e) => e.phraseId));
  const avgScore = Math.round(log.reduce((sum, e) => sum + e.score, 0) / log.length);

  const byDialect: Record<string, { attempts: number; avgScore: number }> = {};
  for (const entry of log) {
    const key = entry.dialect;
    if (!byDialect[key]) byDialect[key] = { attempts: 0, avgScore: 0 };
    byDialect[key]!.attempts += 1;
  }
  for (const dialect of Object.keys(byDialect)) {
    const entries = log.filter((e) => e.dialect === dialect);
    byDialect[dialect]!.avgScore = Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
  }

  // Streak: consecutive calendar days (ending today or yesterday) with at
  // least one practice attempt.
  const practiceDates = Array.from(new Set(log.map((e) => e.date))).sort();
  let bestStreak = 1;
  let running = 1;
  for (let i = 1; i < practiceDates.length; i++) {
    const prev = new Date(practiceDates[i - 1]!);
    const curr = new Date(practiceDates[i]!);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 1;
    }
  }

  let currentStreak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const cursor = new Date();
  for (;;) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (practiceDates.includes(dateStr)) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (dateStr === today) {
      // no practice yet today — still check yesterday before giving up
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  return {
    totalAttempts: log.length,
    uniquePhrasesAttempted: uniquePhrases.size,
    averageScore: avgScore,
    bestStreakDays: bestStreak,
    currentStreakDays: currentStreak,
    byDialect
  };
}
