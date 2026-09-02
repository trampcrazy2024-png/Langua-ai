import React, { useState, useEffect } from "react";
import { Phrase } from "../../types";
import { getLangCode, detectLangCode } from "../../data";
import { similarityScore, feedbackForScore, fuzzyIncludes } from "../../speechUtils";
import { logPracticeAttempt, computeStats, PracticeStats } from "../../progressStore";
import { recordSrsReview, getDueCardIds } from "../../srsStore";
import { isOfflineModelDownloaded, startOfflineRecognition } from "../../offlineAsr";
import { fetchOrGetTodayPhrases, getCachedDailyPhrases, DailyPhraseGroup } from "../../dailyPhrases";
import { apiFetch } from "../../lib/net";
import { startSpeechRecognition } from "../../lib/nativeSpeech";
import { DictionaryPanel } from "./DictionaryPanel";
import { AITranslatePanel } from "./AITranslatePanel";
import { AIGeneratorPanel, GeneratedPhrase } from "./AIGeneratorPanel";
import { DailyPhrasesPanel, DailyPhraseItem } from "./DailyPhrasesPanel";

export interface TranslatorTabProps {
  phrases: Phrase[];
  customPhrases: Phrase[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  deleteCustomPhrase: (id: string) => void;
  addCustomPhrase: (phrase: Omit<Phrase, "id">) => void;
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }) => void;
  triggerToast: (msg: string) => void;
  copyToClipboard: (text: string) => void;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  offlineMode: boolean;
  setActiveTab: (tab: string) => void;
}

export default function TranslatorTab({
  phrases, customPhrases, favorites, toggleFavorite, deleteCustomPhrase, addCustomPhrase,
  playSpeech, triggerToast, copyToClipboard, speechSpeed, setSpeechSpeed, offlineMode, setActiveTab
}: TranslatorTabProps) {
  const [subTab, setSubTab] = useState<"dictionary" | "ai_translate" | "ai_generator" | "daily">("dictionary");
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedDialect, setSelectedDialect] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  const [translateText, setTranslateText] = useState("");
  const [translateDialect, setTranslateDialect] = useState("Gulf Arabic (خلیجی)");
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateResult, setTranslateResult] = useState<any | null>(null);
  const [translateError, setTranslateError] = useState("");

  const [scenarioText, setScenarioText] = useState("");
  const [genDialect, setGenDialect] = useState("Gulf Arabic (خلیجی)");
  const [genSpeakerGender, setGenSpeakerGender] = useState("unisex");
  const [genListenerGender, setGenListenerGender] = useState("unisex");
  const [genLoading, setGenLoading] = useState(false);
  const [genResults, setGenResults] = useState<GeneratedPhrase[]>([]);
  const [genError, setGenError] = useState("");

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newArabic, setNewArabic] = useState("");
  const [newFarsi, setNewFarsi] = useState("");
  const [newEnglish, setNewEnglish] = useState("");
  const [newDialect, setNewDialect] = useState("مشترک");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newLang, setNewLang] = useState<"arabic" | "english">("arabic");

  const [dailyGroups, setDailyGroups] = useState<DailyPhraseGroup[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState("");
  const [dailyFromCache, setDailyFromCache] = useState(false);

  const [practicingId, setPracticingId] = useState<string | null>(null);
  const [practiceResults, setPracticeResults] = useState<Record<string, { label: string; color: string; heard?: string }>>({});
  const [speakingPracticeMode, setSpeakingPracticeMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<PracticeStats>(() => computeStats());
  const [isOffline, setIsOffline] = useState(() => { try { return !navigator.onLine; } catch { return false; } });
  const [offlineModelReady, setOfflineModelReady] = useState(false);
  const [dueIds, setDueIds] = useState<string[]>(() => getDueCardIds());
  const [reviewOnlyMode, setReviewOnlyMode] = useState(false);

  useEffect(() => {
    const cached = getCachedDailyPhrases();
    if (cached) { setDailyGroups(cached); setDailyFromCache(true); }
    isOfflineModelDownloaded().then(setOfflineModelReady);
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);

  const allAvailablePhrases = [...phrases, ...customPhrases];
  const filteredPhrases = allAvailablePhrases.filter((p) => {
    const matchesCat = selectedCat === "all" || p.category === selectedCat;
    const matchesQuery = !searchQuery.trim() || fuzzyIncludes(p.arabic, searchQuery) || fuzzyIncludes(p.farsi, searchQuery) || fuzzyIncludes(p.arabicPhonetic, searchQuery) || fuzzyIncludes(p.english, searchQuery);
    let matchesGender = true;
    if (genderFilter === "male_speaker") matchesGender = p.gender !== "female_speaker";
    if (genderFilter === "female_speaker") matchesGender = p.gender !== "male_speaker";
    const dialectMatchers: Record<string, string[]> = { "لبنانی": ["لبنانی", "شامی"] };
    const matchesDialect = selectedDialect === "all" || (dialectMatchers[selectedDialect] || [selectedDialect]).some((kw) => p.dialect.includes(kw));
    return matchesCat && matchesQuery && matchesGender && matchesDialect && (!reviewOnlyMode || dueIds.includes(p.id));
  });

  const handleTranslateSubmit = async () => {
    if (!translateText.trim()) { triggerToast("لطفاً عبارتی برای ترجمه وارد کنید!"); return; }
    if (offlineMode) { triggerToast("⚠️ حالت پرواز فعال است."); return; }
    setTranslateLoading(true); setTranslateError(""); setTranslateResult(null);
    try {
      const data = await apiFetch<any>("/api/translate", { method: "POST", body: { text: translateText, targetDialect: translateDialect, sourceLang: "Persian/English" } });
      setTranslateResult(data); triggerToast("✨ ترجمه لهجه‌ای با موفقیت تکمیل شد!");
    } catch (err: any) { setTranslateError(err?.message || "خطا در ترجمه"); }
    finally { setTranslateLoading(false); }
  };

  const handleGenerateSubmit = async (overrideScenario?: string, overrideDialect?: string) => {
    const scenario = overrideScenario ?? scenarioText;
    const dialect = overrideDialect ?? genDialect;
    if (!scenario.trim()) { triggerToast("لطفاً یک سناریو سفر مشخص بنویسید!"); return; }
    if (offlineMode) { triggerToast("⚠️ حالت پرواز فعال است."); return; }
    setGenLoading(true); setGenError(""); setGenResults([]);
    try {
      const data = await apiFetch<any>("/api/generate-phrases", { method: "POST", body: { scenario, dialect, speakerGender: genSpeakerGender, listenerGender: genListenerGender } });
      if (data.phrases) { setGenResults(data.phrases); triggerToast(`✨ تعداد ${data.phrases.length} عبارت طلایی تولید شد.`); }
      else throw new Error("ساختار داده نادرست است.");
    } catch (err: any) { setGenError(err?.message || "خطا در تولید عبارات هوشمند"); }
    finally { setGenLoading(false); }
  };

  const handleLoadDaily = async () => {
    if (offlineMode) { triggerToast("⚠️ حالت پرواز فعال است."); return; }
    setDailyLoading(true); setDailyError("");
    try {
      const { groups, fromCache } = await fetchOrGetTodayPhrases();
      setDailyGroups(groups); setDailyFromCache(fromCache);
      if (!fromCache) triggerToast("✨ جملات تازه امروز ساخته و ذخیره شد.");
    } catch (err: any) { setDailyError(err?.message || "ساخت جملات امروز ناموفق بود؛ اتصال یا کلید API را بررسی کنید."); }
    finally { setDailyLoading(false); }
  };

  /*
   * Bug fix (memory/resource leak): handlePracticePhrase() opens a
   * microphone stream plus either a 5s setTimeout (offline path) or a
   * SpeechRecognition session (online path), but nothing stopped any
   * of them if the user navigated away from this tab mid-practice.
   * These refs track whatever is currently active so the unmount
   * effect below can tear it all down.
   */
  const activeStreamRef = React.useRef<MediaStream | null>(null);
  const activeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRecognitionRef = React.useRef<any>(null);
  const activeOfflineHandleRef = React.useRef<{ stop: () => void } | null>(null);

  React.useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
      try { activeRecognitionRef.current?.stop(); } catch {}
      try { activeOfflineHandleRef.current?.stop(); } catch {}
      activeStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handlePracticePhrase = async (p: Phrase) => {
    if (!navigator.mediaDevices?.getUserMedia) { triggerToast("⚠️ دسترسی به میکروفون ممکن نیست."); return; }
    const registerResult = (heard: string) => {
      const score = similarityScore(p.arabic, heard);
      const fb = feedbackForScore(score);
      setPracticeResults((prev) => ({ ...prev, [p.id]: { label: `${fb.label} (${score}%)`, color: fb.color, heard } }));
      logPracticeAttempt(p.id, p.dialect, score);
      recordSrsReview(p.id, score);
      setStats(computeStats()); setDueIds(getDueCardIds());
    };

    if (!navigator.onLine && p.lang === "english" && (await isOfflineModelDownloaded())) {
      setPracticingId(p.id);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStreamRef.current = stream;
        triggerToast("🔌 حالت آفلاین: Vosk روی‌دستگاه...");
        const handle = await startOfflineRecognition(stream, () => {}, registerResult, (message) => triggerToast(message));
        activeOfflineHandleRef.current = handle;
        activeTimeoutRef.current = setTimeout(() => {
          handle.stop();
          stream.getTracks().forEach((t) => t.stop());
          activeStreamRef.current = null;
          activeOfflineHandleRef.current = null;
          activeTimeoutRef.current = null;
          setPracticingId(null);
        }, 5000);
      } catch { triggerToast("⚠️ اجازه دسترسی به میکروفون داده نشد."); setPracticingId(null); }
      return;
    }

    setPracticingId(p.id);
    const handle = startSpeechRecognition({
      lang: getLangCode(p.dialect, p.lang),
      onResult: (heard) => registerResult(heard),
      onError: (message) => triggerToast(message),
      onEnd: () => { setPracticingId(null); activeRecognitionRef.current = null; },
    });
    if (!handle) {
      triggerToast("⚠️ این دستگاه از تشخیص گفتار پشتیبانی نمی‌کند؛ فقط پخش صدا در دسترس است.");
      setPracticingId(null);
      return;
    }
    activeRecognitionRef.current = handle;
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArabic.trim() || !newFarsi.trim()) { triggerToast("لطفاً عربی و ترجمه فارسی را تکمیل کنید."); return; }
    addCustomPhrase({
      category: "conversational", arabic: newArabic, farsi: newFarsi,
      arabicPhonetic: newPhonetic || newArabic, arabicPhoneticLatin: "Custom phrase",
      english: newEnglish || "Traveler Custom Phrase", dialect: newDialect, lang: newLang
    });
    setNewArabic(""); setNewFarsi(""); setNewEnglish(""); setNewPhonetic(""); setNewLang("arabic");
    setShowAddCustom(false); triggerToast("📝 عبارت شخصی به پایگاه داده اضافه شد.");
  };

  return <div className="space-y-6">
    <div className="flex bg-[#0C101F] p-1.5 rounded-xl border border-[#1E293B]">
      {(["dictionary", "ai_translate", "ai_generator", "daily"] as const).map((tab) => <button key={tab} onClick={() => setSubTab(tab)} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all text-center ${subTab === tab ? "bg-[#14B8A6] text-black" : "text-[#94A3B8] hover:text-[#F8FAFC]"}`}>
        {tab === "dictionary" ? "📖 واژه‌نامه آفلاین" : tab === "ai_translate" ? "🤖 مترجم هوشمند لهجه" : tab === "ai_generator" ? "✨ جمله‌ساز سفارشی AI" : "📅 جملات امروز"}
      </button>)}
    </div>

    {subTab === "dictionary" && <DictionaryPanel
      filtered={filteredPhrases} stats={stats} dueCount={dueIds.length}
      selectedCat={selectedCat} setSelectedCat={setSelectedCat} selectedDialect={selectedDialect} setSelectedDialect={setSelectedDialect}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery} genderFilter={genderFilter} setGenderFilter={setGenderFilter}
      speechSpeed={speechSpeed} setSpeechSpeed={setSpeechSpeed} speakingPracticeMode={speakingPracticeMode} setSpeakingPracticeMode={setSpeakingPracticeMode}
      reviewOnlyMode={reviewOnlyMode} setReviewOnlyMode={setReviewOnlyMode} isOffline={isOffline} offlineModelReady={offlineModelReady}
      goToMatrix={() => setActiveTab("Matrix")} showAddCustom={showAddCustom} setShowAddCustom={setShowAddCustom}
      newArabic={newArabic} setNewArabic={setNewArabic} newFarsi={newFarsi} setNewFarsi={setNewFarsi}
      newEnglish={newEnglish} setNewEnglish={setNewEnglish} newPhonetic={newPhonetic} setNewPhonetic={setNewPhonetic}
      newDialect={newDialect} setNewDialect={setNewDialect} newLang={newLang} setNewLang={setNewLang}
      onCreateCustom={handleCreateCustom} favorites={favorites} toggleFavorite={toggleFavorite} deleteCustomPhrase={deleteCustomPhrase}
      practicingId={practicingId} practiceResults={practiceResults} revealedIds={revealedIds} onPractice={handlePracticePhrase}
      onPlay={(t, id) => playSpeech(t, id, detectLangCode(t))} onReveal={(id) => setRevealedIds((prev) => ({ ...prev, [id]: true }))}
      onMoreExamples={(arabic, farsi, dialect) => { const scenario = `جملات بیشتر با استفاده از این عبارت: «${arabic}» (${farsi})`; setScenarioText(scenario); setGenDialect(dialect); setSubTab("ai_generator"); void handleGenerateSubmit(scenario, dialect); }}
      onToast={triggerToast} onStartReview={() => { setReviewOnlyMode(true); setSelectedDialect("all"); setSelectedCat("all"); setSearchQuery(""); triggerToast(`📅 ${dueIds.length} عبارت آماده مرور امروز است (بر اساس SM-2).`); }}
    />}

    {subTab === "ai_translate" && <AITranslatePanel
      text={translateText} setText={setTranslateText} dialect={translateDialect} setDialect={setTranslateDialect}
      loading={translateLoading} result={translateResult} error={translateError} onSubmit={handleTranslateSubmit}
      onCopy={copyToClipboard} onPlay={(t) => playSpeech(t, "ai_trans", detectLangCode(t))}
    />}

    {subTab === "ai_generator" && <AIGeneratorPanel
      scenarioText={scenarioText} setScenarioText={setScenarioText} dialect={genDialect} setDialect={setGenDialect}
      speakerGender={genSpeakerGender} setSpeakerGender={setGenSpeakerGender} listenerGender={genListenerGender} setListenerGender={setGenListenerGender}
      loading={genLoading} error={genError} results={genResults} onSubmit={() => void handleGenerateSubmit()}
      onSave={(item) => { addCustomPhrase({ category: "conversational", arabic: item.arabic, farsi: item.farsi, arabicPhonetic: item.arabicPhonetic, arabicPhoneticLatin: item.arabicPhoneticLatin, english: item.english, dialect: genDialect.split(" ")[0] ?? genDialect, ...(item.audioTips !== undefined ? { audioTips: item.audioTips } : {}) }); triggerToast("📌 ذخیره شد."); }}
      onPlay={(t) => playSpeech(t, "gen_0", detectLangCode(t))}
    />}

    {subTab === "daily" && <DailyPhrasesPanel
      groups={dailyGroups} loading={dailyLoading} error={dailyError} fromCache={dailyFromCache} onLoad={handleLoadDaily}
      onPractice={handlePracticePhrase} onPlay={(t, lang) => playSpeech(t, `d_${Date.now()}`, lang === "arabic" ? "ar-SA" : "en-US")}
      onSave={(item: DailyPhraseItem) => { const lang: "arabic" | "english" = /[\u0600-\u06FF]/.test(item.text) ? "arabic" : "english"; addCustomPhrase({ category: "conversational", arabic: item.text, arabicPhonetic: item.phonetic, arabicPhoneticLatin: item.phoneticLatin, english: item.english, farsi: item.farsi, dialect: "مشترک", lang }); triggerToast("📌 به واژه‌نامه شما اضافه شد."); }}
      practicingId={practicingId} practiceResults={practiceResults}
    />}
  </div>;
}
