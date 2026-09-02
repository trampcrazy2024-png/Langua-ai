import { Sparkles, RefreshCw, ShieldAlert, Mic, Volume2 } from "lucide-react";
import { Phrase } from "../../types";

export interface DailyPhraseItem { text: string; phonetic: string; phoneticLatin: string; english: string; farsi: string }
export interface DailyPhraseGroup { dialect: string; phrases: DailyPhraseItem[] }
export interface DailyPhrasesPanelProps {
  groups: DailyPhraseGroup[]; loading: boolean; error: string; fromCache: boolean; onLoad(): void;
  onPractice(p: Phrase): void; onPlay(text: string, lang: "arabic" | "english"): void; onSave(item: DailyPhraseItem): void;
  practicingId: string | null; practiceResults: Record<string, { label: string; color: string }>;
}
export function DailyPhrasesPanel(p: DailyPhrasesPanelProps) {
  return <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
    <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4">
      <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#14B8A6]" /><span>جملات روزمره تولیدشده توسط هوش مصنوعی (امروز)</span></h3>
      <p className="text-xs text-[#94A3B8] leading-relaxed">هر روز فقط یک‌بار (اولین باری که این تب را باز می‌کنید) هوش مصنوعی ۵ جمله واقعاً روزمره برای هرکدام از لهجه‌های عراقی، لبنانی، انگلیسی آمریکایی و بریتانیایی می‌سازد. نتیجه روی همین گوشی ذخیره می‌شود تا بقیه روز حتی بدون اینترنت هم در دسترس باشد — و جملات هر روز قبلی هم برای مرور باقی می‌مانند.</p>
      {p.loading && <div className="flex items-center justify-center gap-2 text-xs text-[#14B8A6] py-6"><RefreshCw className="w-4 h-4 animate-spin" /><span>در حال ساخت جملات تازه امروز...</span></div>}
      {p.error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2"><ShieldAlert className="w-4 h-4" /><span>{p.error}</span></div>}
      {!p.loading && p.groups.length === 0 && !p.error && <button onClick={p.onLoad} className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold py-3 rounded-xl text-xs transition-all cursor-pointer">📅 دریافت جملات امروز</button>}
      {p.fromCache && p.groups.length > 0 && <p className="text-[10px] text-[#94A3B8]">✅ این نسخه از کش امروز خوانده شد (بدون نیاز به اینترنت).</p>}
      {p.groups.map((group, gIdx) => <div key={gIdx} className="space-y-2">
        <h4 className="text-xs font-black text-[#14B8A6] border-b border-[#1E293B] pb-1">{group.dialect}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{group.phrases.map((item, idx) => {
          const lang: "arabic" | "english" = group.dialect.includes("انگلیسی") ? "english" : "arabic";
          const pid = `daily_${gIdx}_${idx}`;
          const asPhrase: Phrase = { id: pid, category: "conversational", arabic: item.text, arabicPhonetic: item.phonetic, arabicPhoneticLatin: item.phoneticLatin, english: item.english, farsi: item.farsi, dialect: group.dialect, lang };
          return <div key={idx} className="bg-[#090D16] p-3 rounded-xl border border-[#1E293B] space-y-1.5">
            <p className="text-sm font-bold text-[#F8FAFC]">{item.text}</p><p className="text-[11px] text-[#14B8A6]">{item.phonetic}</p><p className="text-[11px] text-[#94A3B8]">{item.farsi}</p>
            <div className="flex items-center gap-2 pt-1"><button onClick={() => p.onPractice(asPhrase)} disabled={p.practicingId === pid} className={`p-1.5 rounded-full ${p.practicingId === pid ? "bg-red-500 text-white animate-pulse" : "bg-[#1E293B] text-[#14B8A6]"}`}><Mic className="w-3.5 h-3.5" /></button><button onClick={() => p.onPlay(item.text, lang)} className="p-1.5 rounded-full bg-[#14B8A6] text-black"><Volume2 className="w-3.5 h-3.5" /></button><button onClick={() => p.onSave(item)} className="text-[10px] text-[#94A3B8] hover:text-[#14B8A6] underline">ذخیره در واژه‌نامه</button></div>
            {p.practiceResults[pid] && <div className="text-[10px] font-bold mt-1 px-2 py-1 rounded-lg bg-[#141C2E] border" style={{ borderColor: p.practiceResults[pid].color, color: p.practiceResults[pid].color }}>{p.practiceResults[pid].label}</div>}
          </div>;
        })}</div>
      </div>)}
    </div>
  </div>;
}
