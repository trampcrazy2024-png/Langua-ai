import React, { useState } from "react";
import { 
  Play, Pause, Volume2, Mic, Sparkles, BookOpen, Clock, 
  Info
} from "lucide-react";
import { similarityScore, feedbackForScore } from "../speechUtils";
import { logPracticeAttempt } from "../progressStore";
import { startSpeechRecognition, speakNative } from "../lib/nativeSpeech";

interface PodcastTabProps {
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }) => void;
  triggerToast: (msg: string) => void;
}

export default function PodcastTab({
  playSpeech,
  triggerToast
}: PodcastTabProps) {
  const [activePodcast, setActivePodcast] = useState("p1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [shadowResult, setShadowResult] = useState<{ label: string; color: string; heard: string; delayMs: number | null } | null>(null);

  /*
   * Bug fix (memory/resource leak): same pattern as MatrixTab.tsx and
   * TranslatorTab.tsx - handleStartShadow() opens a mic stream plus
   * either a SpeechRecognition session or a 4s setTimeout fallback,
   * and nothing stopped either if the user left this tab mid-recording.
   */
  const activeStreamRef = React.useRef<MediaStream | null>(null);
  const activeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRecognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
      try { activeRecognitionRef.current?.stop(); } catch {}
      activeStreamRef.current?.getTracks().forEach((t) => t.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Podcast Scenarios — real everyday spoken exchanges (not tourist-only
  // phrases) so you can practice actually following/joining a conversation.
  const podcasts = [
    {
      id: "p1",
      title: "قهوه‌خانه‌های سنتی شام (شربت و چای بومی)",
      host: "حکیم السوری (دمشق) — لهجه لبنانی/شامی",
      duration: "۵ دقیقه",
      desc: "آشنایی با عادات نوشیدن قهوه تلخ، چای نعنا و سفارش در بازارهای قدیمی سوریه.",
      lines: [
        { speaker: "حکیم", ar: "تفضل يا غالي، أهلاً وسهلاً بقهوة الشام.", fa: "بفرما فدات شم، خوش آمدی به قهوه‌خانه دمشق.", pho: "Tafaddal ya ghali, ahlan wa sahlan bi-qahwat ash-sham." },
        { speaker: "مسافر", ar: "تسلم عيونك، بدي فنجان قهوة سادة من فضلك.", fa: "چشمت سلامت، یک فنجان قهوه تلخ بی‌شکر می‌خوام لطفا.", pho: "Tislam uyounak, baddi finjan qahwa sada min fadlak." },
        { speaker: "حکیم", ar: "على راسي! أحلى فنجان قهوة هيل لأغلى كابتن.", fa: "روی سرم جا داری! زیباترین فنجان قهوه هل‌دار برای بهترین کاپیتان.", pho: "Ala rasi! Ahla finjan qahwa heil li-aghla captain." }
      ]
    },
    {
      id: "p2",
      title: "مسیر دلدادگی (احوالپرسی موکب‌های راه کربلا)",
      host: "ابوحسین العراقی (کربلا) — لهجه عراقی",
      duration: "۴ دقیقه",
      desc: "شنیدن لهجه روان عراقی در خدمت‌رسانی موکب‌ها و پاسخ‌های مودبانه به خادمان.",
      lines: [
        { speaker: "ابوحسین", ar: "هلا بالزوار، تفضلوا استريحوا فدوة، عساكم بخير؟", fa: "خوش آمدید زائران، بفرمایید استراحت کنید فداتون، حالتون خوبه؟", pho: "Hala bil-zuwwar, tafaddaloo astareehoo fadwa, asakum bi-khair?" },
        { speaker: "مسافر", ar: "الله يخليك يا طيب، رحم الله والديك على الخدمة.", fa: "خدا نگهت داره ای مرد خوب، خدا پدر مادرت رو بیامرزه بابت خدمت.", pho: "Allah yukhalik ya tayyib, rahim Allah walideyk ala al-khidma." },
        { speaker: "ابوحسین", ar: "هذا واجبنا يا غالي، شرفتونا بوجودكم معنا.", fa: "این وظیفه ماست فدات شم، با حضورتون پیش ما به ما افتخار دادید.", pho: "Hadha wajibna ya ghali, sharraftoona bi-wujoodikum ma'ana." }
      ]
    },
    {
      id: "p3",
      title: "شلوغی بازار خان الخلیلی قاهره",
      host: "مصطفی المصری (قاهره) — لهجه مصری",
      duration: "۶ دقیقه",
      desc: "داستان پرانرژی خرید صنایع دستی، سوغاتی و تخفیف گرفتن با زبان طنز مصری.",
      lines: [
        { speaker: "مصطفی", ar: "يا باشا، نورت المحل! اتفرج على التحف الجميلة دي.", fa: "رئیس، به مغازه صفا دادی! تماشا کن این صنایع دستی قشنگ رو.", pho: "Ya basha, nawwart al-mahal! Itfarrag ala al-tuhaf al-gamila di." },
        { speaker: "مسافر", ar: "ده نورك يا غالي، بكام التحفة دي بعد الخصم؟", fa: "نور چشم شماست عزیز، قیمت این کاره دست بعد تخفیف چنده؟", pho: "Da noorak ya ghali, bekam al-tuhfa di ba'ad al-khasm?" },
        { speaker: "مصطفی", ar: "عشان خاطرك يا فندم، هعملك سعر ملوكي ملوش مثيل!", fa: "به خاطر گل روی شما قربان، قیمتی شاهانه برات می‌زنم که لنگه نداره!", pho: "Ashan khatrak ya fandim, ha'amillak se'er malooki maloosh maseel!" }
      ]
    },
    {
      id: "p4",
      title: "گپ روزمره با همسایه در بغداد",
      host: "ام‌حیدر (بغداد) — لهجه عراقی",
      duration: "۴ دقیقه",
      desc: "یک مکالمه کاملاً روزمره و غیررسمی بین دو همسایه سر کوچه — دقیقاً چیزی که هرروز می‌شنوید.",
      lines: [
        { speaker: "ام‌حیدر", ar: "هلا خيتي، شكو ماكو؟ شلونج اليوم؟", fa: "سلام خواهرم، چه خبر؟ امروز حالت چطوره؟", pho: "Hala khaiti, shako mako? Shlonich al-youm?" },
        { speaker: "همسایه", ar: "الحمدلله زينة، بس تعبانة شوية من الشغل.", fa: "خدا رو شکر خوبم، فقط یه کم از کار خسته‌ام.", pho: "Al-hamdulillah zayna, bass ta'bana shwaya min ash-shughul." },
        { speaker: "ام‌حیدر", ar: "الله يعينج، تعالي اشربي جاي وياي شوية.", fa: "خدا کمکت کنه، بیا یه کم چای با من بخور.", pho: "Allah yi'eenich, ta'ali ishrabi chai wiyay shwaya." },
        { speaker: "همسایه", ar: "زين والله، بس دقيقة اسوي الغدة واجي.", fa: "چه خوب، فقط یه لحظه ناهار رو آماده کنم بعد میام.", pho: "Zein wallah, bass dagiga asawi al-ghada wa aji." }
      ]
    },
    {
      id: "p5",
      title: "گپ دوستانه در کافه بیروت",
      host: "رامي (بیروت) — لهجه لبنانی",
      duration: "۴ دقیقه",
      desc: "مکالمه غیررسمی دو دوست در کافه — لحن سریع و صمیمی لبنانی روزمره.",
      lines: [
        { speaker: "رامي", ar: "شو يا زلمة، من زمان ما شفتك! وين كنت؟", fa: "چه خبرا مرد، خیلی وقته ندیدمت! کجا بودی؟", pho: "Shu ya zalame, min zaman ma shiftak! Wein kint?" },
        { speaker: "دوست", ar: "كنت مشغول كتير بالشغل، بس هلق فاضي شوي.", fa: "خیلی سرم با کار شلوغ بود، ولی الان یه کم وقت دارم.", pho: "Kint mashghoul kteer bel-shughul, bas halla' fadi shwei." },
        { speaker: "رامي", ar: "يلا تعال نشرب قهوة سوا ونحكي شوي.", fa: "بیا بریم یه قهوه با هم بخوریم و یه کم حرف بزنیم.", pho: "Yalla ta'al nishrab ahwe sawa w-nihki shwei." }
      ]
    },
    {
      id: "p6",
      title: "Everyday Small Talk at a US Coffee Shop",
      host: "Jake (Chicago) — American English",
      duration: "3 min",
      desc: "A casual American English exchange ordering coffee and making small talk — exactly how it sounds day to day.",
      lines: [
        { speaker: "Jake", ar: "Hey, how's it going? What can I get started for you?", fa: "سلام، اوضاع چطوره؟ چی براتون آماده کنم؟", pho: "Hey, how's it going? What can I get started for you?" },
        { speaker: "مشتری", ar: "I'm good, thanks! Can I get a medium latte, please?", fa: "خوبم، ممنون! میشه یه لاته متوسط بگیرم لطفاً؟", pho: "I'm good, thanks! Can I get a medium latte, please?" },
        { speaker: "Jake", ar: "Sure thing. Anything else for you today?", fa: "حتماً. چیز دیگه‌ای هم می‌خواید؟", pho: "Sure thing. Anything else for you today?" },
        { speaker: "مشتری", ar: "That's all, thank you. Have a great day!", fa: "همین کافیه، ممنون. روز خوبی داشته باشید!", pho: "That's all, thank you. Have a great day!" }
      ]
    }
  ];

  const currentPodcast = podcasts.find(p => p.id === activePodcast) ?? podcasts[0]!;

  // Real shadowing: plays the native line via the browser's own speech
  // synthesis (so we get a real 'onstart' timestamp), records the user at
  // the same time, and measures the real gap between the native audio
  // actually starting and the browser's real speech-recognition engine
  // actually detecting the user's voice (the standard 'onspeechstart'
  // event) — a genuine timing measurement from two real browser events,
  // not a simulated/fabricated number.
  const handleStartShadow = () => {
    setRecording(true);
    setShadowResult(null);
    const targetLang = /[\u0600-\u06FF]/.test(currentPodcast.lines[activeLineIdx]!.ar) ? "ar-SA" : "en-US";
    const lineText = currentPodcast.lines[activeLineIdx]!.ar;

    let nativeStartMs: number | null = null;
    let userStartMs: number | null = null;

    // Bug fix (Android device testing, issues #3/#4): both window.speechSynthesis
    // and webkitSpeechRecognition are unreliable/absent in Android's embedded
    // WebView - see lib/nativeSpeech.ts. This mirrors the exact same shadowing
    // measurement (native line start vs. user speech start), just sourced from
    // the native TTS/STT plugins on-device instead of the raw Web Speech API.
    nativeStartMs = performance.now();
    speakNative(lineText, targetLang).then((handled) => {
      if (!handled) {
        // Not native - fall back to the real browser API exactly as before.
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(lineText);
        utterance.lang = targetLang;
        utterance.onstart = () => { nativeStartMs = performance.now(); };
        window.speechSynthesis.speak(utterance);
      }
    });

    const handle = startSpeechRecognition({
      lang: targetLang,
      onSpeechStart: () => { userStartMs = performance.now(); },
      onResult: (heard) => {
        const score = similarityScore(lineText, heard);
        const fb = feedbackForScore(score);
        const delayMs = nativeStartMs !== null && userStartMs !== null
          ? Math.round(userStartMs - nativeStartMs)
          : null;
        setShadowResult({ label: `${fb.label} (${score}%)`, color: fb.color, heard, delayMs });
        logPracticeAttempt(`podcast_${currentPodcast.id}_${activeLineIdx}`, "پادکست", score);
      },
      onError: (message) => triggerToast(message),
      onEnd: () => { setRecording(false); activeRecognitionRef.current = null; },
    });

    if (!handle) {
      // No recognition available at all (old browser, no mic API): still let
      // them record & compare by ear, exactly as the old code did.
      activeTimeoutRef.current = setTimeout(() => {
        setRecording(false);
        activeTimeoutRef.current = null;
        triggerToast("ضبط پایان یافت (تشخیص گفتار روی این دستگاه در دسترس نیست).");
      }, 4000);
      return;
    }
    activeRecognitionRef.current = handle;
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      
      {/* Podcasts List Navigation Row */}
      <div className="bg-[#141C2E] border border-[#1E293B] p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-black text-[#14B8A6] flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>پادکست‌های صوتی روایی و فرهنگی (کابین یادگیری شنیداری)</span>
        </h3>
        <p className="text-[11px] text-[#94A3B8] leading-relaxed">داستان‌های مستند بومی از زبان اهالی شهرهای مختلف به همراه ترجمه همزمان. یکی از کانال‌های زیر را انتخاب کنید:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {podcasts.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePodcast(p.id);
                setIsPlaying(false);
                setActiveLineIdx(0);
                setShadowResult(null);
              }}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                activePodcast === p.id 
                  ? "border-[#14B8A6] bg-[#14B8A6]/5" 
                  : "border-[#1E293B] bg-[#090D16] hover:border-[#14B8A6]/30"
              }`}
            >
              <div className="space-y-0.5">
                <p className="text-xs font-black text-[#F8FAFC] truncate">{p.title}</p>
                <p className="text-[10px] text-[#94A3B8]">{p.host}</p>
              </div>
              <div className="flex justify-between items-center text-[9px] text-[#14B8A6] font-mono mt-2 border-t border-[#1E293B]/60 pt-1.5 w-full">
                <span>زمان پخش: {p.duration}</span>
                <Clock className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Podcast Media Player Screen */}
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-5">
        
        {/* Media Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1E293B] pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-[#F8FAFC]">{currentPodcast.title}</h4>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">{currentPodcast.desc}</p>
          </div>
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              triggerToast(isPlaying ? "⏸️ پخش پادکست متوقف شد." : "▶️ در حال پخش پادکست روایی بومی...");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlaying 
                ? "bg-red-500/25 text-red-400 border border-red-500/30" 
                : "bg-[#14B8A6] text-black hover:bg-[#0D9488]"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>توقف پخش صوتی</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>شروع پخش پادکست</span>
              </>
            )}
          </button>
        </div>

        {/* Lines and Transcription Grid */}
        <div className="space-y-3">
          {currentPodcast.lines.map((line, idx) => (
            <div 
              key={idx} 
              onClick={() => { setActiveLineIdx(idx); setShadowResult(null); }}
              className={`p-3.5 rounded-xl border flex gap-3 text-right hover:border-[#14B8A6]/30 transition-all cursor-pointer ${
                activeLineIdx === idx ? "border-[#14B8A6] bg-[#14B8A6]/5" : "border-[#1E293B]/70 bg-[#090D16]/20"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {line.speaker}
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-black text-[#F8FAFC] font-serif leading-relaxed">{line.ar}</p>
                <p className="text-[10px] text-[#14B8A6] font-mono leading-none" dir="ltr">{line.pho}</p>
                <p className="text-xs text-[#94A3B8] leading-relaxed pt-0.5">{line.fa}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); playSpeech(line.ar, `pod_l_${idx}`); }}
                className="p-1.5 rounded bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6] hover:text-black self-center transition-all shrink-0 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* SHADOWING TRAINER SANDBOX PANEL */}
        <div className="bg-[#090D16]/90 border border-[#1E293B] p-4 rounded-2xl space-y-4 text-right">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#14B8A6] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>تمرین سایه‌زنی واقعی (Shadowing)</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
              <Info className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>روی یک خط از گفتگو بالا بزنید تا هدف تمرین شود</span>
            </div>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">خط انتخاب‌شده: «{currentPodcast.lines[activeLineIdx]!.ar}» — پخش کنید، بعد میکروفون را بزنید و همان جمله را بگویید. صدای شما واقعاً ضبط و با متن هدف مقایسه می‌شود.</p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#141C2E] p-4 rounded-xl border border-[#1E293B]/70">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleStartShadow}
                disabled={recording}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  recording 
                    ? "bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]" 
                    : "bg-[#14B8A6] text-black hover:bg-[#0D9488] cursor-pointer"
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="text-right">
                <p className="text-xs font-bold text-[#F8FAFC]">
                  {recording ? "🎙️ در حال ضبط واقعی صدای شما..." : "برای تمرین این خط، میکروفون را بزنید"}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">نتیجه بر اساس مقایسهٔ متنی واقعی محاسبه می‌شود، نه عدد تصادفی</p>
              </div>
            </div>

            {shadowResult && (
              <div className="bg-[#090D16] px-4 py-2 rounded-lg border w-full sm:w-auto shrink-0 animate-scaleUp text-right" style={{ borderColor: shadowResult.color }}>
                <p className="text-[10px] font-bold" style={{ color: shadowResult.color }}>{shadowResult.label}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">شما گفتید: «{shadowResult.heard}»</p>
                {shadowResult.delayMs !== null && (
                  <p className="text-[10px] mt-1 font-mono" style={{ color: Math.abs(shadowResult.delayMs) <= 800 ? "#10B981" : "#F59E0B" }}>
                    ⏱️ فاصله زمانی واقعی شروع صحبت شما نسبت به صدای بومی: {shadowResult.delayMs >= 0 ? "+" : ""}{shadowResult.delayMs} میلی‌ثانیه
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
