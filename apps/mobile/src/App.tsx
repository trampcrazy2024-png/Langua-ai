import { useState, useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { speakNative, stopNativeSpeech } from "./lib/nativeSpeech";
import { Compass, Sparkles } from "lucide-react";
import { PHRASES } from "./data";
import { Phrase } from "./types";
import { getSpeechSynthesis, newUtterance } from "./lib/speech";
import { apiUrl } from "./lib/config";
import { installGlobalErrorCapture } from "./lib/debugLog";

// Import custom modular components
import TranslatorTab from "./components/translator/TranslatorTab";
import OcrTab from "./components/OcrTab";
import PodcastTab from "./components/PodcastTab";
import SafetyTab from "./components/SafetyTab";
import ChatTab from "./components/ChatTab";
import PlannerTab from "./components/PlannerTab";
import WelcomeScreen from "./components/WelcomeScreen";
import DialectCompareTab from "./components/DialectCompareTab";
import ScenarioTab from "./components/ScenarioTab";
import DebugLogTab from "./components/DebugLogTab";
import { TabErrorBoundary } from "./components/TabErrorBoundary";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("AI Chat");
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return localStorage.getItem("travelapp_seen_welcome") !== "true";
    } catch {
      return true;
    }
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customPhrases, setCustomPhrases] = useState<Phrase[]>([]);
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.9);
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    try { return !navigator.onLine; } catch { return false; }
  });
  const [autoDetectedOffline, setAutoDetectedOffline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<string>("AI Gateway");

  // Debug Log: capture uncaught exceptions/unhandled promise rejections
  // app-wide, once, so the "گزارش خطا" tab has something even for errors
  // that never pass through any component's own try/catch.
  useEffect(() => {
    installGlobalErrorCapture();
  }, []);

  // Real network detection: if the phone actually loses internet (e.g. no
  // signal in a foreign country), the app finds out immediately from the
  // browser's real 'online'/'offline' events — not just when the user
  // remembers to flip the manual toggle.
  useEffect(() => {
    const goOffline = () => {
      setOfflineMode(true);
      setAutoDetectedOffline(true);
      triggerToast("📡 اینترنت قطع شد — مکالمه اصلی با هوش مصنوعی محلی و دیکشنری همچنان کار می‌کنند (تا زمانی که گیت‌وی محلی در دسترس باشد)؛ فقط قابلیت‌های وابسته به سرویس بیرونی محدود می‌شوند.");
    };
    const goOnline = () => {
      if (autoDetectedOffline) {
        setOfflineMode(false);
        setAutoDetectedOffline(false);
        triggerToast("✅ اتصال اینترنت برقرار شد.");
      }
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetectedOffline]);

  // The app talks to one local gateway. The gateway itself decides whether
  // a local Ollama model, DeepSeek, or another configured fallback provider
  // handles a request - see gateway/gateway.py.
  useEffect(() => {
    let cancelled = false;
    const checkGateway = async () => {
      try {
        const response = await fetch(apiUrl("/health"));
        // Same guard as lib/net.ts's apiFetch: a 200 OK with an HTML body
        // (the app's own index.html served back for an unmatched path when
        // no gateway is configured) must not be treated as "online".
        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || !contentType.includes("application/json")) throw new Error();
        const data = await response.json();
        if (cancelled) return;
        if (data.status === "ok") setGatewayStatus("AI Gateway · online");
        else setGatewayStatus("AI Gateway · offline");
      } catch {
        // Bug fix: "unavailable" read as a hard failure/error state, even
        // though native on-device inference (aiProviders.ts's
        // nativeProvider, the actual default/priority path per project
        // direction) needs no gateway at all - a fresh install with no
        // gateway configured yet is an expected, normal state, not a
        // problem. See ChatTab's new gateway-address field for how to
        // configure one, if the learner wants the gateway path too.
        if (!cancelled) setGatewayStatus("AI Gateway · not set up (optional)");
      }
    };
    checkGateway();
    const timer = window.setInterval(checkGateway, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  // Load state from localStorage on init
  useEffect(() => {
    const savedFavs = localStorage.getItem("travelapp_favorites");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    const savedCustom = localStorage.getItem("travelapp_custom_phrases");
    if (savedCustom) {
      try {
        setCustomPhrases(JSON.parse(savedCustom));
      } catch (e) {
        console.error("Failed to parse custom phrases", e);
      }
    }
  }, []);

  // Sync state to localStorage
  const saveFavorites = (newFavs: string[]) => {
    setFavorites(newFavs);
    localStorage.setItem("travelapp_favorites", JSON.stringify(newFavs));
  };

  const saveCustomPhrases = (newCustom: Phrase[]) => {
    setCustomPhrases(newCustom);
    localStorage.setItem("travelapp_custom_phrases", JSON.stringify(newCustom));
  };

  /*
   * Bug fix: this used to be `const toastTimer = { h: null as any };`
   * declared directly in the component body, which means it was a
   * brand-new object on every render - the "clear the previous
   * timer" check right below could never actually find a previous
   * timer, so rapid toasts would stack their auto-dismiss timeouts
   * instead of replacing them, and nothing cleared the pending
   * timeout on unmount either. useRef persists across renders and
   * we add a cleanup effect below.
   */
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  /*
   * Safety net: a truly unhandled promise rejection anywhere in the app
   * (some future async call that slips through without its own try/catch)
   * would otherwise surface as whatever raw browser/WebView default
   * happens to be for `unhandledrejection` - which is exactly how the
   * "Unexpected token '<' ... is not valid JSON" error (from an /api/*
   * fetch getting index.html back instead of a real backend response,
   * when no gateway is configured) was showing up directly on screen.
   * The actual source of that one is now fixed with a proper error
   * message at the fetch layer (lib/net.ts's apiFetch, aiProviders.ts's
   * streamGatewayChat, this file's own gateway health check) rather than
   * relying on this catch-all - but this stays in place as defense in
   * depth against anything else that isn't caught closer to its source.
   */
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      triggerToast("⚠️ خطای غیرمنتظره‌ای رخ داد؛ لطفاً دوباره تلاش کنید.");
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      const updated = favorites.filter((f) => f !== id);
      saveFavorites(updated);
      triggerToast("⭐ از لیست علاقه‌مندی‌ها حذف شد.");
    } else {
      const updated = [...favorites, id];
      saveFavorites(updated);
      triggerToast("⭐ به لیست علاقه‌مندی‌ها الحاق شد.");
    }
  };

  // Delete custom phrase
  const deleteCustomPhrase = (id: string) => {
    const updated = customPhrases.filter((p) => p.id !== id);
    saveCustomPhrases(updated);
    triggerToast("🗑️ عبارت شخصی با موفقیت حذف شد.");
  };

  // Add custom phrase
  const addCustomPhrase = (newPhrase: Omit<Phrase, "id">) => {
    const pWithId: Phrase = {
      ...newPhrase,
      id: `custom_${Date.now()}`
    };
    const updated = [...customPhrases, pWithId];
    saveCustomPhrases(updated);
  };

  // Universal text speaker using HTML5 SpeechSynthesis.
  // langCode lets callers pass the exact dialect/language (e.g. from
  // getLangCode(phrase.dialect, phrase.lang)); when omitted we auto-detect
  // Arabic-script vs Latin-script text so English phrases no longer get
  // read with an Arabic voice.
  const playSpeech = (
    text: string,
    _id: string,
    langCode?: string,
    voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string },
    onEnd?: () => void
  ) => {
    const resolvedLang = langCode || (/[\u0600-\u06FF]/.test(text) ? "ar-SA" : "en-US");

    // Bug fix (Android device testing, issue #3): try Android's real
    // on-device TTS engine first (see lib/nativeSpeech.ts's speakNative -
    // window.speechSynthesis is unreliable/absent in Capacitor's WebView).
    // handledNatively is set synchronously false as a placeholder and the
    // native attempt runs in the background; onEnd fires once either path
    // actually finishes, exactly as before.
    stopNativeSpeech(); // cancel any in-progress native utterance first, mirroring tts.cancel() below
    // exactOptionalPropertyTypes: only set `pitch` on the options object
    // when it's actually a number - passing `pitch: undefined` explicitly
    // is rejected as distinct from omitting the property entirely.
    const nativeSpeakOpts: { rate?: number; pitch?: number } = {
      rate: speechSpeed * (voiceOptions?.rate ?? 1),
    };
    if (voiceOptions?.pitch !== undefined) nativeSpeakOpts.pitch = voiceOptions.pitch;
    speakNative(text, resolvedLang, nativeSpeakOpts).then((handled) => {
      if (handled) onEnd?.();
    });
    if (Capacitor.isNativePlatform()) {
      triggerToast("🔊 در حال تلفظ بومی...");
      return;
    }

    const tts = getSpeechSynthesis();
    if (!tts) { triggerToast("⚠️ سیستم پخش صوتی در این دستگاه در دسترس نیست"); onEnd?.(); return; }
    try { tts.cancel(); } catch {}
    const utt = newUtterance(text);
    if (!utt) { triggerToast("⚠️ سازندهٔ گفتار در دسترس نیست"); onEnd?.(); return; }
    utt.lang = resolvedLang;
    utt.rate = speechSpeed * (voiceOptions?.rate ?? 1);
    if (voiceOptions?.pitch !== undefined) utt.pitch = voiceOptions.pitch;
    if (onEnd) {
      utt.onend = onEnd;
      utt.onerror = onEnd;
    }
    const voices = (tts.getVoices?.() ?? []) as any[];
    const exact = voices.find((v) => v.lang.toLowerCase() === resolvedLang.toLowerCase());
    const family = voices.find((v) => v.lang.toLowerCase().startsWith(resolvedLang.slice(0, 2).toLowerCase()));
    let chosen = exact || family;
    const voiceHint = voiceOptions?.voiceHint;
    if (voiceHint) {
      const hinted = voices.find((v) =>
        v.lang.toLowerCase().startsWith(resolvedLang.slice(0, 2).toLowerCase()) &&
        v.name.toLowerCase().includes(voiceHint.toLowerCase()));
      if (hinted) chosen = hinted;
    }
    if (chosen) utt.voice = chosen;
    else if (resolvedLang.startsWith("ar") && voices.length > 0)
      triggerToast("⚠️ صدای این لهجه نصب نیست؛ نزدیکترین صدای موجود پخش میشود.");
    tts.speak(utt);
    triggerToast("🔊 در حال تلفظ بومی...");
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    try { navigator.clipboard?.writeText(text); triggerToast("📋 متن کپی شد."); }
    catch { triggerToast("⚠️ کلیپبورد در این مرور در دسترس نیست"); }
  };

  // Navigation tabs, reprioritized around the app's actual goal (speaking
  // practice + dialect learning), not flattened into one list: AI Chat
  // (Speaking Mode, Accent Coach, Language Memory, Model Manager all live
  // there), Scenario (guided conversation practice), and Compare
  // (pronunciation comparison across dialects) are the core loop and stay
  // one tap away. Everything else genuinely useful for a traveler but not
  // part of the speaking/pronunciation loop itself moves behind "بیشتر"
  // (More) instead of being deleted - nothing here is removed, just no
  // longer competing for the same row as the core loop.
  const CORE_TABS = ["AI Chat", "Scenario", "Compare"];
  const MORE_TABS = ["Translator", "Podcast", "Planner", "Sign OCR", "SOS Safety", "Debug Log"];
  const [showMoreTabs, setShowMoreTabs] = useState(false);

  /*
   * Bug fix (Android device testing): the hardware/gesture Back button
   * always exited the whole app immediately, no matter which tab or menu
   * was open - there was no backButton listener registered anywhere, so
   * Capacitor's default behavior (exit at the first back press) applied
   * unconditionally. This builds a simple stack of previously-visited
   * tabs and only exits once there is nowhere left to go back to, closing
   * the "بیشتر" dropdown first if it's open.
   */
  const prevTabRef = useRef<string>(activeTab);
  const tabHistoryRef = useRef<string[]>([]);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      tabHistoryRef.current.push(prevTabRef.current);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const handle = CapacitorApp.addListener("backButton", () => {
      if (showMoreTabs) {
        setShowMoreTabs(false);
        return;
      }
      const previous = tabHistoryRef.current.pop();
      if (previous) {
        setActiveTab(previous);
        return;
      }
      CapacitorApp.exitApp();
    });
    return () => {
      handle.then((h) => h.remove());
    };
  }, [showMoreTabs]);

  if (showWelcome) {
    const dismiss = (destination: string) => {
      try {
        localStorage.setItem("travelapp_seen_welcome", "true");
      } catch {}
      setActiveTab(destination);
      setShowWelcome(false);
    };
    return (
      <WelcomeScreen
        onStart={() => dismiss("AI Chat")}
        onBrowseLibrary={() => dismiss("Translator")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col font-sans transition-all selection:bg-[#14B8A6]/30 select-none pb-12">
      
      {/* 1. APP HEADER - ALIGNED PERFECTLY WITH ANDROID MAIN SCREEN */}
      <div className="bg-[#0C101F] border-b border-[#1E293B] py-3.5 px-4 flex justify-between items-center w-full sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          {/* Home icon block */}
          <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center text-black shadow-inner">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1 font-bold">
              <span className="text-[#F8FAFC] text-base tracking-tight font-display">TravelApp</span>
              <span className="text-[#14B8A6] text-base font-display">66</span>
            </div>
            <p className="text-[#94A3B8] text-[10.5px]">Clean Architecture Solution</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {offlineMode && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1">
              <span>✈️ حالت پرواز آفلاین</span>
            </div>
          )}
          <div className="bg-[#14B8A6]/15 border border-[#14B8A6]/20 text-[#14B8A6] text-[9.5px] font-extrabold px-2.5 py-1 rounded">
            {gatewayStatus}
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL TAB ROW - core loop first, secondary tabs behind "بیشتر" */}
      <div className="bg-[#0C101F] border-b border-[#1E293B]/70 py-2 px-3 sticky top-[61px] z-40 overflow-x-auto scrollbar-none flex gap-2">
        {CORE_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                triggerToast(`📁 ورود به بخش ${tab}`);
              }}
              className={`text-xs font-black px-4.5 py-2.5 rounded-xl transition-all duration-300 shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isActive 
                  ? "bg-[#14B8A6] text-black shadow-lg" 
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/30"
              }`}
            >
              <span>{tab === "Compare" ? "🌍 Compare" :
                    tab === "AI Chat" ? "💬 AI Chat" :
                    "🎭 Scenario"}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowMoreTabs((v) => !v)}
          className={`text-xs font-black px-4.5 py-2.5 rounded-xl transition-all duration-300 shrink-0 flex items-center gap-1.5 cursor-pointer ${
            showMoreTabs || MORE_TABS.includes(activeTab)
              ? "bg-[#1E293B] text-[#F8FAFC]"
              : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/30"
          }`}
        >
          <span>{showMoreTabs ? "▲ بستن" : "⋯ بیشتر"}</span>
        </button>
        {showMoreTabs && MORE_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowMoreTabs(false);
                triggerToast(`📁 ورود به بخش ${tab}`);
              }}
              className={`text-xs font-black px-4.5 py-2.5 rounded-xl transition-all duration-300 shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isActive 
                  ? "bg-[#14B8A6] text-black shadow-lg" 
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/30"
              }`}
            >
              <span>{tab === "Translator" ? "🗣️ Translator" :
                    tab === "Planner" ? "🗺️ Planner" :
                    tab === "Sign OCR" ? "📷 Sign OCR" :
                    tab === "Podcast" ? "🎧 Podcast" :
                    tab === "SOS Safety" ? "🚨 SOS Safety" :
                    tab === "Debug Log" ? "🐞 گزارش خطا" : tab}</span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-5 flex-1">
        <TabErrorBoundary key={activeTab} label={activeTab}>
        {activeTab === "Translator" && (
          <TranslatorTab 
            phrases={PHRASES}
            customPhrases={customPhrases}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            deleteCustomPhrase={deleteCustomPhrase}
            addCustomPhrase={addCustomPhrase}
            playSpeech={playSpeech}
            triggerToast={triggerToast}
            copyToClipboard={copyToClipboard}
            speechSpeed={speechSpeed}
            setSpeechSpeed={setSpeechSpeed}
            offlineMode={offlineMode}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "Compare" && (
          <DialectCompareTab playSpeech={playSpeech} triggerToast={triggerToast} />
        )}

        {activeTab === "AI Chat" && (
          <ChatTab 
            playSpeech={playSpeech}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "Scenario" && (
          <ScenarioTab 
            playSpeech={playSpeech}
            triggerToast={triggerToast}
            offlineMode={offlineMode}
          />
        )}

        {activeTab === "Planner" && (
          <PlannerTab 
            triggerToast={triggerToast}
            offlineMode={offlineMode}
          />
        )}

        {activeTab === "Sign OCR" && (
          <OcrTab 
            playSpeech={playSpeech}
            triggerToast={triggerToast}
            offlineMode={offlineMode}
          />
        )}

        {activeTab === "Podcast" && (
          <PodcastTab 
            playSpeech={playSpeech}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "SOS Safety" && (
          <SafetyTab 
            playSpeech={playSpeech}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "Debug Log" && (
          <DebugLogTab triggerToast={triggerToast} />
        )}
        </TabErrorBoundary>
      </div>

      {/* 4. TOAST NOTIFICATION FLOATER */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#14B8A6] text-[#090D16] text-[11px] font-black py-2.5 px-5 rounded-full shadow-[0_4px_15px_rgba(20,184,166,0.35)] flex items-center gap-2 z-50 animate-scaleUp text-right" dir="rtl">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}
