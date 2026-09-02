import { useState } from "react";
import { 
  ShieldAlert, Calculator, MapPin, 
  Send, Lock, Landmark, ShieldCheck, HeartPulse
} from "lucide-react";

interface SafetyTabProps {
  playSpeech: (text: string, id: string, langCode?: string, voiceOptions?: { pitch?: number; rate?: number; voiceHint?: string }) => void;
  triggerToast: (msg: string) => void;
}

export default function SafetyTab({
  triggerToast
}: SafetyTabProps) {
  // SOS States
  const [sosType, setSosType] = useState("medical");
  const [sosStatus, setSosStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [contacts, setContacts] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Calculator States
  const [calcInput, setCalcInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleCalcKey = (val: string) => {
    if (val === "C") {
      setCalcInput("");
      return;
    }
    if (val === "=") {
      if (calcInput === "66") {
        setIsUnlocked(true);
        triggerToast("🔓 رمز ۶۶ پذیرفته شد! گاوصندوق محرمانه بقا باز شد.");
      } else {
        try {
          const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, "");
          const evaluated = Function(`"use strict"; return (${sanitized})`)();
          setCalcInput(String(evaluated));
        } catch {
          setCalcInput("Error");
        }
      }
      return;
    }
    setCalcInput(prev => prev + val);
  };

  const sosMessages: Record<string, string> = {
    medical: "حالة طارئة طبية! أحتاج مساعدة فورية.",
    security: "أحتاج مساعدة أمنية فورية!",
    lost: "لقد ضعت وأحتاج مساعدة للعودة."
  };

  const handleSosDispatch = () => {
    if (!navigator.geolocation) {
      setLocationError("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.");
      setSosStatus("error");
      return;
    }
    setSosStatus("locating");
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng, accuracy: position.coords.accuracy });
        setSosStatus("ready");

        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
        const body = encodeURIComponent(
          `${sosMessages[sosType]} | موقعیت من: ${mapsLink}`
        );
        const recipient = (contacts.split(",")[0] ?? "").trim().replace(/[^0-9+]/g, "");
        // Opens the phone's real SMS app pre-filled with the true GPS link —
        // the user only has to tap Send. This uses the normal cellular SMS
        // network (no internet required), unlike the old fake "satellite"
        // claim which sent nothing at all.
        if (recipient) {
          window.location.href = `sms:${recipient}?body=${body}`;
        }
        triggerToast("📍 موقعیت واقعی شما دریافت شد؛ برنامه پیامک برای ارسال باز می‌شود.");
      },
      (err) => {
        setSosStatus("error");
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "اجازهٔ دسترسی به موقعیت مکانی داده نشد."
            : "دریافت موقعیت مکانی ناموفق بود؛ GPS یا اینترنت را بررسی کنید."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      
      {/* 1. SOS Emergency Dispatcher */}
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-sm font-extrabold text-red-400 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          <span>دیسپچر واقعی اضطراری (موقعیت واقعی GPS + پیامک)</span>
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">در صورت بروز هرگونه مشکل امنیتی، گم‌شدن یا فوریت پزشکی، دکمه زیر را بزنید: موقعیت جغرافیایی واقعی شما از GPS گوشی گرفته می‌شود و برنامهٔ پیامک گوشی با یک پیام آمادهٔ عربی و لینک نقشه باز می‌شود تا خودتان ارسال را تأیید کنید (به شبکه سلولی نیاز دارد، نه اینترنت).</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 bg-[#090D16]/50 p-4 rounded-xl border border-[#1E293B]">
            <div className="space-y-1">
              <span className="text-[10px] text-[#94A3B8]">شماره مخاطب اضطراری (با کد کشور، مثلاً 989123456789+):</span>
              <input 
                type="text"
                value={contacts}
                onChange={(e) => setContacts(e.target.value)}
                placeholder="+98912xxxxxxx"
                className="w-full bg-[#141C2E] text-xs text-[#F8FAFC] border border-[#1E293B] p-2 rounded text-left font-mono"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#94A3B8]">نوع فوریت امدادی:</span>
              <div className="grid grid-cols-3 gap-2">
                {["medical", "security", "lost"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSosType(type)}
                    className={`text-[10px] py-1.5 px-1 rounded-lg font-black border transition-all ${
                      sosType === type 
                        ? "bg-red-500/20 text-red-400 border-red-500" 
                        : "bg-[#090D16] text-[#94A3B8] border-[#1E293B]"
                    }`}
                  >
                    {type === "medical" ? "فوریت پزشکی" :
                     type === "security" ? "نیاز به امنیت" : "گم کرده‌ام راه را"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#090D16]/50 p-4 rounded-xl border border-[#1E293B] space-y-3 text-center flex flex-col justify-between">
            <div className="space-y-1.5 text-right">
              <p className="text-[10px] text-[#94A3B8]">موقعیت جغرافیایی واقعی:</p>
              {coords ? (
                <div className="flex items-center gap-1 text-red-400 font-mono text-xs font-bold justify-end">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} (دقت ~{Math.round(coords.accuracy)}م)</span>
                </div>
              ) : (
                <p className="text-[10px] text-[#94A3B8] leading-relaxed">با زدن دکمه، موقعیت واقعی از GPS گوشی خوانده می‌شود.</p>
              )}
              {locationError && <p className="text-[10px] text-red-400">{locationError}</p>}
            </div>

            {sosStatus !== "locating" && (
              <button
                onClick={handleSosDispatch}
                disabled={!contacts.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-3 rounded-lg text-xs transition-all shadow-[0_4px_12px_rgba(239,68,68,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>دریافت موقعیت واقعی و باز کردن پیامک</span>
              </button>
            )}

            {sosStatus === "locating" && (
              <div className="w-full bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-lg text-xs font-black flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin"></div>
                <span>در حال دریافت موقعیت واقعی از GPS...</span>
              </div>
            )}

            {sosStatus === "ready" && coords && (
              <div className="w-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 animate-fadeIn">
                <ShieldCheck className="w-4 h-4" />
                <span>موقعیت دریافت شد؛ اپلیکیشن پیامک را برای ارسال تأیید کنید.</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#090D16]/60 p-3.5 rounded-xl border border-[#1E293B] space-y-1.5">
          <p className="text-[11px] font-black text-amber-400">شماره‌های رسمی اورژانس عراق:</p>
          <p className="text-[11px] text-[#94A3B8]">پلیس: ۱۰۴ &nbsp;|&nbsp; آمبولانس: ۱۲۲ &nbsp;|&nbsp; آتش‌نشانی: ۱۱۵</p>
          <p className="text-[10px] text-[#94A3B8] leading-relaxed">برای آدرس و شماره به‌روز سرکنسولگری ایران در نجف/کربلا، سایت رسمی <a href="https://najaf.mfa.ir/" target="_blank" rel="noopener noreferrer" className="underline text-[#14B8A6]">najaf.mfa.ir</a> را بررسی کنید — آدرس‌های ثابت داخل برنامه با گذر زمان می‌توانند نادرست شوند.</p>
        </div>
      </div>

      {/* 2. Disguised Stealth Calculator */}
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#14B8A6]" />
          <span>ماشین حساب حفاظتی مخفی (Disguised Stealth Calculator)</span>
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">این ابزار در ظاهر یک ماشین‌حساب ساده جهت محاسبه نرخ دینار و چای است؛ اما اگر مأمورین مرزی موبایل شما را وارسی کنند، چیزی به جز یک محاسبه‌گر نمی‌بینند. با وارد کردن کد امنیتی **66**، گاوصندوق محرمانه کدهای بقا سفر بازگشایی خواهد شد:</p>

        <div className="max-w-[280px] mx-auto bg-[#090D16] p-4 rounded-2xl border border-[#1E293B] space-y-3">
          <div className="bg-[#141C2E] p-3 rounded-xl border border-[#1E293B] text-left text-xl font-mono text-[#F8FAFC] min-h-[48px] break-all">
            {calcInput || "0"}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "C", "0", "=", "+"].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcKey(btn)}
                className={`py-3 px-1 rounded-xl text-sm font-mono font-bold transition-all cursor-pointer ${
                  btn === "=" ? "bg-[#14B8A6] text-black hover:bg-[#0D9488]" :
                  btn === "C" ? "bg-red-500/20 text-red-400" :
                  ["/", "*", "-", "+"].includes(btn) ? "bg-[#1E293B] text-[#14B8A6]" : "bg-[#141C2E] text-[#F8FAFC]"
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {isUnlocked && (
          <div className="bg-[#14B8A6]/10 border border-[#14B8A6] p-5 rounded-2xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-[#14B8A6]/30 pb-2">
              <span className="text-[#14B8A6] text-xs font-black flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>🔓 گاوصندوق امنیتی و راهنمای بقا محرمانه زائران (کد ۶۶)</span>
              </span>
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setCalcInput("");
                }}
                className="text-[10px] bg-red-500/20 text-red-400 px-2.5 py-1 rounded hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                قفل کردن فوری صندوق
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#090D16] p-3.5 rounded-xl border border-[#1E293B] space-y-2">
                <p className="text-xs font-black text-amber-400 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>شماره‌های رسمی اورژانس عراق:</span>
                </p>
                <div className="space-y-1.5 text-[11px] text-[#94A3B8] leading-relaxed">
                  <p>● <strong>پلیس:</strong> ۱۰۴</p>
                  <p>● <strong>آمبولانس:</strong> ۱۲۲</p>
                  <p>● <strong>آتش‌نشانی:</strong> ۱۱۵</p>
                  <p className="text-[10px]">آدرس دقیق سرکنسولگری ایران در سایت رسمی <a href="https://najaf.mfa.ir/" target="_blank" rel="noopener noreferrer" className="underline text-[#14B8A6]">najaf.mfa.ir</a> به‌روز نگه داشته می‌شود؛ چون آدرس‌های ثابت با گذشت زمان تغییر می‌کنند، اینجا ذخیره نشده است.</p>
                </div>
              </div>

              <div className="bg-[#090D16] p-3.5 rounded-xl border border-[#1E293B] space-y-2">
                <p className="text-xs font-black text-red-400 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>عبارات مفید پزشکی (برای گفتن به داروخانه/پزشک):</span>
                </p>
                <div className="space-y-1.5 text-[11px] text-[#94A3B8] leading-relaxed">
                  <p>● برای گرمازدگی بگویید: <strong>علاج لضربة الشمس</strong></p>
                  <p>● برای مسکن درد بگویید: <strong>حبوب مسكن للألم</strong></p>
                  <p>● برای آب معدنی پلمپ بگویید: <strong>ماي معدني مغلق</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
