import React from "react";

interface WelcomeScreenProps {
  onStart: () => void;
  onBrowseLibrary: () => void;
}

export default function WelcomeScreen({ onStart, onBrowseLibrary }: WelcomeScreenProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-hidden px-4"
      style={{ background: "linear-gradient(145deg, #0f0c29, #302b63, #24243e)" }}
      dir="rtl"
    >
      <div className="w-full max-w-[420px] text-center">
        <div
          className="relative overflow-hidden rounded-[48px] px-8 pt-12 pb-10 border border-white/10"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)"
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-pulseGlow pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.15), transparent 60%)"
            }}
          />

          {/* Logo with rings */}
          <div className="relative w-[140px] h-[140px] mx-auto mb-6">
            <div className="absolute rounded-full border-2 border-purple-400/30 animate-ringExpand" style={{ width: 160, height: 160, top: -10, left: -10 }} />
            <div className="absolute rounded-full border-2 border-purple-400/30 animate-ringExpand" style={{ width: 180, height: 180, top: -20, left: -20, animationDelay: "1s" }} />
            <div className="absolute rounded-full border-2 border-purple-400/30 animate-ringExpand" style={{ width: 200, height: 200, top: -30, left: -30, animationDelay: "2s" }} />
            <div
              className="w-[140px] h-[140px] rounded-full flex items-center justify-center animate-floatIcon relative"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
                boxShadow: "0 0 40px rgba(99,102,241,0.4)"
              }}
            >
              <svg viewBox="0 0 100 100" className="w-20 h-20 fill-white">
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2.5" opacity="0.4" />
                <ellipse cx="50" cy="50" rx="40" ry="20" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                <ellipse cx="50" cy="50" rx="20" ry="40" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                <path d="M30 65 L30 35 L50 45 L70 35 L70 65 L50 55 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M50 45 L50 55" stroke="white" strokeWidth="2" opacity="0.5" />
                <path d="M35 75 Q40 70 45 75" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                <path d="M55 75 Q60 70 65 75" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                <path d="M45 78 Q50 73 55 78" stroke="white" strokeWidth="2" fill="none" opacity="0.4" />
                <circle cx="30" cy="28" r="3" fill="white" opacity="0.6" />
                <circle cx="50" cy="22" r="3" fill="white" opacity="0.6" />
                <circle cx="70" cy="28" r="3" fill="white" opacity="0.6" />
                <rect x="42" y="68" width="16" height="3" rx="1.5" fill="white" opacity="0.4" />
              </svg>
            </div>
          </div>

          <h1 className="text-[32px] font-extrabold text-white mb-2 tracking-tight relative">
            لهجه‌یار{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              پلاس
            </span>
          </h1>
          <p className="text-base text-white/60 mb-8 tracking-wide">
            🌍 عراقی · لبنانی · خلیجی · بریتیش · آمریکایی
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-7">
            {[
              { flag: "🇮🇶", label: "عراقی" },
              { flag: "🇱🇧", label: "لبنانی" },
              { flag: "🇦🇪", label: "خلیجی" },
              { flag: "🇬🇧", label: "بریتیش" },
              { flag: "🇺🇸", label: "آمریکایی" }
            ].map((d) => (
              <span
                key={d.label}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 border border-white/[0.06] transition-all hover:bg-purple-500/20 hover:text-white hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                {d.flag} {d.label}
              </span>
            ))}
          </div>

          <button
            onClick={onStart}
            className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)"
            }}
          >
            🎯 شروع کن
          </button>
          <button
            onClick={onBrowseLibrary}
            className="w-full py-3.5 mt-3 rounded-2xl text-base font-semibold text-white/70 border border-white/[0.15] transition-all hover:bg-white/5 hover:border-white/30 cursor-pointer"
          >
            📚 کتابخانه
          </button>

          <p className="mt-6 text-[11px] text-white/30 tracking-wide relative">
            v2.0 · {"۲۱۵+"} عبارت · آفلاین · هوشمند
          </p>
        </div>
      </div>
    </div>
  );
}
