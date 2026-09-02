// In-app diagnostic log ("logcat-lite"): since a real `adb logcat` requires
// a PC + USB debugging, most learners testing an installed APK have no way
// to hand back the actual error text when something silently fails. This
// keeps a small, bounded, persisted log of everything that goes wrong (AI
// provider failures, speech/TTS errors, uncaught exceptions) so the learner
// can open one screen, copy the text, and paste it back for a real
// diagnosis instead of us guessing from a one-line description.

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  time: string; // ISO timestamp
  level: LogLevel;
  tag: string;
  message: string;
}

const LOG_KEY = "travelapp_debug_log";
const MAX_ENTRIES = 300;

function readEntries(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: LogEntry[]): void {
  try {
    const trimmed = entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // best-effort only — a full/unavailable localStorage shouldn't crash
    // the feature that was trying to help debug something else
  }
}

export function logEvent(level: LogLevel, tag: string, message: string): void {
  try {
    const entries = readEntries();
    entries.push({ time: new Date().toISOString(), level, tag, message: String(message).slice(0, 2000) });
    writeEntries(entries);
  } catch {
    // never let logging itself throw
  }
  if (level === "error") console.error(`[${tag}]`, message);
  else if (level === "warn") console.warn(`[${tag}]`, message);
}

export function getLogEntries(): LogEntry[] {
  return readEntries().slice().reverse(); // newest first
}

export function clearLog(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    // best-effort
  }
}

export function formatLogForExport(): string {
  const entries = readEntries();
  if (entries.length === 0) return "گزارشی ثبت نشده است.";
  return entries
    .map((e) => `${e.time} [${e.level.toUpperCase()}] ${e.tag}: ${e.message}`)
    .join("\n");
}

let installed = false;

/** Call once (App.tsx) to also capture uncaught exceptions and unhandled
 * promise rejections — the ones that never pass through any of this app's
 * own try/catch blocks at all. */
export function installGlobalErrorCapture(): void {
  if (installed) return;
  installed = true;
  try {
    window.addEventListener("error", (event: ErrorEvent) => {
      logEvent("error", "window.onerror", event.message || String(event.error || "خطای نامشخص"));
    });
    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      logEvent("error", "unhandledrejection", message);
    });
  } catch {
    // best-effort — if window/addEventListener isn't available for some
    // reason, the rest of the app's manual logEvent() calls still work
  }
}
