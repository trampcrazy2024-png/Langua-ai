import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Volume2, ShieldAlert, RefreshCw, MessageSquare, CheckCircle2, Lightbulb, BookOpen, Cpu, Cloud, Headphones, Square } from "lucide-react";
import { ChatMessage } from "../types";
import { getLangCode, PERSONAS } from "../data";
import { getPreferredProviderKey, setPreferredProviderKey, listProviders, gatewayProvider, getNativeStatus, pickAndLoadNativeModel, unloadNativeModel, streamGatewayChat, type AiProviderKey, type NativeStatus } from "../lib/aiProviders";
import { apiFetch } from "../lib/net";
import { getGatewayBaseUrl, setGatewayBaseUrl } from "../lib/config";
import { startSpeechRecognition, stopNativeSpeech } from "../lib/nativeSpeech";
import { getFrequentMistakes, logMistake } from "../languageMemoryStore";
import { computeLevel } from "../levelStore";
import { getAccentTips } from "../accentCoach";
import { listAvailableModels, type ModelInfo } from "../lib/modelManager";
import { generateMistakePractice, type MistakeQuizQuestion } from "../lib/mistakePractice";
import { buildContextWindow, summarizeOlderTurns } from "../lib/conversationContext";

interface ChatTabProps {
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }, onEnd?: () => void) => void;
  triggerToast: (msg: string) => void;
}

const DIALECT_OPTIONS = PERSONAS;

interface ConversationReport {
  objectiveAchieved: boolean;
  summaryFa: string;
  strengthsFa: string[];
  improvementsFa: string[];
  newVocabulary: { phrase: string; meaningFa: string }[];
}

export default function ChatTab({ playSpeech, triggerToast }: ChatTabProps) {
  const [dialect, setDialect] = useState(DIALECT_OPTIONS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState<ConversationReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  // Which AIProvider answers chat messages - persisted so the choice
  // survives app restarts (see aiProviders.ts: localStorage-backed).
  const [providerKey, setProviderKey] = useState<AiProviderKey>(getPreferredProviderKey);
  // Bug fix (Android device testing): VITE_AI_BASE_URL is baked in at build
  // time, so a packaged APK has no way to point at the user's own LAN
  // gateway (its address varies per network/install). This field lets the
  // user set it at runtime instead - see lib/config.ts.
  const [gatewayUrlInput, setGatewayUrlInput] = useState<string>(() => getGatewayBaseUrl());
  const [gatewayUrlSaved, setGatewayUrlSaved] = useState(false);
  const providers = listProviders();
  const activeProvider = providers.find((p) => p.key === providerKey) ?? gatewayProvider;
  // Quiz-into-learning-loop: distinct real corrections from this session,
  // used to offer a short targeted practice quiz instead of Quiz being a
  // disconnected standalone feature (see mistakePractice.ts).
  const [sessionMistakes, setSessionMistakes] = useState<string[]>([]);
  const [practiceDismissed, setPracticeDismissed] = useState(false);
  // Context Manager: how many of the oldest turns have already been folded
  // into conversationSummaryRef, and the summary text itself - see
  // conversationContext.ts. Refs, not state, since they don't need to
  // trigger a re-render on their own.
  const summarizedRawCountRef = useRef(0);
  const conversationSummaryRef = useRef<string | null>(null);
  // On-device model status (only relevant while "native" is selected) and
  // the pick/load/unload flow for it - see lib/aiProviders.ts.
  const [nativeStatus, setNativeStatus] = useState<NativeStatus | null>(null);
  const [nativeBusy, setNativeBusy] = useState<"" | "importing" | "unloading">("");

  React.useEffect(() => {
    if (providerKey !== "native") return;
    let cancelled = false;
    getNativeStatus().then((s) => {
      if (!cancelled) setNativeStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [providerKey]);

  const handlePickModel = async () => {
    setNativeBusy("importing");
    try {
      await pickAndLoadNativeModel();
      triggerToast("✅ مدل با موفقیت وارد و بارگذاری شد.");
      setNativeStatus(await getNativeStatus());
    } catch (err: any) {
      triggerToast(`⚠️ ${err?.message || "وارد کردن یا بارگذاری مدل ناموفق بود."}`);
    } finally {
      setNativeBusy("");
    }
  };

  const handleUnloadModel = async () => {
    setNativeBusy("unloading");
    try {
      await unloadNativeModel();
      setNativeStatus(await getNativeStatus());
    } catch {
      triggerToast("⚠️ تخلیه مدل از حافظه ناموفق بود.");
    } finally {
      setNativeBusy("");
    }
  };

  const handleGetReport = async () => {
    if (messages.filter((m) => m.sender === "user").length === 0) {
      triggerToast("هنوز چیزی برای بررسی وجود ندارد؛ چند پیام رد‌وبدل کنید.");
      return;
    }
    setReportLoading(true);
    try {
      // Bug fix: was a raw fetch("/api/scenario-report", ...) with a
      // hardcoded same-origin path - see the note in OcrTab.tsx.
      const data = await apiFetch<ConversationReport>("/api/scenario-report", {
        method: "POST",
        body: {
          transcript: messages.map((m) => ({ sender: m.sender, text: m.text })),
          scenarioTitle: "گفتگوی آزاد روزمره",
          objectiveFa: "صحبت روان و صحیح درباره هر موضوعی که پیش آمد",
          dialect: dialect.id
        }
      });
      setReport(data);
    } catch {
      triggerToast("⚠️ ساخت گزارش ناموفق بود؛ اتصال اینترنت را بررسی کنید.");
    } finally {
      setReportLoading(false);
    }
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * Bug fix (memory/resource leak): same pattern already fixed in
   * TranslatorTab.tsx / PodcastTab.tsx / MatrixTab.tsx -
   * handleVoiceInput() opens a mic stream + SpeechRecognition with no
   * cleanup if the user leaves this tab mid-recording. Also tracks the
   * scroll-into-view timeout from handleSend() below for the same
   * reason.
   */
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeRecognitionRef = useRef<any>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      speakingModeRef.current = false;
      try { activeRecognitionRef.current?.stop(); } catch {}
      activeStreamRef.current?.getTracks().forEach((t) => t.stop());
      try { (window as any).speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  // Speaking Mode: a continuous voice loop (listen -> reply -> speak ->
  // listen again), separate from typed Chat - the learner never has to
  // tap Send. Built on the same browser SpeechRecognition/SpeechSynthesis
  // APIs already used for the typed-chat mic button and the per-message
  // playback button below; there is no separate offline STT/TTS engine
  // here (see README.md's honesty note on this).
  const [speakingMode, setSpeakingMode] = useState(false);
  const speakingModeRef = useRef(false);
  const [speakingPhase, setSpeakingPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  useEffect(() => {
    speakingModeRef.current = speakingMode;
    if (!speakingMode) setSpeakingPhase("idle");
  }, [speakingMode]);

  const handleSend = async (textOverride?: string, opts?: { speaking?: boolean }) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    // The conversation engine is whichever AiProvider is selected below
    // (gateway or on-device native) - see lib/aiProviders.ts. The UI here
    // never talks to the gateway or to llama.cpp directly.

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString()
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!opts?.speaking) setInput("");
    setLoading(true);
    setError("");

    try {
      const fullHistory = newMessages.map((m) => ({ sender: m.sender, text: m.text }));
      const { turns: windowedHistory, droppedCount } = buildContextWindow(fullHistory);

      // Context Manager: fold any newly-dropped turns into the rolling
      // summary before this request, so long conversations don't silently
      // lose earlier context just because it no longer fits verbatim.
      if (droppedCount > summarizedRawCountRef.current) {
        const newlyDropped = fullHistory.slice(summarizedRawCountRef.current, droppedCount);
        try {
          const additional = await summarizeOlderTurns(
            activeProvider.chat,
            newlyDropped,
            dialect.id,
            dialect.personaName,
            dialect.trait
          );
          conversationSummaryRef.current = conversationSummaryRef.current
            ? `${conversationSummaryRef.current} ${additional}`
            : additional;
          summarizedRawCountRef.current = droppedCount;
        } catch {
          // Best-effort: if summarization fails, proceed without it
          // rather than blocking the actual turn the learner is waiting on.
        }
      }

      const chatPayload = {
        message: text,
        dialect: dialect.id,
        personaName: dialect.personaName,
        personaTrait: dialect.trait,
        history: windowedHistory,
        task: (opts?.speaking ? "speaking" : "chat") as "chat" | "speaking",
        // Language Memory + Adaptive Difficulty: both computed from real
        // logged data (see languageMemoryStore.ts / levelStore.ts), not
        // placeholders - see aiProviders.ts's buildFlatPrompt for how
        // these are used in the prompt.
        knownMistakes: getFrequentMistakes(dialect.id, 3),
        levelHint: computeLevel(dialect.id),
        conversationSummary: conversationSummaryRef.current ?? undefined
      };

      let replyText = "";
      // Streaming preview: only for typed Chat (not Speaking Mode - TTS
      // needs a complete utterance, not a partial sentence) and only when
      // "گیت‌وی" is explicitly selected (not "خودکار"/"روی خود گوشی" -
      // auto's native-first fallback decision happens inside
      // activeProvider.chat() itself and streaming here would bypass it,
      // and native has no streaming Capacitor call to begin with).
      const canStream = !opts?.speaking && providerKey === "gateway";
      let streamedOk = false;
      let liveMsgId: string | null = null;
      if (canStream) {
        try {
          liveMsgId = `b_${Date.now()}`;
          setMessages((prev) => [...prev, { id: liveMsgId!, sender: "companion", text: "", timestamp: new Date().toISOString() }]);
          for await (const chunk of streamGatewayChat(chatPayload)) {
            if (chunk.delta) {
              replyText += chunk.delta;
              const liveText = replyText.split("\n").filter((l) => !l.startsWith("فارسی:") && !l.startsWith("اصلاح:")).join(" ");
              setMessages((prev) => prev.map((m) => (m.id === liveMsgId ? { ...m, text: liveText } : m)));
            }
          }
          streamedOk = replyText.trim().length > 0;
        } catch (streamErr) {
          // Streaming isn't available (older browser, network hiccup mid-
          // stream, etc.) - drop the empty placeholder and fall back to
          // the regular non-streaming call below instead of showing an error.
          if (liveMsgId) setMessages((prev) => prev.filter((m) => m.id !== liveMsgId));
          replyText = "";
        }
      }

      if (!streamedOk) {
        replyText = await activeProvider.chat(chatPayload);
      }

      // Split out our "فارسی: " / "اصلاح: " lines from the main reply so
      // they render as distinct, clearly-labeled parts of the message.
      const lines = replyText.split("\n").filter(Boolean);
      const mainLines = lines.filter((l) => !l.startsWith("فارسی:") && !l.startsWith("اصلاح:"));
      const farsiLine = lines.find((l) => l.startsWith("فارسی:"))?.replace("فارسی:", "").trim();
      const correctionLine = lines.find((l) => l.startsWith("اصلاح:"))?.replace("اصلاح:", "").trim();
      const mainText = mainLines.join(" ");

      // Language Memory: log a real correction (skip the "no correction"
      // marker the prompt asks the model to send when nothing was wrong).
      if (correctionLine && !correctionLine.includes("بدون اصلاح")) {
        logMistake(dialect.id, correctionLine);
        setSessionMistakes((prev) => (prev.includes(correctionLine) ? prev : [...prev, correctionLine]));
      }

      const botMsg: ChatMessage = {
        id: liveMsgId ?? `b_${Date.now()}`,
        sender: "companion",
        text: mainText,
        translation: [farsiLine, correctionLine ? `⚠️ ${correctionLine}` : null].filter(Boolean).join(" — "),
        timestamp: new Date().toISOString()
      };
      setMessages((prev) =>
        streamedOk && liveMsgId
          ? prev.map((m) => (m.id === liveMsgId ? botMsg : m))
          : [...prev, botMsg]
      );
      scrollTimeoutRef.current = setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        scrollTimeoutRef.current = null;
      }, 100);

      if (opts?.speaking && speakingModeRef.current) {
        setSpeakingPhase("speaking");
        playSpeech(
          mainText,
          botMsg.id,
          getLangCode(dialect.id, dialect.lang),
          { pitch: dialect.pitch, rate: dialect.rateMultiplier, voiceHint: dialect.voiceHint },
          () => {
            if (speakingModeRef.current) listenForSpeakingTurn();
          }
        );
      }
    } catch (err: any) {
      setError(err.message || "گفتگو با هوش مصنوعی ناموفق بود.");
      if (opts?.speaking) {
        triggerToast("⚠️ خطا در مکالمه صوتی — حالت مکالمه متوقف شد.");
        setSpeakingMode(false);
      }
    } finally {
      setLoading(false);
    }
  };

  /** One listen turn of Speaking Mode: opens the mic, waits for one
   * finished utterance, and hands it to handleSend(text, {speaking:true}).
   * On no-speech it just listens again; on a harder error it stops
   * Speaking Mode entirely rather than looping forever. */
  const listenForSpeakingTurn = () => {
    const handle = startSpeechRecognition({
      lang: dialect.lang === "english" ? "en-US" : "fa-IR",
      onSpeechStart: () => setSpeakingPhase("listening"),
      onResult: (heard) => {
        if (heard.trim()) {
          setSpeakingPhase("thinking");
          handleSend(heard.trim(), { speaking: true });
        } else if (speakingModeRef.current) {
          listenForSpeakingTurn();
        }
      },
      onError: (_message, isNoSpeech) => {
        if (isNoSpeech && speakingModeRef.current) {
          listenForSpeakingTurn();
        } else if (speakingModeRef.current) {
          triggerToast("⚠️ خطا در تشخیص گفتار — حالت مکالمه صوتی متوقف شد.");
          setSpeakingMode(false);
        }
      },
      onEnd: () => { activeRecognitionRef.current = null; },
    });
    if (!handle) {
      triggerToast("⚠️ حالت مکالمه صوتی روی این دستگاه پشتیبانی نمی‌شود.");
      setSpeakingMode(false);
      return;
    }
    activeRecognitionRef.current = handle;
  };

  const toggleSpeakingMode = () => {
    if (speakingMode) {
      setSpeakingMode(false);
      try { activeRecognitionRef.current?.stop(); } catch {}
      try { (window as any).speechSynthesis?.cancel(); } catch {}
      stopNativeSpeech();
    } else {
      setSpeakingMode(true);
      speakingModeRef.current = true;
      listenForSpeakingTurn();
    }
  };

  const handleVoiceInput = () => {
    const handle = startSpeechRecognition({
      lang: dialect.lang === "english" ? "en-US" : "fa-IR",
      onSpeechStart: () => setRecording(true),
      onResult: (heard) => setInput(heard),
      onError: (message) => triggerToast(message),
      onEnd: () => { setRecording(false); activeRecognitionRef.current = null; },
    });
    if (!handle) {
      triggerToast("⚠️ ورودی صوتی روی این دستگاه پشتیبانی نمی‌شود؛ متن را تایپ کنید.");
      return;
    }
    activeRecognitionRef.current = handle;
  };

  return (
    <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
      <div className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl space-y-3">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#14B8A6]" />
          <span>مکالمه زنده با هوش مصنوعی (Safar AI)</span>
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          با تایپ یا با صدای خودتان با یک همراه هوش مصنوعی به لهجه انتخابی گفتگو کنید — {activeProvider.description}
        </p>
        <div className="flex gap-1.5">
          {providers.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setProviderKey(p.key);
                setPreferredProviderKey(p.key);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
                providerKey === p.key
                  ? "bg-[#14B8A6] text-black border-[#14B8A6]"
                  : "bg-[#090D16] text-[#94A3B8] border-[#1E293B]"
              }`}
            >
              {p.key === "native" ? <Cpu className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
              {p.label}
            </button>
          ))}
        </div>
        {providerKey === "native" && (
          <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-2.5 text-[11px] text-[#94A3B8]">
            {!nativeStatus ? (
              <span>در حال بررسی وضعیت موتور محلی...</span>
            ) : !nativeStatus.available ? (
              <span>⚠️ موتور محلی روی این دستگاه/پلتفرم در دسترس نیست؛ از «گیت‌وی» استفاده کنید.</span>
            ) : nativeStatus.modelLoaded ? (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">✅ مدل بارگذاری‌شده: {nativeStatus.modelPath?.split("/").pop()}</span>
                <button
                  onClick={handleUnloadModel}
                  disabled={nativeBusy !== ""}
                  className="shrink-0 text-red-400 font-bold disabled:opacity-40"
                >
                  {nativeBusy === "unloading" ? "..." : "تخلیه"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span>هنوز مدلی روی دستگاه بارگذاری نشده (فایل GGUF لازم است).</span>
                <button
                  onClick={handlePickModel}
                  disabled={nativeBusy !== ""}
                  className="shrink-0 bg-[#14B8A6] text-black font-black px-2.5 py-1 rounded-lg disabled:opacity-40"
                >
                  {nativeBusy === "importing" ? "در حال وارد کردن..." : "انتخاب مدل"}
                </button>
              </div>
            )}
          </div>
        )}
        {(providerKey === "gateway" || providerKey === "auto") && (
          <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-2.5 space-y-1.5">
            <span className="text-[10px] text-[#94A3B8] block">
              آدرس گیت‌وی محلی شما (مثال: http://192.168.1.10:8787) — روی گوشی نصب‌شده باید دستی تنظیم شود، چون در زمان ساخت APK قابل تشخیص نیست:
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                dir="ltr"
                value={gatewayUrlInput}
                onChange={(e) => { setGatewayUrlInput(e.target.value); setGatewayUrlSaved(false); }}
                placeholder="http://192.168.x.x:8787"
                className="flex-1 bg-[#141C2E] text-[11px] text-[#F8FAFC] border border-[#1E293B] rounded-lg px-2.5 py-1.5 outline-none"
              />
              <button
                onClick={() => { setGatewayBaseUrl(gatewayUrlInput); setGatewayUrlSaved(true); triggerToast("✅ آدرس گیت‌وی ذخیره شد."); }}
                className="shrink-0 bg-[#14B8A6] text-black font-black px-3 py-1.5 rounded-lg text-[10px]"
              >
                {gatewayUrlSaved ? "ذخیره شد ✓" : "ذخیره"}
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {DIALECT_OPTIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => {
                setDialect(d);
                setMessages([]);
                setReport(null);
              }}
              title={d.occupation}
              className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
                dialect.key === d.key
                  ? "bg-[#14B8A6] text-black border-[#14B8A6]"
                  : "bg-[#090D16] text-[#94A3B8] border-[#1E293B]"
              }`}
            >
              {d.avatar} {d.personaName} · {d.label}
            </button>
          ))}
        </div>
        <AccentCoachPanel dialectId={dialect.id} dialectLabel={dialect.label} />
        <ModelManagerPanel providerKey={providerKey} />
      </div>

      <div
        ref={scrollRef}
        className="bg-[#0C101F] border border-[#1E293B] rounded-2xl p-4 h-80 overflow-y-auto space-y-3"
      >
        {messages.length === 0 && (
          <p className="text-xs text-[#94A3B8] text-center py-10">
            {dialect.avatar} با <strong className="text-[#F8FAFC]">{dialect.personaName}</strong> شروع به گفتگو کنید — اولین پیام خود را بنویسید یا با میکروفون بگویید.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs space-y-1 ${
                m.sender === "user"
                  ? "bg-[#1E293B] text-[#F8FAFC]"
                  : "bg-[#14B8A6]/15 border border-[#14B8A6]/30 text-[#F8FAFC]"
              }`}
            >
              {m.sender === "companion" && (
                <p className="text-[9.5px] font-black text-[#14B8A6]">{dialect.avatar} {dialect.personaName}</p>
              )}
              <div className="flex items-center gap-1.5">
                {m.sender === "companion" && (
                  <button
                    onClick={() => playSpeech(m.text, m.id, getLangCode(dialect.id, dialect.lang), { pitch: dialect.pitch, rate: dialect.rateMultiplier, voiceHint: dialect.voiceHint })}
                    className="shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                  </button>
                )}
                <p className="font-bold leading-relaxed">{m.text}</p>
              </div>
              {m.translation && <p className="text-[10px] text-[#94A3B8] border-t border-[#1E293B]/60 pt-1">{m.translation}</p>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-[#14B8A6] justify-end">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>
              {providerKey === "native" || providerKey === "auto"
                ? "در حال پردازش روی خود گوشی — ممکن است بسته به قدرت دستگاه کمی طول بکشد..."
                : "در حال نوشتن پاسخ..."}
            </span>
          </div>
        )}
      </div>

      {sessionMistakes.length >= 2 && !practiceDismissed && (
        <MistakePracticeCard
          dialectId={dialect.id}
          mistakes={sessionMistakes}
          onDismiss={() => setPracticeDismissed(true)}
        />
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Speaking Mode: separate from typed Chat above - once started, the
          learner never taps Send; listen/reply/speak repeats on its own
          until they tap "پایان مکالمه". */}
      <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${speakingMode ? "bg-[#14B8A6]/10 border-[#14B8A6]" : "bg-[#090D16] border-[#1E293B]"}`}>
        <div className="text-xs text-[#F8FAFC] font-bold flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#14B8A6]" />
          {!speakingMode && <span>حالت مکالمه صوتی (Practice Speaking)</span>}
          {speakingMode && speakingPhase === "listening" && <span className="text-[#14B8A6] animate-pulse">🎙️ در حال گوش دادن...</span>}
          {speakingMode && speakingPhase === "thinking" && <span className="text-amber-400">🤔 در حال فکر کردن...</span>}
          {speakingMode && speakingPhase === "speaking" && <span className="text-[#14B8A6]">🔊 در حال صحبت...</span>}
        </div>
        <button
          onClick={toggleSpeakingMode}
          className={`flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg transition-all ${
            speakingMode ? "bg-red-500 text-white" : "bg-[#14B8A6] text-black"
          }`}
        >
          {speakingMode ? <Square className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
          {speakingMode ? "پایان مکالمه" : "شروع مکالمه"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim() || speakingMode}
          className="bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-40 text-black p-3 rounded-xl transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
        <button
          onClick={handleVoiceInput}
          disabled={recording || speakingMode}
          className={`p-3 rounded-xl transition-all disabled:opacity-40 ${recording ? "bg-red-500 text-white animate-pulse" : "bg-[#1E293B] text-[#14B8A6]"}`}
        >
          <Mic className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="پیام خود را بنویسید..."
          disabled={speakingMode}
          className="flex-1 bg-[#090D16] text-xs text-[#F8FAFC] px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none text-right disabled:opacity-40"
          dir="auto"
        />
      </div>

      {messages.filter((m) => m.sender === "user").length > 0 && (
        <button
          onClick={handleGetReport}
          disabled={reportLoading}
          className="w-full bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
        >
          {reportLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>{reportLoading ? "در حال بررسی گفتگو..." : "بررسی و رفع اشکال مکالمه من"}</span>
        </button>
      )}

      {report && (
        <div className="bg-[#141C2E] border border-[#1E293B] rounded-2xl p-4 space-y-3 animate-fadeIn text-right">
          <p className="text-xs text-[#F8FAFC] leading-relaxed">{report.summaryFa}</p>

          {report.strengthsFa.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-black text-emerald-400">✅ نقاط قوت شما:</p>
              <ul className="text-[11px] text-[#94A3B8] space-y-1 list-disc pr-4">
                {report.strengthsFa.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {report.improvementsFa.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-black text-amber-400 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> اشکالات و نکات اصلاحی:</p>
              <ul className="text-[11px] text-[#94A3B8] space-y-1 list-disc pr-4">
                {report.improvementsFa.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {report.newVocabulary.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-black text-[#14B8A6] flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> واژه‌های جدید این گفتگو:</p>
              {report.newVocabulary.map((v, i) => (
                <div key={i} className="bg-[#090D16] p-2 rounded-lg text-[11px] flex justify-between items-center">
                  <span className="text-[#94A3B8]">{v.meaningFa}</span>
                  <span className="text-[#F8FAFC] font-bold">{v.phrase}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Accent Coach: a small collapsible panel of real, curated tips for the
 * currently selected dialect (see accentCoach.ts). Only rendered when tips
 * actually exist for that dialect - no placeholder/empty state pretending
 * to have content it doesn't. */
function AccentCoachPanel({ dialectId, dialectLabel }: { dialectId: string; dialectLabel: string }) {
  const [open, setOpen] = useState(false);
  const tips = getAccentTips(dialectId);
  if (tips.length === 0) return null;

  return (
    <div className="bg-[#090D16] border border-[#1E293B] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-black text-[#F8FAFC]"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#14B8A6]" />
          Accent Coach — نکات لهجه {dialectLabel}
        </span>
        <span className="text-[#94A3B8]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {tips.map((tip, i) => (
            <p key={i} className="text-[11px] text-[#94A3B8] leading-relaxed">
              <span className="font-bold text-[#14B8A6]">{tip.labelFa}: </span>
              {tip.textFa}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Model Manager: shows the real, currently-available model/provider list
 * from server.ts's /api/models (see lib/modelManager.ts) - only fetched
 * when opened, and only meaningful while "گیت‌وی" or "خودکار" is selected
 * (native's own status is already shown above by the native-status panel).
 * Never a hardcoded model name, per the model-agnostic goal. */
function ModelManagerPanel({ providerKey }: { providerKey: AiProviderKey }) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState("");

  if (providerKey === "native") return null;

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && models === null && !loadingModels) {
      setLoadingModels(true);
      setModelsError("");
      listAvailableModels()
        .then(setModels)
        .catch((err: any) => setModelsError(err?.message || "دریافت لیست مدل‌ها ناموفق بود."))
        .finally(() => setLoadingModels(false));
    }
  };

  return (
    <div className="bg-[#090D16] border border-[#1E293B] rounded-xl overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-black text-[#F8FAFC]"
      >
        <span className="flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-[#14B8A6]" />
          مدیریت مدل‌ها (Model Manager)
        </span>
        <span className="text-[#94A3B8]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {loadingModels && <p className="text-[11px] text-[#94A3B8]">در حال دریافت لیست مدل‌ها از گیت‌وی...</p>}
          {modelsError && <p className="text-[11px] text-red-400">⚠️ {modelsError}</p>}
          {!loadingModels && !modelsError && models && models.length === 0 && (
            <p className="text-[11px] text-[#94A3B8]">هیچ مدلی گزارش نشد — گیت‌وی در دسترس نیست؟</p>
          )}
          {!loadingModels && models && models.length > 0 && (
            <div className="space-y-1">
              {models.map((m, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-[11px] bg-[#141C2E] rounded-lg px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="text-[#F8FAFC] font-bold truncate">{m.model}</p>
                    <p className="text-[#94A3B8] text-[10px] truncate">{m.name} · {m.capabilities.join(", ")}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${m.available ? "bg-[#14B8A6]/20 text-[#14B8A6]" : "bg-[#1E293B] text-[#94A3B8]"}`}>
                    {m.available ? "در دسترس" : m.configured ? "خطا/cooldown" : "پیکربندی نشده"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Quiz-into-learning-loop: appears once this session has 2+ real logged
 * mistakes, offering a short quiz built specifically from them (see
 * mistakePractice.ts) instead of Quiz being a separate, disconnected
 * feature. QuizTab.tsx (generic category/level quizzes) is unchanged and
 * still available from "بیشتر" for open-ended practice.
 */
function MistakePracticeCard({
  dialectId,
  mistakes,
  onDismiss
}: {
  dialectId: string;
  mistakes: string[];
  onDismiss: () => void;
}) {
  const [status, setStatus] = useState<"prompt" | "loading" | "error" | "ready" | "done">("prompt");
  const [questions, setQuestions] = useState<MistakeQuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const start = async () => {
    setStatus("loading");
    try {
      const qs = await generateMistakePractice(dialectId, mistakes);
      if (qs.length === 0) throw new Error("empty");
      setQuestions(qs);
      setIdx(0);
      setSelected(null);
      setCorrectCount(0);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  if (status === "prompt") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-amber-300 font-bold">
          امروز {mistakes.length} اشتباه داشتی؛ می‌خوای همین‌ها رو تمرین کنی؟
        </p>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={start} className="text-[11px] font-black bg-amber-400 text-black px-2.5 py-1.5 rounded-lg">تمرین کن</button>
          <button onClick={onDismiss} className="text-[11px] font-black text-[#94A3B8] px-2 py-1.5">بعداً</button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-3 text-[11px] text-[#94A3B8]">در حال ساخت تمرین بر اساس اشتباهات تو...</div>;
  }

  if (status === "error") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-red-400">⚠️ ساخت تمرین ناموفق بود.</p>
        <button onClick={onDismiss} className="text-[11px] font-black text-[#94A3B8]">بستن</button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 rounded-xl p-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-[#14B8A6] font-bold">
          نتیجه: {correctCount} از {questions.length} درست — همین‌ها رو دوباره در مکالمه بعدی حواست باشه.
        </p>
        <button onClick={onDismiss} className="text-[11px] font-black text-[#94A3B8]">بستن</button>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;

  return (
    <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-3 space-y-2">
      <p className="text-[11px] text-[#94A3B8]">تمرین اشتباهات ({idx + 1}/{questions.length})</p>
      <p className="text-xs text-[#F8FAFC] font-bold">{q.question}</p>
      <div className="space-y-1">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answerIndex;
          const isPicked = selected === i;
          const showState = selected !== null;
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => {
                setSelected(i);
                if (isCorrect) setCorrectCount((c) => c + 1);
              }}
              className={`w-full text-right text-[11px] px-2.5 py-1.5 rounded-lg border ${
                showState && isCorrect ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6]" :
                showState && isPicked ? "bg-red-500/20 border-red-500 text-red-400" :
                "bg-[#141C2E] border-[#1E293B] text-[#F8FAFC]"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-[#94A3B8]">{q.explanation}</p>
          <button
            onClick={() => {
              if (idx + 1 < questions.length) {
                setIdx((i) => i + 1);
                setSelected(null);
              } else {
                setStatus("done");
              }
            }}
            className="shrink-0 text-[11px] font-black bg-[#14B8A6] text-black px-2.5 py-1 rounded-lg"
          >
            {idx + 1 < questions.length ? "بعدی" : "پایان"}
          </button>
        </div>
      )}
    </div>
  );
}
