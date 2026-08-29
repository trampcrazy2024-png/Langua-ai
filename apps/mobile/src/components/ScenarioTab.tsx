import React, { useState, useRef } from "react";
import {
  Send, Mic, Volume2, RefreshCw, Users,
  CheckCircle2, Lightbulb, BookOpen, ArrowRight
} from "lucide-react";
import { ChatMessage } from "../types";
import { SCENARIOS, PERSONAS, getLangCode, ScenarioDef, Persona } from "../data";
import { apiFetch } from "../lib/net";
import { startSpeechRecognition } from "../lib/nativeSpeech";

interface ScenarioTabProps {
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }) => void;
  triggerToast: (msg: string) => void;
  offlineMode: boolean;
}

interface ScenarioReport {
  objectiveAchieved: boolean;
  summaryFa: string;
  strengthsFa: string[];
  improvementsFa: string[];
  newVocabulary: { phrase: string; meaningFa: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  travel: "سفر",
  business: "کاری",
  social: "اجتماعی",
  emergency: "اضطراری",
  daily: "روزمره"
};

export default function ScenarioTab({ playSpeech, triggerToast, offlineMode }: ScenarioTabProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDef | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState<ScenarioReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * Bug fix (memory/resource leak): same pattern fixed in ChatTab.tsx /
   * TranslatorTab.tsx / PodcastTab.tsx / MatrixTab.tsx.
   */
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeRecognitionRef = useRef<any>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      try { activeRecognitionRef.current?.stop(); } catch {}
      activeStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startScenario = async () => {
    if (!selectedScenario) return;
    if (offlineMode) {
      triggerToast("⚠️ حالت پرواز فعال است. برای اجرای سناریو آن را غیرفعال کنید.");
      return;
    }
    setMessages([]);
    setReport(null);
    setLoading(true);
    try {
      // Bug fix: was a raw fetch("/api/chat", ...) with a hardcoded
      // same-origin path - see the note in OcrTab.tsx.
      const data = await apiFetch<any>("/api/chat", {
        method: "POST",
        body: {
          message: "(شروع سناریو — لطفاً به‌عنوان شخصیت نقش، اولین جمله را بگویید)",
          dialect: selectedPersona.id,
          personaName: selectedPersona.personaName,
          personaTrait: selectedPersona.trait,
          personaOccupation: selectedPersona.occupation,
          scenario: {
            titleFa: selectedScenario.titleFa,
            location: selectedScenario.location,
            objectiveFa: selectedScenario.objectiveFa
          },
          history: []
        }
      });
      const { text, done } = stripCompletionMarker(data.response || "");
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: "companion",
        text: extractMain(text),
        translation: extractFarsi(text),
        timestamp: new Date().toISOString()
      };
      setMessages([botMsg]);
      if (done) triggerToast("🎉 هدف سناریو محقق شد! می‌توانید گزارش پایانی را بگیرید.");
    } catch {
      triggerToast("⚠️ شروع سناریو ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || !selectedScenario) return;
    if (offlineMode) {
      triggerToast("⚠️ حالت پرواز فعال است.");
      return;
    }
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, sender: "user", text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      // Bug fix: was a raw fetch("/api/chat", ...) with a hardcoded
      // same-origin path.
      const data = await apiFetch<any>("/api/chat", {
        method: "POST",
        body: {
          message: text,
          dialect: selectedPersona.id,
          personaName: selectedPersona.personaName,
          personaTrait: selectedPersona.trait,
          personaOccupation: selectedPersona.occupation,
          scenario: {
            titleFa: selectedScenario.titleFa,
            location: selectedScenario.location,
            objectiveFa: selectedScenario.objectiveFa
          },
          history: newMessages.map((m) => ({ sender: m.sender, text: m.text }))
        }
      });
      const { text: replyRaw, done } = stripCompletionMarker(data.response || "");
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: "companion",
        text: extractMain(replyRaw),
        translation: extractFarsi(replyRaw),
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, botMsg]);
      if (done) triggerToast("🎉 هدف سناریو محقق شد! می‌توانید گزارش پایانی را بگیرید.");
      scrollTimeoutRef.current = setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        scrollTimeoutRef.current = null;
      }, 100);
    } catch {
      triggerToast("⚠️ ارسال پیام ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const handle = startSpeechRecognition({
      lang: selectedPersona.lang === "english" ? "en-US" : "fa-IR",
      onSpeechStart: () => setRecording(true),
      onResult: (heard) => setInput(heard),
      onError: (message) => triggerToast(message),
      onEnd: () => { setRecording(false); activeRecognitionRef.current = null; },
    });
    if (!handle) {
      triggerToast("⚠️ ورودی صوتی روی این دستگاه پشتیبانی نمی‌شود.");
      return;
    }
    activeRecognitionRef.current = handle;
  };

  const finishScenario = async () => {
    if (!selectedScenario || messages.filter((m) => m.sender === "user").length === 0) {
      triggerToast("هنوز چیزی برای گزارش‌گیری وجود ندارد؛ چند پیام رد‌وبدل کنید.");
      return;
    }
    setReportLoading(true);
    try {
      // Bug fix: was a raw fetch("/api/scenario-report", ...) with a
      // hardcoded same-origin path.
      const data = await apiFetch<ScenarioReport>("/api/scenario-report", {
        method: "POST",
        body: {
          transcript: messages.map((m) => ({ sender: m.sender, text: m.text })),
          scenarioTitle: selectedScenario.titleFa,
          objectiveFa: selectedScenario.objectiveFa,
          dialect: selectedPersona.id
        }
      });
      setReport(data);
    } catch {
      triggerToast("⚠️ ساخت گزارش ناموفق بود؛ اتصال اینترنت را بررسی کنید.");
    } finally {
      setReportLoading(false);
    }
  };

  // ---- Scenario/persona picker screen ----
  if (!selectedScenario) {
    return (
      <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
        <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-3">
          <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#14B8A6]" />
            <span>حالت سناریوی نقش‌آفرینی واقعی</span>
          </h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            یک موقعیت واقعی را انتخاب کنید و شخصیت هوش مصنوعی با شما وارد یک مکالمه واقعی و زنده می‌شود (چک‌این فرودگاه، رستوران، تاکسی و...). در پایان یک گزارش واقعی از روی متن مکالمه خودتان دریافت می‌کنید — نه امتیاز ساختگی.
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-[#F8FAFC]">۱. شخصیت / لهجه:</span>
          <div className="flex flex-wrap gap-1.5">
            {PERSONAS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPersona(p)}
                title={p.occupation}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  selectedPersona.key === p.key ? "bg-[#14B8A6] text-black border-[#14B8A6]" : "bg-[#090D16] text-[#F8FAFC] border-[#1E293B]"
                }`}
              >
                {p.avatar} {p.personaName} · {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-[#F8FAFC]">۲. یک موقعیت انتخاب کنید:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenario(s)}
                className="bg-[#141C2E] border border-[#1E293B] hover:border-[#14B8A6]/50 rounded-xl p-3.5 text-right transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] bg-[#090D16] text-[#94A3B8] px-2 py-0.5 rounded">{CATEGORY_LABELS[s.category]}</span>
                  <span className="text-xl">{s.icon}</span>
                </div>
                <p className="text-sm font-black text-[#F8FAFC]">{s.titleFa}</p>
                <p className="text-[10px] text-[#94A3B8] mt-1">{s.location}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- Active scenario / chat screen ----
  return (
    <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
      <div className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedScenario(null); setMessages([]); setReport(null); }} className="text-[11px] text-[#94A3B8] flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>تغییر سناریو</span>
          </button>
          <span className="text-xs font-black text-[#14B8A6]">{selectedScenario.icon} {selectedScenario.titleFa}</span>
        </div>
        <p className="text-[11px] text-[#94A3B8]">🎯 هدف شما: {selectedScenario.objectiveFa}</p>
        <p className="text-[10px] text-[#94A3B8]">شخصیت: {selectedPersona.avatar} {selectedPersona.personaName} ({selectedPersona.label}) — 📍 {selectedScenario.location}</p>
      </div>

      {messages.length === 0 ? (
        <button
          onClick={startScenario}
          disabled={loading}
          className="w-full bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          <span>{loading ? "در حال شروع..." : "شروع سناریو"}</span>
        </button>
      ) : (
        <>
          <div ref={scrollRef} className="bg-[#0C101F] border border-[#1E293B] rounded-2xl p-4 h-72 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs space-y-1 ${
                  m.sender === "user" ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-[#14B8A6]/15 border border-[#14B8A6]/30 text-[#F8FAFC]"
                }`}>
                  {m.sender === "companion" && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => playSpeech(m.text, m.id, getLangCode(selectedPersona.id, selectedPersona.lang), { pitch: selectedPersona.pitch, rate: selectedPersona.rateMultiplier, voiceHint: selectedPersona.voiceHint })} className="shrink-0">
                        <Volume2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                      </button>
                      <p className="font-bold leading-relaxed">{m.text}</p>
                    </div>
                  )}
                  {m.sender === "user" && <p className="font-bold leading-relaxed">{m.text}</p>}
                  {m.translation && <p className="text-[10px] text-[#94A3B8] border-t border-[#1E293B]/60 pt-1">{m.translation}</p>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-[#14B8A6] justify-end">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>در حال نوشتن پاسخ...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-40 text-black p-3 rounded-xl">
              <Send className="w-4 h-4" />
            </button>
            <button onClick={handleVoiceInput} disabled={recording} className={`p-3 rounded-xl ${recording ? "bg-red-500 text-white animate-pulse" : "bg-[#1E293B] text-[#14B8A6]"}`}>
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="پاسخ خود را بنویسید..."
              className="flex-1 bg-[#090D16] text-xs text-[#F8FAFC] px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none text-right"
              dir="auto"
            />
          </div>

          <button
            onClick={finishScenario}
            disabled={reportLoading}
            className="w-full bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            {reportLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{reportLoading ? "در حال ساخت گزارش..." : "پایان سناریو و دریافت گزارش واقعی"}</span>
          </button>
        </>
      )}

      {report && (
        <div className="bg-[#141C2E] border border-[#1E293B] rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className={`flex items-center gap-2 p-2.5 rounded-lg ${report.objectiveAchieved ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black">{report.objectiveAchieved ? "هدف سناریو محقق شد ✅" : "هدف کاملاً محقق نشد — بازم تمرین کنید"}</span>
          </div>
          <p className="text-xs text-[#F8FAFC] leading-relaxed">{report.summaryFa}</p>

          {report.strengthsFa.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-black text-emerald-400">✅ نقاط قوت:</p>
              <ul className="text-[11px] text-[#94A3B8] space-y-1 list-disc pr-4">
                {report.strengthsFa.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {report.improvementsFa.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-black text-amber-400 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> برای بهتر شدن:</p>
              <ul className="text-[11px] text-[#94A3B8] space-y-1 list-disc pr-4">
                {report.improvementsFa.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {report.newVocabulary.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-black text-[#14B8A6] flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> واژه‌های جدید این مکالمه:</p>
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

// The [OBJECTIVE_COMPLETE] marker is a plain-text convention agreed with the
// server prompt — parsed here, never shown to the user.
function stripCompletionMarker(raw: string): { text: string; done: boolean } {
  const done = raw.includes("[OBJECTIVE_COMPLETE]");
  return { text: raw.replace("[OBJECTIVE_COMPLETE]", "").trim(), done };
}

function extractMain(raw: string): string {
  return raw
    .split("\n")
    .filter((l) => !l.startsWith("فارسی:") && !l.startsWith("اصلاح:"))
    .join(" ")
    .trim();
}

function extractFarsi(raw: string): string {
  const lines = raw.split("\n");
  const farsi = lines.find((l) => l.startsWith("فارسی:"))?.replace("فارسی:", "").trim();
  const correction = lines.find((l) => l.startsWith("اصلاح:"))?.replace("اصلاح:", "").trim();
  return [farsi, correction ? `⚠️ ${correction}` : null].filter(Boolean).join(" — ");
}
