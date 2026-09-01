// Accent Coach: a compact, curated set of real tips per dialect - only for
// the dialects this app's PERSONAS (data.ts) actually has voices/characters
// for. Deliberately kept short and general rather than an exhaustive
// linguistic database: these are well-established characteristics of each
// dialect, not fabricated specifics.

export interface AccentTip {
  category: "vocabulary" | "pronunciation" | "rhythm" | "expression" | "grammar";
  labelFa: string;
  textFa: string;
}

export const ACCENT_COACH: Record<string, AccentTip[]> = {
  "لهجه عراقی": [
    { category: "pronunciation", labelFa: "تلفظ", textFa: "حرف «ق» اغلب مثل «گ» فارسی تلفظ می‌شود (مثلاً «قال» به «گال»)." },
    { category: "vocabulary", labelFa: "واژگان", textFa: "«شلون» به‌جای «کیف حالک» برای احوال‌پرسی رایج است." },
    { category: "expression", labelFa: "اصطلاح رایج", textFa: "«زین» یعنی «خوب»؛ «هواي» یعنی «خیلی زیاد»." },
    { category: "rhythm", labelFa: "ریتم", textFa: "لحن گفتار معمولاً گرم و صمیمی و کمی کشیده‌تر از عربی فصیح است." }
  ],
  "لهجه لبنانی (شامی)": [
    { category: "pronunciation", labelFa: "تلفظ", textFa: "حرف «ق» اغلب کاملاً حذف می‌شود (شبیه یک وقفه کوتاه)، مثلاً «قلب» به «ألب»." },
    { category: "vocabulary", labelFa: "واژگان", textFa: "واژه‌های فرانسوی زیادی وارد گفتار روزمره شده (مثل «مرسی» به‌جای «شکراً»)." },
    { category: "expression", labelFa: "اصطلاح رایج", textFa: "«يعطيك العافية» یک تعارف رایج برای تشکر از زحمت کسی است." },
    { category: "rhythm", labelFa: "ریتم", textFa: "آهنگ گفتار نرم و آوازین است، با کشیدگی روی هجاهای پایانی." }
  ],
  "لهجه خلیجی": [
    { category: "pronunciation", labelFa: "تلفظ", textFa: "بسیاری از کلمات به عربی فصیح نزدیک‌تر باقی مانده‌اند، به‌خصوص در گفتار رسمی." },
    { category: "vocabulary", labelFa: "واژگان", textFa: "«شلونك/شخبارك» رایج‌ترین شکل احوال‌پرسی است." },
    { category: "expression", labelFa: "اصطلاح رایج", textFa: "«ان‌شاءالله» و «ماشاءالله» در مکالمات روزمره بسیار پرکاربردند." },
    { category: "rhythm", labelFa: "ریتم", textFa: "سرعت گفتار معمولاً آرام‌تر و با تلفظ واضح‌تر از دیگر لهجه‌هاست." }
  ],
  "لهجه مصری": [
    { category: "pronunciation", labelFa: "تلفظ", textFa: "حرف «ج» مثل «گ» سخت تلفظ می‌شود (مثلاً «جميل» به «گميل»)." },
    { category: "vocabulary", labelFa: "واژگان", textFa: "لهجه مصری به‌خاطر فیلم و موسیقی، در سراسر جهان عرب قابل‌فهم‌ترین لهجه است." },
    { category: "expression", labelFa: "اصطلاح رایج", textFa: "«إزيك/إزيّك» یعنی «حالت چطوره؟»؛ «تمام» یعنی «باشه/خوبه»." },
    { category: "rhythm", labelFa: "ریتم", textFa: "لحن گفتار پرانرژی و اغلب همراه با طنز و اغراق در بیان است." }
  ],
  "انگلیسی آمریکایی": [
    { category: "pronunciation", labelFa: "تلفظ", textFa: "این لهجه rhotic است، یعنی حرف r همیشه (حتی آخر کلمه) تلفظ می‌شود: car، better." },
    { category: "pronunciation", labelFa: "تلفظ", textFa: "حرف t وسط کلمه اغلب مثل یک d سریع تلفظ می‌شود (flapping): water ≈ wader." },
    { category: "vocabulary", labelFa: "واژگان", textFa: "apartment، elevator، cookie، vacation به‌جای معادل بریتانیایی‌شان." },
    { category: "expression", labelFa: "اصطلاح رایج", textFa: "«gonna»، «wanna»، «What's up?» در گفتار غیررسمی بسیار رایج‌اند." }
  ],
  "انگلیسی بریتانیایی/استاندارد": [
    { category: "pronunciation", labelFa: "تلفظ", textFa: "این لهجه (RP) غیر rhotic است: حرف r در پایان کلمه معمولاً تلفظ نمی‌شود: car، better." },
    { category: "vocabulary", labelFa: "واژگان", textFa: "flat، lift، biscuit، holiday به‌جای معادل آمریکایی‌شان." },
    { category: "expression", labelFa: "اصطلاح رایج", textFa: "«cheers» هم برای تشکر و هم به‌جای «خداحافظ» غیررسمی به‌کار می‌رود." },
    { category: "grammar", labelFa: "دستور زبان", textFa: "استفاده بیشتر از present perfect (I've just eaten) به‌جای simple past آمریکایی." }
  ]
};

export function getAccentTips(dialectId: string): AccentTip[] {
  return ACCENT_COACH[dialectId] ?? [];
}
