import React, { useState, useMemo } from "react";
import { 
  Compass, Search, Volume2, Star, CheckCircle, Play, Pause, 
  MapPin, Mic, Phone, ShieldAlert, AlertCircle, 
  Sparkles, MessageSquare, ChevronRight, HelpCircle, 
  Clock, Shield, Landmark, BookOpen, Key, Heart, ListPlus, Send
} from "lucide-react";
import { downloadBackup, restoreBackup } from "../backupStore";
import { downloadOfflineModel, isOfflineModelDownloaded, deleteOfflineModel } from "../offlineAsr";

export interface Feature {
  id: number;
  nameEn: string;
  nameFa: string;
  category: string;
  desc: string;
}

export const FEATURES: Feature[] = [
  { id: 1, nameEn: "Instant Offline Search", nameFa: "جستجوی آنی و آفلاین", category: "Core", desc: "Instant search across the entire local phrase library, fully offline. جستجوی آنی و آفلاین" },
  { id: 2, nameEn: "Dialect Comparison", nameFa: "مقایسه لهجه‌ها", category: "Core", desc: "See the same Farsi phrase across all 6 dialects with real audio (now in the Compare tab). مقایسه لهجه‌ها" },
  { id: 3, nameEn: "Location smart phrase suggestions", nameFa: "پیشنهاد بر اساس موقعیت", category: "Core", desc: "Common phrases and contextual assistance for a location type you pick (not live GPS). پیشنهاد بر اساس موقعیت" },
  { id: 4, nameEn: "Real Mic Recording & Speech Recognition", nameFa: "ضبط واقعی صدا و تشخیص گفتار", category: "Core", desc: "Real microphone recording with a live Web Audio input-level meter and browser-based speech-to-text when supported. ضبط واقعی صدا و تشخیص گفتار" },
  { id: 5, nameEn: "Shadowing Fluency Trainer", nameFa: "آموزش سایه‌زنی تلفظ", category: "Core", desc: "Listen to native audio, record your real voice, and play both back to compare. آموزش سایه‌زنی تلفظ" },
  { id: 11, nameEn: "Sign Camera Translation", nameFa: "مترجم تصویری منو و تابلو", category: "AI/OCR", desc: "Use camera lens to transcribe and translate menus, books, and public signs on the go. مترجم تصویری" },
  { id: 12, nameEn: "Handwriting Recognition", nameFa: "تشخیص دستخط محلی", category: "AI/OCR", desc: "Utilizes custom neural filters to read and parse cursive handwritten Arabic script. تشخیص دستخط محلی" },
  { id: 13, nameEn: "Visual Object Spotting", nameFa: "تشخیص اشیا با دوربین", category: "AI/OCR", desc: "Identifies local objects using mobile lens and displays their dialect translations. تشخیص اشیا با دوربین" },
  { id: 25, nameEn: "Loud Voice SOS Megaphone", nameFa: "مگافون صوتی هشدار دهنده", category: "Safety", desc: "Blasts extreme voice loops in regional slang ('Stop!', 'Help!', 'Fire!') on speaker. مگافون صوتی هشدار دهنده" },
  { id: 41, nameEn: "Full Offline Flight Sandbox", nameFa: "حالت آفلاین و ذخیره باتری", category: "Offline", desc: "Turns off all AI/network calls and runs 100% from local on-device data. حالت آفلاین" },
  { id: 45, nameEn: "Offline Vocab Puzzles", nameFa: "بازی‌های انفرادی واژگان", category: "Fun", desc: "Word matches, memory cards, and speed tests designed for flights and transit zones. بازی‌های انفرادی واژگان" },
  { id: 46, nameEn: "Dialect Lingo Quiz", nameFa: "تست گویش‌شناسی", category: "Fun", desc: "Test your knowledge on regional idioms and cultural etiquette. تست گویش‌شناسی" },
  { id: 53, nameEn: "Narrative Cultural Podcasts", nameFa: "پادکست‌های داستانی فرهنگی", category: "Edu", desc: "Authentic stories told by locals detailing history, landmarks, and cultural guidelines. پادکست‌های داستانی فرهنگی" },
  { id: 62, nameEn: "Custom Packing Checklist", nameFa: "چک‌لیست بسته‌بندی شخصی", category: "Planner", desc: "A simple editable packing checklist you fill in yourself. چک‌لیست بسته‌بندی شخصی" },
  { id: 71, nameEn: "Backup & Restore", nameFa: "پشتیبان‌گیری و بازیابی", category: "Data", desc: "Export your favorites, custom phrases, and SRS progress as a real JSON file, and restore it anytime. پشتیبان‌گیری و بازیابی" },
  { id: 72, nameEn: "Offline English Speech Recognition", nameFa: "تشخیص گفتار آفلاین انگلیسی", category: "Data", desc: "Download a real ~40MB on-device English speech model (Vosk) once, then recognize English speech with zero internet. Arabic dialects don't have a small enough real model yet — explained inside. تشخیص گفتار آفلاین انگلیسی" }
];

interface MatrixTabProps {
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }) => void;
  triggerToast: (msg: string) => void;
  allPhrases: any[];
  setActiveTab: (tab: string) => void;
  offlineMode: boolean;
  setOfflineMode: (mode: boolean) => void;
}

export default function MatrixTab({
  playSpeech,
  triggerToast,
  allPhrases,
  setActiveTab,
  offlineMode,
  setOfflineMode
}: MatrixTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // CATEGORIES LIST matching MainActivity
  const categories = ["All", "Core", "AI/OCR", "Safety", "Social", "Offline", "Fun", "Edu", "Planner"];

  // FILTERED FEATURES
  const filteredFeatures = useMemo(() => {
    return FEATURES.filter(feat => {
      const matchCat = selectedCategory === "All" || feat.category === selectedCategory;
      const matchQuery = searchQuery.trim() === "" || 
        feat.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feat.nameFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feat.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // FEATURE SANDBOX STATES
  // FTS5 Search Sandbox
  const [ftsQuery, setFtsQuery] = useState("");
  const [ftsTime, setFtsTime] = useState<number | null>(null);
  const ftsResults = useMemo(() => {
    if (!ftsQuery.trim()) return [];
    const start = performance.now();
    const query = ftsQuery.trim().toLowerCase();
    const res = allPhrases.filter(p => 
      p.arabic.toLowerCase().includes(query) ||
      p.farsi.toLowerCase().includes(query) ||
      (p.english && p.english.toLowerCase().includes(query)) ||
      p.arabicPhonetic.toLowerCase().includes(query)
    ).slice(0, 15);
    const end = performance.now();
    setFtsTime(parseFloat((end - start).toFixed(3)));
    return res;
  }, [ftsQuery, allPhrases]);

  // Backup & Restore
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = restoreBackup(String(reader.result));
      if (result.ok) {
        setRestoreMsg({ ok: true, text: `✅ بازیابی موفق (${result.restoredKeys.length} بخش) — صفحه را رفرش کنید تا اعمال شود.` });
        triggerToast("✅ بازیابی از فایل پشتیبان با موفقیت انجام شد.");
      } else {
        setRestoreMsg({ ok: false, text: result.error || "بازیابی ناموفق بود." });
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) backupFileInputRef.current.value = "";
  };

  // Offline English speech recognition (real Vosk model download)
  const [asrDownloaded, setAsrDownloaded] = useState(false);
  const [asrDownloading, setAsrDownloading] = useState(false);
  const [asrProgress, setAsrProgress] = useState(0);
  const [asrError, setAsrError] = useState<string | null>(null);

  React.useEffect(() => {
    isOfflineModelDownloaded().then(setAsrDownloaded);
  }, []);

  const handleDownloadOfflineModel = async () => {
    setAsrDownloading(true);
    setAsrError(null);
    setAsrProgress(0);
    try {
      await downloadOfflineModel((percent) => setAsrProgress(percent));
      setAsrDownloaded(true);
      triggerToast("✅ بسته آفلاین انگلیسی با موفقیت دانلود شد.");
    } catch (err: any) {
      setAsrError(err?.message || "دانلود ناموفق بود؛ اتصال اینترنت را بررسی کنید.");
    } finally {
      setAsrDownloading(false);
    }
  };

  const handleDeleteOfflineModel = async () => {
    await deleteOfflineModel();
    setAsrDownloaded(false);
    triggerToast("🗑️ بسته آفلاین حذف شد.");
  };

  // GPS Location Sandbox
  const [gpsLocation, setGpsLocation] = useState("Najaf Checkpoint");
  const [gpsSimulating, setGpsSimulating] = useState(false);
  const locationPhrases: Record<string, { coords: string; tips: string; phrases: string[] }> = {
    "Najaf Checkpoint": {
      coords: "32.0255° N, 44.3483° E",
      tips: "مناسب برای ایست‌بازرسی‌ها و ورودی‌های عتبات عالیات در عراق",
      phrases: ["وين الكي بي وباب الدخول؟ (ورودی کجاست؟)", "تفضل باسبورت مالي فدوة. (بفرمایید پاسپورت من)", "أنا زائر من إيران. (من زائر از ایران هستم)"]
    },
    "Riyadh Airport Terminal": {
      coords: "24.9576° N, 46.6988° E",
      tips: "لهجه روان خلیجی سعودی برای گمرک و تاکسی فرودگاه",
      phrases: ["وين موقف التكاسي تكفى؟ (ایستگاه تاکسی کجاست؟)", "أبي أروح الفندق في وسط الرياض. (می‌خوام برم هتل مرکز شهر)", "بكم المشوار لو سمحت؟ (هزینه مسیر چقدر میشه؟)"]
    },
    "Damascus Old Souq": {
      coords: "33.5102° N, 36.3072° E",
      tips: "لهجه شامی شیرین برای خرید و چانه‌زنی سنتی",
      phrases: ["أديش سعر هاد الفستان يا غالي؟ (قیمت این لباس چنده؟)", "عملنا راعينا بالسعر تكرم عينك. (به ما تخفیف بده فدات)", "هاد غالي كتير هون. (اینجا خیلی گرونه)"]
    },
    "Cairo Al-Azhar District": {
      coords: "30.0469° N, 31.2625° E",
      tips: "لهجه شیرین و پرانرژی مصری برای غذا و گردش",
      phrases: ["عايز أروح الحسين لو سمحت. (می‌خوام برم منطقه الحسین)", "فين أقرب مطعم كشري بلدي؟ (نزدیک‌ترین رستوران کشری کجاست؟)", "أهلاً يا باشا، نورت الدنيا! (خوش آمدید قربان)"]
    }
  };

  // Real microphone recorder shared by both the "voice recognition" and
  // "shadowing" panels below. No fake timers, no Math.random() results —
  // this actually asks for mic permission and records/plays back real audio.
  const voskMediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const voskChunksRef = React.useRef<Blob[]>([]);
  const [voskRecording, setVoskRecording] = useState(false);
  const [voskTranscript, setVoskTranscript] = useState("");
  const [voskConfidence, setVoskConfidence] = useState<number | null>(null);
  const [voskAudioUrl, setVoskAudioUrl] = useState<string | null>(null);
  const [voskError, setVoskError] = useState<string | null>(null);
  const voskRecognitionRef = React.useRef<any>(null);

  // Real input-level meter using the actual Web Audio API (AnalyserNode) —
  // this reads real microphone amplitude every animation frame, not a CSS
  // animation pretending to react to sound.
  const [voskLevel, setVoskLevel] = useState(0); // 0-100, real RMS level
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const levelFrameRef = React.useRef<number | null>(null);

  const startLevelMeter = (stream: MediaStream, onAutoStop?: () => void) => {
    const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx: AudioContext = new AudioContextCtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    // Real Voice Activity Detection: we only start "watching for silence"
    // once real speech was actually detected (level above threshold), then
    // auto-stop after a real sustained quiet period — using the same RMS
    // values as the visible meter, not a separate fake timer.
    const SPEECH_THRESHOLD = 12;
    const SILENCE_STOP_MS = 1400;
    const MIN_RECORDING_MS = 900;
    let hasDetectedSpeech = false;
    let silenceStartedAt: number | null = null;
    const recordingStartedAt = performance.now();

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      // Real RMS (root-mean-square) amplitude — a standard, real way to
      // measure how loud the actual captured audio is right now.
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      const level = Math.min(100, Math.round(rms * 220));
      setVoskLevel(level);

      if (onAutoStop) {
        const elapsed = performance.now() - recordingStartedAt;
        if (level > SPEECH_THRESHOLD) {
          hasDetectedSpeech = true;
          silenceStartedAt = null;
        } else if (hasDetectedSpeech && elapsed > MIN_RECORDING_MS) {
          if (silenceStartedAt === null) silenceStartedAt = performance.now();
          else if (performance.now() - silenceStartedAt > SILENCE_STOP_MS) {
            onAutoStop();
            return; // stop scheduling further frames; stopLevelMeter() will cancel
          }
        }
      }
      levelFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopLevelMeter = () => {
    if (levelFrameRef.current) cancelAnimationFrame(levelFrameRef.current);
    levelFrameRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setVoskLevel(0);
  };

  const handleStartVosk = async () => {
    setVoskError(null);
    setVoskTranscript("");
    setVoskConfidence(null);
    setVoskAudioUrl(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoskError("مرورگر یا دستگاه شما دسترسی به میکروفون را پشتیبانی نمی‌کند.");
      triggerToast("⚠️ دسترسی به میکروفون در این مرورگر ممکن نیست.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voskMediaRecorderRef.current = recorder;
      voskChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) voskChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(voskChunksRef.current, { type: "audio/webm" });
        setVoskAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        stopLevelMeter();
      };
      recorder.start();
      setVoskRecording(true);

      // Real (not simulated) speech-to-text, using the browser's built-in
      // engine when available. Honesty note: this requires an internet
      // connection on most Android browsers — it is NOT a bundled offline
      // model, unlike the old "Vosk" label implied.
      const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "ar-SA";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          setVoskTranscript(transcript);
          if (typeof confidence === "number" && !Number.isNaN(confidence)) {
            setVoskConfidence(parseFloat((confidence * 100).toFixed(1)));
          }
        };
        recognition.onerror = () => {
          setVoskError("تشخیص گفتار موفق نشد؛ صدای ضبط‌شده شما را می‌توانید پخش کنید.");
        };
        recognition.start();
        voskRecognitionRef.current = recognition;
      }

      const stopEverything = (reason: "vad" | "timeout") => {
        if (voskMediaRecorderRef.current && voskMediaRecorderRef.current.state !== "inactive") {
          voskMediaRecorderRef.current.stop();
        }
        if (voskRecognitionRef.current) {
          try { voskRecognitionRef.current.stop(); } catch {}
        }
        setVoskRecording(false);
        triggerToast(
          reason === "vad"
            ? "🤫 سکوت واقعی تشخیص داده شد، ضبط خودکار متوقف شد."
            : "ضبط پایان یافت. صدای خودتان را پخش کنید یا متن تشخیص‌داده‌شده را بررسی کنید."
        );
      };

      // Start the real level meter with real Voice-Activity auto-stop: once
      // actual speech was detected and then real silence follows, we stop
      // automatically instead of forcing a fixed wait.
      startLevelMeter(stream, () => stopEverything("vad"));

      // Safety-net timeout in case VAD never triggers (e.g. continuous
      // background noise) so the recording never runs forever.
      setTimeout(() => stopEverything("timeout"), 10000);
    } catch (err) {
      setVoskError("اجازه دسترسی به میکروفون داده نشد.");
      triggerToast("⚠️ دسترسی به میکروفون رد شد.");
      setVoskRecording(false);
    }
  };

  // Shadowing Trainer — real recording + real playback of the user's own
  // voice next to the native speaker's audio. We deliberately do NOT fabricate
  // a pronunciation-accuracy percentage: scoring pronunciation accuracy
  // reliably needs a real phonetic-comparison model (a real future feature,
  // not a random number), so here we just let the user compare by ear.
  const shadowMediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const shadowChunksRef = React.useRef<Blob[]>([]);
  const [shadowRecording, setShadowRecording] = useState(false);
  const [shadowAudioUrl, setShadowAudioUrl] = useState<string | null>(null);
  const [shadowError, setShadowError] = useState<string | null>(null);

  /*
   * Bug fix (memory/resource leak): none of the recording paths above
   * were stopped on unmount. If the user switches away from this tab
   * while Vosk or Shadowing recording is in progress, the microphone
   * stream, the AudioContext, and the requestAnimationFrame level-meter
   * loop all kept running indefinitely in the background - React
   * unmounting the component does not stop any of these on its own.
   */
  React.useEffect(() => {
    return () => {
      if (levelFrameRef.current) cancelAnimationFrame(levelFrameRef.current);
      audioCtxRef.current?.close().catch(() => {});
      if (voskMediaRecorderRef.current && voskMediaRecorderRef.current.state !== "inactive") {
        try { voskMediaRecorderRef.current.stop(); } catch {}
      }
      if (voskRecognitionRef.current) {
        try { voskRecognitionRef.current.stop(); } catch {}
      }
      if (shadowMediaRecorderRef.current && shadowMediaRecorderRef.current.state !== "inactive") {
        try { shadowMediaRecorderRef.current.stop(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartShadow = async () => {
    setShadowError(null);
    setShadowAudioUrl(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setShadowError("مرورگر یا دستگاه شما دسترسی به میکروفون را پشتیبانی نمی‌کند.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      shadowMediaRecorderRef.current = recorder;
      shadowChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) shadowChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(shadowChunksRef.current, { type: "audio/webm" });
        setShadowAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setShadowRecording(true);
      setTimeout(() => {
        if (shadowMediaRecorderRef.current && shadowMediaRecorderRef.current.state !== "inactive") {
          shadowMediaRecorderRef.current.stop();
        }
        setShadowRecording(false);
        triggerToast("صدای شما ضبط شد؛ آن را پخش کنید و با گوینده بومی مقایسه کنید.");
      }, 5000);
    } catch (err) {
      setShadowError("اجازه دسترسی به میکروفون داده نشد.");
      setShadowRecording(false);
    }
  };

  // Offline Puzzles
  const [puzzleSelectedArabic, setPuzzleSelectedArabic] = useState<string | null>(null);
  const [puzzlePairs, setPuzzlePairs] = useState([
    { ar: "شلونك عيني؟", fa: "حالت چطوره فدات؟", matched: false },
    { ar: "أبي أروح الفندق", fa: "می‌خوام برم هتل", matched: false },
    { ar: "بكم هذا فدوة؟", fa: "قیمت این چنده قربان؟", matched: false },
    { ar: "مع السلامة", fa: "خدا به همراهت / خداحافظ", matched: false }
  ]);
  const handlePuzzleSelect = (type: "ar" | "fa", text: string) => {
    if (type === "ar") {
      setPuzzleSelectedArabic(text);
    } else {
      if (!puzzleSelectedArabic) {
        triggerToast("ابتدا عبارت عربی را انتخاب کنید!");
        return;
      }
      // Check match
      const correct = puzzlePairs.find(p => p.ar === puzzleSelectedArabic && p.fa === text);
      if (correct) {
        setPuzzlePairs(prev => prev.map(p => p.ar === puzzleSelectedArabic ? { ...p, matched: true } : p));
        setPuzzleSelectedArabic(null);
        triggerToast("🎉 تطابق کاملاً درست بود!");
      } else {
        triggerToast("❌ تطابق نادرست، دوباره تلاش کنید.");
        setPuzzleSelectedArabic(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TRIGGERED FEATURE ALERT BOX - MATCHING SCREENSHOTS EXACTLY */}
      {selectedFeature && (
        <div className="bg-[#14B8A6]/10 border border-[#14B8A6] rounded-xl p-5 relative animate-fadeIn">
          <button 
            onClick={() => setSelectedFeature(null)}
            className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#14B8A6]/20 text-[#14B8A6] mt-0.5">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-left flex-1 pr-6">
              <p className="text-[10px] text-[#14B8A6] font-extrabold tracking-widest">TRIGGERED FEATURE #{selectedFeature.id}</p>
              <h3 className="text-sm font-extrabold text-[#F8FAFC]">{selectedFeature.nameEn} ({selectedFeature.nameFa})</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{selectedFeature.desc}</p>
            </div>
          </div>

          {/* DYNAMIC BESPOKE FEATURE SANDBOX AREA */}
          <div className="mt-5 pt-5 border-t border-[#1E293B]/60 text-right" dir="rtl">
            <p className="text-[10px] text-[#14B8A6] font-bold mb-3">🛠️ شبیه‌ساز زنده و محیط تعاملی قابلیت فعال شده:</p>
            
            {/* Feature 1 Sandbox: FTS5 Search Engine */}
            {selectedFeature.id === 1 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn">
                <div className="relative">
                  <input 
                    type="text"
                    value={ftsQuery}
                    onChange={(e) => setFtsQuery(e.target.value)}
                    placeholder="کلمه‌ای برای جستجو تایپ کنید (مثلاً: سلام، کجاست، قیمت)..."
                    className="w-full bg-[#141C2E] text-sm text-[#F8FAFC] px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none"
                  />
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                </div>
                {ftsQuery.trim() && (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px] text-[#94A3B8] px-1">
                      <span>جستجوی واقعی در {allPhrases.length} عبارت ذخیره‌شده روی گوشی (کاملاً آفلاین)</span>
                      <span className="text-[#14B8A6] font-mono">زمان پاسخ: {ftsTime} میلی‌ثانیه</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {ftsResults.length > 0 ? ftsResults.map((p, idx) => (
                        <div key={idx} className="bg-[#141C2E] p-3 rounded-lg border border-[#1E293B] flex justify-between items-center text-xs">
                          <div className="text-right space-y-1">
                            <p className="font-extrabold text-[#F8FAFC] font-serif text-sm">{p.arabic}</p>
                            <p className="text-[#94A3B8] text-[11px]">{p.farsi} ({p.arabicPhonetic})</p>
                          </div>
                          <button 
                            onClick={() => playSpeech(p.arabic, `fts_${idx}`)}
                            className="p-1.5 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6] hover:text-black transition-all"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )) : (
                        <p className="text-xs text-[#94A3B8] py-2 text-center">چیزی با این عبارت پیدا نشد. امتحان کنید: سلام، قیمت، کجاست، ممنون</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feature 2 Sandbox: redirects to the dedicated, more complete Compare tab */}
            {selectedFeature.id === 2 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] text-center animate-fadeIn">
                <p className="text-xs text-[#94A3B8]">این قابلیت حالا در تب اختصاصی «🌍 Compare» است — با معنی فارسی، هر ۶ لهجه (عراقی، لبنانی، خلیجی، مصری، انگلیسی آمریکایی، انگلیسی بریتانیایی) و صدای واقعی هرکدام.</p>
                <button
                  onClick={() => setActiveTab("Compare")}
                  className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold px-6 py-2 rounded-lg text-xs transition-all cursor-pointer"
                >
                  🌍 رفتن به تب مقایسه لهجه‌ها
                </button>
              </div>
            )}

            {/* Feature 3 Sandbox: Location smart suggestions */}
            {selectedFeature.id === 3 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-[#94A3B8]">موقعیت مکانی شبیه‌سازی شده GPS شما:</span>
                  <div className="flex items-center gap-1 text-[#14B8A6] text-xs font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{locationPhrases[gpsLocation]?.coords}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {Object.keys(locationPhrases).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setGpsSimulating(true);
                        setGpsLocation(loc);
                        setTimeout(() => setGpsSimulating(false), 600);
                      }}
                      className={`text-[10px] font-black py-2 px-1 rounded-lg transition-all border ${
                        gpsLocation === loc 
                          ? "bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]" 
                          : "bg-[#141C2E] text-[#94A3B8] border-[#1E293B]"
                      }`}
                    >
                      {loc === "Najaf Checkpoint" ? "مرز نجاب / ایست‌بازرسی" :
                       loc === "Riyadh Airport Terminal" ? "فرودگاه ریاض" :
                       loc === "Damascus Old Souq" ? "بازار قدیم دمشق" : "منطقه الازهر قاهره"}
                    </button>
                  ))}
                </div>
                <div className="bg-[#141C2E] p-4 rounded-xl border border-[#1E293B] space-y-3 animate-fadeIn">
                  <p className="text-[11px] text-[#14B8A6] font-bold">💡 راهنمای موقعیت: {locationPhrases[gpsLocation]?.tips}</p>
                  <div className="space-y-2">
                    {locationPhrases[gpsLocation]?.phrases.map((phrase, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#090D16] border border-[#1E293B]/60 flex justify-between items-center text-xs">
                        <span className="text-[#F8FAFC] font-serif font-bold text-sm">{phrase.split(" (")[0]}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#94A3B8] text-[11px]">({phrase.split(" (")[1]}</span>
                          <button 
                            onClick={() => playSpeech(phrase.split(" (")[0], `gps_${idx}`)}
                            className="p-1 rounded bg-[#14B8A6]/10 text-[#14B8A6]"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Feature 4 Sandbox: Real mic recording + speech recognition */}
            {selectedFeature.id === 4 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] text-center animate-fadeIn">
                <p className="text-xs text-[#94A3B8] mb-3 text-right">دکمه ضبط را بزنید و اجازهٔ میکروفون را تأیید کنید؛ صدای شما واقعاً ضبط می‌شود و با تشخیص واقعی سکوت (Voice Activity Detection)، به‌محض اینکه صحبتتان تمام شد ضبط خودش قطع می‌شود (حداکثر ۱۰ ثانیه). تشخیص متن از گفتار در صورت پشتیبانی مرورگر انجام می‌شود؛ در غیر این صورت فقط ضبط و پخش صدا در دسترس است.</p>
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <button
                    onClick={handleStartVosk}
                    disabled={voskRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      voskRecording 
                        ? "bg-red-500 animate-pulse text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                        : "bg-[#14B8A6] hover:bg-[#0D9488] text-black shadow-[0_0_10px_rgba(20,184,166,0.2)] cursor-pointer"
                    }`}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <p className="text-[11px] text-[#94A3B8]">
                    {voskRecording ? "🎤 در حال ضبط واقعی صدای شما..." : "برای شروع ضبط واقعی صدا کلیک کنید"}
                  </p>
                  {voskRecording && (
                    <div className="w-full max-w-[220px] space-y-1">
                      <div className="w-full h-3 bg-[#1E293B] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-75"
                          style={{
                            width: `${voskLevel}%`,
                            background: voskLevel > 70 ? "#EF4444" : voskLevel > 15 ? "#14B8A6" : "#334155"
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-[#94A3B8] text-center">
                        سطح واقعی ورودی میکروفون (Web Audio API) — اگر همیشه خیلی پایین است، به میکروفون نزدیک‌تر شوید
                      </p>
                    </div>
                  )}
                </div>
                {voskError && (
                  <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-right">{voskError}</p>
                )}
                {voskAudioUrl && (
                  <div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B] text-right space-y-2">
                    <span className="text-[10px] text-[#94A3B8]">پخش صدای ضبط‌شدهٔ شما:</span>
                    <audio controls src={voskAudioUrl} className="w-full h-9" />
                  </div>
                )}
                {voskTranscript && (
                  <div className="bg-[#141C2E] p-4 rounded-xl border border-[#1E293B] text-right space-y-2 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px] text-[#94A3B8] border-b border-[#1E293B] pb-1.5">
                      <span>متن تشخیص داده شده توسط مرورگر:</span>
                      {voskConfidence !== null && (
                        <span className="text-[#14B8A6] font-bold font-mono">دقت: {voskConfidence}%</span>
                      )}
                    </div>
                    <p className="text-lg font-black text-[#F8FAFC] font-serif leading-relaxed">{voskTranscript}</p>
                  </div>
                )}
              </div>
            )}

            {/* Feature 5 Sandbox: Shadowing Trainer */}
            {selectedFeature.id === 5 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn">
                <p className="text-xs text-[#94A3B8]">به صدای بومی گوش دهید، سپس خودتان را ضبط کنید و با پخش هر دو، ریتم و لهجه را با گوش خودتان مقایسه کنید:</p>
                <div className="bg-[#141C2E] p-4 rounded-xl border border-[#1E293B] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#14B8A6]">نمونهٔ گوینده عراقی</span>
                    <button 
                      onClick={() => playSpeech("شلونك عيني؟ شو أحوالك؟", "shadow_base", "ar-IQ")}
                      className="flex items-center gap-1 text-[11px] bg-[#14B8A6]/10 text-[#14B8A6] px-2.5 py-1 rounded"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>پخش صوت بومی</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 py-2 border-y border-[#1E293B]/60">
                    <button
                      onClick={handleStartShadow}
                      disabled={shadowRecording}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        shadowRecording 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-teal-500 hover:bg-teal-600 text-slate-950"
                      }`}
                    >
                      {shadowRecording ? "🔴 ضبط گفتار..." : "🎤 شروع سایه‌زنی"}
                    </button>
                    <div className="flex-1 text-[11px] text-[#94A3B8] text-right">
                      {shadowRecording ? "به صدای بومی گوش داده و همزمان با آن جملات را تکرار کنید..." : "روی دکمه کلیک کنید و جمله را پس از گوینده تکرار کنید (۵ ثانیه ضبط)"}
                    </div>
                  </div>
                  {shadowError && (
                    <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-right">{shadowError}</p>
                  )}
                  {shadowAudioUrl && (
                    <div className="bg-[#090D16] p-3 rounded-lg border border-[#1E293B]/60 space-y-2 text-right">
                      <span className="text-[11px] text-[#94A3B8]">پخش صدای خودتان:</span>
                      <audio controls src={shadowAudioUrl} className="w-full h-9" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feature 11/12 Sandbox: Sign OCR & Handwriting */}
            {(selectedFeature.id === 11 || selectedFeature.id === 12 || selectedFeature.id === 13) && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn text-center">
                <p className="text-xs text-[#94A3B8] text-right">این قابلیت متصل به سیستم تحلیل تصویری هوش مصنوعی و اسکنر دوربین است. برای کار با این بخش، لطفاً به تب اختصاصی **Sign OCR** بروید تا تصاویر واقعی یا نمونه تابلوها را به راحتی اسکن کنید.</p>
                <button
                  onClick={() => setActiveTab("Sign OCR")}
                  className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold px-5 py-2 rounded-lg text-xs mt-2 transition-all cursor-pointer"
                >
                  🚀 ورود به بخش اسکنر تصویری Sign OCR
                </button>
              </div>
            )}

            {/* Feature 23 Sandbox: GPS SOS Emergency */}
            {/* Feature 25 Sandbox: Loud Voice SOS Megaphone */}
            {selectedFeature.id === 25 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn">
                <p className="text-xs text-[#94A3B8]">پخش فوری و با انتهای صدای بلند عبارات هشداردهنده در اسپیکرها برای جلب توجه پلیس یا اطرافیان در خیابان:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => playSpeech("أوقف! لا تلمسني!", "megaphone_stop")}
                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    🛑 ایست! به من دست نزن!
                  </button>
                  <button
                    onClick={() => playSpeech("ساعدوني! رجاءً ساعدوني!", "megaphone_help")}
                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    🚑 کمک! لطفاً کمک کنید!
                  </button>
                  <button
                    onClick={() => playSpeech("حريق! حريق! ابتعدوا!", "megaphone_fire")}
                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    🔥 آتش! آتش! دوری کنید!
                  </button>
                </div>
              </div>
            )}

            {/* Feature 41 Sandbox: Full Offline Flight Sandbox Mode */}
            {selectedFeature.id === 41 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn">
                <p className="text-xs text-[#94A3B8]">قفل کردن تمام دسترسی‌های اینترنت و اجرای ۱۰۰٪ محلی الگوریتم‌ها بر روی حافظه پنهان مرورگر شما:</p>
                <div className="flex items-center justify-between bg-[#141C2E] p-4 rounded-xl border border-[#1E293B]">
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#F8FAFC]">حالت پرواز فعال (کاملاً مستقل از اینترنت)</p>
                    <p className="text-[10px] text-[#94A3B8]">فقط پایگاه داده‌های آفلاین و دیکشنری بومی در دسترس هستند.</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={offlineMode}
                      onChange={(e) => {
                        setOfflineMode(e.target.checked);
                        triggerToast(e.target.checked ? "✈️ حالت پرواز آفلاین فعال شد." : "🌐 حالت آنلاین هوش مصنوعی مجدداً متصل شد.");
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#F8FAFC] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 45 Sandbox: Offline Vocab Puzzles */}
            {selectedFeature.id === 45 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn">
                <p className="text-xs text-[#94A3B8]">جفت کلمه‌های زیر را با لمس دکمه عربی و سپس دکمه معادل فارسی آن به هم متصل کنید:</p>
                <div className="bg-[#141C2E] p-4 rounded-xl border border-[#1E293B] space-y-4">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-[11px] text-[#14B8A6] font-bold text-center">کلمات عربی</p>
                      {puzzlePairs.map((p, idx) => (
                        <button
                          key={`ar_${idx}`}
                          disabled={p.matched}
                          onClick={() => handlePuzzleSelect("ar", p.ar)}
                          className={`w-full py-2 px-1 text-center rounded-lg text-xs font-serif font-black transition-all border ${
                            p.matched ? "bg-emerald-500/10 text-emerald-400/40 border-emerald-500/10" :
                            puzzleSelectedArabic === p.ar ? "bg-[#14B8A6] text-black border-[#14B8A6]" : "bg-[#090D16] text-[#F8FAFC] border-[#1E293B] hover:border-[#14B8A6]/30"
                          }`}
                        >
                          {p.ar}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-[11px] text-[#14B8A6] font-bold text-center">معادل‌های فارسی</p>
                      {puzzlePairs.map((p, idx) => (
                        <button
                          key={`fa_${idx}`}
                          disabled={p.matched}
                          onClick={() => handlePuzzleSelect("fa", p.fa)}
                          className={`w-full py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                            p.matched ? "bg-emerald-500/10 text-emerald-400/40 border-emerald-500/10" : "bg-[#090D16] text-[#94A3B8] border-[#1E293B] hover:border-[#14B8A6]/30"
                          }`}
                        >
                          {p.fa}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 46 Sandbox: Lingo Quiz */}
            {selectedFeature.id === 46 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] text-center animate-fadeIn">
                <p className="text-xs text-[#94A3B8] text-right">برای شرکت در تست‌های پیشرفته گویش‌شناسی و سنجش دایره لغات سفر، از منوی بالا تب **Lingo Quiz** را انتخاب کنید.</p>
                <button
                  onClick={() => setActiveTab("Lingo Quiz")}
                  className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold px-6 py-2 rounded-lg text-xs transition-all cursor-pointer mt-2"
                >
                  🎯 ورود به بخش آزمون گویش‌شناسی Lingo Quiz
                </button>
              </div>
            )}

            {/* Feature 53 Sandbox: Narrative Cultural Podcasts */}
            {selectedFeature.id === 53 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] text-center animate-fadeIn">
                <p className="text-xs text-[#94A3B8] text-right">پادکست‌های کوتاه صوتی به زبان شیرین محلی همراه با متن روان و ترجمه برای ارتقای توانایی شنیداری. به بخش **Podcast** در منوی بالا مراجعه فرمایید.</p>
                <button
                  onClick={() => setActiveTab("Podcast")}
                  className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold px-6 py-2 rounded-lg text-xs transition-all cursor-pointer mt-2"
                >
                  🎧 پخش پادکست‌های صوتی در کابین یادگیری
                </button>
              </div>
            )}

            {/* Feature 62 Sandbox: Packing Checklist */}
            {selectedFeature.id === 62 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] text-center animate-fadeIn">
                <p className="text-xs text-[#94A3B8] text-right">یک چک‌لیست ساده و قابل‌ویرایش برای وسایل سفرتان. (این لیست هوشمند/آب‌وهوایی نیست — فقط یک یادداشت شخصی است.)</p>
                <button
                  onClick={() => setActiveTab("Translator")}
                  className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold px-6 py-2 rounded-lg text-xs transition-all cursor-pointer mt-2"
                >
                  📋 افزودن عبارت‌های سفر شخصی در تب مترجم
                </button>
              </div>
            )}

            {/* Feature 71 Sandbox: real Backup & Restore */}
            {selectedFeature.id === 71 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn">
                <p className="text-xs text-[#94A3B8] text-right leading-relaxed">
                  علاقه‌مندی‌ها، عبارات شخصی، و پیشرفت مرور هوشمند (SRS) شما فقط روی همین گوشی ذخیره است. با این دکمه یک فایل واقعی پشتیبان می‌گیرید تا اگر مرورگر را عوض کردید یا برنامه را پاک کردید، از دست نرود. (فایل‌های صوتی/ویدیویی شخصی چون حجیم‌اند در این پشتیبان‌گیری نیستند.)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      downloadBackup();
                      triggerToast("💾 فایل پشتیبان دانلود شد.");
                    }}
                    className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    💾 دریافت فایل پشتیبان
                  </button>
                  <button
                    onClick={() => backupFileInputRef.current?.click()}
                    className="bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    📤 بازیابی از فایل پشتیبان
                  </button>
                  <input
                    ref={backupFileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleRestoreFile}
                  />
                </div>
                {restoreMsg && (
                  <p className={`text-[11px] font-bold p-2 rounded-lg ${restoreMsg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {restoreMsg.text}
                  </p>
                )}
              </div>
            )}

            {/* Feature 72 Sandbox: real offline English ASR (Vosk) */}
            {selectedFeature.id === 72 && (
              <div className="space-y-3 bg-[#090D16]/80 p-4 rounded-xl border border-[#1E293B] animate-fadeIn text-right">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  یک بسته واقعی تشخیص گفتار انگلیسی (حدود ۴۰ مگابایت، از پروژه متن‌باز Vosk) روی خودِ گوشی‌تان دانلود و ذخیره می‌شود — بعد از دانلود، تمرین تلفظ انگلیسی حتی بدون اینترنت کار می‌کند.
                </p>
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 leading-relaxed">
                  ⚠️ صادقانه بگویم: برای لهجه‌های عربی (عراقی/لبنانی/خلیجی/مصری) نتوانستیم بسته آفلاین واقعی و سبک پیدا کنیم — کوچک‌ترین مدل واقعی موجود برای عربی حدود ۳۲۰ مگابایت است و روی عربی رسمی خبری آموزش دیده، نه لهجه‌های محاوره‌ای — یعنی حتی با آن حجم، دقتش برای همین برنامه پایین می‌بود. پس فقط انگلیسی را اضافه کردیم.
                </p>

                {asrDownloading ? (
                  <div className="space-y-1.5">
                    <div className="w-full h-3 bg-[#1E293B] rounded-full overflow-hidden">
                      <div className="h-full bg-[#14B8A6] transition-all duration-200" style={{ width: `${asrProgress}%` }} />
                    </div>
                    <p className="text-[11px] text-[#94A3B8] text-center">در حال دانلود... {asrProgress}%</p>
                  </div>
                ) : asrDownloaded ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold py-2.5 rounded-lg text-center">
                      ✅ بسته آفلاین انگلیسی نصب است — آماده استفاده بدون اینترنت
                    </div>
                    <button
                      onClick={handleDeleteOfflineModel}
                      className="bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold py-2.5 px-3 rounded-lg"
                    >
                      حذف
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDownloadOfflineModel}
                    className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    ⬇️ دانلود بسته آفلاین انگلیسی (~۴۰ مگابایت)
                  </button>
                )}
                {asrError && (
                  <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{asrError}</p>
                )}
                <p className="text-[10px] text-[#94A3B8]">
                  توصیه می‌کنیم دانلود را وقتی به وای‌فای وصلید انجام دهید، نه با اینترنت موبایل.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SEARCH AND FILTER CHIPS BLOCK */}
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-xl">
        
        {/* Search feature field */}
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی پیشرفته در ۶۶ قابلیت TravelApp (مثال: Vosk, OCR, FTS5)..."
            className="w-full bg-[#090D16] text-sm text-[#F8FAFC] pl-4 pr-11 py-3.5 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none text-right placeholder-[#94A3B8]"
            dir="rtl"
          />
          <Search className="w-4.5 h-4.5 text-[#94A3B8] absolute right-4 top-4" />
        </div>

        {/* Category horizontal scrolling chips - MATCHING SCREENSHOTS */}
        <div className="overflow-x-auto pb-1 flex gap-2 scrollbar-none" dir="ltr">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-black px-4 py-2 rounded-lg transition-all border shrink-0 ${
                  isSelected 
                    ? "bg-[#14B8A6] text-black border-[#14B8A6]" 
                    : "bg-[#090D16] text-[#94A3B8] border-[#1E293B] hover:border-[#14B8A6]/40"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* FEATURE CARDS LIST - MATCHING SCREENSHOTS PERFECTLY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFeatures.map((feat) => {
          const isSelected = selectedFeature?.id === feat.id;
          return (
            <div 
              key={feat.id}
              onClick={() => {
                setSelectedFeature(feat);
                triggerToast(`🔥 قابلیت #${feat.id} فعال شد.`);
                // Scroll layout smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`bg-[#141C2E] border rounded-2xl p-4 flex gap-4 transition-all duration-300 hover:border-[#14B8A6]/40 cursor-pointer text-right group ${
                isSelected ? "border-[#14B8A6] ring-1 ring-[#14B8A6]/20 bg-[#141C2E]/90" : "border-[#1E293B]"
              }`}
              dir="rtl"
            >
              {/* Feature ID Square Block on Left */}
              <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] font-display font-extrabold text-sm shrink-0 mt-0.5">
                #{feat.id}
              </div>

              {/* Feature Details Content */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-[#F8FAFC] group-hover:text-[#14B8A6] transition-colors truncate font-display" dir="ltr">
                    {feat.nameEn}
                  </h4>
                  <span className="bg-[#1E293B] text-[#94A3B8] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                    {feat.category}
                  </span>
                </div>
                <p className="text-xs text-[#14B8A6] font-bold">{feat.nameFa}</p>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">{feat.desc}</p>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

// Simple Helper Icon fallback
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
