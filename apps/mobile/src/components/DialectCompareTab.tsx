import React, { useState } from "react";
import { Volume2, Layers, Mic } from "lucide-react";
import { DIALECT_COMPARISONS, getLangCode } from "../data";
import { similarityScore, feedbackForScore } from "../speechUtils";
import { logPracticeAttempt } from "../progressStore";
import { recordSrsReview } from "../srsStore";
import { startSpeechRecognition } from "../lib/nativeSpeech";

interface DialectCompareTabProps {
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }) => void;
  triggerToast: (msg: string) => void;
}

export default function DialectCompareTab({ playSpeech, triggerToast }: DialectCompareTabProps) {
  const [activeId, setActiveId] = useState(DIALECT_COMPARISONS[0].id);
  const active = DIALECT_COMPARISONS.find((c) => c.id === activeId) || DIALECT_COMPARISONS[0];
  const [practicingKey, setPracticingKey] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { label: string; color: string; heard?: string }>>({});

  const handlePractice = (entryKey: string, text: string, dialect: string, lang?: "arabic" | "english") => {
    setPracticingKey(entryKey);
    const handle = startSpeechRecognition({
      lang: getLangCode(dialect, lang),
      onResult: (heard) => {
        const score = similarityScore(text, heard);
        const fb = feedbackForScore(score);
        setResults((prev) => ({ ...prev, [entryKey]: { label: `${fb.label} (${score}%)`, color: fb.color, heard } }));
        logPracticeAttempt(entryKey, dialect, score);
        recordSrsReview(entryKey, score);
      },
      onError: (message) => triggerToast(message),
      onEnd: () => setPracticingKey(null),
    });
    if (!handle) {
      triggerToast("⚠️ تشخیص گفتار روی این دستگاه پشتیبانی نمی‌شود.");
      setPracticingKey(null);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-3">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#14B8A6]" />
          <span>مقایسه یک جمله در همه لهجه‌ها</span>
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          یک جمله فارسی را انتخاب کنید، به تلفظ واقعی هر لهجه گوش دهید و با میکروفون خودتان هم امتحان کنید — نتیجه واقعی تمرین شما در آمار و مرور هوشمند (SRS) هم ثبت می‌شود.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {DIALECT_COMPARISONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                activeId === c.id
                  ? "bg-[#14B8A6] text-black border-[#14B8A6]"
                  : "bg-[#090D16] text-[#F8FAFC] border-[#1E293B] hover:border-[#14B8A6]/40"
              }`}
            >
              {c.titleFa}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {active.entries.map((entry, idx) => {
          const entryKey = `cmp_${active.id}_${idx}`;
          return (
            <div key={idx} className="bg-[#141C2E] border border-[#1E293B] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handlePractice(entryKey, entry.text, entry.dialect, entry.lang)}
                    disabled={practicingKey === entryKey}
                    className={`p-2.5 rounded-full transition-all ${
                      practicingKey === entryKey
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-[#1E293B] hover:bg-[#334155] text-[#14B8A6]"
                    }`}
                    title="تمرین تلفظ"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => playSpeech(entry.text, entryKey, getLangCode(entry.dialect, entry.lang))}
                    className="p-2.5 rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-black transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 text-right space-y-1">
                  <p className="text-sm font-black text-[#F8FAFC]">{entry.text}</p>
                  <p className="text-[11px] text-[#14B8A6]">{entry.phonetic}</p>
                </div>
                <span className="shrink-0 bg-[#090D16] text-[#94A3B8] border border-[#1E293B] text-[9.5px] font-black px-2.5 py-1 rounded">
                  {entry.dialect}
                </span>
              </div>
              {results[entryKey] && (
                <div
                  className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-[#090D16] border"
                  style={{ borderColor: results[entryKey].color, color: results[entryKey].color }}
                >
                  {results[entryKey].label}
                  {results[entryKey].heard && (
                    <span className="block text-[#94A3B8] font-normal mt-0.5">شما گفتید: «{results[entryKey].heard}»</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
