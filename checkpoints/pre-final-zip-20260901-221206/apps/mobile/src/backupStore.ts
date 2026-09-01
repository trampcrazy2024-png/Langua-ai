// Real backup/restore for the user's own progress data. Exports the actual
// localStorage keys this app writes to — nothing fabricated, nothing synced
// to a server. Note: personal audio/video clips (stored in IndexedDB via
// mediaStore.ts) are binary and are NOT included in this JSON backup.

const BACKUP_KEYS = [
  "travelapp_favorites",
  "travelapp_custom_phrases",
  "travelapp_practice_log",
  "travelapp_srs_cards"
];

export interface BackupFile {
  appName: "TravelApp";
  backupVersion: 1;
  exportedAt: string;
  data: Record<string, string>;
}

export function buildBackup(): BackupFile {
  const data: Record<string, string> = {};
  for (const key of BACKUP_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return {
    appName: "TravelApp",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    data
  };
}

export function downloadBackup(): void {
  const backup = buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `travelapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface RestoreResult {
  ok: boolean;
  restoredKeys: string[];
  error?: string;
}

export function restoreBackup(fileText: string): RestoreResult {
  try {
    const parsed = JSON.parse(fileText) as BackupFile;
    if (!parsed || parsed.appName !== "TravelApp" || !parsed.data) {
      return { ok: false, restoredKeys: [], error: "این فایل یک فایل پشتیبان معتبر TravelApp نیست." };
    }
    const restoredKeys: string[] = [];
    for (const key of BACKUP_KEYS) {
      if (parsed.data[key] !== undefined) {
        localStorage.setItem(key, parsed.data[key]);
        restoredKeys.push(key);
      }
    }
    return { ok: true, restoredKeys };
  } catch {
    return { ok: false, restoredKeys: [], error: "فایل قابل خواندن نبود (JSON نامعتبر)." };
  }
}
