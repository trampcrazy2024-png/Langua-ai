import { Info, Volume2, Mic, Star, Trash2 } from "lucide-react";
import { Phrase } from "../../types";
import { GenderBadge } from "./GenderBadge";
import PhraseMediaAttachment from "../PhraseMediaAttachment";

export interface PracticeView { label: string; color: string; heard?: string }
export interface PhraseCardProps {
  phrase: Phrase;
  isFavorite: boolean;
  isCustom: boolean;
  speakingMode: boolean;
  revealed: boolean;
  practiceResult?: PracticeView | undefined;
  busy: boolean;
  onToggleFav(): void;
  onDelete(): void;
  onPractice(): void;
  onPlay(text: string): void;
  onReveal(): void;
  onMoreExamples(arabic: string, farsi: string, dialect: string): void;
  onToast(msg: string): void;
}

export function PhraseCard(p: PhraseCardProps) {
  const it = p.phrase;
  return (
    <div className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl flex flex-col justify-between text-right space-y-3 relative hover:border-[#14B8A6]/35 transition-all" dir="rtl">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 text-[9px] font-black px-2.5 py-1 rounded">{it.dialect}</span>
          <GenderBadge gender={it.gender} />
        </div>
        <div className="flex items-center gap-1.5">
          {p.isCustom && <button onClick={p.onDelete} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
          <button onClick={p.onToggleFav} className={`p-1.5 rounded-lg transition-all ${p.isFavorite ? "bg-amber-500/15 text-amber-400" : "bg-[#090D16] text-[#94A3B8] hover:text-[#F8FAFC]"}`}>
            <Star className={`w-3.5 h-3.5 ${p.isFavorite ? "fill-amber-400" : ""}`} />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {p.speakingMode && !p.revealed && !p.practiceResult ? (
          <div className="bg-[#090D16] border border-dashed border-[#1E293B] rounded-lg p-3 text-center space-y-1.5">
            <p className="text-[10px] text-[#94A3B8]">این را با صدای بلند به لهجه بگویید:</p>
            <p className="text-sm font-black text-[#F8FAFC]">{it.farsi}</p>
            <button onClick={p.onReveal} className="text-[10px] text-[#14B8A6] underline">نمایش پاسخ صحیح</button>
          </div>
        ) : (
          <>
            <p className="text-base font-black text-[#F8FAFC] font-serif leading-relaxed">{it.arabic}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#14B8A6] font-bold"><span>تلفظ:</span><p>{it.arabicPhonetic}</p></div>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-semibold">{it.farsi}</p>
            {it.english && <p className="text-[10px] text-[#94A3B8]/60 font-mono" dir="ltr">{it.english}</p>}
          </>
        )}
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-[#1E293B]/60 text-[10px] text-[#94A3B8]">
        <div className="flex items-center gap-1"><Info className="w-3 h-3 text-[#14B8A6]" /><span>{it.audioTips || "برای تمامی لهجه‌های عتبات و خلیج"}</span></div>
        <div className="flex items-center gap-2">
          <button onClick={p.onPractice} disabled={p.busy} className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center shadow ${p.busy ? "bg-red-500 text-white animate-pulse" : "bg-[#1E293B] hover:bg-[#334155] text-[#14B8A6]"}`} title="تمرین تلفظ"><Mic className="w-4 h-4" /></button>
          <button onClick={() => p.onPlay(it.arabic)} className="p-1.5 rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-black transition-all cursor-pointer flex items-center justify-center shadow"><Volume2 className="w-4 h-4" /></button>
        </div>
      </div>
      {p.practiceResult && (
        <div className="text-[11px] font-bold mt-1 px-2 py-1.5 rounded-lg bg-[#090D16] border" style={{ borderColor: p.practiceResult.color, color: p.practiceResult.color }}>
          {p.practiceResult.label}
          {p.practiceResult.heard && <span className="block text-[#94A3B8] font-normal mt-0.5">شما گفتید: «{p.practiceResult.heard}»</span>}
        </div>
      )}
      <PhraseMediaAttachment phraseId={it.id} triggerToast={p.onToast} />
      <button onClick={() => p.onMoreExamples(it.arabic, it.farsi, it.dialect)} className="text-[10px] text-[#94A3B8] hover:text-[#14B8A6] underline block mt-1">🪄 مثال‌های بیشتر با این عبارت (هوش مصنوعی)</button>
    </div>
  );
}
