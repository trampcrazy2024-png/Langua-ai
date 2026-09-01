import React from "react";
import { Sparkles, RefreshCw, Copy, Volume2, ShieldAlert } from "lucide-react";

export interface AITranslatePanelProps {
  text: string; setText(v: string): void; dialect: string; setDialect(v: string): void;
  loading: boolean; result: any; error: string; onSubmit(): void; onCopy(t: string): void; onPlay(t: string): void;
}

export function AITranslatePanel(p: AITranslatePanelProps) {
  return (
    <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#14B8A6]" /><span>مترجم بومی‌ساز لهجه‌های عربی (هوش مصنوعی محلی/آفلاین)</span></h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">متن فارسی یا انگلیسی خود را وارد کنید...</p>
        <div className="space-y-3">
          <div className="space-y-1"><span className="text-[10.5px] text-[#94A3B8]">عبارت مبدا (فارسی، انگلیسی یا عربی فصیح):</span><textarea value={p.text} onChange={(e) => p.setText(e.target.value)} placeholder="مثال: قیمت این پیراهن چقدر میشه؟ بهم تخفیف بده..." className="w-full bg-[#090D16] text-xs text-[#F8FAFC] p-3 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none min-h-[90px] text-right" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><span className="text-[10.5px] text-[#94A3B8]">لهجه مقصد:</span><select value={p.dialect} onChange={(e) => p.setDialect(e.target.value)} className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5 text-right outline-none"><option value="Gulf Arabic (خلیجی - سعودی، امارات)">لهجه خلیجی</option><option value="Iraqi Arabic (عراقی - کربلا و نجف)">لهجه عراقی</option><option value="Levantine Arabic (شامی - سوریه و لبنان)">لهجه شامی</option><option value="Egyptian Arabic (مصری)">لهجه مصری</option><option value="Standard Arabic (فصیح کتابی)">عربی فصیح</option></select></div>
            <div className="flex items-end"><button onClick={p.onSubmit} disabled={p.loading} className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">{p.loading ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>در حال ترجمه در موتور هوش مصنوعی...</span></> : <><Sparkles className="w-4 h-4" /><span>بومی‌سازی و دریافت نتایج لهجه</span></>}</button></div>
          </div>
        </div>
        {p.error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2"><ShieldAlert className="w-4 h-4" /><span>{p.error}</span></div>}
        {p.result && <div className="bg-[#090D16]/80 p-5 rounded-2xl border border-[#1E293B] space-y-4 animate-scaleUp">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3"><span className="text-[#14B8A6] text-xs font-black">ترجمه به گویش: {p.dialect}</span><div className="flex items-center gap-1"><button onClick={() => p.onCopy(p.result.translation)} className="p-1.5 rounded bg-[#141C2E] text-[#94A3B8] hover:text-[#F8FAFC]" title="کپی"><Copy className="w-3.5 h-3.5" /></button><button onClick={() => p.onPlay(p.result.translation)} className="p-1.5 rounded bg-[#14B8A6] text-black"><Volume2 className="w-3.5 h-3.5" /></button></div></div>
          <div className="space-y-3"><div className="space-y-0.5"><p className="text-[10px] text-[#94A3B8]">متن بومی عربی:</p><p className="text-xl font-black text-[#F8FAFC] font-serif leading-relaxed">{p.result.translation}</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"><div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B]/60 space-y-1"><p className="text-[10px] text-[#14B8A6] font-bold">🗣️ تلفظ:</p><p className="text-xs font-mono text-[#F8FAFC]" dir="ltr">{p.result.pronunciation}</p></div><div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B]/60 space-y-1"><p className="text-[10px] text-[#14B8A6] font-bold">ℹ️ راهنمای تلفظ:</p><p className="text-xs text-[#F8FAFC] leading-relaxed">{p.result.audioPronunciationTips}</p></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"><div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B]/60 space-y-1"><p className="text-[10px] text-amber-400 font-bold">📝 واژه‌شناسی:</p><p className="text-xs text-[#F8FAFC] leading-relaxed">{p.result.literalMeaning}</p></div><div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B]/60 space-y-1"><p className="text-[10px] text-emerald-400 font-bold">💡 ملاحظات فرهنگی:</p><p className="text-xs text-[#F8FAFC] leading-relaxed">{p.result.culturalNote}</p></div></div>
          </div>
        </div>}
      </div>
    </div>
  );
}
