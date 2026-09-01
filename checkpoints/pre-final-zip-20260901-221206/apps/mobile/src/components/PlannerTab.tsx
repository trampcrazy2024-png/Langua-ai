import React, { useState } from "react";
import { Compass, Sparkles, ShieldAlert, RefreshCw, Package, Lightbulb, CalendarDays } from "lucide-react";
import { apiFetch } from "../lib/net";

interface PlannerTabProps {
  triggerToast: (msg: string) => void;
  offlineMode: boolean;
}

interface PlanResult {
  packingItems: string[];
  culturalTips: string[];
  dailyRecommendations: { day: number; activity: string; localDialectChallenge: string }[];
}

export default function PlannerTab({ triggerToast, offlineMode }: PlannerTabProps) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(3);
  const [type, setType] = useState("Dialect Immersion");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PlanResult | null>(null);

  const handlePlan = async () => {
    if (!destination.trim()) {
      triggerToast("لطفاً مقصد سفر خود را بنویسید.");
      return;
    }
    if (offlineMode) {
      triggerToast("⚠️ حالت پرواز فعال است. برای ساخت برنامه سفر جدید آن را غیرفعال کنید.");
      return;
    }
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      // Bug fix: was a raw fetch("/api/planner", ...) with a hardcoded
      // same-origin path - see the note in OcrTab.tsx for why that's
      // wrong once VITE_AI_BASE_URL/the shared-secret header matter.
      const data = await apiFetch<PlanResult>("/api/planner", {
        method: "POST",
        body: { destination, duration, type }
      });
      setPlan(data);
      triggerToast("🗺️ برنامه سفر شما آماده شد.");
    } catch (err: any) {
      const message = typeof err?.message === "string" ? err.message : "";
      setError(/^API \d+$/.test(message) ? "ساخت برنامه سفر ناموفق بود." : message || "خطا در ساخت برنامه سفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn text-right" dir="rtl">
      <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#14B8A6]" />
          <span>برنامه‌ریز هوشمند سفر</span>
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          مقصد، مدت سفر و سبک سفرتان را وارد کنید تا هوش مصنوعی چک‌لیست بسته‌بندی، نکات فرهنگی مهم، و یک چالش روزانه تمرین زبان محلی برای هر روز سفرتان بسازد.
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="مقصد سفر (مثلاً: نجف، بیروت، لس‌آنجلس، لندن...)"
            className="w-full bg-[#090D16] text-xs text-[#F8FAFC] px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#14B8A6] outline-none text-right"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-[#94A3B8]">مدت سفر (روز):</span>
              <input
                type="number"
                min={1}
                max={30}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#94A3B8]">سبک سفر:</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5"
              >
                <option value="Dialect Immersion">غرق‌شدن در زبان محلی</option>
                <option value="Backpacker">کوله‌گردی/بودجه کم</option>
                <option value="Business">تجاری</option>
                <option value="Luxury">لوکس</option>
                <option value="Pilgrimage">زیارتی</option>
              </select>
            </div>
          </div>

          <button
            onClick={handlePlan}
            disabled={loading}
            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-50 text-black font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ساخت برنامه سفر...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ساخت برنامه سفر</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {plan && (
          <div className="space-y-4 pt-2 animate-fadeIn">
            <div className="bg-[#090D16] p-4 rounded-xl border border-[#1E293B] space-y-2">
              <p className="text-xs font-black text-[#14B8A6] flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>چک‌لیست بسته‌بندی پیشنهادی:</span>
              </p>
              <ul className="text-[11px] text-[#94A3B8] space-y-1 list-disc pr-4">
                {plan.packingItems.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div className="bg-[#090D16] p-4 rounded-xl border border-[#1E293B] space-y-2">
              <p className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>نکات فرهنگی مهم:</span>
              </p>
              <ul className="text-[11px] text-[#94A3B8] space-y-1 list-disc pr-4">
                {plan.culturalTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>

            <div className="bg-[#090D16] p-4 rounded-xl border border-[#1E293B] space-y-2">
              <p className="text-xs font-black text-[#F8FAFC] flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                <span>برنامه روزانه و چالش گفتاری:</span>
              </p>
              <div className="space-y-2">
                {plan.dailyRecommendations.map((rec) => (
                  <div key={rec.day} className="bg-[#141C2E] p-2.5 rounded-lg border border-[#1E293B]/60 text-[11px] space-y-1">
                    <p className="font-bold text-[#14B8A6]">روز {rec.day}: {rec.activity}</p>
                    <p className="text-[#94A3B8]">🗣️ چالش امروز: {rec.localDialectChallenge}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
