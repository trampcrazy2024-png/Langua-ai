import React from "react";
import { Sparkles, RefreshCw, ShieldAlert, Info, Volume2 } from "lucide-react";

export interface GeneratedPhrase { arabic: string; arabicPhonetic: string; arabicPhoneticLatin: string; farsi: string; english: string; audioTips?: string }
export interface AIGeneratorPanelProps {
  scenarioText: string; setScenarioText(v: string): void; dialect: string; setDialect(v: string): void;
  speakerGender: string; setSpeakerGender(v: string): void; listenerGender: string; setListenerGender(v: string): void;
  loading: boolean; error: string; results: GeneratedPhrase[]; onSubmit(): void; onSave(item: GeneratedPhrase, index: number): void; onPlay(text: string): void;
}
export function AIGeneratorPanel(p: AIGeneratorPanelProps) {
  return <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
    <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4">
      <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#14B8A6]" /><span>جمله‌ساز چندبعدی و سناریومحور هوش مصنوعی</span></h3>
      <p className="text-xs text-[#94A3B8] leading-relaxed">سناریو، نیاز یا موقعیت خاص خود در سفر را بنویسید (مثلاً: گم شدن در مترو ریاض، خرید سیمکارت عراقی، ویزیت پزشک کودکان)؛ هوش مصنوعی بلافاصله مجموعه‌ای اختصاصی از کاربردی‌ترین عبارات را با تفکیک دقیق گرامر و کدهای تلفظ برای شما گردآوری می‌کند:</p>
      <div className="space-y-3">
        <div className="space-y-1"><span className="text-[10.5px] text-[#94A3B8]">شرح موقعیت یا سناریوی سفر:</span><input type="text" value={p.scenarioText} onChange={(e) => p.setScenarioText(e.target.value)} placeholder="مثال: تحویل گرفتن چمدان مفقود شده در ترمینال نجف..." className="w-full bg-[#090D16] text-xs text-[#F8FAFC] px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none text-right" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">انتخاب لهجه بومی:</span><select value={p.dialect} onChange={(e) => p.setDialect(e.target.value)} className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5"><option value="Gulf Arabic (خلیجی)">لهجه خلیجی / عراقی</option><option value="Levantine Arabic (شامی)">لهجه شامی / سوری</option><option value="Egyptian Arabic (مصری)">لهجه مصری</option><option value="Standard Arabic (فصیح)">عربی فصیح</option></select></div>
          <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">جنسیت گوینده (شما):</span><select value={p.speakerGender} onChange={(e) => p.setSpeakerGender(e.target.value)} className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5"><option value="unisex">مشترک / بدون محدودیت گرامر</option><option value="male_speaker">من یک مرد هستم (مذکر)</option><option value="female_speaker">من یک زن هستم (مؤنث)</option></select></div>
          <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">جنسیت شنونده (مخاطب):</span><select value={p.listenerGender} onChange={(e) => p.setListenerGender(e.target.value)} className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5"><option value="unisex">یک آقا یا خانم</option><option value="male_listener">آقا (خطاب به مرد)</option><option value="female_listener">خانم (خطاب به زن)</option></select></div>
        </div>
        <button onClick={p.onSubmit} disabled={p.loading} className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">{p.loading ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>در حال گردآوری سفارشی سناریو شما...</span></> : <><Sparkles className="w-4 h-4" /><span>تولید ۶ عبارت حیاتی و بومی برای این موقعیت</span></>}</button>
      </div>
      {p.error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2"><ShieldAlert className="w-4 h-4" /><span>{p.error}</span></div>}
      {p.results.length > 0 && <div className="space-y-4 pt-3">
        <div className="flex justify-between items-center px-1"><span className="text-xs text-[#14B8A6] font-bold">📋 جملات طلایی استخراج شده برای سناریوی شما:</span><span className="text-[10px] text-[#94A3B8]">بر روی دکمه هر کلمه کلیک کنید تا آن را ذخیره کنید</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{p.results.map((item, idx) => <div key={idx} className="bg-[#090D16]/90 border border-[#1E293B] p-4 rounded-2xl flex flex-col justify-between space-y-3 relative hover:border-[#14B8A6]/35 transition-all">
          <div className="flex justify-between items-center gap-2"><span className="bg-[#14B8A6]/10 text-[#14B8A6] text-[9px] font-extrabold px-2 py-0.5 rounded">{p.dialect.split(" ")[0]} #{idx + 1}</span><button onClick={() => p.onSave(item, idx)} className="text-[10px] bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6] hover:text-black border border-[#14B8A6]/20 px-2 py-1 rounded transition-all">➕ ذخیره در واژه‌نامه</button></div>
          <div className="space-y-1 text-right"><p className="text-base font-black text-[#F8FAFC] font-serif leading-relaxed">{item.arabic}</p><div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#14B8A6] font-bold"><span>تلفظ:</span><p>{item.arabicPhonetic}</p></div><p className="text-xs text-[#94A3B8] font-semibold leading-relaxed">{item.farsi}</p></div>
          <div className="flex justify-between items-center pt-2 border-t border-[#1E293B]/40 text-[10px] text-[#94A3B8]"><div className="flex items-center gap-1"><Info className="w-3 h-3 text-[#14B8A6]" /><span className="max-w-[200px] truncate">{item.audioTips}</span></div><button onClick={() => p.onPlay(item.arabic)} className="p-1 rounded bg-[#14B8A6] text-black"><Volume2 className="w-3.5 h-3.5" /></button></div>
        </div>)}</div>
      </div>}
    </div>
  </div>;
}
