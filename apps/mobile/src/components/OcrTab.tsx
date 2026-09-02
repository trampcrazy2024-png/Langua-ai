import React, { useState } from "react";
import { 
  Camera, UploadCloud, Volume2, 
  RefreshCw, Info, CheckCircle, ShieldAlert
} from "lucide-react";
import { apiFetch } from "../lib/net";

interface OcrTabProps {
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }) => void;
  triggerToast: (msg: string) => void;
  offlineMode: boolean;
}

export default function OcrTab({
  playSpeech,
  triggerToast,
  offlineMode
}: OcrTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  /*
   * Bug fix (memory leak): the 1.5s "simulate OCR" timeout below had
   * no cleanup on unmount - navigating away from this tab mid-preset
   * would still fire setResult()/setLoading() on a gone component.
   */
  const presetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => {
      if (presetTimeoutRef.current) clearTimeout(presetTimeoutRef.current);
    };
  }, []);

  // High-fidelity image presets
  const presets = [
    {
      id: "preset_menu",
      title: "منوی غذا (رستوران محلی)",
      desc: "شاورما دجاج ولحم بالثوم والمخلل",
      transcription: "شاورما دجاج ولحم بالثوم والمخلل - وجبة كاملة",
      translation: "Chicken and beef shawarma with garlic sauce and pickles - full meal deal",
      pronunciation: "Shawarma dajaj wa lahm bith-thoum wal-mukhallal - wajba kamila",
      travelContext: "این یک تابلوی قیمتی در مغازه‌های ساندویچی سنتی است. نشان می‌دهد شاورما مرغ و گوشت همراه با سس سیر محلی و خیارشور سرو می‌شود.",
      image: "🍔"
    },
    {
      id: "preset_road",
      title: "تابلوی راهنمایی (ایست بازرسی)",
      desc: "نقطة تفتيش أمنية - قف وخفض السرعة",
      transcription: "نقطة تفتيش أمنية - قف وخفض السرعة أمامك",
      translation: "Security Checkpoint - Stop and reduce speed ahead",
      pronunciation: "Nuqtat taftish amniyyah - qif wa khaffid as-sur'ah amamak",
      travelContext: "یک اعلان بسیار حیاتی جاده‌ای در نزدیکی حرمین یا ورودی مرزها. یعنی سرعت ماشین را کم کنید و برای بررسی باسپورت متوقف شوید.",
      image: "🚧"
    },
    {
      id: "preset_welcome",
      title: "خوش آمدگویی زائران",
      desc: "أهلاً وسهلاً بضيوف الرحمن الزوار الكرام",
      transcription: "أهلاً وسهلاً بضيوف الرحمن الزوار الكرام في النجف الأشرف",
      translation: "Welcome, esteemed pilgrims and guests of the Merciful, to Holy Najaf",
      pronunciation: "Ahlan wa sahlan bi-duyoof ar-rahman az-zuwwar al-kiram fi an-najaf al-ashraf",
      travelContext: "یک بنر خوش‌آمدگویی رسمی مذهبی که معمولاً موکب‌ها یا شهرداری‌ها در مسیرهای پیاده‌روی زوار عتبات نصب می‌کنند.",
      image: "🕌"
    }
  ];

  const handlePresetClick = (preset: any) => {
    setSelectedPreset(preset.id);
    setLoading(true);
    setError("");
    setResult(null);

    // Simulate OCR delay
    presetTimeoutRef.current = setTimeout(() => {
      setResult({
        transcription: preset.transcription,
        translation: preset.translation,
        pronunciation: preset.pronunciation,
        travelContext: preset.travelContext
      });
      setLoading(false);
      presetTimeoutRef.current = null;
      triggerToast("✨ اسکنر تابلویPreset با موفقیت تحلیل شد!");
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (offlineMode) {
      triggerToast("⚠️ حالت پرواز فعال است. برای آپلود و پردازش با هوش مصنوعی آن را خاموش کنید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLoading(true);
      setError("");
      setResult(null);
      setSelectedPreset(null);

      try {
        /*
         * Bug fix: this used to be a raw fetch("/api/ocr", ...) with a
         * hardcoded same-origin path, unlike every other AI-calling
         * component in the app. That bypassed VITE_AI_BASE_URL (so this
         * one tab would silently break in any deployment where the API
         * isn't same-origin) and skipped the shared-secret header that
         * apiFetch attaches automatically.
         */
        const data = await apiFetch<any>("/api/ocr", {
          method: "POST",
          body: { image: base64 }
        });

        setResult(data);
        triggerToast("✨ تصویر واقعی شما با موفقیت اسکن و ترجمه شد!");
      } catch (err: any) {
        const message = typeof err?.message === "string" ? err.message : "";
        setError(
          /^API \d+$/.test(message)
            ? "خطا در پردازش تصویر توسط سرور هوش مصنوعی."
            : message || "خطا در اتصال به موتور بینایی هوش مصنوعی"
        );
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <Camera className="w-4.5 h-4.5 text-[#14B8A6]" />
          <span>مترجم تصویری هوشمند و خط‌ خوان اسکنر (Sign OCR)</span>
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">با دوربین موبایل خود عکسی از یک دستخط بومی، منوی رستوران عربی، تابلوی جاده‌ای یا برچسب دارو بگیرید و آپلود کنید. هوش مصنوعی بلافاصله متن عربی را استخراج، بازنویسی و بومی‌سازی می‌کند:</p>

        {/* Drag and Drop File Upload Area */}
        <div className="relative border-2 border-dashed border-[#1E293B] hover:border-[#14B8A6]/60 rounded-2xl p-6 transition-all bg-[#090D16]/40 text-center">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="w-10 h-10 text-[#14B8A6] mx-auto mb-2 animate-bounce-slow" />
          <p className="text-xs font-bold text-[#F8FAFC]">برای بارگذاری تصویر واقعی، اینجا کلیک کرده یا فایل را بکشید</p>
          <p className="text-[10px] text-[#94A3B8] mt-1">فرمت‌های مجاز: PNG, JPG, JPEG (تا سقف ۱۰ مگابایت)</p>
        </div>

        {/* Preset Travel Signs Grid */}
        <div className="space-y-2">
          <p className="text-[11px] text-[#94A3B8] font-bold">بخش تست سریع با تابلوهای آماده پرکاربرد جاده و سفر:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetClick(p)}
                className={`flex items-center gap-3 bg-[#090D16] border p-3 rounded-xl transition-all hover:border-[#14B8A6]/40 text-right cursor-pointer ${
                  selectedPreset === p.id ? "border-[#14B8A6] bg-[#14B8A6]/5" : "border-[#1E293B]"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center text-lg shrink-0">
                  {p.image}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#F8FAFC] truncate">{p.title}</p>
                  <p className="text-[9.5px] text-[#94A3B8] truncate" dir="ltr">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="py-6 text-center bg-[#090D16]/50 rounded-2xl border border-[#1E293B] space-y-3">
            <RefreshCw className="w-6 h-6 text-[#14B8A6] animate-spin mx-auto" />
            <p className="text-xs text-[#14B8A6] font-bold">در حال پردازش پیکسل‌های تصویر و فیلترهای نوری OCR...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* OCR Result Display */}
        {result && !loading && (
          <div className="bg-[#090D16]/80 p-5 rounded-2xl border border-[#1E293B] space-y-4 animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <span className="text-[#14B8A6] text-xs font-black flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>گزارش آنالیز بینایی ماشین و OCR هوشمند</span>
              </span>
              <button 
                onClick={() => playSpeech(result.transcription, "ocr_res")}
                className="p-1.5 rounded bg-[#14B8A6] text-black"
                title="شنیدن تلفظ صوتی"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B]/60 space-y-1">
                <p className="text-[10px] text-[#14B8A6] font-bold">📝 متن اصلی بازنویسی شده (عربی):</p>
                <p className="text-lg font-black text-[#F8FAFC] font-serif leading-relaxed" dir="rtl">{result.transcription}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B]/60 space-y-1 text-left">
                  <p className="text-[10px] text-[#14B8A6] font-bold text-right">🗣️ تلفظ انگلیسی (Pronunciation):</p>
                  <p className="text-xs font-mono text-[#F8FAFC] leading-relaxed" dir="ltr">{result.pronunciation}</p>
                </div>
                <div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B]/60 space-y-1">
                  <p className="text-[10px] text-[#14B8A6] font-bold">🌐 معنای روان فارسی/انگلیسی:</p>
                  <p className="text-xs text-[#F8FAFC] leading-relaxed">{result.translation}</p>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-1.5">
                <p className="text-[11px] text-[#10B981] font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>💡 اهمیت کاربردی و زمینه سفر برای مسافران:</span>
                </p>
                <p className="text-xs text-[#F8FAFC] leading-relaxed">{result.travelContext}</p>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
