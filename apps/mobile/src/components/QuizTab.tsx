import React, { useState } from "react";
import { 
  Trophy, Sparkles, CheckCircle, HelpCircle, 
  RefreshCw, Info, ChevronRight, Award, ShieldAlert, Star
} from "lucide-react";
import { apiFetch } from "../lib/net";

interface QuizTabProps {
  triggerToast: (msg: string) => void;
  offlineMode: boolean;
}

export default function QuizTab({
  triggerToast,
  offlineMode
}: QuizTabProps) {
  const [category, setCategory] = useState("Arabic Colloquial Idioms");
  const [level, setLevel] = useState("Intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // High-fidelity offline fallback quiz data (in case they are in flight/offline)
  const fallbackQuizzes: Record<string, any[]> = {
    "Arabic Colloquial Idioms": [
      {
        question: "معنی عبارت پرکاربرد عراقی 'فدوة اروحلك' چیست؟",
        options: [
          "قربانت بروم / فدایت شوم (برای محبت و تشکر)",
          "از اینجا برو بیرون",
          "من مأمور گمرک هستم",
          "آدرس نزدیک‌ترین رستوران کجاست؟"
        ],
        answerIndex: 0,
        explanation: "عبارت 'فدوة اروحلك' یا 'فدوة' یکی از صمیمانه‌ترین اصطلاحات عراقی برای بیان محبت، تشکر و احترام بسیار عمیق است."
      },
      {
        question: "در لهجه شامی (سوریه)، به فردی که می‌خواهیم بگوییم 'خوشتیپ / خوشگل'، چه می‌گویند؟",
        options: [
          "يا بطل",
          "يا جميل",
          "شو هالقد؟",
          "يا مرتب / يا غالي"
        ],
        answerIndex: 3,
        explanation: "در لهجه شامی 'يا مرتب' یا 'يا غالي' به معنی فرد شیک‌پوش، باوقار و عزیز استفاده فراوان دارد."
      },
      {
        question: "عبارت مصری 'عامل ايه؟' به چه معناست؟",
        options: [
          "چیکار می‌کنی؟ / حالت چطوره؟",
          "قیمتش چنده؟",
          "ساعت چند است؟",
          "نان بخر"
        ],
        answerIndex: 0,
        explanation: "'عامل ايه؟' پرکاربردترین جمله احوالپرسی مصری است که معادل چطوری یا چیکارا می‌کنی در فارسی است."
      }
    ],
    "Dialect Comparison": [
      {
        question: "کدام کلمه برای اشاره به 'خانه' در لهجه مصری به کار می‌رود؟",
        options: ["بيت", "بيت / بيت عائلي", "بيت / بيت كبير", "بيت / دار"],
        answerIndex: 0,
        explanation: "اگرچه در بیشتر لهجه‌ها 'بیت' مشترک است، مصری‌ها کلمه 'بيت' یا 'شقة' (آپارتمان) را بسیار به کار می‌برند."
      }
    ],
    "Travel Customs": [
      {
        question: "وقتی یک عراقی به شما می‌گوید 'شرفتونا'، پاسخ مناسب و با ادب بالا چیست؟",
        options: [
          "الشرف لنا، الله يخليك",
          "لا شكراً",
          "مع السلامة",
          "بكم هذا؟"
        ],
        answerIndex: 0,
        explanation: "'شرفتونا' یعنی به ما افتخار دادید و شرف حضور آوردید. پاسخ مودبانه آن 'الشرف لنا' (شرف برای ماست) می‌باشد."
      }
    ]
  };

  const handleStartQuiz = async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedAns(null);
    setScore(0);
    setQuizFinished(false);

    if (offlineMode) {
      // Use fallback
      const qList = fallbackQuizzes[category] || fallbackQuizzes["Arabic Colloquial Idioms"];
      setQuestions(qList);
      setLoading(false);
      triggerToast("✈️ به دلیل فعال بودن حالت پرواز، آزمون محلی آفلاین بارگذاری شد.");
      return;
    }

    try {
      // Bug fix: was a raw fetch("/api/quiz", ...) with a hardcoded
      // same-origin path - see the note in OcrTab.tsx.
      const data = await apiFetch<any>("/api/quiz", {
        method: "POST",
        body: { category, level }
      });

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        triggerToast("🎯 آزمون هوشمند ۳ گزینه‌ای با موفقیت ایجاد شد!");
      } else {
        throw new Error("دیتای برگشتی نادرست است.");
      }
    } catch (err: any) {
      // Fallback
      const qList = fallbackQuizzes[category] || fallbackQuizzes["Arabic Colloquial Idioms"];
      setQuestions(qList);
      triggerToast("⚠️ خطا در اتصال به سرور. آزمون پیش‌فرض آفلاین فعال شد.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (idx: number) => {
    if (selectedAns !== null) return; // Answered already
    setSelectedAns(idx);
    
    const correctIdx = questions[currentIdx].answerIndex;
    if (idx === correctIdx) {
      setScore(s => s + 10);
      triggerToast("✅ پاسخ کاملاً صحیح! +۱۰ امتیاز");
    } else {
      triggerToast("❌ پاسخ نادرست بود.");
    }
  };

  const handleNext = () => {
    setSelectedAns(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setQuizFinished(true);
      triggerToast("🏆 آزمون به پایان رسید! امتیاز نهایی محاسبه شد.");
    }
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      
      {/* Quiz Config Form */}
      {questions.length === 0 && !loading && (
        <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5 text-[#14B8A6]" />
            <span>آزمون تعاملی و خودسنجی گویش‌های سفر (Lingo Quiz)</span>
          </h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed">سطح تسلط زبان و اطلاعات فرهنگی عتبات و خلیج خود را به وسیله کوئیزهای هوش مصنوعی بسنجید. موضوع و سطح مد نظر خود را انتخاب کرده و شروع کنید:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-[#94A3B8]">دسته بندی و موضوع کوئیز:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5 outline-none"
              >
                <option value="Arabic Colloquial Idioms">اصطلاحات و ضرب‌المثل‌های عامیانه</option>
                <option value="Dialect Comparison">مقایسه تفاوت لهجه‌ها (عراقی، شامی، مصری)</option>
                <option value="Travel Customs">آداب معاشرت و رسوم بومی کشورها</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#94A3B8]">درجه سختی آزمون:</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-[#090D16] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5 outline-none"
              >
                <option value="Beginner">مبتدی (آموزش‌های اولیه)</option>
                <option value="Intermediate">متوسط (کاربردی سفر)</option>
                <option value="Advanced">پیشرفته (اصطلاحات بومی پیچیده)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>تولید کوئیز ۳ سواله هوشمند سفر</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center bg-[#141C2E] rounded-2xl border border-[#1E293B] space-y-3">
          <RefreshCw className="w-6 h-6 text-[#14B8A6] animate-spin mx-auto" />
          <p className="text-xs text-[#14B8A6] font-bold">هوش مصنوعی در حال بررسی سوالات بومی و تولید گزینه‌هاست...</p>
        </div>
      )}

      {/* Quiz Active Interface */}
      {questions.length > 0 && !quizFinished && (
        <div className="bg-[#141C2E] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-[#1E293B]/60 pb-2">
            <span className="text-[11px] text-[#94A3B8]">سوال {currentIdx+1} از {questions.length}</span>
            <span className="text-[#14B8A6] font-mono text-xs font-black">امتیاز شما: {score}</span>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-black text-[#F8FAFC] leading-relaxed">{questions[currentIdx].question}</h4>
            
            <div className="grid grid-cols-1 gap-2.5">
              {questions[currentIdx].options.map((opt: string, idx: number) => {
                const isSelected = selectedAns === idx;
                const correctIdx = questions[currentIdx].answerIndex;
                const isCorrect = idx === correctIdx;
                
                let btnStyle = "bg-[#090D16] border-[#1E293B] text-[#F8FAFC] hover:border-[#14B8A6]/40";
                if (selectedAns !== null) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                  } else if (isSelected) {
                    btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                  } else {
                    btnStyle = "bg-[#090D16]/40 border-[#1E293B]/40 text-[#94A3B8]/60";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={selectedAns !== null}
                    className={`text-right p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedAns !== null && isCorrect && <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mr-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedAns !== null && (
            <div className="bg-[#090D16]/50 p-4 rounded-xl border border-[#1E293B] space-y-3 animate-scaleUp">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-extrabold">
                <Info className="w-4.5 h-4.5 text-[#14B8A6]" />
                <span>💡 تحلیل تشریحی پاسخ توسط هوش مصنوعی:</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{questions[currentIdx].explanation}</p>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNext}
                  className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold px-5 py-2 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{currentIdx === questions.length - 1 ? "مشاهده نتیجه نهایی" : "سوال بعدی"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz Finished Screen */}
      {quizFinished && (
        <div className="bg-[#141C2E] border border-[#1E293B] p-6 rounded-2xl text-center space-y-4 animate-scaleUp shadow-xl">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce-slow" />
          <h3 className="text-base font-extrabold text-[#F8FAFC]">تبریک! کوئیز گویش‌شناسی به پایان رسید.</h3>
          <p className="text-xs text-[#94A3B8]">شما تمامی سناریوهای تستی این آزمون را به اتمام رساندید.</p>
          
          <div className="bg-[#090D16] p-4 rounded-xl border border-[#1E293B] max-w-xs mx-auto">
            <p className="text-xs text-[#94A3B8]">امتیاز نهایی کسب شده:</p>
            <p className="text-2xl font-black text-[#14B8A6] font-mono mt-1">{score} / {questions.length * 10}</p>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => {
                setQuestions([]);
                setQuizFinished(false);
              }}
              className="bg-[#1E293B] hover:bg-[#141C2E] text-[#F8FAFC] border border-[#1E293B] text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer"
            >
              انتخاب آزمون جدید
            </button>
            <button
              onClick={handleStartQuiz}
              className="bg-[#14B8A6] hover:bg-[#0D9488] text-black font-extrabold px-6 py-2.5 rounded-lg text-xs cursor-pointer"
            >
              تلاش مجدد همین آزمون
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
