import { Search, Plus } from "lucide-react";
import { Phrase } from "../../types";
import { CATEGORIES, DIALECT_FILTERS } from "../../data";
import { PhraseCard } from "./PhraseCard";

export interface StatsView { totalAttempts: number; uniquePhrasesAttempted: number; averageScore: number; currentStreakDays: number }

export interface DictionaryPanelProps {
  filtered: Phrase[]; stats: StatsView; dueCount: number;
  selectedCat: string; setSelectedCat(v: string): void;
  selectedDialect: string; setSelectedDialect(v: string): void;
  searchQuery: string; setSearchQuery(v: string): void;
  genderFilter: string; setGenderFilter(v: string): void;
  speechSpeed: number; setSpeechSpeed(v: number): void;
  speakingPracticeMode: boolean; setSpeakingPracticeMode(v: boolean): void;
  reviewOnlyMode: boolean; setReviewOnlyMode(v: boolean): void;
  isOffline: boolean; offlineModelReady: boolean; goToMatrix(): void;
  showAddCustom: boolean; setShowAddCustom(v: boolean): void;
  newArabic: string; setNewArabic(v: string): void;
  newFarsi: string; setNewFarsi(v: string): void;
  newEnglish: string; setNewEnglish(v: string): void;
  newPhonetic: string; setNewPhonetic(v: string): void;
  newDialect: string; setNewDialect(v: string): void;
  newLang: "arabic" | "english"; setNewLang(v: "arabic" | "english"): void;
  onCreateCustom(e: any): void;
  favorites: string[]; toggleFavorite(id: string): void; deleteCustomPhrase(id: string): void;
  practicingId: string | null;
  practiceResults: Record<string, { label: string; color: string; heard?: string }>;
  revealedIds: Record<string, boolean>;
  onPractice(p: Phrase): void; onPlay(text: string, id: string, langCode?: string): void;
  onReveal(id: string): void; onMoreExamples(arabic: string, farsi: string, dialect: string): void;
  onToast(msg: string): void; onStartReview(): void;
}

export function DictionaryPanel(p: DictionaryPanelProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {p.stats.totalAttempts > 0 && (
        <div className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><p className="text-base font-black text-[#14B8A6]">{p.stats.totalAttempts}</p><p className="text-[9.5px] text-[#94A3B8]">تلاش‌های تمرین</p></div>
            <div><p className="text-base font-black text-[#F8FAFC]">{p.stats.uniquePhrasesAttempted}</p><p className="text-[9.5px] text-[#94A3B8]">عبارت تمرین‌شده</p></div>
            <div><p className="text-base font-black text-amber-400">{p.stats.averageScore}%</p><p className="text-[9.5px] text-[#94A3B8]">میانگین دقت</p></div>
            <div><p className="text-base font-black text-emerald-400">{p.stats.currentStreakDays} روز</p><p className="text-[9.5px] text-[#94A3B8]">توالی تمرین</p></div>
          </div>
          {p.dueCount > 0 && <button onClick={p.onStartReview} className="w-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black py-2 rounded-lg flex items-center justify-center gap-1.5">📅 {p.dueCount} عبارت آماده مرور هوشمند امروز — شروع مرور</button>}
        </div>
      )}

      {p.isOffline && !p.offlineModelReady && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-center justify-between gap-2">
          <p className="text-[11px] text-amber-400 leading-relaxed">📡 اینترنت وصل نیست. تشخیص گفتار انگلیسی می‌تواند کاملاً آفلاین کار کند اگر بستهٔ آن را از قبل دانلود کرده باشید.</p>
          <button onClick={p.goToMatrix} className="shrink-0 text-[10px] font-black bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg">دانلود بسته</button>
        </div>
      )}

      <div className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl space-y-2">
        <span className="text-[11px] font-black text-[#F8FAFC]">زبان / لهجه‌ای که می‌خواهید تمرین کنید:</span>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
          {DIALECT_FILTERS.map((d) => <button key={d.id} onClick={() => p.setSelectedDialect(d.id)} className={`text-[10px] font-black px-2 py-2 rounded-lg border transition-all ${p.selectedDialect === d.id ? "bg-[#14B8A6] text-black border-[#14B8A6]" : "bg-[#090D16] text-[#94A3B8] border-[#1E293B] hover:border-[#14B8A6]/40"}`}>{d.label}</button>)}
        </div>
      </div>

      <div className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl space-y-3">
        <div className="relative">
          <input type="text" value={p.searchQuery} onChange={(e) => p.setSearchQuery(e.target.value)} placeholder="جستجو در هزاران واژه و اصطلاحات بومی..." className="w-full bg-[#090D16] text-xs text-[#F8FAFC] px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none text-right" dir="rtl" />
          <Search className="w-4.5 h-4.5 text-[#94A3B8] absolute left-3.5 top-2.5" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto" dir="rtl"><span className="text-[11px] text-[#94A3B8] shrink-0">سرعت تلفظ:</span><input type="range" min="0.5" max="1.5" step="0.1" value={p.speechSpeed} onChange={(e) => p.setSpeechSpeed(parseFloat(e.target.value))} className="accent-[#14B8A6] w-24 sm:w-32" /><span className="text-[11px] font-mono text-[#14B8A6]">{p.speechSpeed}x</span></div>
          <div className="flex gap-1.5 w-full sm:w-auto justify-end">
            {["all", "male_speaker", "female_speaker"].map((gen) => <button key={gen} onClick={() => p.setGenderFilter(gen)} className={`text-[10px] font-black px-2.5 py-1.5 rounded transition-all border ${p.genderFilter === gen ? "bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]" : "bg-[#090D16] text-[#94A3B8] border-[#1E293B]"}`}>{gen === "all" ? "تمام جنسیت‌ها" : gen === "male_speaker" ? "گوینده مرد" : "گوینده زن"}</button>)}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#1E293B]/60 pt-3">
          <div className="text-right"><span className="text-[11px] font-black text-[#F8FAFC]">حالت تمرین گفتار روزمره</span><p className="text-[10px] text-[#94A3B8]">فقط معنی فارسی نشان داده می‌شود؛ شما باید آن را با صدای بلند به لهجه بگویید.</p></div>
          <button onClick={() => p.setSpeakingPracticeMode(!p.speakingPracticeMode)} className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all ${p.speakingPracticeMode ? "bg-[#14B8A6] text-black border-[#14B8A6]" : "bg-[#090D16] text-[#94A3B8] border-[#1E293B]"}`}>{p.speakingPracticeMode ? "روشن ✅" : "خاموش"}</button>
        </div>
        {p.reviewOnlyMode && <div className="flex items-center justify-between border-t border-[#1E293B]/60 pt-3"><div className="text-right"><span className="text-[11px] font-black text-amber-400">حالت مرور هوشمند SRS فعال است</span><p className="text-[10px] text-[#94A3B8]">فقط عبارات آماده مرور امروز نشان داده می‌شوند.</p></div><button onClick={() => p.setReviewOnlyMode(false)} className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">خروج از مرور</button></div>}
        <div className="overflow-x-auto pb-1 flex gap-2 border-t border-[#1E293B]/60 pt-3" dir="rtl">
          {CATEGORIES.map((cat) => <button key={cat.id} onClick={() => p.setSelectedCat(cat.id)} className={`text-[11px] font-black px-3.5 py-1.5 rounded-lg border shrink-0 transition-all ${p.selectedCat === cat.id ? "bg-[#14B8A6] text-black border-[#14B8A6]" : "bg-[#090D16] text-[#94A3B8] border-[#1E293B] hover:border-[#14B8A6]/30"}`}>{cat.nameFa}</button>)}
        </div>
      </div>

      <div className="flex justify-between items-center px-1"><span className="text-[11px] text-[#94A3B8]">{p.filtered.length} عبارت آماده بارگذاری شده</span><button onClick={() => p.setShowAddCustom(!p.showAddCustom)} className="bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6] hover:text-black border border-[#14B8A6]/30 px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer"><Plus className="w-3.5 h-3.5" /><span>افزودن عبارت شخصی شما</span></button></div>

      {p.showAddCustom && (
        <form onSubmit={p.onCreateCustom} className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl space-y-3 text-right" dir="rtl">
          <h4 className="text-xs font-black text-[#14B8A6]">📝 افزودن اصطلاح اختصاصی جدید به سفر شما</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">متن عربی:</span><input type="text" value={p.newArabic} onChange={(e) => p.setNewArabic(e.target.value)} placeholder="مثال: من فضلك، بكم حساب هذه؟" className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded p-2 text-right" required /></div>
            <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">ترجمه فارسی:</span><input type="text" value={p.newFarsi} onChange={(e) => p.setNewFarsi(e.target.value)} placeholder="مثال: لطفاً، حساب این چقدر میشه؟" className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded p-2 text-right" required /></div>
            <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">تلفظ صوتی فارسی:</span><input type="text" value={p.newPhonetic} onChange={(e) => p.setNewPhonetic(e.target.value)} placeholder="مثال: من فضلِک، بِکَم حِساب هاذی؟" className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded p-2 text-right" /></div>
            <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">لهجه بومی:</span><select value={p.newDialect} onChange={(e) => p.setNewDialect(e.target.value)} className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded p-2 text-right"><option value="مشترک">مشترک / فصیح</option><option value="لهجه عراقی">لهجه عراقی</option><option value="لهجه لبنانی (شامی)">لهجه لبنانی (شامی)</option><option value="خلیجی">لهجه خلیجی</option><option value="مصری">لهجه مصری</option><option value="انگلیسی آمریکایی">انگلیسی آمریکایی</option><option value="انگلیسی بریتانیایی/استاندارد">انگلیسی بریتانیایی/استاندارد</option></select></div>
            <div className="space-y-1"><span className="text-[10px] text-[#94A3B8]">نوع متن:</span><select value={p.newLang} onChange={(e) => p.setNewLang(e.target.value as "arabic" | "english")} className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded p-2 text-right"><option value="arabic">عربی (حروف عربی)</option><option value="english">انگلیسی (حروف لاتین)</option></select></div>
          </div>
          <div className="flex gap-2 justify-end pt-2"><button type="button" onClick={() => p.setShowAddCustom(false)} className="bg-[#090D16] text-[#94A3B8] border border-[#1E293B] px-4 py-2 rounded-lg text-xs">انصراف</button><button type="submit" className="bg-[#14B8A6] text-black font-extrabold px-5 py-2 rounded-lg text-xs">ثبت کلمه شخصی</button></div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {p.filtered.length > 0 ? p.filtered.map((ph) => (
          <PhraseCard key={ph.id} phrase={ph} isFavorite={p.favorites.includes(ph.id)} isCustom={ph.id.startsWith("custom_")} speakingMode={p.speakingPracticeMode} revealed={!!p.revealedIds[ph.id]} practiceResult={p.practiceResults[ph.id]} busy={p.practicingId === ph.id} onToggleFav={() => p.toggleFavorite(ph.id)} onDelete={() => p.deleteCustomPhrase(ph.id)} onPractice={() => p.onPractice(ph)} onPlay={(t) => p.onPlay(t, ph.id)} onReveal={() => p.onReveal(ph.id)} onMoreExamples={p.onMoreExamples} onToast={p.onToast} />
        )) : <p className="text-xs text-[#94A3B8] text-center col-span-2 py-8 bg-[#141C2E] rounded-2xl border border-[#1E293B]">عبارتی پیدا نشد. می‌توانید با دکمه بالا اولین کلمه خود را ثبت کنید!</p>}
      </div>
    </div>
  );
}
