import { useState } from "react";
import { Bug, Copy, Trash2, RefreshCw } from "lucide-react";
import { getLogEntries, clearLog, formatLogForExport, type LogEntry } from "../lib/debugLog";

interface DebugLogTabProps {
  triggerToast: (msg: string) => void;
}

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  error: "text-red-400 border-red-500/30 bg-red-500/10",
  warn: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  info: "text-[#14B8A6] border-[#14B8A6]/30 bg-[#14B8A6]/10",
};

export default function DebugLogTab({ triggerToast }: DebugLogTabProps) {
  const [entries, setEntries] = useState<LogEntry[]>(() => getLogEntries());

  const refresh = () => {
    setEntries(getLogEntries());
    triggerToast("🔄 گزارش به‌روزرسانی شد.");
  };

  const copyAll = async () => {
    const text = formatLogForExport();
    try {
      await navigator.clipboard.writeText(text);
      triggerToast("📋 کل گزارش کپی شد — می‌توانید آن را اینجا برای من بفرستید.");
    } catch {
      triggerToast("⚠️ کپی خودکار ممکن نشد؛ متن را دستی انتخاب و کپی کنید.");
    }
  };

  const handleClear = () => {
    clearLog();
    setEntries([]);
    triggerToast("🗑️ گزارش پاک شد.");
  };

  return (
    <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <Bug className="w-4 h-4 text-[#14B8A6]" />
          <span>گزارش خطا (Debug Log)</span>
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          هر بار که مکالمه، تشخیص گفتار، صدا، یا سناریو با خطا مواجه شود، متن دقیق خطا همین‌جا
          ذخیره می‌شود — حتی اگر پیام روی صفحه محو شده باشد. اگر مشکلی پیش آمد، دکمهٔ «کپی کل
          گزارش» را بزنید و متن را برای من بفرستید تا دقیق رفعش کنم.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 bg-[#14B8A6] text-black font-black px-3 py-1.5 rounded-lg text-[11px]"
          >
            <Copy className="w-3.5 h-3.5" />
            کپی کل گزارش
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 bg-[#090D16] border border-[#1E293B] text-[#F8FAFC] font-bold px-3 py-1.5 rounded-lg text-[11px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            به‌روزرسانی
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 bg-[#090D16] border border-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-lg text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            پاک کردن
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl text-center text-xs text-[#94A3B8]">
          هنوز هیچ خطایی ثبت نشده — یعنی یا همه‌چیز درست کار کرده، یا هنوز چیزی امتحان نکرده‌اید.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={`${entry.time}_${i}`}
              className={`border rounded-xl p-3 text-[11px] leading-relaxed ${LEVEL_COLOR[entry.level]}`}
              dir="ltr"
            >
              <div className="flex justify-between gap-2 font-bold mb-1">
                <span>{entry.tag}</span>
                <span className="opacity-70">{new Date(entry.time).toLocaleTimeString("fa-IR")}</span>
              </div>
              <div className="whitespace-pre-wrap break-words opacity-90">{entry.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
