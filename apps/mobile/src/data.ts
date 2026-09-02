import { Phrase } from "./types";

export const CATEGORIES = [
  { id: "all", nameFa: "همه اصطلاحات", nameEn: "All Phrases", icon: "Compass" },
  { id: "greetings", nameFa: "سلام و احوالپرسی", nameEn: "Greetings", icon: "Smile" },
  { id: "conversational", nameFa: "تعارفات و گفتگو", nameEn: "Everyday Chat", icon: "MessageSquare" },
  { id: "taxi_directions", nameFa: "تاکسی و آدرس‌دهی", nameEn: "Taxi & Directions", icon: "MapPin" },
  { id: "restaurant_food", nameFa: "رستوران و غذا", nameEn: "Dining & Food", icon: "Utensils" },
  { id: "shopping_prices", nameFa: "خرید و قیمت‌ها", nameEn: "Shopping & Prices", icon: "ShoppingBag" },
  { id: "emergency_health", nameFa: "پزشکی و اورژانس", nameEn: "Safety & Health", icon: "ShieldAlert" },
  { id: "family_home", nameFa: "خانواده و منزل", nameEn: "Family & Home", icon: "Home" },
  { id: "numbers_time", nameFa: "اعداد و زمان", nameEn: "Numbers & Time", icon: "Clock" },
  { id: "phone_calls", nameFa: "تلفن و پیام", nameEn: "Phone & Messaging", icon: "Phone" },
  { id: "smalltalk_weather", nameFa: "گپ روزمره و آب‌وهوا", nameEn: "Small Talk & Weather", icon: "Cloud" },
  { id: "work_study", nameFa: "کار و تحصیل", nameEn: "Work & Study", icon: "Briefcase" },
  { id: "feelings", nameFa: "احساسات و حال‌واحوال", nameEn: "Feelings", icon: "Heart" },
  { id: "transport_public", nameFa: "اتوبوس و مترو", nameEn: "Public Transport", icon: "Bus" },
  { id: "religious_pilgrimage", nameFa: "زیارتی و مذهبی", nameEn: "Pilgrimage & Religious", icon: "Landmark" },
  { id: "tech_internet", nameFa: "اینترنت و موبایل", nameEn: "Tech & Internet", icon: "Wifi" },
  { id: "compliments_apologies", nameFa: "تعریف و عذرخواهی", nameEn: "Compliments & Apologies", icon: "Smile" },
  { id: "hotel_lodging", nameFa: "هتل و اقامت", nameEn: "Hotel & Lodging", icon: "BedDouble" },
  { id: "airport_travel", nameFa: "فرودگاه و سفر", nameEn: "Airport & Travel", icon: "Plane" },
  { id: "bank_money", nameFa: "بانک و پول", nameEn: "Bank & Money", icon: "Landmark" },
  { id: "clothing_sizes", nameFa: "لباس و سایز", nameEn: "Clothing & Sizes", icon: "Shirt" },
  { id: "education_school", nameFa: "تحصیل و مدرسه", nameEn: "Education & School", icon: "GraduationCap" }
];

// Quick-filter dialect chips shown in the dictionary (based on the `dialect` field).
export const DIALECT_FILTERS = [
  { id: "all", label: "همه لهجه‌ها" },
  { id: "عراقی", label: "عراقی" },
  { id: "لبنانی", label: "لبنانی / شامی" },
  { id: "خلیجی", label: "خلیجی" },
  { id: "مصری", label: "مصری" },
  { id: "آمریکایی", label: "انگلیسی آمریکایی" },
  { id: "بریتانیایی", label: "انگلیسی بریتانیایی" }
];

// Maps a phrase's free-text `dialect` label (+ optional `lang`) to a real
// BCP-47 locale code so the browser's Speech Synthesis engine picks a voice
// that actually matches the dialect being taught, instead of being hardcoded
// to Saudi Arabic (ar-SA) for everything including English phrases.
export function getLangCode(dialect: string, lang?: "arabic" | "english"): string {
  const d = dialect || "";
  if (lang === "english") {
    if (d.includes("آمریکایی")) return "en-US";
    if (d.includes("بریتانیایی") || d.includes("انگلستان")) return "en-GB";
    return "en-US";
  }
  if (d.includes("عراقی")) return "ar-IQ";
  if (d.includes("خلیجی")) return "ar-SA";
  if (d.includes("شامی") || d.includes("لبنانی") || d.includes("سوریه")) return "ar-LB";
  if (d.includes("مصری")) return "ar-EG";
  return "ar-SA";
}

// Fallback used when a caller only has raw text and no Phrase object
// (e.g. AI-translated text). Detects Arabic-script vs Latin-script text.
export function detectLangCode(text: string): string {
  return /[\u0600-\u06FF]/.test(text) ? "ar-SA" : "en-US";
}

export const PHRASES: Phrase[] = [
  // === GREETINGS ===
  {
    id: "g1",
    category: "greetings",
    arabic: "صباح الخير",
    arabicPhonetic: "صَباحُ الخِیر",
    arabicPhoneticLatin: "Sabaah al-khair",
    english: "Good morning",
    farsi: "صبح بخیر",
    dialect: "مشترک / فصیح",
    audioTips: "در جواب بگویید: صباح النور",
    gender: "unisex"
  },
  {
    id: "g2",
    category: "greetings",
    arabic: "صباح النور",
    arabicPhonetic: "صَباحُ النّور",
    arabicPhoneticLatin: "Sabaah an-noor",
    english: "Good morning (Response)",
    farsi: "صبح بخیر (پاسخ)",
    dialect: "مشترک / فصیح",
    audioTips: "پاسخ رسمی و صمیمی به صبح بخیر",
    gender: "unisex"
  },
  {
    id: "g3_m",
    category: "greetings",
    arabic: "شلونك؟",
    arabicPhonetic: "شِلونِک؟",
    arabicPhoneticLatin: "Shlonak?",
    english: "How are you? (To Male - Gulf/Iraq)",
    farsi: "حالت چطوره؟ (خطاب به مرد - لهجه خلیجی/عراقی)",
    dialect: "لهجه خلیجی / عراقی",
    audioTips: "پرکاربردترین احوالپرسی در عراق و کشورهای حوزه خلیج فارس از مردان",
    gender: "male_listener"
  },
  {
    id: "g3_f",
    category: "greetings",
    arabic: "شلونج؟",
    arabicPhonetic: "شِلونِج؟",
    arabicPhoneticLatin: "Shlonaj?",
    english: "How are you? (To Female - Gulf/Iraq)",
    farsi: "حالت چطوره؟ (خطاب به زن - لهجه خلیجی/عراقی)",
    dialect: "لهجه خلیجی / عراقی",
    audioTips: "تلفظ انتهای کلمه شبیه به 'چ' در فارسی است",
    gender: "female_listener"
  },
  {
    id: "g4_m",
    category: "greetings",
    arabic: "كيفك؟",
    arabicPhonetic: "کِیفَک؟",
    arabicPhoneticLatin: "Kifak?",
    english: "How are you? (To Male - Levantine)",
    farsi: "چطوری؟ (خطاب به مرد - لهجه شامی/سوریه و لبنان)",
    dialect: "لهجه شامی",
    audioTips: "در کشورهای سوریه، لبنان، اردن و فلسطین خطاب به آقایان",
    gender: "male_listener"
  },
  {
    id: "g4_f",
    category: "greetings",
    arabic: "كيفكِ؟",
    arabicPhonetic: "کِیفِک؟",
    arabicPhoneticLatin: "Kifik?",
    english: "How are you? (To Female - Levantine)",
    farsi: "چطوری؟ (خطاب به زن - لهجه شامی/سوریه و لبنان)",
    dialect: "لهجه شامی",
    audioTips: "با کسره در انتهای کلمه خطاب به خانم‌ها استفاده می‌شود",
    gender: "female_listener"
  },
  {
    id: "g5_m",
    category: "greetings",
    arabic: "إزيك؟",
    arabicPhonetic: "اِزَیَّک؟",
    arabicPhoneticLatin: "Izzayak?",
    english: "How are you? (To Male - Egyptian)",
    farsi: "چطوری؟ (خطاب به مرد - لهجه مصری)",
    dialect: "لهجه مصری",
    audioTips: "لهجه شیرین و پرطرفدار مصری خطاب به مردان",
    gender: "male_listener"
  },
  {
    id: "g5_f",
    category: "greetings",
    arabic: "إزيكِ؟",
    arabicPhonetic: "اِزَیِّک؟",
    arabicPhoneticLatin: "Izzayek?",
    english: "How are you? (To Female - Egyptian)",
    farsi: "چطوری؟ (خطاب به زن - لهجه مصری)",
    dialect: "لهجه مصری",
    audioTips: "لهجه مصری با تلفظ کسره برای خانم‌ها",
    gender: "female_listener"
  },
  {
    id: "g6",
    category: "greetings",
    arabic: "أنا بخير، شكراً",
    arabicPhonetic: "اَنا بِخِیر، شُکرَن",
    arabicPhoneticLatin: "Ana bi-khair, shukran",
    english: "I am fine, thank you",
    farsi: "من خوبم، ممنون",
    dialect: "مشترک / فصیح",
    audioTips: "پاسخ استاندارد و مودبانه در تمامی لهجه‌ها برای زن و مرد",
    gender: "unisex"
  },
  {
    id: "g7",
    category: "greetings",
    arabic: "أهلاً وسهلاً",
    arabicPhonetic: "اَهلَن وَ سَهلَن",
    arabicPhoneticLatin: "Ahlan wa sahlan",
    english: "Welcome",
    farsi: "خوش آمدید",
    dialect: "مشترک",
    audioTips: "می‌توانید به اختصار بگویید: أهلاً",
    gender: "unisex"
  },
  {
    id: "g8",
    category: "greetings",
    arabic: "طاب يومك",
    arabicPhonetic: "طابَ یَومُک",
    arabicPhoneticLatin: "Taaba yawmuk",
    english: "Have a good day",
    farsi: "روز خوبی داشته باشید",
    dialect: "فصیح",
    audioTips: "آرزوی روز خوش به صورت رسمی و مودبانه",
    gender: "unisex"
  },
  {
    id: "g9",
    category: "greetings",
    arabic: "مع السلامة",
    arabicPhonetic: "مَعَ السَّلامِه",
    arabicPhoneticLatin: "Ma'as-salama",
    english: "Goodbye",
    farsi: "خداحافظ",
    dialect: "مشترک",
    audioTips: "در پاسخ معمولاً از همین عبارت استفاده می‌شود",
    gender: "unisex"
  },
  {
    id: "g10",
    category: "greetings",
    arabic: "إلى اللقاء",
    arabicPhonetic: "اِلالِّقاء",
    arabicPhoneticLatin: "Ila-liqaa",
    english: "See you later",
    farsi: "به امید دیدار",
    dialect: "فصیح / مشترک",
    audioTips: "برای خداحافظی صمیمانه و غیررسمی",
    gender: "unisex"
  },
  {
    id: "g11_m",
    category: "greetings",
    arabic: "شو اسمك؟",
    arabicPhonetic: "شو اِسمَک؟",
    arabicPhoneticLatin: "Shu ismak?",
    english: "What is your name? (To Male)",
    farsi: "اسمت چیه؟ (خطاب به مرد)",
    dialect: "عامه (محلی)",
    audioTips: "در فصیح به صورت 'ما اسمك؟' گفته می‌شود",
    gender: "male_listener"
  },
  {
    id: "g11_f",
    category: "greetings",
    arabic: "شو اسمكِ؟",
    arabicPhonetic: "شو اِسمِک؟",
    arabicPhoneticLatin: "Shu ismek?",
    english: "What is your name? (To Female)",
    farsi: "اسمت چیه؟ (خطاب به زن)",
    dialect: "عامه (محلی)",
    audioTips: "تلفظ با کسره انتهای کلمه برای خانم‌ها",
    gender: "female_listener"
  },
  {
    id: "g12",
    category: "greetings",
    arabic: "اسمي ...",
    arabicPhonetic: "اِسمی ...",
    arabicPhoneticLatin: "Ismi ...",
    english: "My name is ...",
    farsi: "اسم من ... است",
    dialect: "مشترک",
    audioTips: "مثال: اسمي علي (اسم من علی است)",
    gender: "unisex"
  },

  // === EVERYDAY CONVERSATION ===
  {
    id: "c13",
    category: "conversational",
    arabic: "نعم / لا",
    arabicPhonetic: "نَعَم / لا",
    arabicPhoneticLatin: "Na'am / La",
    english: "Yes / No",
    farsi: "بله / خیر",
    dialect: "مشترک",
    audioTips: "در لهجه عامه به جای نعم معمولاً 'إي' (Eey) گفته می‌شود",
    gender: "unisex"
  },
  {
    id: "c14_m",
    category: "conversational",
    arabic: "لو سمحت",
    arabicPhonetic: "لَو سَمَحت",
    arabicPhoneticLatin: "Law samaht",
    english: "Please / Excuse me (To Male)",
    farsi: "لطفاً / ببخشید آقا (خطاب به مرد)",
    dialect: "مشترک",
    audioTips: "برای جلب توجه فروشنده، گارسون یا راننده مرد بسیار کاربردی است",
    gender: "male_listener"
  },
  {
    id: "c14_f",
    category: "conversational",
    arabic: "لو سمحتِ",
    arabicPhonetic: "لَو سَمَحتی",
    arabicPhoneticLatin: "Law samahti",
    english: "Please / Excuse me (To Female)",
    farsi: "لطفاً / ببخشید خانم (خطاب به زن)",
    dialect: "مشترک",
    audioTips: "برای جلب توجه فروشنده، گارسون یا راننده زن بسیار کاربردی است",
    gender: "female_listener"
  },
  {
    id: "c15_m",
    category: "conversational",
    arabic: "من فضلك",
    arabicPhonetic: "مِن فَضلَک",
    arabicPhoneticLatin: "Min fadlak",
    english: "Please (To Male)",
    farsi: "لطفاً (خطاب به مرد - رسمی)",
    dialect: "مشترک",
    audioTips: "یک اصطلاح کاملاً محترمانه برای درخواست کردن چیزی از یک آقا",
    gender: "male_listener"
  },
  {
    id: "c15_f",
    category: "conversational",
    arabic: "من فضلكِ",
    arabicPhonetic: "مِن فَضلِک",
    arabicPhoneticLatin: "Min fadlik",
    english: "Please (To Female)",
    farsi: "لطفاً (خطاب به زن - رسمی)",
    dialect: "مشترک",
    audioTips: "یک اصطلاح کاملاً محترمانه برای درخواست کردن چیزی از یک خانم",
    gender: "female_listener"
  },
  {
    id: "c16",
    category: "conversational",
    arabic: "شكراً جزيلاً",
    arabicPhonetic: "شُکرَن جَزیلَن",
    arabicPhoneticLatin: "Shukran jazeelan",
    english: "Thank you very much",
    farsi: "خیلی ممنونم",
    dialect: "مشترک",
    audioTips: "تشکر رسمی و غلیظ برای قدردانی",
    gender: "unisex"
  },
  {
    id: "c17",
    category: "conversational",
    arabic: "العفو",
    arabicPhonetic: "العَفوُ",
    arabicPhoneticLatin: "Al-afw",
    english: "You are welcome / Sorry",
    farsi: "خواهش می‌کنم (در جواب تشکر) / عفو کنید",
    dialect: "مشترک",
    audioTips: "در جواب تشکر 'شکراً' گفته می‌شود",
    gender: "unisex"
  },
  {
    id: "c18",
    category: "conversational",
    arabic: "مو مشكلة",
    arabicPhonetic: "مو مُشکِلِه",
    arabicPhoneticLatin: "Mo mushkila",
    english: "No problem",
    farsi: "مشکلی نیست / اشکالی نداره",
    dialect: "عامه (محلی)",
    audioTips: "در فصیح به صورت 'لا مشكلة' گفته می‌شود",
    gender: "unisex"
  },
  {
    id: "c19",
    category: "conversational",
    arabic: "ما عم أفهم",
    arabicPhonetic: "ما عَم اَفهَم",
    arabicPhoneticLatin: "Ma am afham",
    english: "I do not understand",
    farsi: "متوجه نمی‌شوم / نمی‌فهمم چی می‌گید",
    dialect: "لهجه شامی / عامه",
    audioTips: "حرف 'عم' نشان‌دهنده حال استمراری در لهجه‌های عامه است",
    gender: "unisex"
  },
  {
    id: "c20_m",
    category: "conversational",
    arabic: "تتكلم فارسي أو إنجليزي؟",
    arabicPhonetic: "تِتکَلَّم فارسی اَو اِنگلیزی؟",
    arabicPhoneticLatin: "Tetkallam Farsi aw Ingleezi?",
    english: "Do you speak Farsi or English? (To Male)",
    farsi: "آیا فارسی یا انگلیسی صحبت می‌کنی؟ (خطاب به مرد)",
    dialect: "عامه",
    audioTips: "برای گفتگو با مخاطب آقا",
    gender: "male_listener"
  },
  {
    id: "c20_f",
    category: "conversational",
    arabic: "تتكلمين فارسي أو إنجليزي؟",
    arabicPhonetic: "تِتکَلَّمین فارسی اَو اِنگلیزی؟",
    arabicPhoneticLatin: "Tetkallameen Farsi aw Ingleezi?",
    english: "Do you speak Farsi or English? (To Female)",
    farsi: "آیا فارسی یا انگلیسی صحبت می‌کنی؟ (خطاب به زن)",
    dialect: "عامه",
    audioTips: "مخاطب زن با پسوند 'ین' در فعل مشخص می‌شود",
    gender: "female_listener"
  },
  {
    id: "c21",
    category: "conversational",
    arabic: "أنا ما أعرف عربي",
    arabicPhonetic: "اَنا ما اَعرِف عَرَبی",
    arabicPhoneticLatin: "Ana ma a'raf Arabi",
    english: "I don't speak Arabic",
    farsi: "من عربی بلد نیستم",
    dialect: "عامه",
    audioTips: "ساده‌ترین روش برای گفتن اینکه عربی متوجه نمی‌شوید",
    gender: "unisex"
  },
  {
    id: "c22_m",
    category: "conversational",
    arabic: "ممكن تحكي على مهلك؟",
    arabicPhonetic: "مُمکِن تَحکی عَلی مَهلَک؟",
    arabicPhoneticLatin: "Mumkin tahki ala mehlak?",
    english: "Could you please speak slower? (To Male)",
    farsi: "میشه لطفاً آروم‌تر صحبت کنید؟ (خطاب به مرد)",
    dialect: "عامه (شامی / خلیجی)",
    audioTips: "تحکی یعنی صحبت کنی، علی مهلک یعنی با آرامش و یواش",
    gender: "male_listener"
  },
  {
    id: "c22_f",
    category: "conversational",
    arabic: "ممكن تحكي على مهلكِ؟",
    arabicPhonetic: "مُمکِن تَحکی عَلی مَهلِک؟",
    arabicPhoneticLatin: "Mumkin tahki ala mehlik?",
    english: "Could you please speak slower? (To Female)",
    farsi: "میشه لطفاً آروم‌تر صحبت کنید؟ (خطاب به زن)",
    dialect: "عامه (شامی / خلیجی)",
    audioTips: "تلفظ با کسره 'مهلِک' خطاب به خانم‌ها",
    gender: "female_listener"
  },
  {
    id: "c23",
    category: "conversational",
    arabic: "عيد من فضلك",
    arabicPhonetic: "عید مِن فَضلِک",
    arabicPhoneticLatin: "Eed min fadlak",
    english: "Repeat please",
    farsi: "لطفاً تکرار کنید (دوباره بگید)",
    dialect: "مشترک",
    audioTips: "کلمه عید یعنی تکرار کن (از ریشه اعاده)",
    gender: "unisex"
  },
  {
    id: "c24",
    category: "conversational",
    arabic: "شو يعني هاد؟",
    arabicPhonetic: "شو یَعنی هاد؟",
    arabicPhoneticLatin: "Shu ya'ni had?",
    english: "What does this mean?",
    farsi: "معنی این چیست؟ / این یعنی چی؟",
    dialect: "عامه (شامی)",
    audioTips: "برای پرسیدن معنی کلمات ناشناس با اشاره دست به اشیا",
    gender: "unisex"
  },
  {
    id: "c25",
    category: "conversational",
    arabic: "إن شاء الله",
    arabicPhonetic: "اِن شاءَ الله",
    arabicPhoneticLatin: "In sha' Allah",
    english: "God willing",
    farsi: "انشالله / به امید خدا",
    dialect: "مشترک",
    audioTips: "در مکالمات روزمره بسیار زیاد تکرار می‌شود",
    gender: "unisex"
  },
  {
    id: "c26",
    category: "conversational",
    arabic: "الحمد لله",
    arabicPhonetic: "اَلحَمدُ لله",
    arabicPhoneticLatin: "Al-hamdulillah",
    english: "Praise be to God",
    farsi: "الحمدلله / خدا را شکر",
    dialect: "مشترک",
    audioTips: "پاسخ متداول به احوالپرسی",
    gender: "unisex"
  },
  {
    id: "c27_m",
    category: "conversational",
    arabic: "تسلم ايدك",
    arabicPhonetic: "تِسلَم ایدَک",
    arabicPhoneticLatin: "Teslam eedak",
    english: "Bless your hands (To Male)",
    farsi: "دستت درد نکنه (خطاب به مرد)",
    dialect: "عامه",
    audioTips: "تعارف بسیار زیبا پس از دریافت خدمات، غذا یا هدیه از یک آقا",
    gender: "male_listener"
  },
  {
    id: "c27_f",
    category: "conversational",
    arabic: "تسلم ايدكِ",
    arabicPhonetic: "تِسلَم ایدِک",
    arabicPhoneticLatin: "Teslam eedek",
    english: "Bless your hands (To Female)",
    farsi: "دستت درد نکنه (خطاب به زن)",
    dialect: "عامه",
    audioTips: "تعارف بسیار زیبا پس از دریافت خدمات یا هدیه از یک خانم",
    gender: "female_listener"
  },

  // === TAXI & DIRECTIONS ===
  {
    id: "t28",
    category: "taxi_directions",
    arabic: "وين ... ؟",
    arabicPhonetic: "وِین ... ؟",
    arabicPhoneticLatin: "Wein ... ?",
    english: "Where is ... ?",
    farsi: "کجاست ... ؟",
    dialect: "عامه",
    audioTips: "در فصیح به صورت 'أين' (Ayna) گفته می‌شود",
    gender: "unisex"
  },
  {
    id: "t29",
    category: "taxi_directions",
    arabic: "وين موقف الباص؟",
    arabicPhonetic: "وِین مَوقِف الباص؟",
    arabicPhoneticLatin: "Wein mawqif al-bas?",
    english: "Where is the bus station?",
    farsi: "ایستگاه اتوبوس کجاست؟",
    dialect: "مشترک",
    audioTips: "موقف یعنی محل ایستادن یا ایستگاه",
    gender: "unisex"
  },
  {
    id: "t30",
    category: "taxi_directions",
    arabic: "وين المطار؟",
    arabicPhonetic: "وِین المَطار؟",
    arabicPhoneticLatin: "Wein al-matar?",
    english: "Where is the airport?",
    farsi: "فرودگاه کجاست؟",
    dialect: "مشترک",
    audioTips: "برای مسیر فرودگاه کاربرد دارد",
    gender: "unisex"
  },
  {
    id: "t31",
    category: "taxi_directions",
    arabic: "وين الفندق؟",
    arabicPhonetic: "وِین الفُندُق؟",
    arabicPhoneticLatin: "Wein al-fundoq?",
    english: "Where is the hotel?",
    farsi: "هتل کجاست؟",
    dialect: "مشترک",
    audioTips: "می‌توانید اسم هتل را بعد از آن بگویید",
    gender: "unisex"
  },
  {
    id: "t32",
    category: "taxi_directions",
    arabic: "روح دغري",
    arabicPhonetic: "روح دُغری",
    arabicPhoneticLatin: "Rooh deghri",
    english: "Go straight",
    farsi: "مستقیم برو",
    dialect: "لهجه شامی / مصری",
    audioTips: "دغری یعنی مستقیم و بدون انحراف",
    gender: "unisex"
  },
  {
    id: "t33",
    category: "taxi_directions",
    arabic: "لف يمين",
    arabicPhonetic: "لِف یَمین",
    arabicPhoneticLatin: "Lif yameen",
    english: "Turn right",
    farsi: "بپیچ راست / سمت راست برو",
    dialect: "مشترک",
    audioTips: "لف یعنی دور زدن یا پیچیدن",
    gender: "unisex"
  },
  {
    id: "t34",
    category: "taxi_directions",
    arabic: "لف يسار",
    arabicPhonetic: "لِف یَسار",
    arabicPhoneticLatin: "Lif yasar",
    english: "Turn left",
    farsi: "بپیچ چپ / سمت چپ برو",
    dialect: "مشترک",
    audioTips: "کلمه یسار یعنی چپ، در لهجه مصری 'شمال' (Shimal) نیز می‌گویند",
    gender: "unisex"
  },
  {
    id: "t35_m",
    category: "taxi_directions",
    arabic: "وقف هون لو سمحت",
    arabicPhonetic: "وَقِّف هون لَو سَمَحت",
    arabicPhoneticLatin: "Waqqif hon law samaht",
    english: "Stop here please (To Male)",
    farsi: "اینجا نگه دارید لطفاً (خطاب به راننده مرد)",
    dialect: "عامه",
    audioTips: "جمله طلایی برای پیاده شدن از تاکسی وقتی راننده آقا است",
    gender: "male_listener"
  },
  {
    id: "t35_f",
    category: "taxi_directions",
    arabic: "وقف هون لو سمحتِ",
    arabicPhonetic: "وَقِّف هون لَو سَمَحتی",
    arabicPhoneticLatin: "Waqqif hon law samahti",
    english: "Stop here please (To Female)",
    farsi: "اینجا نگه دارید لطفاً (خطاب به راننده زن)",
    dialect: "عامه",
    audioTips: "جمله طلایی برای پیاده شدن از تاکسی وقتی راننده خانم است",
    gender: "female_listener"
  },
  {
    id: "t36",
    category: "taxi_directions",
    arabic: "كم وقت يحتاج لنوصل؟",
    arabicPhonetic: "کَم وَقت یَحتج لِنوصَل؟",
    arabicPhoneticLatin: "Kam waqt yahtaj linousal?",
    english: "How long to arrive?",
    farsi: "چقدر طول می‌کشد تا برسیم؟",
    dialect: "عامه",
    audioTips: "نوصل یعنی برسیم و وارد شویم",
    gender: "unisex"
  },
  {
    id: "t37",
    category: "taxi_directions",
    arabic: "كم حساب التاكسي للفندق؟",
    arabicPhonetic: "کَم حِساب التاکسی لِلفُندُق؟",
    arabicPhoneticLatin: "Kam hisab at-taxi lel-fundoq?",
    english: "How much is the taxi to the hotel?",
    farsi: "کرایه تاکسی تا هتل چقدر می‌شود؟",
    dialect: "عامه",
    audioTips: "قبل از سوار شدن حتماً بر سر قیمت توافق کنید یا بگویید العداد (متر)",
    gender: "unisex"
  },

  // === DINING & FOOD ===
  {
    id: "f39_m",
    category: "restaurant_food",
    arabic: "أنا جوعان",
    arabicPhonetic: "اَنا جَوعان",
    arabicPhoneticLatin: "Ana jaw'an",
    english: "I am hungry (Male speaker)",
    farsi: "من گرسنه‌ام (گوینده مرد)",
    dialect: "مشترک",
    audioTips: "گوینده آقا برای اعلام گرسنگی خود از این کلمه استفاده می‌کند",
    gender: "male_speaker"
  },
  {
    id: "f39_f",
    category: "restaurant_food",
    arabic: "أنا جوعانة",
    arabicPhonetic: "اَنا جَوعانِه",
    arabicPhoneticLatin: "Ana jaw'ana",
    english: "I am hungry (Female speaker)",
    farsi: "من گرسنه‌ام (گوینده زن)",
    dialect: "مشترک",
    audioTips: "خانم‌ها برای اعلام گرسنگی پسوند تاء تأنیث 'ه' را تلفظ می‌کنند",
    gender: "female_speaker"
  },
  {
    id: "f40_m",
    category: "restaurant_food",
    arabic: "أنا عطشان",
    arabicPhonetic: "اَنا عَطشان",
    arabicPhoneticLatin: "Ana 'atshan",
    english: "I am thirsty (Male speaker)",
    farsi: "من تشنه‌ام (گوینده مرد)",
    dialect: "مشترک",
    audioTips: "گوینده آقا برای درخواست آب",
    gender: "male_speaker"
  },
  {
    id: "f40_f",
    category: "restaurant_food",
    arabic: "أنا عطشانة",
    arabicPhonetic: "اَنا عَطشانِه",
    arabicPhoneticLatin: "Ana 'atshaneh",
    english: "I am thirsty (Female speaker)",
    farsi: "من تشنه‌ام (گوینده زن)",
    dialect: "مشترک",
    audioTips: "گوینده خانم برای درخواست آب",
    gender: "female_speaker"
  },
  {
    id: "f41",
    category: "restaurant_food",
    arabic: "بدي طاولة لشخصين",
    arabicPhonetic: "بِدّی طاوِلِه لِشَخصین",
    arabicPhoneticLatin: "Beddi tawla le-shakhsayn",
    english: "I want a table for two",
    farsi: "من یک میز برای دو نفر می‌خواهم",
    dialect: "لهجه شامی",
    audioTips: "بدی یعنی می‌خواهم (خواستن)، طاوله یعنی میز",
    gender: "unisex"
  },
  {
    id: "f42",
    category: "restaurant_food",
    arabic: "المنيو لو سمحت",
    arabicPhonetic: "المِنیو لَو سَمَحت",
    arabicPhoneticLatin: "Al-menu law samaht",
    english: "The menu, please",
    farsi: "منوی غذا را لطفاً بیاورید",
    dialect: "مشترک",
    audioTips: "گاهی به آن 'قائمة الطعام' (Qa'imat at-ta'am) نیز می‌گویند",
    gender: "unisex"
  },
  {
    id: "f43",
    category: "restaurant_food",
    arabic: "مي بدون غاز",
    arabicPhonetic: "مَیّ بِدون گاز",
    arabicPhoneticLatin: "Mayy bedoon ghaz",
    english: "Still water",
    farsi: "آب بدون گاز (آب معدنی معمولی)",
    dialect: "عامه",
    audioTips: "در کشورهای عربی آب گازدار هم محبوب است، پس این کلمه کلیدی است",
    gender: "unisex"
  },
  {
    id: "f44",
    category: "restaurant_food",
    arabic: "الحساب لو سمحت",
    arabicPhonetic: "الحِساب لَو سَمَحت",
    arabicPhoneticLatin: "Al-hisab law samaht",
    english: "The bill, please",
    farsi: "صورتحساب را لطفاً بیاورید / فاکتور چقدر شد؟",
    dialect: "مشترک",
    audioTips: "مهم‌ترین اصطلاح برای گارسون پس از اتمام غذا",
    gender: "unisex"
  },
  {
    id: "f45",
    category: "restaurant_food",
    arabic: "الأكل كتير طيب",
    arabicPhonetic: "الاَکل کِتیر طَیِّب",
    arabicPhoneticLatin: "Al-akl kteer tayyib",
    english: "The food is very delicious",
    farsi: "غذا خیلی خوشمزه بود",
    dialect: "لهجه شامی",
    audioTips: "کتیر یعنی خیلی، طیب یعنی خوشمزه و نیکو",
    gender: "unisex"
  },
  {
    id: "f46",
    category: "restaurant_food",
    arabic: "شاي / قهوة",
    arabicPhonetic: "شای / قَهوِه",
    arabicPhoneticLatin: "Shay / Qahwa",
    english: "Tea / Coffee",
    farsi: "چای / قهوه",
    dialect: "مشترک",
    audioTips: "قهوه عربی معمولاً طعم هل و زعفران دارد",
    gender: "unisex"
  },
  {
    id: "f47",
    category: "restaurant_food",
    arabic: "بدون سكر",
    arabicPhonetic: "بِدون سُکَّر",
    arabicPhoneticLatin: "Bedoon sukkar",
    english: "Without sugar",
    farsi: "بدون شکر",
    dialect: "مشترک",
    audioTips: "بسیار مهم برای افراد دیابتی یا کسانی که چای رژیمی می‌خواهند",
    gender: "unisex"
  },
  {
    id: "f48",
    category: "restaurant_food",
    arabic: "هذا حار؟",
    arabicPhonetic: "هادا حارّ؟",
    arabicPhoneticLatin: "Hadha harr?",
    english: "Is this spicy?",
    farsi: "آیا این تند است؟",
    dialect: "مشترک",
    audioTips: "حار در غذا یعنی فلفلی و تند، در هوا یعنی داغ و گرم",
    gender: "unisex"
  },
  {
    id: "f49_m",
    category: "restaurant_food",
    arabic: "أنا نباتي",
    arabicPhonetic: "اَنا نَباتی",
    arabicPhoneticLatin: "Ana nabati",
    english: "I am vegetarian (Male speaker)",
    farsi: "من گیاه‌خوار هستم (گوینده مرد)",
    dialect: "مشترک / فصیح",
    audioTips: "برای آقایان گیاهخوار جهت خرید یا سفارش غذا",
    gender: "male_speaker"
  },
  {
    id: "f49_f",
    category: "restaurant_food",
    arabic: "أنا نباتية",
    arabicPhonetic: "اَنا نَباتیِّه",
    arabicPhoneticLatin: "Ana nabatiya",
    english: "I am vegetarian (Female speaker)",
    farsi: "من گیاه‌خوار هستم (گوینده زن)",
    dialect: "مشترک / فصیح",
    audioTips: "با پسوند تاء تأنیث برای خانم‌های گیاهخوار",
    gender: "female_speaker"
  },

  // === SHOPPING & PRICES ===
  {
    id: "s50",
    category: "shopping_prices",
    arabic: "قديش سعر هاد؟",
    arabicPhonetic: "قَدیش سِعر هاد؟",
    arabicPhoneticLatin: "Adesh se'er had?",
    english: "How much is the price of this?",
    farsi: "قیمت این چقدر است؟",
    dialect: "لهجه شامی",
    audioTips: "در خلیجی می‌گویند 'بكم هادا؟' (Bikam hadha?)",
    gender: "unisex"
  },
  {
    id: "s51",
    category: "shopping_prices",
    arabic: "كتير غالي!",
    arabicPhonetic: "کِتیر غالی!",
    arabicPhoneticLatin: "Kteer ghali!",
    english: "Very expensive!",
    farsi: "خیلی گرونه!",
    dialect: "عامه",
    audioTips: "اسلحه اول در چانه‌زنی خرید کالا در بازارهای سنتی",
    gender: "unisex"
  },
  {
    id: "s52",
    category: "shopping_prices",
    arabic: "كم آخر سعر؟",
    arabicPhonetic: "کَم آخِر سِعر؟",
    arabicPhoneticLatin: "Kam akher se'er?",
    english: "What is the final price?",
    farsi: "آخرش چند میدی؟ / قیمت نهایی چیست؟",
    dialect: "عامه",
    audioTips: "برای دریافت تخفیف قطعی و منصفانه",
    gender: "unisex"
  },
  {
    id: "s53_m",
    category: "shopping_prices",
    arabic: "اعطيني خصم لو سمحت",
    arabicPhonetic: "اَعطینی خَصم لَو سَمَحت",
    arabicPhoneticLatin: "A'teeni khasm law samaht",
    english: "Give me a discount, please (To Male)",
    farsi: "لطفاً به من تخفیف بدهید (خطاب به فروشنده مرد)",
    dialect: "عامه",
    audioTips: "درخواست تخفیف از فروشنده آقا",
    gender: "male_listener"
  },
  {
    id: "s53_f",
    category: "shopping_prices",
    arabic: "اعطيني خصم لو سمحتِ",
    arabicPhonetic: "اَعطینی خَصم لَو سَمَحتی",
    arabicPhoneticLatin: "A'teeni khasm law samahti",
    english: "Give me a discount, please (To Female)",
    farsi: "لطفاً به من تخفیف بدهید (خطاب به فروشنده زن)",
    dialect: "عامه",
    audioTips: "درخواست تخفیف از فروشنده خانم",
    gender: "female_listener"
  },
  {
    id: "s54",
    category: "shopping_prices",
    arabic: "تقبل كارت؟",
    arabicPhonetic: "تَقبَل کارت؟",
    arabicPhoneticLatin: "Taqbal kart?",
    english: "Do you accept credit card?",
    farsi: "آیا کارت اعتباری (پوز) قبول می‌کنید؟",
    dialect: "عامه",
    audioTips: "برای پرداخت‌های فروشگاهی",
    gender: "unisex"
  },
  {
    id: "s55",
    category: "shopping_prices",
    arabic: "بس كاش",
    arabicPhonetic: "بَس کاش",
    arabicPhoneticLatin: "Bas cash",
    english: "Only cash",
    farsi: "فقط پول نقد قبول می‌کنیم",
    dialect: "عامه",
    audioTips: "کلمه بس یعنی فقط یا کافی است",
    gender: "unisex"
  },
  {
    id: "s56_m",
    category: "shopping_prices",
    arabic: "عم أتفرج بس",
    arabicPhonetic: "عَم اَتفَرَّج بَس",
    arabicPhoneticLatin: "Am atfarraj bas",
    english: "I am just looking (Male speaker)",
    farsi: "فقط دارم تماشا می‌کنم (گوینده مرد)",
    dialect: "عامه",
    audioTips: "پاسخ آقایان توریست وقتی فروشنده به آن‌ها نزدیک می‌شود",
    gender: "male_speaker"
  },
  {
    id: "s56_f",
    category: "shopping_prices",
    arabic: "عم أتفرّج بس",
    arabicPhonetic: "عَم اَتفَرَّج بَس",
    arabicPhoneticLatin: "Am atfarraj bas",
    english: "I am just looking (Female speaker)",
    farsi: "فقط دارم تماشا می‌کنم (گوینده زن)",
    dialect: "عامه",
    audioTips: "پاسخ خانم‌های توریست وقتی فروشنده به آن‌ها نزدیک می‌شود",
    gender: "female_speaker"
  },
  {
    id: "s57_m",
    category: "shopping_prices",
    arabic: "بدي هاد",
    arabicPhonetic: "بِدّی هاد",
    arabicPhoneticLatin: "Beddi had",
    english: "I want this (Male/Unisex speaker)",
    farsi: "این را برمی‌دارم / این را می‌خواهم",
    dialect: "لهجه شامی / عامه",
    audioTips: "هاد یعنی این (اشاره به شیء نزدیک)",
    gender: "unisex"
  },

  // === EMERGENCY & MEDICAL ===
  {
    id: "e59",
    category: "emergency_health",
    arabic: "ساعدوني!",
    arabicPhonetic: "ساعِدونی!",
    arabicPhoneticLatin: "Sa'dooni!",
    english: "Help me!",
    farsi: "کمکم کنید!",
    dialect: "مشترک",
    audioTips: "با صدای بلند فریاد بزنید در مواقع اضطراری",
    gender: "unisex"
  },
  {
    id: "e61_m",
    category: "emergency_health",
    arabic: "أنا ضايع",
    arabicPhonetic: "اَنا ضایِع",
    arabicPhoneticLatin: "Ana daye'",
    english: "I am lost (Male speaker)",
    farsi: "من راه را گم کرده‌ام (گوینده مرد)",
    dialect: "عامه",
    audioTips: "زمانی که آقایان راه خود را گم کرده‌اند",
    gender: "male_speaker"
  },
  {
    id: "e61_f",
    category: "emergency_health",
    arabic: "أنا ضائعة",
    arabicPhonetic: "اَنا ضایعِه",
    arabicPhoneticLatin: "Ana day'a",
    english: "I am lost (Female speaker)",
    farsi: "من راه را گم کرده‌ام (گوینده زن)",
    dialect: "عامه",
    audioTips: "زمانی که خانم‌ها راه خود را گم کرده‌اند",
    gender: "female_speaker"
  },
  {
    id: "e62_m",
    category: "emergency_health",
    arabic: "أنا مريض",
    arabicPhonetic: "اَنا مَریض",
    arabicPhoneticLatin: "Ana mareed",
    english: "I am sick (Male speaker)",
    farsi: "من بیمارم / حالم خوب نیست (گوینده مرد)",
    dialect: "مشترک",
    audioTips: "در صورت بروز ناگهانی علائم بیماری در آقایان",
    gender: "male_speaker"
  },
  {
    id: "e62_f",
    category: "emergency_health",
    arabic: "أنا مريضة",
    arabicPhonetic: "اَنا مَریضِه",
    arabicPhoneticLatin: "Ana mareeda",
    english: "I am sick (Female speaker)",
    farsi: "من بیمارم / حالم خوب نیست (گوینده زن)",
    dialect: "مشترک",
    audioTips: "در صورت بروز ناگهانی علائم بیماری در خانم‌ها",
    gender: "female_speaker"
  },
  {
    id: "e64",
    category: "emergency_health",
    arabic: "وين المستشفى؟",
    arabicPhonetic: "وِین المُستَشفی؟",
    arabicPhoneticLatin: "Wein al-mustashfa?",
    english: "Where is the hospital?",
    farsi: "بیمارستان کجاست؟",
    dialect: "مشترک",
    audioTips: "برای مراجعه به مراکز درمانی اورژانسی",
    gender: "unisex"
  },
  {
    id: "e66",
    category: "emergency_health",
    arabic: "وين الصيدلية؟",
    arabicPhonetic: "وِین الصَّیدَلیّه؟",
    arabicPhoneticLatin: "Wein as-saydaliya?",
    english: "Where is the pharmacy?",
    farsi: "داروخانه کجاست؟",
    dialect: "مشترک",
    audioTips: "برای تهیه سریع داروها با نسخه یا بدون آن",
    gender: "unisex"
  },

  // === EXTRA IRAQI DIALECT (لهجه عراقی) ===
  { id: "iq_g1", category: "greetings", arabic: "هلا بيك", arabicPhonetic: "هَلا بیک", arabicPhoneticLatin: "Hala beek", english: "Welcome / Hi there", farsi: "خوش اومدی / سلام", dialect: "لهجه عراقی", audioTips: "احوالپرسی خودمانی و گرم بین عراقی‌ها", gender: "unisex" },
  { id: "iq_g2", category: "greetings", arabic: "شكو ماكو؟", arabicPhonetic: "شَکو ماکو؟", arabicPhoneticLatin: "Shako mako?", english: "What's up? / What's new?", farsi: "چه خبر؟", dialect: "لهجه عراقی", audioTips: "معروف‌ترین اصطلاح خودمانی عراقی برای احوالپرسی دوستانه", gender: "unisex" },
  { id: "iq_g3", category: "greetings", arabic: "تصبح على خير", arabicPhonetic: "تِصبَح عَلَی خِیر", arabicPhoneticLatin: "Tsbah 'ala khair", english: "Good night", farsi: "شب بخیر", dialect: "لهجه عراقی", audioTips: "هنگام خداحافظی شبانه استفاده می‌شود", gender: "unisex" },
  { id: "iq_c1", category: "conversational", arabic: "خوش جيت", arabicPhonetic: "خوش جِیت", arabicPhoneticLatin: "Khosh jeet", english: "Welcome (you've come well)", farsi: "خوش اومدی", dialect: "لهجه عراقی", audioTips: "خطاب به مهمان تازه‌وارد", gender: "unisex" },
  { id: "iq_c2", category: "conversational", arabic: "عاشت ايدك", arabicPhonetic: "عاشَت اِیدَک", arabicPhoneticLatin: "'Ashat eedak", english: "Thank you (lit. bless your hands)", farsi: "دستت درد نکنه", dialect: "لهجه عراقی", audioTips: "تشکر گرم و صمیمانه پس از کمک یا لطف کسی", gender: "male_listener" },
  { id: "iq_c3", category: "conversational", arabic: "ماكو مشكلة", arabicPhonetic: "ماکو مُشکِلَه", arabicPhoneticLatin: "Mako mushkila", english: "No problem", farsi: "مشکلی نیست", dialect: "لهجه عراقی", audioTips: "پاسخ آرامش‌بخش به عذرخواهی یا درخواست", gender: "unisex" },
  { id: "iq_t1", category: "taxi_directions", arabic: "خذني لهذا العنوان", arabicPhonetic: "خِذنی لِهَذا العُنوان", arabicPhoneticLatin: "Khedhni la-hadha al-'unwan", english: "Take me to this address", farsi: "منو به این آدرس ببر", dialect: "لهجه عراقی", audioTips: "خطاب به راننده تاکسی همراه با نشان دادن آدرس روی گوشی", gender: "unisex" },
  { id: "iq_t2", category: "taxi_directions", arabic: "كم الأجرة؟", arabicPhonetic: "کَم الاُجرَه؟", arabicPhoneticLatin: "Kam al-ujra?", english: "How much is the fare?", farsi: "کرایه چقدر میشه؟", dialect: "لهجه عراقی", audioTips: "قبل از سوار شدن حتماً بپرسید", gender: "unisex" },
  { id: "iq_t3", category: "taxi_directions", arabic: "وكف هنا لو سمحت", arabicPhonetic: "وَکِف هِنا لَو سَمَحت", arabicPhoneticLatin: "Wagif hna law samaht", english: "Please stop here", farsi: "لطفاً همین‌جا نگه دار", dialect: "لهجه عراقی", audioTips: "برای پیاده شدن از تاکسی", gender: "unisex" },
  { id: "iq_r1", category: "restaurant_food", arabic: "شنو الأكلة المضمونة؟", arabicPhonetic: "شِنو الاَکلَه المَضمونَه؟", arabicPhoneticLatin: "Shino al-akla al-mazmoona?", english: "What's the specialty/recommended dish?", farsi: "غذای خاص و پیشنهادی چیه؟", dialect: "لهجه عراقی", audioTips: "از گارسون بپرسید تا بهترین غذا را پیشنهاد دهد", gender: "unisex" },
  { id: "iq_r2", category: "restaurant_food", arabic: "بدون بصل لو سمحت", arabicPhonetic: "بِدون بَصَل لَو سَمَحت", arabicPhoneticLatin: "Bidoon basal law samaht", english: "Without onion, please", farsi: "لطفاً بدون پیاز", dialect: "لهجه عراقی", audioTips: "برای سفارش با درخواست خاص غذایی", gender: "unisex" },
  { id: "iq_r3", category: "restaurant_food", arabic: "الحساب لو سمحت", arabicPhonetic: "الحِساب لَو سَمَحت", arabicPhoneticLatin: "Al-hisab law samaht", english: "The bill, please", farsi: "لطفاً صورت‌حساب رو بیارید", dialect: "لهجه عراقی", audioTips: "برای درخواست پرداخت در پایان غذا", gender: "unisex" },
  { id: "iq_s1", category: "shopping_prices", arabic: "هذا غالي شوية", arabicPhonetic: "هَذا غالی شِوَیَه", arabicPhoneticLatin: "Hadha ghali shwaya", english: "This is a bit expensive", farsi: "این یه کمی گرونه", dialect: "لهجه عراقی", audioTips: "برای شروع چانه‌زنی مؤدبانه", gender: "unisex" },
  { id: "iq_s2", category: "shopping_prices", arabic: "خفف علي شوية", arabicPhonetic: "خَفِّف عَلَیَّ شِوَیَه", arabicPhoneticLatin: "Khaffif 'alay shwaya", english: "Give me a bit of a discount", farsi: "یه کم تخفیف بده", dialect: "لهجه عراقی", audioTips: "درخواست تخفیف در بازار سنتی", gender: "unisex" },
  { id: "iq_e1", category: "emergency_health", arabic: "أحتاج طبيب باجر", arabicPhonetic: "اَحتاج طَبیب باجِر", arabicPhoneticLatin: "Ahtaj tabeeb bajir", english: "I need a doctor now", farsi: "همین الان به دکتر نیاز دارم", dialect: "لهجه عراقی", audioTips: "برای موقعیت‌های اورژانسی پزشکی", gender: "unisex" },

  // === EXTRA LEBANESE / LEVANTINE DIALECT (لهجه لبنانی/شامی) ===
  { id: "lb_g1", category: "greetings", arabic: "مرحبا كيفك؟", arabicPhonetic: "مَرحَبا کیفَک؟", arabicPhoneticLatin: "Marhaba, kifak?", english: "Hi, how are you?", farsi: "سلام، چطوری؟", dialect: "لهجه لبنانی (شامی)", audioTips: "احوالپرسی روزمره و پرکاربرد در لبنان", gender: "male_listener" },
  { id: "lb_g2", category: "greetings", arabic: "نهارك سعيد", arabicPhonetic: "نَهارَک سَعید", arabicPhoneticLatin: "Naharak sa'eed", english: "Have a nice day", farsi: "روز خوبی داشته باشی", dialect: "لهجه لبنانی (شامی)", audioTips: "آرزوی روز خوش، معمولاً صبح‌ها", gender: "unisex" },
  { id: "lb_g3", category: "greetings", arabic: "يعطيك العافية", arabicPhonetic: "یِعطیک العافیِه", arabicPhoneticLatin: "Ya'tik al-'afyeh", english: "Thank you / well done (to someone working)", farsi: "خسته نباشی", dialect: "لهجه لبنانی (شامی)", audioTips: "خطاب به کسی که در حال کار است", gender: "unisex" },
  { id: "lb_c1", category: "conversational", arabic: "شو في ما في؟", arabicPhonetic: "شو فی ما فی؟", arabicPhoneticLatin: "Shu fi ma fi?", english: "What's going on? / What's up?", farsi: "چه خبرا؟", dialect: "لهجه لبنانی (شامی)", audioTips: "خیلی خودمانی و رایج بین جوان‌ها", gender: "unisex" },
  { id: "lb_c2", category: "conversational", arabic: "تكرم عينك", arabicPhonetic: "تِکرَم عِینَک", arabicPhoneticLatin: "Tikram 'aynak", english: "You're welcome (very polite)", farsi: "خواهش می‌کنم (خیلی مؤدبانه)", dialect: "لهجه لبنانی (شامی)", audioTips: "پاسخ رسمی و مؤدبانه به تشکر", gender: "male_listener" },
  { id: "lb_c3", category: "conversational", arabic: "ولو، ما في داعي", arabicPhonetic: "وَلَو، ما فی داعی", arabicPhoneticLatin: "Walaw, ma fi da'i", english: "No need, don't mention it", farsi: "بابا نیازی نیست", dialect: "لهجه لبنانی (شامی)", audioTips: "وقتی کسی زیاد تشکر می‌کند", gender: "unisex" },
  { id: "lb_t1", category: "taxi_directions", arabic: "لوين رايح؟ بدي روح ع...", arabicPhonetic: "لِوِین رایِح؟ بِدّی روح عَ...", arabicPhoneticLatin: "La-wein rayeh? Biddi rouh 'a...", english: "Where to? I want to go to...", farsi: "کجا میری؟ می‌خوام برم به...", dialect: "لهجه لبنانی (شامی)", audioTips: "شروع صحبت با راننده سرویس/تاکسی", gender: "unisex" },
  { id: "lb_t2", category: "taxi_directions", arabic: "قديش الأجرة عالتاكسي؟", arabicPhonetic: "قَدیش الاُجرَه عَالتاکسی؟", arabicPhoneticLatin: "Addeish al-ujra 'al-taxi?", english: "How much does the taxi cost?", farsi: "کرایه تاکسی چقدره؟", dialect: "لهجه لبنانی (شامی)", audioTips: "قبل سوار شدن حتماً توافق قیمت کنید", gender: "unisex" },
  { id: "lb_t3", category: "taxi_directions", arabic: "خليك عالطريق الرئيسي", arabicPhonetic: "خَلّیک عَالطَریق الرَئیسی", arabicPhoneticLatin: "Khalleek 'al-tareek al-ra'eesi", english: "Stay on the main road", farsi: "توی جاده اصلی بمون", dialect: "لهجه لبنانی (شامی)", audioTips: "برای راهنمایی مسیر به راننده", gender: "unisex" },
  { id: "lb_r1", category: "restaurant_food", arabic: "شو بتنصحني آكل؟", arabicPhonetic: "شو بِتَنصَحنی آکُل؟", arabicPhoneticLatin: "Shu bitnasahni akol?", english: "What do you recommend I eat?", farsi: "چی پیشنهاد می‌کنی بخورم؟", dialect: "لهجه لبنانی (شامی)", audioTips: "درخواست پیشنهاد از گارسون", gender: "unisex" },
  { id: "lb_r2", category: "restaurant_food", arabic: "بدي المنيو لو سمحت", arabicPhonetic: "بِدّی المِنیو لَو سَمَحت", arabicPhoneticLatin: "Biddi al-menu law samaht", english: "I'd like the menu, please", farsi: "لطفاً منو رو می‌خوام", dialect: "لهجه لبنانی (شامی)", audioTips: "برای شروع سفارش در رستوران", gender: "unisex" },
  { id: "lb_r3", category: "restaurant_food", arabic: "الأكل كتير طيب، يسلمو ايديك", arabicPhonetic: "الاَکِل کتیر طَیِّب، یِسلَمو اِیدیک", arabicPhoneticLatin: "Al-akel kteer tayeb, yislamo eedeek", english: "The food is delicious, thank you (to the chef)", farsi: "غذا خیلی خوشمزه بود، دستت درد نکنه", dialect: "لهجه لبنانی (شامی)", audioTips: "تعریف صمیمانه از غذا در پایان وعده", gender: "unisex" },
  { id: "lb_s1", category: "shopping_prices", arabic: "في خصم؟", arabicPhonetic: "فی خَصم؟", arabicPhoneticLatin: "Fi khasm?", english: "Is there a discount?", farsi: "تخفیف داره؟", dialect: "لهجه لبنانی (شامی)", audioTips: "سوال ساده و رایج در فروشگاه‌ها", gender: "unisex" },
  { id: "lb_s2", category: "shopping_prices", arabic: "هيدا آخر سعر؟", arabicPhonetic: "هَیدا آخِر سِعِر؟", arabicPhoneticLatin: "Heida akher si'r?", english: "Is this the final price?", farsi: "این آخرین قیمتشه؟", dialect: "لهجه لبنانی (شامی)", audioTips: "برای چانه زدن نهایی", gender: "unisex" },
  { id: "lb_e1", category: "emergency_health", arabic: "بدي دكتور، الحالة مستعجلة", arabicPhonetic: "بِدّی دُکتور، الحالِه مُستَعجَلِه", arabicPhoneticLatin: "Biddi doctor, al-hala musta'jala", english: "I need a doctor, it's urgent", farsi: "دکتر می‌خوام، اورژانسیه", dialect: "لهجه لبنانی (شامی)", audioTips: "برای موقعیت پزشکی فوری", gender: "unisex" },

  // === AMERICAN ENGLISH (انگلیسی آمریکایی) ===
  { id: "en_us_g1", category: "greetings", arabic: "Hey, how's it going?", arabicPhonetic: "هی، هاوز ایت گویینگ؟", arabicPhoneticLatin: "Hey, how's it going?", english: "Hey, how's it going?", farsi: "سلام، اوضاع چطوره؟", dialect: "انگلیسی آمریکایی", audioTips: "احوالپرسی خودمانی و رایج در آمریکا؛ تلفظ 'goin'' با حذف g آخر", lang: "english", gender: "unisex" },
  { id: "en_us_g2", category: "greetings", arabic: "Nice to meet you!", arabicPhonetic: "نایس تو میت یو", arabicPhoneticLatin: "Nice to meet you!", english: "Nice to meet you!", farsi: "از آشناییت خوشحالم!", dialect: "انگلیسی آمریکایی", audioTips: "معمولاً با دست دادن همراه است", lang: "english", gender: "unisex" },
  { id: "en_us_g3", category: "greetings", arabic: "Take care!", arabicPhonetic: "تیک کر", arabicPhoneticLatin: "Take care!", english: "Take care!", farsi: "مواظب خودت باش!", dialect: "انگلیسی آمریکایی", audioTips: "جمله رایج هنگام خداحافظی دوستانه", lang: "english", gender: "unisex" },
  { id: "en_us_c1", category: "conversational", arabic: "No worries at all.", arabicPhonetic: "نو وریز اَت آل", arabicPhoneticLatin: "No worries at all.", english: "No worries at all.", farsi: "اصلاً نگران نباش.", dialect: "انگلیسی آمریکایی", audioTips: "پاسخ آرام و دوستانه به عذرخواهی", lang: "english", gender: "unisex" },
  { id: "en_us_c2", category: "conversational", arabic: "That sounds great to me.", arabicPhonetic: "دَت ساوندز گریت تو می", arabicPhoneticLatin: "That sounds great to me.", english: "That sounds great to me.", farsi: "به نظرم عالیه.", dialect: "انگلیسی آمریکایی", audioTips: "تأیید یک پیشنهاد یا برنامه", lang: "english", gender: "unisex" },
  { id: "en_us_c3", category: "conversational", arabic: "I really appreciate it.", arabicPhonetic: "آی ریلی اَپریشیت ایت", arabicPhoneticLatin: "I really appreciate it.", english: "I really appreciate it.", farsi: "واقعاً ممنونم.", dialect: "انگلیسی آمریکایی", audioTips: "تشکر رسمی‌تر از just 'thanks'", lang: "english", gender: "unisex" },
  { id: "en_us_t1", category: "taxi_directions", arabic: "Can you take me to this address?", arabicPhonetic: "کن یو تیک می تو دیس اَدرس؟", arabicPhoneticLatin: "Can you take me to this address?", english: "Can you take me to this address?", farsi: "می‌تونی منو به این آدرس ببری؟", dialect: "انگلیسی آمریکایی", audioTips: "برای رانندگان اوبر/تاکسی در آمریکا", lang: "english", gender: "unisex" },
  { id: "en_us_t2", category: "taxi_directions", arabic: "How much will the ride cost?", arabicPhonetic: "هاو ماچ ویل دِ راید کاست؟", arabicPhoneticLatin: "How much will the ride cost?", english: "How much will the ride cost?", farsi: "این مسیر چقدر خرج داره؟", dialect: "انگلیسی آمریکایی", audioTips: "معمولاً از قبل در اپ مشخص است اما پرسیدن اشکالی ندارد", lang: "english", gender: "unisex" },
  { id: "en_us_t3", category: "taxi_directions", arabic: "You can just drop me off here.", arabicPhonetic: "یو کن جاست دراپ می آف هیر", arabicPhoneticLatin: "You can just drop me off here.", english: "You can just drop me off here.", farsi: "همین‌جا پیادم کن، خوبه.", dialect: "انگلیسی آمریکایی", audioTips: "برای پیاده شدن قبل رسیدن دقیق به مقصد", lang: "english", gender: "unisex" },
  { id: "en_us_r1", category: "restaurant_food", arabic: "Could I get a table for two?", arabicPhonetic: "کود آی گت اَ تیبل فور تو؟", arabicPhoneticLatin: "Could I get a table for two?", english: "Could I get a table for two?", farsi: "میشه یه میز دو نفره داشته باشم؟", dialect: "انگلیسی آمریکایی", audioTips: "درخواست مؤدبانه هنگام ورود به رستوران", lang: "english", gender: "unisex" },
  { id: "en_us_r2", category: "restaurant_food", arabic: "What do you recommend here?", arabicPhonetic: "وات دو یو رِکامِند هیر؟", arabicPhoneticLatin: "What do you recommend here?", english: "What do you recommend here?", farsi: "چی رو اینجا پیشنهاد می‌کنی؟", dialect: "انگلیسی آمریکایی", audioTips: "سوال از پیشخدمت درباره غذای خاص رستوران", lang: "english", gender: "unisex" },
  { id: "en_us_r3", category: "restaurant_food", arabic: "Can I get the check, please?", arabicPhonetic: "کن آی گت دِ چک، پلیز؟", arabicPhoneticLatin: "Can I get the check, please?", english: "Can I get the check, please?", farsi: "میشه صورت‌حساب رو بیارید لطفاً؟", dialect: "انگلیسی آمریکایی", audioTips: "در آمریکا از 'check' به‌جای 'bill' استفاده می‌شود", lang: "english", gender: "unisex" },
  { id: "en_us_s1", category: "shopping_prices", arabic: "Is this on sale?", arabicPhonetic: "ایز دیس آن سیل؟", arabicPhoneticLatin: "Is this on sale?", english: "Is this on sale?", farsi: "این تخفیف داره؟", dialect: "انگلیسی آمریکایی", audioTips: "سوال رایج در فروشگاه‌های آمریکا", lang: "english", gender: "unisex" },
  { id: "en_us_s2", category: "shopping_prices", arabic: "Do you have this in a different size?", arabicPhonetic: "دو یو هَو دیس این اَ دیفرنت سایز؟", arabicPhoneticLatin: "Do you have this in a different size?", english: "Do you have this in a different size?", farsi: "این رو سایز دیگه هم دارید؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن سایز دیگر از فروشنده", lang: "english", gender: "unisex" },
  { id: "en_us_e1", category: "emergency_health", arabic: "I need a doctor right away.", arabicPhonetic: "آی نید اَ داکتر رایت اِوی", arabicPhoneticLatin: "I need a doctor right away.", english: "I need a doctor right away.", farsi: "همین الان به دکتر نیاز دارم.", dialect: "انگلیسی آمریکایی", audioTips: "برای موقعیت پزشکی فوری", lang: "english", gender: "unisex" },
  { id: "en_us_e2", category: "emergency_health", arabic: "Please call 911.", arabicPhonetic: "پلیز کال ناین وان وان", arabicPhoneticLatin: "Please call 911.", english: "Please call 911.", farsi: "لطفاً با اورژانس آمریکا (۹۱۱) تماس بگیرید.", dialect: "انگلیسی آمریکایی", audioTips: "شماره اورژانس در آمریکا ۹۱۱ است (نه ۱۱۵)", lang: "english", gender: "unisex" },

  // === STANDARD / BRITISH ENGLISH (انگلیسی استاندارد/بریتانیایی) ===
  { id: "en_gb_g1", category: "greetings", arabic: "Good afternoon, how do you do?", arabicPhonetic: "گود آفترنون، هاو دو یو دو؟", arabicPhoneticLatin: "Good afternoon, how do you do?", english: "Good afternoon, how do you do?", farsi: "عصر بخیر، حالتون چطوره؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "احوالپرسی رسمی‌تر و مودبانه‌تر نسبت به لهجه آمریکایی", lang: "english", gender: "unisex" },
  { id: "en_gb_g2", category: "greetings", arabic: "Lovely to see you.", arabicPhonetic: "لاولی تو سی یو", arabicPhoneticLatin: "Lovely to see you.", english: "Lovely to see you.", farsi: "خیلی خوشحالم که دیدمت.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "عبارت گرم و رسمی رایج در بریتانیا", lang: "english", gender: "unisex" },
  { id: "en_gb_c1", category: "conversational", arabic: "Cheers for that.", arabicPhonetic: "چیرز فور دَت", arabicPhoneticLatin: "Cheers for that.", english: "Cheers for that.", farsi: "ممنون بابتش.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "'Cheers' در بریتانیا معنای غیررسمی 'thanks' هم دارد", lang: "english", gender: "unisex" },
  { id: "en_gb_c2", category: "conversational", arabic: "Not to worry.", arabicPhonetic: "ناتو وری", arabicPhoneticLatin: "Not to worry.", english: "Not to worry.", farsi: "نگران نباش.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "معادل بریتانیایی 'no worries'", lang: "english", gender: "unisex" },
  { id: "en_gb_t1", category: "taxi_directions", arabic: "Could you take me to this address, please?", arabicPhonetic: "کود یو تیک می تو دیس اَدرس، پلیز؟", arabicPhoneticLatin: "Could you take me to this address, please?", english: "Could you take me to this address, please?", farsi: "لطفاً می‌شه منو به این آدرس ببرید؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "شکل مؤدبانه‌تر درخواست از راننده", lang: "english", gender: "unisex" },
  { id: "en_gb_t2", category: "taxi_directions", arabic: "How much is the fare, please?", arabicPhonetic: "هاو ماچ ایز دِ فر، پلیز؟", arabicPhoneticLatin: "How much is the fare, please?", english: "How much is the fare, please?", farsi: "لطفاً کرایه چقدر میشه؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "در بریتانیا هم 'fare' کلمه رایج است", lang: "english", gender: "unisex" },
  { id: "en_gb_r1", category: "restaurant_food", arabic: "Could we have the bill, please?", arabicPhonetic: "کود وی هَو دِ بیل، پلیز؟", arabicPhoneticLatin: "Could we have the bill, please?", english: "Could we have the bill, please?", farsi: "لطفاً میشه صورت‌حساب رو بیاریم؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "در بریتانیا از 'bill' استفاده می‌شود نه 'check'", lang: "english", gender: "unisex" },
  { id: "en_gb_r2", category: "restaurant_food", arabic: "That was absolutely lovely, thank you.", arabicPhonetic: "دَت واز اَبسولوتلی لاولی، تنک یو", arabicPhoneticLatin: "That was absolutely lovely, thank you.", english: "That was absolutely lovely, thank you.", farsi: "واقعاً عالی بود، ممنونم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "تعریف مؤدبانه از غذا در پایان وعده", lang: "english", gender: "unisex" },
  { id: "en_gb_s1", category: "shopping_prices", arabic: "Is there any discount available?", arabicPhonetic: "ایز دِر اِنی دیسکاونت اَویلبل؟", arabicPhoneticLatin: "Is there any discount available?", english: "Is there any discount available?", farsi: "آیا تخفیفی موجوده؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسش رسمی درباره تخفیف", lang: "english", gender: "unisex" },
  { id: "en_gb_e1", category: "emergency_health", arabic: "I need to see a doctor urgently.", arabicPhonetic: "آی نید تو سی اَ داکتر اُرجنتلی", arabicPhoneticLatin: "I need to see a doctor urgently.", english: "I need to see a doctor urgently.", farsi: "فوراً باید دکتر ببینم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "برای موقعیت پزشکی اورژانسی", lang: "english", gender: "unisex" },
  { id: "en_gb_e2", category: "emergency_health", arabic: "Please call for an ambulance.", arabicPhonetic: "پلیز کال فور اَن اَمبیولنس", arabicPhoneticLatin: "Please call for an ambulance.", english: "Please call for an ambulance.", farsi: "لطفاً آمبولانس خبر کنید.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "شماره اورژانس بریتانیا ۹۹۹ است", lang: "english", gender: "unisex" },

  // === FAMILY & HOME (خانواده و منزل) ===
  { id: "iq2_fh1", category: "family_home", arabic: "هذا بيتي، تفضل ادخل", arabicPhonetic: "هَذا بِیتی، تِفَضَّل اُدخُل", arabicPhoneticLatin: "Hadha beeti, tfaddal udkhul", english: "This is my house, please come in", farsi: "این خونه منه، بفرمایید داخل", dialect: "لهجه عراقی", audioTips: "خوشامدگویی به مهمان دم در", gender: "unisex" },
  { id: "iq2_fh2", category: "family_home", arabic: "عندي عائلة كبيرة", arabicPhonetic: "عِندی عائِلَه کَبیرَه", arabicPhoneticLatin: "Indi 'a'ila kabeera", english: "I have a big family", farsi: "من خانواده بزرگی دارم", dialect: "لهجه عراقی", audioTips: "برای معرفی خودتان در گفتگوی دوستانه", gender: "unisex" },
  { id: "iq2_fh3", category: "family_home", arabic: "شلون أهلك؟ كلهم بخير؟", arabicPhonetic: "شلون اَهلَک؟ کِلهُم بِخِیر؟", arabicPhoneticLatin: "Shlon ahlak? Kullhum bikheir?", english: "How's your family? Are they all well?", farsi: "خانواده‌ت چطورن؟ همه خوبن؟", dialect: "لهجه عراقی", audioTips: "پرسیدن احوال خانواده، نشانه احترام", gender: "unisex" },
  { id: "iq2_fh4", category: "family_home", arabic: "اريد اروح للبيت اسوي شغل", arabicPhonetic: "اَرید اَروح لِلبِیت اَسَوّی شُغُل", arabicPhoneticLatin: "Areed arooh lil-beit asawwi shughul", english: "I want to go home to do some work", farsi: "می‌خوام برم خونه یه کاری انجام بدم", dialect: "لهجه عراقی", audioTips: "توضیح دادن دلیل ترک جمع", gender: "unisex" },
  { id: "lb2_fh1", category: "family_home", arabic: "هيدا بيتي، اهلا وسهلا فيك", arabicPhonetic: "هَیدا بِیتی، اَهلاً وَسَهلاً فیک", arabicPhoneticLatin: "Heida beiti, ahlan wa sahlan feek", english: "This is my house, welcome", farsi: "این خونه منه، خوش اومدی", dialect: "لهجه لبنانی (شامی)", audioTips: "خوشامدگویی صمیمانه به منزل", gender: "male_listener" },
  { id: "lb2_fh2", category: "family_home", arabic: "كيف أهلك وولادك؟", arabicPhonetic: "کیف اَهلَک وَ وْلادَک؟", arabicPhoneticLatin: "Kif ahlak w wladak?", english: "How is your family and kids?", farsi: "خانواده و بچه‌هات چطورن؟", dialect: "لهجه لبنانی (شامی)", audioTips: "احوالپرسی صمیمانه خانوادگی", gender: "unisex" },
  { id: "lb2_fh3", category: "family_home", arabic: "بدي روح عالبيت بكير اليوم", arabicPhonetic: "بِدّی روح عَالبِیت بَکیر الیوم", arabicPhoneticLatin: "Biddi rouh 'al-beit bakeer el-yom", english: "I want to go home early today", farsi: "امروز می‌خوام زود برم خونه", dialect: "لهجه لبنانی (شامی)", audioTips: "توضیح برنامه روزانه به همکار یا دوست", gender: "unisex" },
  { id: "lb2_fh4", category: "family_home", arabic: "عندي غرفة فاضية إذا بدك تنام", arabicPhonetic: "عِندی غُرفِه فاضیِه اِذا بِدَک تِنام", arabicPhoneticLatin: "Andi ghorfeh fadyeh iza biddak tnam", english: "I have an empty room if you want to sleep", farsi: "یه اتاق خالی دارم اگه بخوای بخوابی", dialect: "لهجه لبنانی (شامی)", audioTips: "پیشنهاد مهمان‌نوازی به دوست", gender: "unisex" },
  { id: "en_us2_fh1", category: "family_home", arabic: "This is my place, come on in.", arabicPhonetic: "دیس ایز مای پلیس، کام آن این", arabicPhoneticLatin: "This is my place, come on in.", english: "This is my place, come on in.", farsi: "اینجا خونه منه، بیا تو.", dialect: "انگلیسی آمریکایی", audioTips: "دعوت خودمانی به منزل", lang: "english", gender: "unisex" },
  { id: "en_us2_fh2", category: "family_home", arabic: "How's your family doing?", arabicPhonetic: "هاوز یور فمیلی دویینگ؟", arabicPhoneticLatin: "How's your family doing?", english: "How's your family doing?", farsi: "خانواده‌ت چطورن؟", dialect: "انگلیسی آمریکایی", audioTips: "احوالپرسی معمول از خانواده", lang: "english", gender: "unisex" },
  { id: "en_us2_fh3", category: "family_home", arabic: "I've got two kids, a boy and a girl.", arabicPhonetic: "آیو گات تو کیدز، اَ بوی اَند اَ گرل", arabicPhoneticLatin: "I've got two kids, a boy and a girl.", english: "I've got two kids, a boy and a girl.", farsi: "دو تا بچه دارم، یه پسر و یه دختر.", dialect: "انگلیسی آمریکایی", audioTips: "معرفی خانواده در گفتگوی روزمره", lang: "english", gender: "unisex" },
  { id: "en_gb2_fh1", category: "family_home", arabic: "Do make yourself at home.", arabicPhonetic: "دو مِیک یورسِلف اَت هوم", arabicPhoneticLatin: "Do make yourself at home.", english: "Do make yourself at home.", farsi: "راحت باش، مثل خونه خودت.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "عبارت مؤدبانه هنگام میزبانی مهمان", lang: "english", gender: "unisex" },
  { id: "en_gb2_fh2", category: "family_home", arabic: "I live with my parents at the moment.", arabicPhonetic: "آی لیو ویث مای پرنتس اَت دِ مومنت", arabicPhoneticLatin: "I live with my parents at the moment.", english: "I live with my parents at the moment.", farsi: "این روزها با پدر و مادرم زندگی می‌کنم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "توضیح وضعیت زندگی شخصی", lang: "english", gender: "unisex" },

  // === NUMBERS & TIME (اعداد و زمان) ===
  { id: "iq2_nt1", category: "numbers_time", arabic: "الساعة جيهة بيها؟", arabicPhonetic: "الساعَه جیهَه بیها؟", arabicPhoneticLatin: "Es-sa'ah jeeha beeha?", english: "What time is it?", farsi: "ساعت چنده؟", dialect: "لهجه عراقی", audioTips: "پرسیدن ساعت به‌صورت خودمانی", gender: "unisex" },
  { id: "iq2_nt2", category: "numbers_time", arabic: "راح اجيك الساعة سبعة", arabicPhonetic: "راح اَجیک الساعَه سَبعَه", arabicPhoneticLatin: "Rah ajeek es-sa'ah sab'a", english: "I'll come to you at seven o'clock", farsi: "ساعت هفت میام پیشت", dialect: "لهجه عراقی", audioTips: "هماهنگی زمان قرار ملاقات", gender: "unisex" },
  { id: "iq2_nt3", category: "numbers_time", arabic: "بيه دقيقة وارجع", arabicPhonetic: "بیه دَقیقَه واَرجَع", arabicPhoneticLatin: "Beeh daqeeqa w arja'", english: "Give me a minute and I'll be back", farsi: "یه دقیقه صبر کن الان برمی‌گردم", dialect: "لهجه عراقی", audioTips: "خواستن مهلت کوتاه از طرف مقابل", gender: "unisex" },
  { id: "iq2_nt4", category: "numbers_time", arabic: "شكد الساعة الحين بالضبط؟", arabicPhonetic: "شِکَد الساعَه الحین بِالضَبط؟", arabicPhoneticLatin: "Shkad es-sa'ah al-heen bidh-dhabt?", english: "What time exactly is it now?", farsi: "الان دقیقاً ساعت چنده؟", dialect: "لهجه عراقی", audioTips: "پرسیدن زمان دقیق", gender: "unisex" },
  { id: "lb2_nt1", category: "numbers_time", arabic: "قديش الساعة هلق بالضبط؟", arabicPhonetic: "قَدیش الساعَه هَلَق بِالضَبط؟", arabicPhoneticLatin: "Addesh es-sa'ah hallaq biz-zabt?", english: "What time is it exactly right now?", farsi: "الان دقیقاً ساعت چنده؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن زمان دقیق در مکالمه", gender: "unisex" },
  { id: "lb2_nt2", category: "numbers_time", arabic: "منلتقي بعد نص ساعة", arabicPhonetic: "مِنِلتَقی بَعد نُص ساعَه", arabicPhoneticLatin: "Mniltaqi ba'd nos sa'a", english: "Let's meet in half an hour", farsi: "نیم ساعت دیگه همدیگه رو ببینیم", dialect: "لهجه لبنانی (شامی)", audioTips: "پیشنهاد زمان ملاقات", gender: "unisex" },
  { id: "lb2_nt3", category: "numbers_time", arabic: "لسه بكير، عندي وقت", arabicPhonetic: "لِسَّه بَکیر، عِندی وَقت", arabicPhoneticLatin: "Lissa bakeer, andi wa't", english: "It's still early, I have time", farsi: "هنوز زوده، وقت دارم", dialect: "لهجه لبنانی (شامی)", audioTips: "اطمینان‌دادن دربارهٔ زمان کافی", gender: "unisex" },
  { id: "lb2_nt4", category: "numbers_time", arabic: "تأخرت شوي، بس جاي هلق", arabicPhonetic: "تَأَخَّرت شِوَی، بَس جای هَلَق", arabicPhoneticLatin: "Ta'akhkharet shway, bas jayy hallaq", english: "I'm a bit late, but I'm coming now", farsi: "یه کم دیر کردم، ولی الان دارم میام", dialect: "لهجه لبنانی (شامی)", audioTips: "عذرخواهی بابت تأخیر کوتاه", gender: "unisex" },
  { id: "en_us2_nt1", category: "numbers_time", arabic: "What time is it right now?", arabicPhonetic: "وات تایم ایز ایت رایت ناو؟", arabicPhoneticLatin: "What time is it right now?", english: "What time is it right now?", farsi: "الان ساعت چنده؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن ساعت به شکل معمول", lang: "english", gender: "unisex" },
  { id: "en_us2_nt2", category: "numbers_time", arabic: "Let's meet up around seven.", arabicPhonetic: "لتس میت آپ اَراوند سِون", arabicPhoneticLatin: "Let's meet up around seven.", english: "Let's meet up around seven.", farsi: "بیا حدود ساعت هفت همو ببینیم.", dialect: "انگلیسی آمریکایی", audioTips: "هماهنگی زمان قرار به‌صورت غیررسمی", lang: "english", gender: "unisex" },
  { id: "en_us2_nt3", category: "numbers_time", arabic: "I'll be there in five minutes.", arabicPhonetic: "آیل بی دِر این فایو مینتس", arabicPhoneticLatin: "I'll be there in five minutes.", english: "I'll be there in five minutes.", farsi: "پنج دقیقه دیگه اونجام.", dialect: "انگلیسی آمریکایی", audioTips: "اعلام زمان تقریبی رسیدن", lang: "english", gender: "unisex" },
  { id: "en_gb2_nt1", category: "numbers_time", arabic: "Could you tell me the time, please?", arabicPhonetic: "کود یو تِل می دِ تایم، پلیز؟", arabicPhoneticLatin: "Could you tell me the time, please?", english: "Could you tell me the time, please?", farsi: "لطفاً می‌شه بگید ساعت چنده؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن ساعت به شکل مؤدبانه", lang: "english", gender: "unisex" },
  { id: "en_gb2_nt2", category: "numbers_time", arabic: "Shall we say half past six?", arabicPhonetic: "شَل وی سِی هاف پَست سیکس؟", arabicPhoneticLatin: "Shall we say half past six?", english: "Shall we say half past six?", farsi: "بگیم ساعت شیش و نیم؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پیشنهاد زمان قرار به سبک بریتانیایی", lang: "english", gender: "unisex" },

  // === PHONE & MESSAGING (تلفن و پیام) ===
  { id: "iq2_ph1", category: "phone_calls", arabic: "الو، مين المتكلم؟", arabicPhonetic: "اَلو، مین المُتَکَلِّم؟", arabicPhoneticLatin: "Alo, meen al-mutakallim?", english: "Hello, who's speaking?", farsi: "الو، شما؟", dialect: "لهجه عراقی", audioTips: "پاسخ به تماس تلفنی از شماره ناشناس", gender: "unisex" },
  { id: "iq2_ph2", category: "phone_calls", arabic: "خط الموبايل مو زين", arabicPhonetic: "خَط المُوبایل مو زِین", arabicPhoneticLatin: "Khatt al-mobile mu zein", english: "The phone line isn't good", farsi: "خط تلفن خوب نیست", dialect: "لهجه عراقی", audioTips: "توضیح دادن قطعی یا نویز تماس", gender: "unisex" },
  { id: "iq2_ph3", category: "phone_calls", arabic: "ابعثلي رسالة اذا ماكدرت اجاوب", arabicPhonetic: "اِبعَثلی رِسالَه اِذا ماکِدَرت اَجاوِب", arabicPhoneticLatin: "Ib'athli risala idha makdart ajawib", english: "Send me a message if I can't answer", farsi: "اگه نتونستم جواب بدم برام پیام بفرست", dialect: "لهجه عراقی", audioTips: "راهنمایی برای تماس نگرفتن", gender: "unisex" },
  { id: "lb2_ph1", category: "phone_calls", arabic: "الو، مين معي؟", arabicPhonetic: "اَلو، مین مَعی؟", arabicPhoneticLatin: "Alo, meen ma'i?", english: "Hello, who is this?", farsi: "الو، کی هستید؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پاسخ به تماس از شماره ناآشنا", gender: "unisex" },
  { id: "lb2_ph2", category: "phone_calls", arabic: "الخط عم يقطع، بعاود عليك", arabicPhonetic: "الخَط عَم یِقطَع، بَعاوِد عَلِیک", arabicPhoneticLatin: "El-khatt am ye'ta', b'awid 'aleik", english: "The line keeps dropping, I'll call you back", farsi: "خط قطع میشه، دوباره بهت زنگ می‌زنم", dialect: "لهجه لبنانی (شامی)", audioTips: "توضیح قطعی تماس", gender: "unisex" },
  { id: "lb2_ph3", category: "phone_calls", arabic: "ابعتلي الموقع عالواتساب", arabicPhonetic: "اِبعَتلی المَوقِع عَالواتساب", arabicPhoneticLatin: "Eb'atli el-mawke' 'al-WhatsApp", english: "Send me the location on WhatsApp", farsi: "لوکیشن رو تو واتساپ برام بفرست", dialect: "لهجه لبنانی (شامی)", audioTips: "درخواست ارسال موقعیت مکانی", gender: "unisex" },
  { id: "en_us2_ph1", category: "phone_calls", arabic: "Hi, who's calling?", arabicPhonetic: "های، هوز کالینگ؟", arabicPhoneticLatin: "Hi, who's calling?", english: "Hi, who's calling?", farsi: "سلام، شما؟", dialect: "انگلیسی آمریکایی", audioTips: "پاسخ به تماس از شماره ناشناس", lang: "english", gender: "unisex" },
  { id: "en_us2_ph2", category: "phone_calls", arabic: "Can you hear me okay?", arabicPhonetic: "کن یو هیر می اوکی؟", arabicPhoneticLatin: "Can you hear me okay?", english: "Can you hear me okay?", farsi: "صدام رو خوب می‌شنوی؟", dialect: "انگلیسی آمریکایی", audioTips: "بررسی کیفیت تماس", lang: "english", gender: "unisex" },
  { id: "en_us2_ph3", category: "phone_calls", arabic: "Just text me the address.", arabicPhonetic: "جاست تکست می دِ اَدرس", arabicPhoneticLatin: "Just text me the address.", english: "Just text me the address.", farsi: "فقط آدرس رو برام پیامک کن.", dialect: "انگلیسی آمریکایی", audioTips: "درخواست ارسال آدرس با پیامک", lang: "english", gender: "unisex" },
  { id: "en_gb2_ph1", category: "phone_calls", arabic: "Hello, who am I speaking to?", arabicPhonetic: "هلو، هو اَم آی اسپیکینگ تو؟", arabicPhoneticLatin: "Hello, who am I speaking to?", english: "Hello, who am I speaking to?", farsi: "سلام، با کی صحبت می‌کنم؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پاسخ رسمی‌تر به تماس تلفنی", lang: "english", gender: "unisex" },
  { id: "en_gb2_ph2", category: "phone_calls", arabic: "The signal's rather poor here.", arabicPhonetic: "دِ سیگنال ز رادر پور هیر", arabicPhoneticLatin: "The signal's rather poor here.", english: "The signal's rather poor here.", farsi: "آنتن اینجا خیلی ضعیفه.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "توضیح ضعف آنتن‌دهی", lang: "english", gender: "unisex" },

  // === SMALL TALK & WEATHER (گپ روزمره و آب‌وهوا) ===
  { id: "iq2_sw1", category: "smalltalk_weather", arabic: "الجو حر واجد اليوم", arabicPhonetic: "الجَو حَر واجِد الیوم", arabicPhoneticLatin: "Al-jaw har wajid al-yom", english: "The weather is very hot today", farsi: "امروز هوا خیلی گرمه", dialect: "لهجه عراقی", audioTips: "گفتگوی معمول درباره هوا", gender: "unisex" },
  { id: "iq2_sw2", category: "smalltalk_weather", arabic: "شلونك اليوم؟ شغلك زين؟", arabicPhonetic: "شلونَک الیوم؟ شُغلَک زِین؟", arabicPhoneticLatin: "Shlonak al-yom? Shughlak zein?", english: "How are you today? Is work good?", farsi: "امروز چطوری؟ کارت خوبه؟", dialect: "لهجه عراقی", audioTips: "احوالپرسی خودمانی روزمره", gender: "unisex" },
  { id: "iq2_sw3", category: "smalltalk_weather", arabic: "الجو رح يمطر باجر", arabicPhonetic: "الجَو رَح یِمطُر باجِر", arabicPhoneticLatin: "Al-jaw rah yimtur bajir", english: "It's going to rain tomorrow", farsi: "فردا هوا بارونی میشه", dialect: "لهجه عراقی", audioTips: "پیش‌بینی هوا در گفتگوی روزمره", gender: "unisex" },
  { id: "lb2_sw1", category: "smalltalk_weather", arabic: "الجو كتير حلو اليوم", arabicPhonetic: "الجَو کتیر حِلو الیوم", arabicPhoneticLatin: "Ej-jaw kteer helou el-yom", english: "The weather is very nice today", farsi: "امروز هوا خیلی خوبه", dialect: "لهجه لبنانی (شامی)", audioTips: "شروع گپ دوستانه با موضوع هوا", gender: "unisex" },
  { id: "lb2_sw2", category: "smalltalk_weather", arabic: "شو الأخبار؟ شغلك ماشي؟", arabicPhonetic: "شو الاَخبار؟ شُغلَک ماشی؟", arabicPhoneticLatin: "Shu el-akhbar? Shughlak mashi?", english: "What's new? Is work going well?", farsi: "چه خبرا؟ کارت خوب پیش میره؟", dialect: "لهجه لبنانی (شامی)", audioTips: "احوالپرسی خودمانی و پیگیری کار", gender: "unisex" },
  { id: "lb2_sw3", category: "smalltalk_weather", arabic: "الدني برد كتير هالأيام", arabicPhonetic: "الدُنیِه بَرد کتیر هَالاَیّام", arabicPhoneticLatin: "Ed-dinyeh bard kteer hal-ayyam", english: "It's very cold these days", farsi: "این روزها هوا خیلی سرده", dialect: "لهجه لبنانی (شامی)", audioTips: "گفتگو دربارهٔ سرمای هوا", gender: "unisex" },
  { id: "en_us2_sw1", category: "smalltalk_weather", arabic: "Beautiful weather we're having, huh?", arabicPhonetic: "بیوتیفول وِدِر ویر هَوینگ، ها؟", arabicPhoneticLatin: "Beautiful weather we're having, huh?", english: "Beautiful weather we're having, huh?", farsi: "هوا امروز خیلی قشنگه، نه؟", dialect: "انگلیسی آمریکایی", audioTips: "کلاسیک‌ترین جمله شروع گفتگو دربارهٔ هوا", lang: "english", gender: "unisex" },
  { id: "en_us2_sw2", category: "smalltalk_weather", arabic: "How's work been treating you?", arabicPhonetic: "هاوز ورک بین تریتینگ یو؟", arabicPhoneticLatin: "How's work been treating you?", english: "How's work been treating you?", farsi: "کارت چطور پیش میره؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن حال کار به شکل دوستانه", lang: "english", gender: "unisex" },
  { id: "en_us2_sw3", category: "smalltalk_weather", arabic: "It's freezing out there today.", arabicPhonetic: "ایتس فریزینگ اوت دِر تودی", arabicPhoneticLatin: "It's freezing out there today.", english: "It's freezing out there today.", farsi: "امروز بیرون یخ‌بندونه.", dialect: "انگلیسی آمریکایی", audioTips: "توصیف هوای خیلی سرد", lang: "english", gender: "unisex" },
  { id: "en_gb2_sw1", category: "smalltalk_weather", arabic: "Bit chilly out today, isn't it?", arabicPhonetic: "بیت چیلی اوت تودی، ایزنت ایت؟", arabicPhoneticLatin: "Bit chilly out today, isn't it?", english: "Bit chilly out today, isn't it?", farsi: "امروز یه‌کم سرده بیرون، نه؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "معمول‌ترین جمله بریتانیایی برای شروع گفتگو", lang: "english", gender: "unisex" },
  { id: "en_gb2_sw2", category: "smalltalk_weather", arabic: "How's everything going with you?", arabicPhonetic: "هاوز اِوریتینگ گویینگ ویث یو؟", arabicPhoneticLatin: "How's everything going with you?", english: "How's everything going with you?", farsi: "اوضاعت چطوره؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "احوالپرسی عمومی و مؤدبانه", lang: "english", gender: "unisex" },

  // === WORK & STUDY (کار و تحصیل) ===
  { id: "iq2_ws1", category: "work_study", arabic: "أنا اشتغل بشركة صغيرة", arabicPhonetic: "اَنا اَشتَغِل بِشَرِکَه صَغیرَه", arabicPhoneticLatin: "Ana ashteghil bi-sharika sagheera", english: "I work at a small company", farsi: "من تو یه شرکت کوچیک کار می‌کنم", dialect: "لهجه عراقی", audioTips: "معرفی شغل به دیگران", gender: "unisex" },
  { id: "iq2_ws2", category: "work_study", arabic: "عندي امتحان باجر الصبح", arabicPhonetic: "عِندی اِمتِحان باجِر الصُبح", arabicPhoneticLatin: "Indi imtihan bajir as-subh", english: "I have an exam tomorrow morning", farsi: "فردا صبح امتحان دارم", dialect: "لهجه عراقی", audioTips: "توضیح برنامه درسی به دوستان", gender: "unisex" },
  { id: "iq2_ws3", category: "work_study", arabic: "أدرس بالجامعة قسم الهندسة", arabicPhonetic: "اَدرُس بِالجامِعَه قِسم الهَندَسَه", arabicPhoneticLatin: "Adrus bil-jami'a qism al-handasa", english: "I study engineering at university", farsi: "من رشته مهندسی تو دانشگاه می‌خونم", dialect: "لهجه عراقی", audioTips: "معرفی رشته تحصیلی", gender: "unisex" },
  { id: "lb2_ws1", category: "work_study", arabic: "بشتغل بشركة تكنولوجيا", arabicPhonetic: "بِشتَغِل بِشَرکِه تِکنولوجیا", arabicPhoneticLatin: "Bishteghel bi-sharikeh technologia", english: "I work at a tech company", farsi: "من تو یه شرکت فناوری کار می‌کنم", dialect: "لهجه لبنانی (شامی)", audioTips: "معرفی شغل در مکالمه", gender: "unisex" },
  { id: "lb2_ws2", category: "work_study", arabic: "عندي دوام لحتى الساعة خمسة", arabicPhonetic: "عِندی دَوام لَحَتّی الساعَه خَمسِه", arabicPhoneticLatin: "Andi dawam la-hatta es-sa'a khamse", english: "I work until five o'clock", farsi: "من تا ساعت پنج سر کارم", dialect: "لهجه لبنانی (شامی)", audioTips: "توضیح ساعت کاری", gender: "unisex" },
  { id: "lb2_ws3", category: "work_study", arabic: "عم بدرس بالجامعة الأمريكية", arabicPhonetic: "عَم بِدرُس بِالجامعِه الاَمریکیِه", arabicPhoneticLatin: "Am bidros bil-jam'a el-amrikiyye", english: "I'm studying at the American university", farsi: "دارم تو دانشگاه آمریکایی درس می‌خونم", dialect: "لهجه لبنانی (شامی)", audioTips: "معرفی محل تحصیل", gender: "unisex" },
  { id: "en_us2_ws1", category: "work_study", arabic: "I work in marketing.", arabicPhonetic: "آی ورک این مارکتینگ", arabicPhoneticLatin: "I work in marketing.", english: "I work in marketing.", farsi: "من تو بخش بازاریابی کار می‌کنم.", dialect: "انگلیسی آمریکایی", audioTips: "معرفی حوزه شغلی", lang: "english", gender: "unisex" },
  { id: "en_us2_ws2", category: "work_study", arabic: "I've got finals coming up next week.", arabicPhonetic: "آیو گات فاینالز کامینگ آپ نکست ویک", arabicPhoneticLatin: "I've got finals coming up next week.", english: "I've got finals coming up next week.", farsi: "هفته دیگه امتحانای پایانی دارم.", dialect: "انگلیسی آمریکایی", audioTips: "صحبت دربارهٔ برنامهٔ درسی", lang: "english", gender: "unisex" },
  { id: "en_gb2_ws1", category: "work_study", arabic: "I'm reading law at university.", arabicPhonetic: "آیم ریدینگ لا اَت یونیورسیتی", arabicPhoneticLatin: "I'm reading law at university.", english: "I'm reading law at university.", farsi: "من تو دانشگاه حقوق می‌خونم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "در انگلیسی بریتانیایی 'reading' یعنی رشتهٔ تحصیلی", lang: "english", gender: "unisex" },
  { id: "en_gb2_ws2", category: "work_study", arabic: "I work nine to five, Monday to Friday.", arabicPhonetic: "آی ورک ناین تو فایو، ماندی تو فرایدی", arabicPhoneticLatin: "I work nine to five, Monday to Friday.", english: "I work nine to five, Monday to Friday.", farsi: "من دوشنبه تا جمعه، نه تا پنج کار می‌کنم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "توضیح ساعت و روزهای کاری", lang: "english", gender: "unisex" },

  // === FEELINGS (احساسات و حال‌واحوال) ===
  { id: "iq2_fe1", category: "feelings", arabic: "اليوم متعب شوية", arabicPhonetic: "الیوم مِتعَب شِوَیَه", arabicPhoneticLatin: "Al-yom mit'ab shwaya", english: "I'm a bit tired today", farsi: "امروز یه‌کم خسته‌م", dialect: "لهجه عراقی", audioTips: "بیان خستگی در گفتگوی روزمره", gender: "male_speaker" },
  { id: "iq2_fe2", category: "feelings", arabic: "أنا فرحان جداً اليوم", arabicPhonetic: "اَنا فَرحان جِدّاً الیوم", arabicPhoneticLatin: "Ana farhan jiddan al-yom", english: "I'm very happy today", farsi: "امروز خیلی خوشحالم", dialect: "لهجه عراقی", audioTips: "بیان احساس شادی", gender: "male_speaker" },
  { id: "iq2_fe3", category: "feelings", arabic: "مو مرتاح شوية، شكلي دايخ", arabicPhonetic: "مو مِرتاح شِوَیَه، شَکلی دایِخ", arabicPhoneticLatin: "Mu murtah shwaya, shakli dayikh", english: "I'm not feeling well, I feel dizzy", farsi: "زیاد حالم خوب نیست، انگار سرم گیج می‌ره", dialect: "لهجه عراقی", audioTips: "توضیح ناخوشی خفیف", gender: "unisex" },
  { id: "lb2_fe1", category: "feelings", arabic: "مبسوط كتير اليوم", arabicPhonetic: "مَبسوط کتیر الیوم", arabicPhoneticLatin: "Mabsout kteer el-yom", english: "I'm very happy today", farsi: "امروز خیلی خوشحالم", dialect: "لهجه لبنانی (شامی)", audioTips: "بیان احساس خوشحالی", gender: "male_speaker" },
  { id: "lb2_fe2", category: "feelings", arabic: "شوي تعبان، بدي ارتاح", arabicPhonetic: "شِوَی تَعبان، بِدّی اِرتاح", arabicPhoneticLatin: "Shway ta'ban, biddi irtah", english: "A bit tired, I want to rest", farsi: "یه‌کم خسته‌ام، می‌خوام استراحت کنم", dialect: "لهجه لبنانی (شامی)", audioTips: "بیان نیاز به استراحت", gender: "unisex" },
  { id: "lb2_fe3", category: "feelings", arabic: "قلقان شوي بس رح يمشي الحال", arabicPhonetic: "قَلقان شِوَی بَس رَح یِمشی الحال", arabicPhoneticLatin: "Alqan shway bas rah yimshi el-hal", english: "A bit worried, but it'll be fine", farsi: "یه‌کم نگرانم ولی درست میشه", dialect: "لهجه لبنانی (شامی)", audioTips: "بیان نگرانی خفیف همراه با امیدواری", gender: "unisex" },
  { id: "en_us2_fe1", category: "feelings", arabic: "I'm feeling pretty good today.", arabicPhonetic: "آیم فیلینگ پریتی گود تودی", arabicPhoneticLatin: "I'm feeling pretty good today.", english: "I'm feeling pretty good today.", farsi: "امروز حالم خیلی خوبه.", dialect: "انگلیسی آمریکایی", audioTips: "بیان حال خوب", lang: "english", gender: "unisex" },
  { id: "en_us2_fe2", category: "feelings", arabic: "I'm kind of stressed out right now.", arabicPhonetic: "آیم کایند آو استرست اوت رایت ناو", arabicPhoneticLatin: "I'm kind of stressed out right now.", english: "I'm kind of stressed out right now.", farsi: "الان یه‌جورایی استرس دارم.", dialect: "انگلیسی آمریکایی", audioTips: "بیان استرس در مکالمه روزمره", lang: "english", gender: "unisex" },
  { id: "en_gb2_fe1", category: "feelings", arabic: "I'm feeling a bit under the weather.", arabicPhonetic: "آیم فیلینگ اَ بیت آندر دِ وِدِر", arabicPhoneticLatin: "I'm feeling a bit under the weather.", english: "I'm feeling a bit under the weather.", farsi: "حالم یه‌کم خوب نیست.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "اصطلاح رایج بریتانیایی برای بیان کسالت خفیف", lang: "english", gender: "unisex" },
  { id: "en_gb2_fe2", category: "feelings", arabic: "Quite chuffed with how it went.", arabicPhonetic: "کوایت چافد ویث هاو ایت وِنت", arabicPhoneticLatin: "Quite chuffed with how it went.", english: "Quite chuffed with how it went.", farsi: "خیلی از نتیجه‌ش راضی و خوشحالم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "'chuffed' اصطلاح خودمانی بریتانیایی یعنی خیلی خوشحال", lang: "english", gender: "unisex" },

  // === GULF ARABIC (لهجه خلیجی) — everyday-life categories ===
  { id: "gulf_fh1", category: "family_home", arabic: "بيتي قريب من هني", arabicPhonetic: "بِیتی قَریب مِن هِنی", arabicPhoneticLatin: "Beiti qareeb min hini", english: "My house is close to here", farsi: "خونه‌م نزدیک همین‌جاست", dialect: "لهجه خلیجی", audioTips: "توضیح موقعیت منزل به دوستان", gender: "unisex" },
  { id: "gulf_nt1", category: "numbers_time", arabic: "الساعة كم الحين؟", arabicPhonetic: "الساعَه کَم الحین؟", arabicPhoneticLatin: "Es-sa'a kam al-heen?", english: "What time is it now?", farsi: "الان ساعت چنده؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن ساعت به لهجه خلیجی", gender: "unisex" },
  { id: "gulf_ph1", category: "phone_calls", arabic: "الو مين يتكلم؟", arabicPhonetic: "اَلو مین یِتکَلَّم؟", arabicPhoneticLatin: "Alo meen yitkallam?", english: "Hello, who's speaking?", farsi: "الو، شما؟", dialect: "لهجه خلیجی", audioTips: "پاسخ به تماس ناشناس", gender: "unisex" },
  { id: "gulf_sw1", category: "smalltalk_weather", arabic: "الجو حار اليوم مره", arabicPhonetic: "الجَو حار الیوم مَرَّه", arabicPhoneticLatin: "Al-jaw har al-yom marra", english: "The weather is very hot today", farsi: "امروز هوا خیلی گرمه", dialect: "لهجه خلیجی", audioTips: "گفتگوی معمول درباره هوا", gender: "unisex" },
  { id: "gulf_ws1", category: "work_study", arabic: "اشتغل بشركة نفط", arabicPhonetic: "اَشتَغِل بِشَرِکَه نَفط", arabicPhoneticLatin: "Ashteghil bi-sharika naft", english: "I work at an oil company", farsi: "من تو یه شرکت نفتی کار می‌کنم", dialect: "لهجه خلیجی", audioTips: "معرفی شغل رایج در منطقه خلیج", gender: "unisex" },
  { id: "gulf_fe1", category: "feelings", arabic: "أنا مبسوط اليوم كثير", arabicPhonetic: "اَنا مَبسوط الیوم کَثیر", arabicPhoneticLatin: "Ana mabsoot al-yom katheer", english: "I'm very happy today", farsi: "امروز خیلی خوشحالم", dialect: "لهجه خلیجی", audioTips: "بیان احساس خوشحالی", gender: "male_speaker" },

  // === EGYPTIAN ARABIC (لهجه مصری) — everyday-life categories ===
  { id: "eg_fh1", category: "family_home", arabic: "البيت ده بتاعي، اتفضل", arabicPhonetic: "البِیت دِه بِتاعی، اِتفَضَّل", arabicPhoneticLatin: "El-beit dah betaay, itfaddal", english: "This house is mine, please come in", farsi: "این خونه مال منه، بفرمایید", dialect: "لهجه مصری", audioTips: "خوشامدگویی مصری به مهمان", gender: "unisex" },
  { id: "eg_nt1", category: "numbers_time", arabic: "الساعة كام دلوقتي؟", arabicPhonetic: "الساعَه کام دِلوَقتی؟", arabicPhoneticLatin: "Es-sa'a kam delwa'ti?", english: "What time is it now?", farsi: "الان ساعت چنده؟", dialect: "لهجه مصری", audioTips: "پرسیدن ساعت به لهجه مصری", gender: "unisex" },
  { id: "eg_ph1", category: "phone_calls", arabic: "ألو، مين معايا؟", arabicPhonetic: "اَلو، مین مَعایا؟", arabicPhoneticLatin: "Alo, meen ma'aya?", english: "Hello, who is this?", farsi: "الو، کی هستید؟", dialect: "لهجه مصری", audioTips: "پاسخ به تماس ناشناس به سبک مصری", gender: "unisex" },
  { id: "eg_sw1", category: "smalltalk_weather", arabic: "الجو حلو النهارده", arabicPhonetic: "الجَو حِلو النَهارده", arabicPhoneticLatin: "El-gaw helw en-naharda", english: "The weather is nice today", farsi: "امروز هوا خوبه", dialect: "لهجه مصری", audioTips: "شروع گپ دوستانه درباره هوا", gender: "unisex" },
  { id: "eg_ws1", category: "work_study", arabic: "بشتغل في شركة سياحة", arabicPhonetic: "بِشتَغَل فی شَرِکَه سِیاحَه", arabicPhoneticLatin: "Bishteghal fi sharika siyaha", english: "I work at a tourism company", farsi: "من تو یه شرکت گردشگری کار می‌کنم", dialect: "لهجه مصری", audioTips: "معرفی شغل به سبک مصری", gender: "unisex" },
  { id: "eg_fe1", category: "feelings", arabic: "أنا مبسوط النهارده جدًا", arabicPhonetic: "اَنا مَبسوط النَهارده جِدّاً", arabicPhoneticLatin: "Ana mabsoot en-naharda giddan", english: "I'm very happy today", farsi: "امروز خیلی خوشحالم", dialect: "لهجه مصری", audioTips: "بیان احساس خوشحالی به سبک مصری", gender: "male_speaker" },

  // === PUBLIC TRANSPORT (اتوبوس و مترو) ===
  { id: "iq3_tp1", category: "transport_public", arabic: "وين محطة الباص القريبة؟", arabicPhonetic: "وِین مَحَطَّه الباص القَریبَه؟", arabicPhoneticLatin: "Wein mahattat al-bas al-qareeba?", english: "Where's the nearest bus station?", farsi: "نزدیک‌ترین ایستگاه اتوبوس کجاست؟", dialect: "لهجه عراقی", audioTips: "پرسیدن مسیر حمل‌ونقل عمومی", gender: "unisex" },
  { id: "iq3_tp2", category: "transport_public", arabic: "هذا الباص يوصل الوسط؟", arabicPhonetic: "هَذا الباص یِوصَل الوَسَط؟", arabicPhoneticLatin: "Hadha al-bas yiwsal al-wasat?", english: "Does this bus go downtown?", farsi: "این اتوبوس به مرکز شهر می‌ره؟", dialect: "لهجه عراقی", audioTips: "پرسیدن مقصد اتوبوس", gender: "unisex" },
  { id: "lb3_tp1", category: "transport_public", arabic: "وين محطة الباص الجاي؟", arabicPhonetic: "وِین مَحَطِّه الباص الجای؟", arabicPhoneticLatin: "Wein mahatet el-bas ej-jay?", english: "Where's the next bus stop?", farsi: "ایستگاه بعدی اتوبوس کجاست؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن ایستگاه بعدی", gender: "unisex" },
  { id: "lb3_tp2", category: "transport_public", arabic: "التذكرة بكم؟", arabicPhonetic: "التَذکِرَه بِکَم؟", arabicPhoneticLatin: "Et-tazkara bikam?", english: "How much is the ticket?", farsi: "بلیت چقدره؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن قیمت بلیت", gender: "unisex" },
  { id: "gulf_tp1", category: "transport_public", arabic: "وين أقرب محطة مترو؟", arabicPhonetic: "وِین اَقرَب مَحَطَّه مِترو؟", arabicPhoneticLatin: "Wein aqrab mahattat metro?", english: "Where's the nearest metro station?", farsi: "نزدیک‌ترین ایستگاه مترو کجاست؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن مسیر مترو", gender: "unisex" },
  { id: "gulf_tp2", category: "transport_public", arabic: "متى يجي الباص الجاي؟", arabicPhonetic: "مَتَی یِجی الباص الجای؟", arabicPhoneticLatin: "Mata yiji al-bas al-jay?", english: "When does the next bus arrive?", farsi: "اتوبوس بعدی کی میاد؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن زمان اتوبوس بعدی", gender: "unisex" },
  { id: "eg_tp1", category: "transport_public", arabic: "المترو محطته فين؟", arabicPhonetic: "المِترو مَحَطِّتُه فین؟", arabicPhoneticLatin: "El-metro mahattetoh fein?", english: "Where's the metro station?", farsi: "ایستگاه مترو کجاست؟", dialect: "لهجه مصری", audioTips: "پرسیدن مسیر مترو در قاهره", gender: "unisex" },
  { id: "eg_tp2", category: "transport_public", arabic: "الأتوبيس ده رايح فين؟", arabicPhonetic: "الاُتوبیس دِه رایِح فین؟", arabicPhoneticLatin: "El-otobees da rayeh fein?", english: "Where is this bus going?", farsi: "این اتوبوس کجا می‌ره؟", dialect: "لهجه مصری", audioTips: "پرسیدن مقصد اتوبوس مصری", gender: "unisex" },
  { id: "en_us3_tp1", category: "transport_public", arabic: "Where's the nearest bus stop?", arabicPhonetic: "ور از دِ نیرست باس استاپ؟", arabicPhoneticLatin: "Where's the nearest bus stop?", english: "Where's the nearest bus stop?", farsi: "نزدیک‌ترین ایستگاه اتوبوس کجاست؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن ایستگاه اتوبوس", lang: "english", gender: "unisex" },
  { id: "en_us3_tp2", category: "transport_public", arabic: "Does this train go downtown?", arabicPhonetic: "داز دیس ترین گو داونتاون؟", arabicPhoneticLatin: "Does this train go downtown?", english: "Does this train go downtown?", farsi: "این قطار به مرکز شهر می‌ره؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن مقصد قطار/مترو", lang: "english", gender: "unisex" },
  { id: "en_gb3_tp1", category: "transport_public", arabic: "Where's the nearest tube station?", arabicPhonetic: "ور از دِ نیرست تیوب استیشن؟", arabicPhoneticLatin: "Where's the nearest tube station?", english: "Where's the nearest tube station?", farsi: "نزدیک‌ترین ایستگاه مترو (تیوب) کجاست؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "در بریتانیا مترو را 'tube' یا 'underground' می‌گویند", lang: "english", gender: "unisex" },
  { id: "en_gb3_tp2", category: "transport_public", arabic: "Could I have a single ticket, please?", arabicPhonetic: "کود آی هَو اَ سینگل تیکت، پلیز؟", arabicPhoneticLatin: "Could I have a single ticket, please?", english: "Could I have a single ticket, please?", farsi: "لطفاً یه بلیت یک‌طرفه می‌خوام", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "'single' یعنی بلیت یک‌طرفه در بریتانیا", lang: "english", gender: "unisex" },

  // === PILGRIMAGE & RELIGIOUS (زیارتی و مذهبی) ===
  { id: "iq3_rp1", category: "religious_pilgrimage", arabic: "وين يمعد الحرم من هنا؟", arabicPhonetic: "وِین یِمعَد الحَرَم مِن هِنا؟", arabicPhoneticLatin: "Wein yim'ad al-haram min hna?", english: "How far is the shrine from here?", farsi: "حرم از اینجا چقدر فاصله داره؟", dialect: "لهجه عراقی", audioTips: "پرسیدن مسیر به حرم", gender: "unisex" },
  { id: "iq3_rp2", category: "religious_pilgrimage", arabic: "وين أكو مكان للوضوء؟", arabicPhonetic: "وِین اَکو مَکان لِلوُضوء؟", arabicPhoneticLatin: "Wein aku makan lil-wudhu'?", english: "Where is there a place for ablution?", farsi: "جای وضو گرفتن کجاست؟", dialect: "لهجه عراقی", audioTips: "پرسیدن جای وضو در نزدیکی حرم", gender: "unisex" },
  { id: "lb3_rp1", category: "religious_pilgrimage", arabic: "وين أقرب مسجد من هون؟", arabicPhonetic: "وِین اَقرَب مَسجِد مِن هون؟", arabicPhoneticLatin: "Wein aqrab masjid min hon?", english: "Where's the nearest mosque from here?", farsi: "نزدیک‌ترین مسجد از اینجا کجاست؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن مسیر به نزدیک‌ترین مسجد", gender: "unisex" },
  { id: "lb3_rp2", category: "religious_pilgrimage", arabic: "امتى وقت الصلاة الجاية؟", arabicPhonetic: "اِمتَی وَقت الصَلاه الجایِه؟", arabicPhoneticLatin: "Emta wa't es-salah ej-jayeh?", english: "When is the next prayer time?", farsi: "وقت نماز بعدی کیه؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن ساعت اذان بعدی", gender: "unisex" },
  { id: "gulf_rp1", category: "religious_pilgrimage", arabic: "وين مكان الطواف؟", arabicPhonetic: "وِین مَکان الطَواف؟", arabicPhoneticLatin: "Wein makan at-tawaf?", english: "Where is the place for tawaf?", farsi: "محل طواف کجاست؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن مکان طواف در سفر زیارتی", gender: "unisex" },
  { id: "gulf_rp2", category: "religious_pilgrimage", arabic: "الله يقبل زيارتك", arabicPhonetic: "اَلله یِقبَل زیارَتَک", arabicPhoneticLatin: "Allah yiqbal ziyaratak", english: "May God accept your pilgrimage", farsi: "خدا زیارتت رو قبول کنه", dialect: "لهجه خلیجی", audioTips: "دعای رایج خطاب به زائر", gender: "unisex" },
  { id: "eg_rp1", category: "religious_pilgrimage", arabic: "فين أقرب جامع من هنا؟", arabicPhonetic: "فین اَقرَب جامِع مِن هِنا؟", arabicPhoneticLatin: "Fein aqrab gami' min hena?", english: "Where's the nearest mosque from here?", farsi: "نزدیک‌ترین مسجد از اینجا کجاست؟", dialect: "لهجه مصری", audioTips: "پرسیدن مسیر مسجد به لهجه مصری", gender: "unisex" },
  { id: "eg_rp2", category: "religious_pilgrimage", arabic: "الله يتقبل منك", arabicPhonetic: "اَلله یِتقَبَّل مِنَّک", arabicPhoneticLatin: "Allah yit'abbal minnak", english: "May God accept it from you", farsi: "خدا از تو قبول کنه", dialect: "لهجه مصری", audioTips: "دعای رایج پس از عبادت یا زیارت", gender: "unisex" },
  { id: "en_us3_rp1", category: "religious_pilgrimage", arabic: "Where is the nearest church?", arabicPhonetic: "ور ایز دِ نیرست چرچ؟", arabicPhoneticLatin: "Where is the nearest church?", english: "Where is the nearest church?", farsi: "نزدیک‌ترین کلیسا کجاست؟", dialect: "انگلیسی آمریکایی", audioTips: "برای پرسیدن مکان‌های مذهبی در کشورهای انگلیسی‌زبان", lang: "english", gender: "unisex" },
  { id: "en_us3_rp2", category: "religious_pilgrimage", arabic: "What time does the service start?", arabicPhonetic: "وات تایم داز دِ سِرویس استارت؟", arabicPhoneticLatin: "What time does the service start?", english: "What time does the service start?", farsi: "مراسم چه ساعتی شروع می‌شه؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن زمان مراسم مذهبی", lang: "english", gender: "unisex" },
  { id: "en_gb3_rp1", category: "religious_pilgrimage", arabic: "Is there a prayer room nearby?", arabicPhonetic: "ایز دِر اَ پریِر روم نیربای؟", arabicPhoneticLatin: "Is there a prayer room nearby?", english: "Is there a prayer room nearby?", farsi: "نزدیک این‌جا اتاق نماز هست؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "معمولاً در فرودگاه‌ها و مراکز بزرگ بریتانیا موجود است", lang: "english", gender: "unisex" },
  { id: "en_gb3_rp2", category: "religious_pilgrimage", arabic: "I'd like to visit the cathedral, please.", arabicPhonetic: "آید لایک تو ویزیت دِ کثیدرال، پلیز", arabicPhoneticLatin: "I'd like to visit the cathedral, please.", english: "I'd like to visit the cathedral, please.", farsi: "می‌خواستم از کلیسای جامع بازدید کنم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "برای بازدید از اماکن مذهبی تاریخی", lang: "english", gender: "unisex" },

  // === TECH & INTERNET (اینترنت و موبایل) ===
  { id: "iq3_ti1", category: "tech_internet", arabic: "عندكم واي فاي؟ شنو الباسورد؟", arabicPhonetic: "عِندکُم وایفای؟ شِنو الباسوَرد؟", arabicPhoneticLatin: "Indkum wifi? Shino al-password?", english: "Do you have wifi? What's the password?", farsi: "وای‌فای دارید؟ رمزش چیه؟", dialect: "لهجه عراقی", audioTips: "پرسیدن رمز وای‌فای در هتل/کافه", gender: "unisex" },
  { id: "iq3_ti2", category: "tech_internet", arabic: "موبايلي ماكو عليه شحن", arabicPhonetic: "موبایلی ماکو عَلَیه شَحَن", arabicPhoneticLatin: "Mobayli mako 'alaih shahin", english: "My phone has no charge", farsi: "گوشیم شارژ نداره", dialect: "لهجه عراقی", audioTips: "توضیح مشکل باتری گوشی", gender: "unisex" },
  { id: "lb3_ti1", category: "tech_internet", arabic: "في واي فاي هون؟ شو الباسوورد؟", arabicPhonetic: "فی وایفای هون؟ شو الباسوورد؟", arabicPhoneticLatin: "Fi wifi hon? Shu el-password?", english: "Is there wifi here? What's the password?", farsi: "اینجا وای‌فای هست؟ رمزش چیه؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن رمز وای‌فای", gender: "unisex" },
  { id: "lb3_ti2", category: "tech_internet", arabic: "بدي شاحن موبايل، عندك؟", arabicPhonetic: "بِدّی شاحِن موبایل، عِندَک؟", arabicPhoneticLatin: "Biddi shahen mobile, andak?", english: "I need a phone charger, do you have one?", farsi: "شارژر موبایل می‌خوام، داری؟", dialect: "لهجه لبنانی (شامی)", audioTips: "درخواست شارژر از دیگران", gender: "unisex" },
  { id: "gulf_ti1", category: "tech_internet", arabic: "أبي أشتري شريحة اتصالات", arabicPhonetic: "اَبی اَشتَری شَریحَه اِتِّصالات", arabicPhoneticLatin: "Abi ashtiri shareeha ittisalat", english: "I want to buy a SIM card", farsi: "می‌خوام یه سیم‌کارت بخرم", dialect: "لهجه خلیجی", audioTips: "خرید سیم‌کارت محلی", gender: "unisex" },
  { id: "gulf_ti2", category: "tech_internet", arabic: "النت بطيء وايد", arabicPhonetic: "النِت بَطیء وایِد", arabicPhoneticLatin: "An-net bati' wayid", english: "The internet is very slow", farsi: "اینترنت خیلی کنده", dialect: "لهجه خلیجی", audioTips: "شکایت از سرعت اینترنت", gender: "unisex" },
  { id: "eg_ti1", category: "tech_internet", arabic: "في واي فاي هنا؟ الباسورد ايه؟", arabicPhonetic: "فی وایفای هِنا؟ الباسوَرد اِیه؟", arabicPhoneticLatin: "Fi wifi hena? El-password eh?", english: "Is there wifi here? What's the password?", farsi: "اینجا وای‌فای هست؟ رمزش چیه؟", dialect: "لهجه مصری", audioTips: "پرسیدن رمز وای‌فای به لهجه مصری", gender: "unisex" },
  { id: "eg_ti2", category: "tech_internet", arabic: "عايز اشتري خط موبايل", arabicPhonetic: "عایِز اِشتِری خَط موبایل", arabicPhoneticLatin: "Ayez eshteri khat mobile", english: "I want to buy a phone line/SIM", farsi: "می‌خوام یه سیم‌کارت بخرم", dialect: "لهجه مصری", audioTips: "خرید سیم‌کارت در مصر", gender: "unisex" },
  { id: "en_us3_ti1", category: "tech_internet", arabic: "Is there wifi here? What's the password?", arabicPhonetic: "ایز دِر وایفای هیر؟ واتس دِ پسورد؟", arabicPhoneticLatin: "Is there wifi here? What's the password?", english: "Is there wifi here? What's the password?", farsi: "اینجا وای‌فای هست؟ رمزش چیه؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن وای‌فای در کافه/هتل", lang: "english", gender: "unisex" },
  { id: "en_us3_ti2", category: "tech_internet", arabic: "My phone's about to die.", arabicPhonetic: "مای فونز اَباوت تو دای", arabicPhoneticLatin: "My phone's about to die.", english: "My phone's about to die.", farsi: "گوشیم داره خاموش می‌شه (شارژ کمه).", dialect: "انگلیسی آمریکایی", audioTips: "اصطلاح خودمانی برای اتمام شارژ گوشی", lang: "english", gender: "unisex" },
  { id: "en_gb3_ti1", category: "tech_internet", arabic: "Do you have wifi, and what's the password?", arabicPhonetic: "دو یو هَو وایفای، اَند واتس دِ پسورد؟", arabicPhoneticLatin: "Do you have wifi, and what's the password?", english: "Do you have wifi, and what's the password?", farsi: "وای‌فای دارید؟ رمزش چیه؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن وای‌فای به‌شکل مؤدبانه", lang: "english", gender: "unisex" },
  { id: "en_gb3_ti2", category: "tech_internet", arabic: "Could I buy a local SIM card somewhere?", arabicPhonetic: "کود آی بای اَ لوکال سیم کارد سام‌ور؟", arabicPhoneticLatin: "Could I buy a local SIM card somewhere?", english: "Could I buy a local SIM card somewhere?", farsi: "کجا می‌تونم سیم‌کارت محلی بخرم؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن محل خرید سیم‌کارت", lang: "english", gender: "unisex" },

  // === COMPLIMENTS & APOLOGIES (تعریف و عذرخواهی) ===
  { id: "iq3_ca1", category: "compliments_apologies", arabic: "ذوقك حلو مره", arabicPhonetic: "ذَوقَک حِلو مَرَّه", arabicPhoneticLatin: "Dhawqak hilu marra", english: "You have great taste", farsi: "سلیقه‌ت خیلی خوبه", dialect: "لهجه عراقی", audioTips: "تعریف از سلیقه کسی", gender: "unisex" },
  { id: "iq3_ca2", category: "compliments_apologies", arabic: "سامحني، ما كان قصدي", arabicPhonetic: "سامِحنی، ما کان قَصدی", arabicPhoneticLatin: "Samihni, ma kan qasdi", english: "Forgive me, I didn't mean it", farsi: "ببخشید، منظوری نداشتم", dialect: "لهجه عراقی", audioTips: "عذرخواهی صمیمانه", gender: "unisex" },
  { id: "lb3_ca1", category: "compliments_apologies", arabic: "ذوقك حلو كتير", arabicPhonetic: "ذَوقَک حِلو کتیر", arabicPhoneticLatin: "Dhawa'ak helou kteer", english: "You have great taste", farsi: "سلیقه‌ت خیلی خوبه", dialect: "لهجه لبنانی (شامی)", audioTips: "تعریف از انتخاب یا سلیقه", gender: "unisex" },
  { id: "lb3_ca2", category: "compliments_apologies", arabic: "بعتذر منك كتير", arabicPhonetic: "بِعتِذِر مِنَّک کتیر", arabicPhoneticLatin: "Bi'tzir minnak kteer", english: "I sincerely apologize to you", farsi: "خیلی ازت عذرخواهی می‌کنم", dialect: "لهجه لبنانی (شامی)", audioTips: "عذرخواهی رسمی‌تر", gender: "unisex" },
  { id: "gulf_ca1", category: "compliments_apologies", arabic: "ذوقك راقي وايد", arabicPhonetic: "ذَوقَک راقی وایِد", arabicPhoneticLatin: "Dhawgak raqi wayid", english: "Your taste is very refined", farsi: "سلیقه‌ت خیلی خوبه", dialect: "لهجه خلیجی", audioTips: "تعریف مؤدبانه از سلیقه", gender: "unisex" },
  { id: "gulf_ca2", category: "compliments_apologies", arabic: "اعذرني، ما قصدت أزعجك", arabicPhonetic: "اِعذُرنی، ما قَصَدت اَزعِجَک", arabicPhoneticLatin: "I'dhurni, ma qasadt az'ijak", english: "Excuse me, I didn't mean to bother you", farsi: "ببخشید، نمی‌خواستم مزاحمت بشم", dialect: "لهجه خلیجی", audioTips: "عذرخواهی مؤدبانه", gender: "unisex" },
  { id: "eg_ca1", category: "compliments_apologies", arabic: "ذوقك حلو أوي", arabicPhonetic: "ذَوقَک حِلو اَوی", arabicPhoneticLatin: "Dhaw'ak helw awi", english: "You have really great taste", farsi: "سلیقه‌ت خیلی خوبه", dialect: "لهجه مصری", audioTips: "تعریف از سلیقه به سبک مصری", gender: "unisex" },
  { id: "eg_ca2", category: "compliments_apologies", arabic: "معلش، آسف قوي", arabicPhonetic: "مَعلِش، آسِف قَوی", arabicPhoneticLatin: "Ma'lesh, asef awi", english: "It's okay, I'm really sorry", farsi: "اشکالی نداره، خیلی متأسفم", dialect: "لهجه مصری", audioTips: "عذرخواهی خودمانی مصری", gender: "unisex" },
  { id: "en_us3_ca1", category: "compliments_apologies", arabic: "You have great taste!", arabicPhonetic: "یو هَو گریت تِیست!", arabicPhoneticLatin: "You have great taste!", english: "You have great taste!", farsi: "سلیقه‌ت خیلی خوبه!", dialect: "انگلیسی آمریکایی", audioTips: "تعریف دوستانه", lang: "english", gender: "unisex" },
  { id: "en_us3_ca2", category: "compliments_apologies", arabic: "I'm so sorry, I didn't mean to.", arabicPhonetic: "آیم سو ساری، آی دیدنت مین تو", arabicPhoneticLatin: "I'm so sorry, I didn't mean to.", english: "I'm so sorry, I didn't mean to.", farsi: "خیلی متأسفم، منظوری نداشتم.", dialect: "انگلیسی آمریکایی", audioTips: "عذرخواهی صمیمانه", lang: "english", gender: "unisex" },
  { id: "en_gb3_ca1", category: "compliments_apologies", arabic: "That's a lovely choice, well done.", arabicPhonetic: "دَتس اَ لاولی چویس، وِل دان", arabicPhoneticLatin: "That's a lovely choice, well done.", english: "That's a lovely choice, well done.", farsi: "انتخاب قشنگی بود، آفرین.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "تعریف مؤدبانه بریتانیایی", lang: "english", gender: "unisex" },
  { id: "en_gb3_ca2", category: "compliments_apologies", arabic: "I do apologize, that was my mistake.", arabicPhonetic: "آی دو اَپالوجایز، دت واز مای میستیک", arabicPhoneticLatin: "I do apologize, that was my mistake.", english: "I do apologize, that was my mistake.", farsi: "واقعاً عذرخواهی می‌کنم، تقصیر من بود.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "عذرخواهی رسمی بریتانیایی", lang: "english", gender: "unisex" },

  // === HOTEL & LODGING (هتل و اقامت) ===
  { id: "iq4_hl1", category: "hotel_lodging", arabic: "عندي حجز باسمي", arabicPhonetic: "عِندی حَجز بِاسمی", arabicPhoneticLatin: "Indi hajiz bismi", english: "I have a reservation under my name", farsi: "من به اسم خودم رزرو دارم", dialect: "لهجه عراقی", audioTips: "معرفی خود در پذیرش هتل", gender: "unisex" },
  { id: "iq4_hl2", category: "hotel_lodging", arabic: "شنو وكت الخروج من الفندق؟", arabicPhonetic: "شِنو وَکت الخُروج مِن الفُندُق؟", arabicPhoneticLatin: "Shino wakit al-khurooj min al-funduq?", english: "What's the checkout time?", farsi: "ساعت تسویه هتل چیه؟", dialect: "لهجه عراقی", audioTips: "پرسیدن ساعت تسویه حساب", gender: "unisex" },
  { id: "lb4_hl1", category: "hotel_lodging", arabic: "عندي حجز باسمي", arabicPhonetic: "عِندی حَجز بِاسمی", arabicPhoneticLatin: "Andi hajez b-ismi", english: "I have a reservation under my name", farsi: "من به اسم خودم رزرو دارم", dialect: "لهجه لبنانی (شامی)", audioTips: "اعلام رزرو در پذیرش", gender: "unisex" },
  { id: "lb4_hl2", category: "hotel_lodging", arabic: "بدي غرفة تلات ليالي", arabicPhonetic: "بِدّی غُرفِه تَلات لَیالی", arabicPhoneticLatin: "Biddi ghorfeh talet layali", english: "I want a room for three nights", farsi: "یه اتاق برای سه شب می‌خوام", dialect: "لهجه لبنانی (شامی)", audioTips: "رزرو اتاق هتل", gender: "unisex" },
  { id: "gulf_hl1", category: "hotel_lodging", arabic: "أبي غرفة مطلة على البحر", arabicPhonetic: "اَبی غُرفَه مُطِلَّه عَلَی البَحر", arabicPhoneticLatin: "Abi ghurfa mutilla 'ala al-bahr", english: "I want a room with a sea view", farsi: "یه اتاق با ویو دریا می‌خوام", dialect: "لهجه خلیجی", audioTips: "درخواست اتاق با ویژگی خاص", gender: "unisex" },
  { id: "gulf_hl2", category: "hotel_lodging", arabic: "وين محل الفطور؟", arabicPhonetic: "وِین مَحَل الفُطور؟", arabicPhoneticLatin: "Wein mahal al-futoor?", english: "Where is the breakfast area?", farsi: "محل صبحانه کجاست؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن مکان صبحانه در هتل", gender: "unisex" },
  { id: "eg_hl1", category: "hotel_lodging", arabic: "عندي حجز باسمي", arabicPhonetic: "عِندی حَجز بِاسمی", arabicPhoneticLatin: "Andi hagz bismi", english: "I have a reservation under my name", farsi: "من به اسم خودم رزرو دارم", dialect: "لهجه مصری", audioTips: "اعلام رزرو در هتل به لهجه مصری", gender: "unisex" },
  { id: "eg_hl2", category: "hotel_lodging", arabic: "ممكن أغير الغرفة؟ فيها مشكلة", arabicPhonetic: "مُمکِن اَغَیَّر الغُرفَه؟ فیها مُشکِلَه", arabicPhoneticLatin: "Mumkin aghayyar el-ghorfa? Feeha moshkela", english: "Can I change the room? There's a problem with it", farsi: "می‌شه اتاقم رو عوض کنم؟ مشکل داره", dialect: "لهجه مصری", audioTips: "درخواست تعویض اتاق", gender: "unisex" },
  { id: "en_us4_hl1", category: "hotel_lodging", arabic: "I have a reservation under my name.", arabicPhonetic: "آی هَو اَ رزرویشن آندر مای نیم", arabicPhoneticLatin: "I have a reservation under my name.", english: "I have a reservation under my name.", farsi: "من به اسم خودم رزرو دارم.", dialect: "انگلیسی آمریکایی", audioTips: "چک‌این در هتل", lang: "english", gender: "unisex" },
  { id: "en_us4_hl2", category: "hotel_lodging", arabic: "What time is checkout?", arabicPhonetic: "وات تایم ایز چک‌اوت؟", arabicPhoneticLatin: "What time is checkout?", english: "What time is checkout?", farsi: "ساعت تسویه چنده؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن ساعت تسویه هتل", lang: "english", gender: "unisex" },
  { id: "en_gb4_hl1", category: "hotel_lodging", arabic: "I've got a booking under my name.", arabicPhonetic: "آیو گات اَ بوکینگ آندر مای نیم", arabicPhoneticLatin: "I've got a booking under my name.", english: "I've got a booking under my name.", farsi: "من به اسم خودم رزرو دارم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "در بریتانیا از 'booking' بیشتر از 'reservation' استفاده می‌شود", lang: "english", gender: "unisex" },
  { id: "en_gb4_hl2", category: "hotel_lodging", arabic: "Could you tell me the checkout time, please?", arabicPhonetic: "کود یو تِل می دِ چک‌اوت تایم، پلیز؟", arabicPhoneticLatin: "Could you tell me the checkout time, please?", english: "Could you tell me the checkout time, please?", farsi: "لطفاً می‌شه ساعت تسویه رو بگید؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن مؤدبانه ساعت تسویه", lang: "english", gender: "unisex" },

  // === AIRPORT & TRAVEL (فرودگاه و سفر) ===
  { id: "iq4_at1", category: "airport_travel", arabic: "وين قاعة المغادرة؟", arabicPhonetic: "وِین قاعَه المُغادَرَه؟", arabicPhoneticLatin: "Wein qa'at al-mughadara?", english: "Where's the departure hall?", farsi: "سالن پرواز خروجی کجاست؟", dialect: "لهجه عراقی", audioTips: "پرسیدن مسیر در فرودگاه", gender: "unisex" },
  { id: "iq4_at2", category: "airport_travel", arabic: "الرحلة متأخرة لو لأ؟", arabicPhonetic: "الرِحلَه مِتاَخِّرَه لَو لا؟", arabicPhoneticLatin: "Ar-rihla mit'akhira law la?", english: "Is the flight delayed or not?", farsi: "پرواز تأخیر داره یا نه؟", dialect: "لهجه عراقی", audioTips: "پرسیدن وضعیت پرواز", gender: "unisex" },
  { id: "lb4_at1", category: "airport_travel", arabic: "وين صالة المغادرة؟", arabicPhonetic: "وِین صالِه المُغادَرَه؟", arabicPhoneticLatin: "Wein saalet el-mghadara?", english: "Where's the departure hall?", farsi: "سالن پرواز خروجی کجاست؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن مسیر ترمینال فرودگاه", gender: "unisex" },
  { id: "lb4_at2", category: "airport_travel", arabic: "وزني زايد على الشنطة؟", arabicPhonetic: "وَزنی زایِد عَلَی الشَنطَه؟", arabicPhoneticLatin: "Wazne zayed 'ala eshanta?", english: "Is my bag overweight?", farsi: "چمدونم اضافه‌وزن داره؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن درباره وزن چمدان در چک‌این", gender: "unisex" },
  { id: "gulf_at1", category: "airport_travel", arabic: "وين بوابة الطيران رقم خمسة؟", arabicPhonetic: "وِین بَوّابَه الطَیَران رَقَم خَمسَه؟", arabicPhoneticLatin: "Wein bawwabat at-tayaran raqam khamsa?", english: "Where's gate number five?", farsi: "گیت شماره پنج کجاست؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن مسیر گیت پرواز", gender: "unisex" },
  { id: "gulf_at2", category: "airport_travel", arabic: "أبي أوصل قبل الرحلة بساعتين", arabicPhonetic: "اَبی اَوصَل قَبل الرِحلَه بِساعَتَین", arabicPhoneticLatin: "Abi awsal qabl ar-rihla bisa'atain", english: "I want to arrive two hours before the flight", farsi: "می‌خوام دو ساعت قبل از پرواز برسم", dialect: "لهجه خلیجی", audioTips: "برنامه‌ریزی زمان رسیدن به فرودگاه", gender: "unisex" },
  { id: "eg_at1", category: "airport_travel", arabic: "فين صالة السفر؟", arabicPhonetic: "فین صالَه السَفَر؟", arabicPhoneticLatin: "Fein salet es-safar?", english: "Where's the departure hall?", farsi: "سالن پرواز خروجی کجاست؟", dialect: "لهجه مصری", audioTips: "پرسیدن مسیر فرودگاه به لهجه مصری", gender: "unisex" },
  { id: "eg_at2", category: "airport_travel", arabic: "الطيارة هتتأخر؟", arabicPhonetic: "الطَیّارَه هَتِتاَخَّر؟", arabicPhoneticLatin: "Et-tayara hatit'akhar?", english: "Will the plane be delayed?", farsi: "هواپیما تأخیر می‌خوره؟", dialect: "لهجه مصری", audioTips: "پرسیدن وضعیت پرواز به سبک مصری", gender: "unisex" },
  { id: "en_us4_at1", category: "airport_travel", arabic: "Where's the departure gate?", arabicPhonetic: "ور از دِ دیپارچر گیت؟", arabicPhoneticLatin: "Where's the departure gate?", english: "Where's the departure gate?", farsi: "گیت خروجی کجاست؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن مسیر گیت پرواز", lang: "english", gender: "unisex" },
  { id: "en_us4_at2", category: "airport_travel", arabic: "Is my flight on time?", arabicPhonetic: "ایز مای فلایت آن تایم؟", arabicPhoneticLatin: "Is my flight on time?", english: "Is my flight on time?", farsi: "پروازم به موقعه؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن وضعیت زمانی پرواز", lang: "english", gender: "unisex" },
  { id: "en_gb4_at1", category: "airport_travel", arabic: "Which way to the departure lounge?", arabicPhonetic: "ویچ وی تو دِ دیپارچر لانج؟", arabicPhoneticLatin: "Which way to the departure lounge?", english: "Which way to the departure lounge?", farsi: "سالن پرواز خروجی از کدوم طرفه؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن مسیر سالن انتظار پرواز", lang: "english", gender: "unisex" },
  { id: "en_gb4_at2", category: "airport_travel", arabic: "Is my luggage within the weight limit?", arabicPhonetic: "ایز مای لاگیج ویدین دِ وِیت لیمیت؟", arabicPhoneticLatin: "Is my luggage within the weight limit?", english: "Is my luggage within the weight limit?", farsi: "چمدونم توی محدودیت وزنیه؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن وزن مجاز چمدان", lang: "english", gender: "unisex" },

  // === BANK & MONEY (بانک و پول) ===
  { id: "iq4_bm1", category: "bank_money", arabic: "وين أكو صراف آلي هنا؟", arabicPhonetic: "وِین اَکو صَرّاف آلی هِنا؟", arabicPhoneticLatin: "Wein aku sarraf aali hna?", english: "Where is there an ATM here?", farsi: "دستگاه خودپرداز کجاست؟", dialect: "لهجه عراقی", audioTips: "پرسیدن مسیر عابربانک", gender: "unisex" },
  { id: "iq4_bm2", category: "bank_money", arabic: "أريد أصرف دولار إلى دينار", arabicPhonetic: "اَرید اَصرُف دولار اِلَی دینار", arabicPhoneticLatin: "Areed asrouf dolar ila dinar", english: "I want to exchange dollars to dinars", farsi: "می‌خوام دلار رو به دینار تبدیل کنم", dialect: "لهجه عراقی", audioTips: "تبدیل ارز در صرافی", gender: "unisex" },
  { id: "lb4_bm1", category: "bank_money", arabic: "وين في صراف آلي هون؟", arabicPhonetic: "وِین فی صَرّاف آلی هون؟", arabicPhoneticLatin: "Wein fi sarraf aale hon?", english: "Where is there an ATM here?", farsi: "دستگاه خودپرداز کجاست؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن مسیر عابربانک به لهجه لبنانی", gender: "unisex" },
  { id: "lb4_bm2", category: "bank_money", arabic: "بتقبلوا بطاقة ائتمان؟", arabicPhonetic: "بِتِقبَلوا بِطاقَه اِئتِمان؟", arabicPhoneticLatin: "Bti'balo bitaqet i'timen?", english: "Do you accept credit cards?", farsi: "کارت اعتباری قبول می‌کنید؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن پذیرش کارت اعتباری", gender: "unisex" },
  { id: "gulf_bm1", category: "bank_money", arabic: "وين أقرب صراف آلي؟", arabicPhonetic: "وِین اَقرَب صَرّاف آلی؟", arabicPhoneticLatin: "Wein aqrab sarraf aali?", english: "Where's the nearest ATM?", farsi: "نزدیک‌ترین خودپرداز کجاست؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن مسیر عابربانک", gender: "unisex" },
  { id: "gulf_bm2", category: "bank_money", arabic: "تقبلون فيزا أو بس كاش؟", arabicPhonetic: "تِقبَلون فیزا اَو بَس کاش؟", arabicPhoneticLatin: "Tigbaloon visa aw bas cash?", english: "Do you accept visa or only cash?", farsi: "کارت ویزا قبول می‌کنید یا فقط نقدی؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن روش پرداخت", gender: "unisex" },
  { id: "eg_bm1", category: "bank_money", arabic: "فين أقرب فيزا أو ماكينة سحب؟", arabicPhonetic: "فین اَقرَب فیزا اَو ماکینَه سَحب؟", arabicPhoneticLatin: "Fein aqrab visa aw makanet sahb?", english: "Where's the nearest ATM?", farsi: "نزدیک‌ترین خودپرداز کجاست؟", dialect: "لهجه مصری", audioTips: "پرسیدن مسیر عابربانک به لهجه مصری", gender: "unisex" },
  { id: "eg_bm2", category: "bank_money", arabic: "بتقبلوا فيزا كارد؟", arabicPhonetic: "بِتِقبَلوا فیزا کارد؟", arabicPhoneticLatin: "Bti'baloo visa card?", english: "Do you accept visa card?", farsi: "کارت ویزا قبول می‌کنید؟", dialect: "لهجه مصری", audioTips: "پرسیدن پذیرش کارت", gender: "unisex" },
  { id: "en_us4_bm1", category: "bank_money", arabic: "Where's the nearest ATM?", arabicPhonetic: "ور از دِ نیرست ای‌تی‌ام؟", arabicPhoneticLatin: "Where's the nearest ATM?", english: "Where's the nearest ATM?", farsi: "نزدیک‌ترین خودپرداز کجاست؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن مسیر عابربانک", lang: "english", gender: "unisex" },
  { id: "en_us4_bm2", category: "bank_money", arabic: "Do you take credit cards?", arabicPhonetic: "دو یو تیک کردیت کاردز؟", arabicPhoneticLatin: "Do you take credit cards?", english: "Do you take credit cards?", farsi: "کارت اعتباری قبول می‌کنید؟", dialect: "انگلیسی آمریکایی", audioTips: "پرسیدن پذیرش کارت در فروشگاه", lang: "english", gender: "unisex" },
  { id: "en_gb4_bm1", category: "bank_money", arabic: "Where's the nearest cash machine?", arabicPhonetic: "ور از دِ نیرست کش مشین؟", arabicPhoneticLatin: "Where's the nearest cash machine?", english: "Where's the nearest cash machine?", farsi: "نزدیک‌ترین خودپرداز کجاست؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "در بریتانیا معمولاً 'cash machine' یا 'cashpoint' گفته می‌شود", lang: "english", gender: "unisex" },
  { id: "en_gb4_bm2", category: "bank_money", arabic: "Do you accept card payments?", arabicPhonetic: "دو یو اَکسپت کارد پیمنتس؟", arabicPhoneticLatin: "Do you accept card payments?", english: "Do you accept card payments?", farsi: "پرداخت با کارت قبول می‌کنید؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن پذیرش پرداخت کارتی", lang: "english", gender: "unisex" },

  // === CLOTHING & SIZES (لباس و سایز) ===
  { id: "iq5_cs1", category: "clothing_sizes", arabic: "عندك مقاس أكبر؟", arabicPhonetic: "عِندَک مَقاس اَکبَر؟", arabicPhoneticLatin: "Indak maqas akbar?", english: "Do you have a bigger size?", farsi: "سایز بزرگ‌تر دارید؟", dialect: "لهجه عراقی", audioTips: "درخواست سایز دیگر در فروشگاه پوشاک", gender: "unisex" },
  { id: "iq5_cs2", category: "clothing_sizes", arabic: "أكدر أقيسه؟", arabicPhonetic: "اَکدَر اَقیسَه؟", arabicPhoneticLatin: "Agdar aqeesa?", english: "Can I try it on?", farsi: "می‌تونم امتحانش کنم؟", dialect: "لهجه عراقی", audioTips: "درخواست پرو کردن لباس", gender: "unisex" },
  { id: "lb5_cs1", category: "clothing_sizes", arabic: "عندك قياس أكبر؟", arabicPhonetic: "عِندَک قیاس اَکبَر؟", arabicPhoneticLatin: "Andak iyas akbar?", english: "Do you have a bigger size?", farsi: "سایز بزرگ‌تر دارید؟", dialect: "لهجه لبنانی (شامی)", audioTips: "پرسیدن سایز دیگر", gender: "unisex" },
  { id: "lb5_cs2", category: "clothing_sizes", arabic: "فيني قيسها؟", arabicPhonetic: "فینی قیسها؟", arabicPhoneticLatin: "Feeni ayyisha?", english: "Can I try it on?", farsi: "می‌تونم امتحانش کنم؟", dialect: "لهجه لبنانی (شامی)", audioTips: "درخواست اتاق پرو", gender: "unisex" },
  { id: "gulf_cs1", category: "clothing_sizes", arabic: "عندك مقاس أكبر شوي؟", arabicPhonetic: "عِندَک مَقاس اَکبَر شِوَی؟", arabicPhoneticLatin: "Indak maqas akbar shway?", english: "Do you have a slightly bigger size?", farsi: "یه سایز بزرگ‌تر دارید؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن سایز بزرگ‌تر", gender: "unisex" },
  { id: "gulf_cs2", category: "clothing_sizes", arabic: "وين غرفة القياس؟", arabicPhonetic: "وِین غُرفَه القیاس؟", arabicPhoneticLatin: "Wein ghurfat al-qiyas?", english: "Where's the fitting room?", farsi: "اتاق پرو کجاست؟", dialect: "لهجه خلیجی", audioTips: "پرسیدن مکان اتاق پرو", gender: "unisex" },
  { id: "eg_cs1", category: "clothing_sizes", arabic: "عندك مقاس أكبر؟", arabicPhonetic: "عِندَک مَقاس اَکبَر؟", arabicPhoneticLatin: "Andak ma'as akbar?", english: "Do you have a bigger size?", farsi: "سایز بزرگ‌تر دارید؟", dialect: "لهجه مصری", audioTips: "پرسیدن سایز دیگر به لهجه مصری", gender: "unisex" },
  { id: "eg_cs2", category: "clothing_sizes", arabic: "فين غرفة القياس؟", arabicPhonetic: "فین غُرفَه القیاس؟", arabicPhoneticLatin: "Fein ghorfet el-'iyas?", english: "Where's the fitting room?", farsi: "اتاق پرو کجاست؟", dialect: "لهجه مصری", audioTips: "پرسیدن اتاق پرو", gender: "unisex" },
  { id: "en_us5_cs1", category: "clothing_sizes", arabic: "Do you have this in a larger size?", arabicPhonetic: "دو یو هَو دیس این اَ لارجر سایز؟", arabicPhoneticLatin: "Do you have this in a larger size?", english: "Do you have this in a larger size?", farsi: "این رو سایز بزرگ‌تر دارید؟", dialect: "انگلیسی آمریکایی", audioTips: "درخواست سایز دیگر", lang: "english", gender: "unisex" },
  { id: "en_us5_cs2", category: "clothing_sizes", arabic: "Can I try this on?", arabicPhonetic: "کن آی ترای دیس آن؟", arabicPhoneticLatin: "Can I try this on?", english: "Can I try this on?", farsi: "می‌شه امتحانش کنم؟", dialect: "انگلیسی آمریکایی", audioTips: "درخواست پرو لباس", lang: "english", gender: "unisex" },
  { id: "en_gb5_cs1", category: "clothing_sizes", arabic: "Have you got this in a bigger size?", arabicPhonetic: "هَو یو گات دیس این اَ بیگر سایز؟", arabicPhoneticLatin: "Have you got this in a bigger size?", english: "Have you got this in a bigger size?", farsi: "این رو سایز بزرگ‌تر دارید؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "درخواست سایز دیگر به سبک بریتانیایی", lang: "english", gender: "unisex" },
  { id: "en_gb5_cs2", category: "clothing_sizes", arabic: "Where are the fitting rooms, please?", arabicPhonetic: "ور آر دِ فیتینگ رومز، پلیز؟", arabicPhoneticLatin: "Where are the fitting rooms, please?", english: "Where are the fitting rooms, please?", farsi: "لطفاً اتاق پرو کجاست؟", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "پرسیدن مؤدبانه اتاق پرو", lang: "english", gender: "unisex" },

  // === EDUCATION & SCHOOL (تحصیل و مدرسه) ===
  { id: "iq5_ed1", category: "education_school", arabic: "أدرس بجامعة بغداد", arabicPhonetic: "اَدرُس بِجامِعَه بَغداد", arabicPhoneticLatin: "Adrus bi-jami'at Baghdad", english: "I study at Baghdad University", farsi: "من تو دانشگاه بغداد درس می‌خونم", dialect: "لهجه عراقی", audioTips: "معرفی محل تحصیل", gender: "unisex" },
  { id: "iq5_ed2", category: "education_school", arabic: "عندي امتحان مهم باجر", arabicPhonetic: "عِندی اِمتِحان مُهِم باجِر", arabicPhoneticLatin: "Indi imtihan muhim bajir", english: "I have an important exam tomorrow", farsi: "فردا یه امتحان مهم دارم", dialect: "لهجه عراقی", audioTips: "توضیح برنامه درسی", gender: "unisex" },
  { id: "lb5_ed1", category: "education_school", arabic: "بدرس بالجامعة الأميركية", arabicPhonetic: "بِدرُس بِالجامعِه الاَمیرکیِه", arabicPhoneticLatin: "Bidros bil-jam'a al-amirkiyye", english: "I study at the American university", farsi: "تو دانشگاه آمریکایی درس می‌خونم", dialect: "لهجه لبنانی (شامی)", audioTips: "معرفی دانشگاه", gender: "unisex" },
  { id: "lb5_ed2", category: "education_school", arabic: "لسه ولادي بالمدرسة", arabicPhonetic: "لِسَّه وْلادی بِالمَدرَسِه", arabicPhoneticLatin: "Lissa wladi bil-madrase", english: "My kids are still at school", farsi: "بچه‌هام هنوز مدرسه‌ان", dialect: "لهجه لبنانی (شامی)", audioTips: "صحبت درباره بچه‌ها و مدرسه", gender: "unisex" },
  { id: "gulf_ed1", category: "education_school", arabic: "أدرس بجامعة الملك سعود", arabicPhonetic: "اَدرُس بِجامِعَه المَلِک سَعود", arabicPhoneticLatin: "Adrus bi-jami'at al-malik Sa'ud", english: "I study at King Saud University", farsi: "تو دانشگاه ملک سعود درس می‌خونم", dialect: "لهجه خلیجی", audioTips: "معرفی دانشگاه در منطقه خلیج", gender: "unisex" },
  { id: "gulf_ed2", category: "education_school", arabic: "ودي أسجل بدورة لغة", arabicPhonetic: "وَدّی اَسَجِّل بِدَورَه لُغَه", arabicPhoneticLatin: "Waddi asajjil bi-dawra lugha", english: "I want to sign up for a language course", farsi: "می‌خوام تو یه دوره زبان ثبت‌نام کنم", dialect: "لهجه خلیجی", audioTips: "ثبت‌نام در دوره آموزشی", gender: "unisex" },
  { id: "eg_ed1", category: "education_school", arabic: "بدرس في جامعة القاهرة", arabicPhonetic: "بِدرُس فی جامعِه القاهِرَه", arabicPhoneticLatin: "Bidros fi gam'et el-qahera", english: "I study at Cairo University", farsi: "تو دانشگاه قاهره درس می‌خونم", dialect: "لهجه مصری", audioTips: "معرفی دانشگاه به لهجه مصری", gender: "unisex" },
  { id: "eg_ed2", category: "education_school", arabic: "عندي امتحان مهم بكرة", arabicPhonetic: "عِندی اِمتِحان مُهِم بُکرَه", arabicPhoneticLatin: "Andi emtehan mohem bokra", english: "I have an important exam tomorrow", farsi: "فردا یه امتحان مهم دارم", dialect: "لهجه مصری", audioTips: "توضیح برنامه امتحان", gender: "unisex" },
  { id: "en_us5_ed1", category: "education_school", arabic: "I'm studying computer science.", arabicPhonetic: "آیم استادینگ کامپیوتر ساینس", arabicPhoneticLatin: "I'm studying computer science.", english: "I'm studying computer science.", farsi: "دارم علوم کامپیوتر می‌خونم.", dialect: "انگلیسی آمریکایی", audioTips: "معرفی رشته تحصیلی", lang: "english", gender: "unisex" },
  { id: "en_us5_ed2", category: "education_school", arabic: "I have a big exam tomorrow.", arabicPhonetic: "آی هَو اَ بیگ اِگزم تومارو", arabicPhoneticLatin: "I have a big exam tomorrow.", english: "I have a big exam tomorrow.", farsi: "فردا یه امتحان بزرگ دارم.", dialect: "انگلیسی آمریکایی", audioTips: "توضیح برنامه امتحان", lang: "english", gender: "unisex" },
  { id: "en_gb5_ed1", category: "education_school", arabic: "I'm reading engineering at university.", arabicPhonetic: "آیم ریدینگ اِنجینیرینگ اَت یونیورسیتی", arabicPhoneticLatin: "I'm reading engineering at university.", english: "I'm reading engineering at university.", farsi: "تو دانشگاه مهندسی می‌خونم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "در انگلیسی بریتانیایی 'reading' یعنی رشته تحصیلی", lang: "english", gender: "unisex" },
  { id: "en_gb5_ed2", category: "education_school", arabic: "I've got my exams next week.", arabicPhonetic: "آیو گات مای اِگزَمز نکست ویک", arabicPhoneticLatin: "I've got my exams next week.", english: "I've got my exams next week.", farsi: "هفته دیگه امتحان دارم.", dialect: "انگلیسی بریتانیایی/استاندارد", audioTips: "صحبت درباره برنامه امتحانات", lang: "english", gender: "unisex" },

  // === CORE CONVERSATION VERBS (افعال و عبارات ضروری مکالمه) ===
  // Bug fix / content request: the phrase bank was thin on the single most
  // useful category for actually holding a conversation - "I want",
  // "I don't understand", "please repeat", "how do you say X" - the
  // building blocks every other phrase category depends on. Added here
  // for exactly the three dialects the user is learning (Iraqi, Lebanese,
  // American English), each phrase checked against real dialectal usage
  // rather than a literal MSA-to-dialect word swap.
  { id: "iq_dv1", category: "core_verbs", arabic: "أريد هذا، لو سمحت", arabicPhonetic: "اَرید هَذا، لَو سَمَحت", arabicPhoneticLatin: "Areed hatha, lo samaht", english: "I want this, please", farsi: "این رو می‌خوام، لطفاً", dialect: "لهجه عراقی", audioTips: "أريد رایج‌تر از ابي در موقعیت‌های مؤدبانه است", gender: "unisex" },
  { id: "iq_dv2", category: "core_verbs", arabic: "ما أفهم، عيد لو سمحت", arabicPhonetic: "ما اَفهَم، عید لَو سَمَحت", arabicPhoneticLatin: "Ma afham, 'eid lo samaht", english: "I don't understand, please repeat", farsi: "متوجه نمی‌شم، لطفاً تکرار کنید", dialect: "لهجه عراقی", audioTips: "عيد یعنی تکرار کن، خیلی پرکاربرده", gender: "unisex" },
  { id: "iq_dv3", category: "core_verbs", arabic: "شلون تكول هاي بالعربي؟", arabicPhonetic: "شِلون تِکول های بِالعَرَبی؟", arabicPhoneticLatin: "Shlon tguul hay bil-'arabi?", english: "How do you say this in Arabic?", farsi: "این رو به عربی چطور می‌گید؟", dialect: "لهجه عراقی", audioTips: "تكول (تقول عراقی) یعنی می‌گویی", gender: "unisex" },
  { id: "iq_dv4", category: "core_verbs", arabic: "أحتاج مساعدة، إذا ما تزعل", arabicPhonetic: "اَحتاج مُساعَدَه، اِذا ما تِزعَل", arabicPhoneticLatin: "Ahtaj musa'ada, itha ma tiz'al", english: "I need help, if you don't mind", farsi: "کمک لازم دارم، اگه ناراحت نمی‌شید", dialect: "لهجه عراقی", audioTips: "إذا ما تزعل عبارت مؤدبانهٔ محلیه", gender: "unisex" },
  { id: "iq_dv5", category: "core_verbs", arabic: "أكو مشكلة", arabicPhonetic: "اَکو مُشکِلَه", arabicPhoneticLatin: "Aku mushkila", english: "There's a problem", farsi: "یه مشکلی هست", dialect: "لهجه عراقی", audioTips: "أكو (هست) و ماكو (نیست) از کلمات کلیدی عراقی‌ان", gender: "unisex" },
  { id: "iq_dv6", category: "core_verbs", arabic: "ماكو مشكلة، خوش", arabicPhonetic: "ماکو مُشکِلَه، خوش", arabicPhoneticLatin: "Maku mushkila, khosh", english: "No problem, all good", farsi: "مشکلی نیست، خوبه", dialect: "لهجه عراقی", audioTips: "پاسخ خیلی رایج به تشکر یا عذرخواهی", gender: "unisex" },
  { id: "iq_dv7", category: "core_verbs", arabic: "أدري / ما أدري", arabicPhonetic: "اَدری / ما اَدری", arabicPhoneticLatin: "Adri / ma adri", english: "I know / I don't know", farsi: "می‌دونم / نمی‌دونم", dialect: "لهجه عراقی", audioTips: "أدري رایج‌تر از أعرف تو گفتار روزمره عراقیه", gender: "unisex" },
  { id: "iq_dv8", category: "core_verbs", arabic: "خلي أفكر شوية", arabicPhonetic: "خَلّی اَفَکِّر شُوَیَّه", arabicPhoneticLatin: "Khalli afakkir shwaya", english: "Let me think a little", farsi: "بذار یه کم فکر کنم", dialect: "لهجه عراقی", audioTips: "شوية یعنی یه کم", gender: "unisex" },

  { id: "lb_dv1", category: "core_verbs", arabic: "بدي هيدا، لو سمحت", arabicPhonetic: "بِدّی هِیدا، لَو سَمَحت", arabicPhoneticLatin: "Biddi heida, law samaht", english: "I want this, please", farsi: "این رو می‌خوام، لطفاً", dialect: "لهجه لبنانی (شامی)", audioTips: "بدي یعنی می‌خوام، خیلی پرکاربرده", gender: "unisex" },
  { id: "lb_dv2", category: "core_verbs", arabic: "ما فهمت، فيك تعيد؟", arabicPhonetic: "ما فِهِمت، فیک تِعید؟", arabicPhoneticLatin: "Ma fhemt, fik t'eed?", english: "I didn't understand, can you repeat?", farsi: "متوجه نشدم، می‌شه تکرار کنید؟", dialect: "لهجه لبنانی (شامی)", audioTips: "فيك یعنی می‌تونی، خیلی رایجه", gender: "unisex" },
  { id: "lb_dv3", category: "core_verbs", arabic: "كيف بتقول هيدي بالعربي؟", arabicPhonetic: "کیف بِتقول هِیدی بِالعَرَبی؟", arabicPhoneticLatin: "Kif btu'ol heidi bil-'arabi?", english: "How do you say this in Arabic?", farsi: "این رو به عربی چطور می‌گید؟", dialect: "لهجه لبنانی (شامی)", audioTips: "بتقول یعنی می‌گی", gender: "unisex" },
  { id: "lb_dv4", category: "core_verbs", arabic: "محتاج مساعدة إذا بيصير", arabicPhonetic: "مُحتاج مُساعَدِه اِذا بِیصیر", arabicPhoneticLatin: "Mehtaj musa'ade iza bisir", english: "I need help if possible", farsi: "کمک لازم دارم اگه ممکنه", dialect: "لهجه لبنانی (شامی)", audioTips: "إذا بيصير یعنی اگه ممکنه", gender: "unisex" },
  { id: "lb_dv5", category: "core_verbs", arabic: "في مشكلة شوي", arabicPhonetic: "فی مُشکِلِه شْوَی", arabicPhoneticLatin: "Fi mushkile shway", english: "There's a small problem", farsi: "یه مشکل کوچیک هست", dialect: "لهجه لبنانی (شامی)", audioTips: "شوي یعنی یه کم، در آخر جمله هم میاد", gender: "unisex" },
  { id: "lb_dv6", category: "core_verbs", arabic: "ولا يهمك، تمام", arabicPhonetic: "وَلا یِهِمَّک، تَمام", arabicPhoneticLatin: "Wala yhimmak, tamem", english: "No worries, it's fine", farsi: "نگران نباش، خوبه", dialect: "لهجه لبنانی (شامی)", audioTips: "ولا يهمك یکی از پرکاربردترین عبارت‌های لبنانیه", gender: "unisex" },
  { id: "lb_dv7", category: "core_verbs", arabic: "بعرف / ما بعرف", arabicPhonetic: "بَعرِف / ما بَعرِف", arabicPhoneticLatin: "Ba'ref / ma ba'ref", english: "I know / I don't know", farsi: "می‌دونم / نمی‌دونم", dialect: "لهجه لبنانی (شامی)", audioTips: "بعرف صرف رایج فعل عرف تو لهجهٔ شامیه", gender: "unisex" },
  { id: "lb_dv8", category: "core_verbs", arabic: "خليني فكر شوي", arabicPhonetic: "خَلّینی فَکِّر شْوَی", arabicPhoneticLatin: "Khallini fakker shway", english: "Let me think a little", farsi: "بذار یه کم فکر کنم", dialect: "لهجه لبنانی (شامی)", audioTips: "خليني یعنی بذار من", gender: "unisex" },

  { id: "en_us_dv1", category: "core_verbs", arabic: "I want this one, please.", arabicPhonetic: "آی وانت دیس وان، پلیز", arabicPhoneticLatin: "I want this one, please.", english: "I want this one, please.", farsi: "این یکی رو می‌خوام، لطفاً.", dialect: "انگلیسی آمریکایی", audioTips: "\"I'll take this one\" هم خیلی رایج‌تر و طبیعی‌تره", lang: "english", gender: "unisex" },
  { id: "en_us_dv2", category: "core_verbs", arabic: "Sorry, I don't get it — can you say that again?", arabicPhonetic: "ساری، آی دُنت گت ایت، کن یو سِی دَت اِگین؟", arabicPhoneticLatin: "Sorry, I don't get it — can you say that again?", english: "Sorry, I don't get it — can you say that again?", farsi: "ببخشید، متوجه نشدم — می‌شه دوباره بگید؟", dialect: "انگلیسی آمریکایی", audioTips: "\"I don't get it\" خیلی محاوره‌ای و رایج‌تر از don't understand است", lang: "english", gender: "unisex" },
  { id: "en_us_dv3", category: "core_verbs", arabic: "How do you say this in English?", arabicPhonetic: "هاو دو یو سِی دیس این اینگلیش؟", arabicPhoneticLatin: "How do you say this in English?", english: "How do you say this in English?", farsi: "این رو به انگلیسی چطور می‌گید؟", dialect: "انگلیسی آمریکایی", audioTips: "سؤال کلیدی برای یادگیری لغت جدید", lang: "english", gender: "unisex" },
  { id: "en_us_dv4", category: "core_verbs", arabic: "Could I get some help, please?", arabicPhonetic: "کود آی گت سام هلپ، پلیز؟", arabicPhoneticLatin: "Could I get some help, please?", english: "Could I get some help, please?", farsi: "می‌شه کمکم کنید؟", dialect: "انگلیسی آمریکایی", audioTips: "Could I get شکل مؤدبانه و خیلی رایج آمریکاییه", lang: "english", gender: "unisex" },
  { id: "en_us_dv5", category: "core_verbs", arabic: "There's a small problem.", arabicPhonetic: "دِرز اَ اسمال پرابلم", arabicPhoneticLatin: "There's a small problem.", english: "There's a small problem.", farsi: "یه مشکل کوچیک هست.", dialect: "انگلیسی آمریکایی", audioTips: "جملهٔ ساده برای گزارش مشکل", lang: "english", gender: "unisex" },
  { id: "en_us_dv6", category: "core_verbs", arabic: "No worries, it's all good.", arabicPhonetic: "نو وریز، ایتس اُل گود", arabicPhoneticLatin: "No worries, it's all good.", english: "No worries, it's all good.", farsi: "نگران نباش، همه چی خوبه.", dialect: "انگلیسی آمریکایی", audioTips: "پاسخ محاوره‌ای بسیار رایج آمریکایی", lang: "english", gender: "unisex" },
  { id: "en_us_dv7", category: "core_verbs", arabic: "I know / I have no idea.", arabicPhonetic: "آی نو / آی هَو نو آیدیا", arabicPhoneticLatin: "I know / I have no idea.", english: "I know / I have no idea.", farsi: "می‌دونم / هیچ ایده‌ای ندارم.", dialect: "انگلیسی آمریکایی", audioTips: "\"I have no idea\" رایج‌تر و طبیعی‌تر از don't know است", lang: "english", gender: "unisex" },
  { id: "en_us_dv8", category: "core_verbs", arabic: "Let me think about it for a sec.", arabicPhonetic: "لت می تینک اِباوت ایت فور اَ سک", arabicPhoneticLatin: "Let me think about it for a sec.", english: "Let me think about it for a sec.", farsi: "بذار یه لحظه فکر کنم.", dialect: "انگلیسی آمریکایی", audioTips: "sec مخفف محاوره‌ای second است", lang: "english", gender: "unisex" },

  // === RESTAURANT & FOOD (extra batch, added on user request) ===
  { id: "iq_rf1", category: "restaurant_food", arabic: "شنو عندكم زين اليوم؟", arabicPhonetic: "شِنو عِندَکُم زِین اَلیوم؟", arabicPhoneticLatin: "Shino 'indkum zain al-yōm?", english: "What's good here today?", farsi: "امروز چی دارید که خوبه؟", dialect: "عراقی", audioTips: "زین یعنی خوب/عالی، خیلی رایج در عراقی", gender: "unisex" },
  { id: "iq_rf2", category: "restaurant_food", arabic: "بدون بصل لو سمحت", arabicPhonetic: "بِدون بَصَل لَو سَمَحت", arabicPhoneticLatin: "Bidoon basal law samaht", english: "Without onion, please", farsi: "بدون پیاز، لطفاً", dialect: "عراقی", audioTips: "بدون + اسم غذا برای حذف هر ماده‌ای کار می‌کند", gender: "unisex" },
  { id: "iq_rf3", category: "restaurant_food", arabic: "الحساب لو سمحت", arabicPhonetic: "اَلحِساب لَو سَمَحت", arabicPhoneticLatin: "Al-hisaab law samaht", english: "The check, please", farsi: "صورت‌حساب لطفاً", dialect: "عراقی", audioTips: "همون فصیح استفاده میشه، فقط لهجه تلفظ فرق داره", gender: "unisex" },
  { id: "iq_rf4", category: "restaurant_food", arabic: "اكو شي حار مو حلو؟", arabicPhonetic: "اَکو شِی حار مو حِلو؟", arabicPhoneticLatin: "Aku shee haar mu hilu?", english: "Is there anything spicy, not sweet?", farsi: "چیز تندی هست که شیرین نباشه؟", dialect: "عراقی", audioTips: "اكو یعنی هست، خیلی پرکاربرده", gender: "unisex" },
  { id: "lb_rf1", category: "restaurant_food", arabic: "شو بتنصحني ياكل؟", arabicPhonetic: "شو بِتنصَحنی یاکُل؟", arabicPhoneticLatin: "Shu btinsahni yekol?", english: "What do you recommend I eat?", farsi: "چی پیشنهاد می‌کنید بخورم؟", dialect: "لهجه لبنانی (شامی)", audioTips: "سؤال خیلی طبیعی برای گارسون", gender: "unisex" },
  { id: "lb_rf2", category: "restaurant_food", arabic: "بدون بصل ياريت", arabicPhonetic: "بِدون بَصَل یارِیت", arabicPhoneticLatin: "Bidoon basal yarēt", english: "Without onion, if possible", farsi: "بدون پیاز، اگه میشه", dialect: "لهجه لبنانی (شامی)", audioTips: "ياريت یه خواهش مؤدبانه‌ست، معادل کاش/لطفاً", gender: "unisex" },
  { id: "lb_rf3", category: "restaurant_food", arabic: "الحساب، لو سمحت", arabicPhonetic: "اَلحِساب، لَو سَمَحت", arabicPhoneticLatin: "El-hsēb, law samaht", english: "The check, please", farsi: "صورت‌حساب لطفاً", dialect: "لهجه لبنانی (شامی)", audioTips: "همیشه با اشارهٔ دست تو هوا (نوشتن) هم همراهه", gender: "unisex" },
  { id: "lb_rf4", category: "restaurant_food", arabic: "فيه شي حلو، متل حلويات؟", arabicPhonetic: "فِیه شِی حِلو، مِتل حَلَویات؟", arabicPhoneticLatin: "Fiyye shi hilu, metl halawiyyat?", english: "Is there something sweet, like desserts?", farsi: "چیز شیرینی هست، مثل دسر؟", dialect: "لهجه لبنانی (شامی)", audioTips: "متل یعنی مثل", gender: "unisex" },
  { id: "en_us_rf1", category: "restaurant_food", arabic: "What do you recommend?", arabicPhonetic: "واتْ دو یو رِکامِند؟", arabicPhoneticLatin: "What do you recommend?", english: "What do you recommend?", farsi: "چی پیشنهاد می‌کنید؟", dialect: "انگلیسی آمریکایی", audioTips: "سؤال استاندارد رستورانی در آمریکا", lang: "english", gender: "unisex" },
  { id: "en_us_rf2", category: "restaurant_food", arabic: "Can I get that without onions?", arabicPhonetic: "کن آی گت دَت وایثاوت آنیِنز؟", arabicPhoneticLatin: "Can I get that without onions?", english: "Can I get that without onions?", farsi: "میشه اونو بدون پیاز بگیرم؟", dialect: "انگلیسی آمریکایی", audioTips: "\"Can I get\" خیلی رایج‌تر از \"I would like\" در محاوره است", lang: "english", gender: "unisex" },
  { id: "en_us_rf3", category: "restaurant_food", arabic: "Could we get the check, please?", arabicPhonetic: "کود وی گت دِ چک، پلیز؟", arabicPhoneticLatin: "Could we get the check, please?", english: "Could we get the check, please?", farsi: "میشه صورت‌حساب رو بیارید؟", dialect: "انگلیسی آمریکایی", audioTips: "در آمریکا \"check\" میگن، در بریتانیا \"bill\"", lang: "english", gender: "unisex" },
  { id: "en_us_rf4", category: "restaurant_food", arabic: "Do you have anything spicy?", arabicPhonetic: "دو یو هَو اِنی‌ثینگ اسپایسی؟", arabicPhoneticLatin: "Do you have anything spicy?", english: "Do you have anything spicy?", farsi: "چیز تندی دارید؟", dialect: "انگلیسی آمریکایی", audioTips: "سؤال ساده و پرکاربرد در هر رستورانی", lang: "english", gender: "unisex" },

  // === TAXI & DIRECTIONS (extra batch, added on user request) ===
  { id: "iq_td1", category: "taxi_directions", arabic: "خذني لهذا العنوان لو سمحت", arabicPhonetic: "خُذنی لِهَذا اَلعِنوان لَو سَمَحت", arabicPhoneticLatin: "Khithni la-hatha al-'unwaan law samaht", english: "Take me to this address, please", farsi: "منو به این آدرس ببر، لطفاً", dialect: "عراقی", audioTips: "خذني یعنی منو ببر", gender: "unisex" },
  { id: "iq_td2", category: "taxi_directions", arabic: "بيه چم تاخذ؟", arabicPhonetic: "بِیه چَم تاخُذ؟", arabicPhoneticLatin: "Beeh cham taakhuth?", english: "How much will it cost?", farsi: "چقدر می‌گیری؟", dialect: "عراقی", audioTips: "چم یعنی چقدر (مخصوص عراقی، مصری/شامی نمی‌گن)", gender: "unisex" },
  { id: "iq_td3", category: "taxi_directions", arabic: "وكف هنا لو سمحت", arabicPhonetic: "وَکِف هِنا لَو سَمَحت", arabicPhoneticLatin: "Wagif hina law samaht", english: "Stop here, please", farsi: "همینجا نگه دار، لطفاً", dialect: "عراقی", audioTips: "وكف یعنی نگه دار/بایست", gender: "unisex" },
  { id: "iq_td4", category: "taxi_directions", arabic: "شكد يبعد من هسه؟", arabicPhonetic: "شِکَد یِبعَد مِن هَسَّه؟", arabicPhoneticLatin: "Shgad yib'ad min hassa?", english: "How far is it from here?", farsi: "از اینجا چقدر فاصله داره؟", dialect: "عراقی", audioTips: "هسه یعنی الان/همین‌الان", gender: "unisex" },
  { id: "lb_td1", category: "taxi_directions", arabic: "بدي روح عهالعنوان لو سمحت", arabicPhonetic: "بِدّی روح عَهَالعِنوان لَو سَمَحت", arabicPhoneticLatin: "Biddi rooh 'a-hal-'unwēn law samaht", english: "I want to go to this address, please", farsi: "می‌خوام به این آدرس برم، لطفاً", dialect: "لهجه لبنانی (شامی)", audioTips: "بدي یعنی می‌خوام، خیلی پرکاربرد", gender: "unisex" },
  { id: "lb_td2", category: "taxi_directions", arabic: "قديش رح ياخد معك؟", arabicPhonetic: "قَدِّیش رَح یاخُد مَعَک؟", arabicPhoneticLatin: "Addēsh rah yekhod ma'ak?", english: "How much will it take?", farsi: "چقدر می‌گیری؟", dialect: "لهجه لبنانی (شامی)", audioTips: "قديش یعنی چقدر، به‌جای \"چم\" عراقی", gender: "unisex" },
  { id: "lb_td3", category: "taxi_directions", arabic: "وقف هون لو سمحت", arabicPhonetic: "وَقِّف هون لَو سَمَحت", arabicPhoneticLatin: "Waqqif hon law samaht", english: "Stop here, please", farsi: "همینجا نگه دار، لطفاً", dialect: "لهجه لبنانی (شامی)", audioTips: "هون یعنی اینجا (به‌جای هنا فصیح)", gender: "unisex" },
  { id: "lb_td4", category: "taxi_directions", arabic: "قديش بعيدة من هون؟", arabicPhonetic: "قَدِّیش بَعیدِه مِن هون؟", arabicPhoneticLatin: "Addēsh b'eede min hon?", english: "How far is it from here?", farsi: "از اینجا چقدر فاصله داره؟", dialect: "لهجه لبنانی (شامی)", audioTips: "بعيدة چون مؤنثه (المسافة)", gender: "unisex" },
  { id: "en_us_td1", category: "taxi_directions", arabic: "Can you take me to this address?", arabicPhonetic: "کن یو تِیک می تو دیس اَدرِس؟", arabicPhoneticLatin: "Can you take me to this address?", english: "Can you take me to this address?", farsi: "میشه منو به این آدرس ببرید؟", dialect: "انگلیسی آمریکایی", audioTips: "جملهٔ استاندارد برای تاکسی/اوبر", lang: "english", gender: "unisex" },
  { id: "en_us_td2", category: "taxi_directions", arabic: "About how much will it cost?", arabicPhonetic: "اِباوت هاو ماچ ویل ایت کاست؟", arabicPhoneticLatin: "About how much will it cost?", english: "About how much will it cost?", farsi: "تقریباً چقدر می‌شه؟", dialect: "انگلیسی آمریکایی", audioTips: "\"about\" برای گرفتن تخمین قیمت، نه قیمت دقیق", lang: "english", gender: "unisex" },
  { id: "en_us_td3", category: "taxi_directions", arabic: "You can drop me off right here.", arabicPhonetic: "یو کن دراپ می آف رایت هیر", arabicPhoneticLatin: "You can drop me off right here.", english: "You can drop me off right here.", farsi: "می‌تونید همینجا پیادم کنید.", dialect: "انگلیسی آمریکایی", audioTips: "\"drop me off\" اصطلاح استاندارد پیاده‌شدن از ماشین", lang: "english", gender: "unisex" },
  { id: "en_us_td4", category: "taxi_directions", arabic: "How far is it from here?", arabicPhonetic: "هاو فار ایز ایت فرام هیر؟", arabicPhoneticLatin: "How far is it from here?", english: "How far is it from here?", farsi: "از اینجا چقدر فاصله داره؟", dialect: "انگلیسی آمریکایی", audioTips: "سؤال ساده و کاربردی", lang: "english", gender: "unisex" }
];

// One "concept" (a single Farsi meaning) shown side-by-side across every
// supported dialect, so the user can hear/see exactly how the same idea
// changes shape from Iraqi to Lebanese to Gulf to Egyptian to American to
// British English. Each entry's `dialect` string matches getLangCode()'s
// keyword matching, so playback always uses the correct accent.
export interface DialectComparisonEntry {
  dialect: string;
  text: string;
  phonetic: string;
  phoneticLatin: string;
  lang?: "arabic" | "english";
}
export interface DialectComparisonConcept {
  id: string;
  titleFa: string;
  entries: DialectComparisonEntry[];
}

export const DIALECT_COMPARISONS: DialectComparisonConcept[] = [
  {
    id: "c1",
    titleFa: "سلام، حالت چطوره؟",
    entries: [
      { dialect: "لهجه عراقی", text: "شلونك عيني؟ أحوالك؟", phonetic: "شلونَک عِینی؟ اَحوالَک؟", phoneticLatin: "Shlonak ayni? Ahwalak?" },
      { dialect: "لهجه لبنانی (شامی)", text: "مرحبا، كيفك؟ شو الأخبار؟", phonetic: "مَرحَبا، کیفَک؟ شو الاَخبار؟", phoneticLatin: "Marhaba, kifak? Shu al-akhbar?" },
      { dialect: "لهجه خلیجی", text: "هلا والله، وش لونك؟ عساك طيب؟", phonetic: "هَلا وَالله، وِش لونَک؟ عَساک طَیِّب؟", phoneticLatin: "Hala wallah, wish lounak? Asak tayyib?" },
      { dialect: "لهجه مصری", text: "أهلاً يا باشا، ازيك؟ عامل ايه؟", phonetic: "اَهلاً یا باشا، اِزَّیَک؟ عامِل اِیه؟", phoneticLatin: "Ahlan ya basha, izzayak? Amil eh?" },
      { dialect: "انگلیسی آمریکایی", text: "Hey, how's it going?", phonetic: "هی، هاوز ایت گویینگ؟", phoneticLatin: "Hey, how's it going?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Hello, how do you do?", phonetic: "هلو، هاو دو یو دو؟", phoneticLatin: "Hello, how do you do?", lang: "english" }
    ]
  },
  {
    id: "c2",
    titleFa: "نزدیک‌ترین داروخانه کجاست؟",
    entries: [
      { dialect: "لهجه عراقی", text: "فدوة، وين أكو أقرب صيدلية هنا؟", phonetic: "فِدوَه، وِین اَکو اَقرَب صَیدَلیَه هِنا؟", phoneticLatin: "Fadwa, wein aku aqrab saydaliyyah hna?" },
      { dialect: "لهجه لبنانی (شامی)", text: "وين أقرب صيدلية هون؟", phonetic: "وِین اَقرَب صَیدَلیِه هون؟", phoneticLatin: "Wein aqrab saydaliyyeh hon?" },
      { dialect: "لهجه خلیجی", text: "وين أقرب صيدلية الله يعافيك؟", phonetic: "وِین اَقرَب صَیدَلیَه اَلله یُعافیک؟", phoneticLatin: "Wein aqrab saydaliyyah Allah yu'afeek?" },
      { dialect: "لهجه مصری", text: "فين أقرب أجزخانة هنا لو سمحت؟", phonetic: "فین اَقرَب اَجزَخانَه هِنا لَو سَمَحت؟", phoneticLatin: "Fein aqrab agzakhana hena lau samaht?" },
      { dialect: "انگلیسی آمریکایی", text: "Where's the nearest pharmacy?", phonetic: "ور از دِ نیرست فارمِسی؟", phoneticLatin: "Where's the nearest pharmacy?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Where's the nearest chemist's?", phonetic: "ور از دِ نیرست کِمیستس؟", phoneticLatin: "Where's the nearest chemist's?", lang: "english" }
    ]
  },
  {
    id: "c3",
    titleFa: "می‌خوام غذای محلی بخورم",
    entries: [
      { dialect: "لهجه عراقی", text: "أريد آكل أكلة عراقية أصيلة", phonetic: "اَرید آکُل اَکلَه عِراقیَه اَصیلَه", phoneticLatin: "Areed akol akla iraqiya aseela" },
      { dialect: "لهجه لبنانی (شامی)", text: "بدي آكل أكل لبناني تقليدي", phonetic: "بِدّی آکُل اَکِل لِبنانی تَقلیدی", phoneticLatin: "Biddi akol akel libnene ta'leedi" },
      { dialect: "لهجه خلیجی", text: "أبي آكل أكل محلي خليجي", phonetic: "اَبی آکُل اَکِل مَحَلّی خَلیجی", phoneticLatin: "Abi akol akel mahalli khaleeji" },
      { dialect: "لهجه مصری", text: "عايز آكل أكل مصري بلدي", phonetic: "عایِز آکُل اَکِل مَصری بَلَدی", phoneticLatin: "Ayez akol akl masri baladi" },
      { dialect: "انگلیسی آمریکایی", text: "I want to try some local food.", phonetic: "آی وانت تو ترای سام لوکال فود", phoneticLatin: "I want to try some local food.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "I'd like to try some local cuisine.", phonetic: "آید لایک تو ترای سام لوکال کوئیزین", phoneticLatin: "I'd like to try some local cuisine.", lang: "english" }
    ]
  },
  {
    id: "c4",
    titleFa: "قیمتش چنده؟ یه‌کم تخفیف بده",
    entries: [
      { dialect: "لهجه عراقی", text: "بيه كام؟ خفف علي شوية", phonetic: "بیه کام؟ خَفِّف عَلَیَّ شِوَیَه", phoneticLatin: "Bee kam? Khaffif alay shwaya" },
      { dialect: "لهجه لبنانی (شامی)", text: "قديش هيدا؟ عطيني خصم شوي", phonetic: "قَدیش هَیدا؟ عَطینی خَصم شِوَی", phoneticLatin: "Addesh heida? Atini khasm shway" },
      { dialect: "لهجه خلیجی", text: "بكم هذا؟ سوي لي خصم", phonetic: "بِکَم هَذا؟ سَوّی لی خَصم", phoneticLatin: "Bikam hatha? Sawwi li khasm" },
      { dialect: "لهجه مصری", text: "بكام ده؟ اعملّي خصم شوية", phonetic: "بِکام دِه؟ اِعمِللی خَصم شِوَیَه", phoneticLatin: "Bikam da? E'meli khasm shwaya" },
      { dialect: "انگلیسی آمریکایی", text: "How much is this? Can you give me a discount?", phonetic: "هاو ماچ ایز دیس؟ کن یو گیو می اَ دیسکاونت؟", phoneticLatin: "How much is this? Can you give me a discount?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "How much is this? Any chance of a discount?", phonetic: "هاو ماچ ایز دیس؟ اِنی چنس آو اَ دیسکاونت؟", phoneticLatin: "How much is this? Any chance of a discount?", lang: "english" }
    ]
  },
  {
    id: "c5",
    titleFa: "متشکرم، خیلی لطف کردید",
    entries: [
      { dialect: "لهجه عراقی", text: "عاشت ايدك، الله يخليك", phonetic: "عاشَت اِیدَک، اَلله یِخَلّیک", phoneticLatin: "Ashat eedak, Allah yikhalleek" },
      { dialect: "لهجه لبنانی (شامی)", text: "يعطيك العافية، تكرم عينك", phonetic: "یِعطیک العافیِه، تِکرَم عِینَک", phoneticLatin: "Ya'tik al-'afyeh, tikram aynak" },
      { dialect: "لهجه خلیجی", text: "الله يعافيك، تسلم ايدك", phonetic: "اَلله یُعافیک، تِسلَم اِیدَک", phoneticLatin: "Allah yu'afeek, tislam eedak" },
      { dialect: "لهجه مصری", text: "متشكر أوي، ربنا يخليك", phonetic: "مِتشَکِّر اَوی، رَبِّنا یِخَلّیک", phoneticLatin: "Mit-shakkir awi, rabbena yikhaleek" },
      { dialect: "انگلیسی آمریکایی", text: "Thank you so much, I really appreciate it.", phonetic: "تنک یو سو ماچ، آی ریلی اَپریشیت ایت", phoneticLatin: "Thank you so much, I really appreciate it.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Thank you ever so much, that's very kind.", phonetic: "تنک یو اِور سو ماچ، دَتس وری کایند", phoneticLatin: "Thank you ever so much, that's very kind.", lang: "english" }
    ]
  },
  {
    id: "c6",
    titleFa: "ببخشید، متوجه نشدم؛ دوباره بگید",
    entries: [
      { dialect: "لهجه عراقی", text: "سماح، ما فهمت، اعيدها لو سمحت", phonetic: "سَماح، ما فِهمِت، اَعیدها لَو سَمَحت", phoneticLatin: "Samah, ma fihimit, a'eedha law samaht" },
      { dialect: "لهجه لبنانی (شامی)", text: "بعتذر، ما فهمت، فيك تعيدها؟", phonetic: "بِعتِذِر، ما فِهِمت، فیک تِعیدها؟", phoneticLatin: "Bi'tzir, ma fhimt, feek t'eedha?" },
      { dialect: "لهجه خلیجی", text: "عفوا، ما فهمت، ممكن تعيدها؟", phonetic: "عَفواً، ما فِهِمت، مُمکِن تُعیدها؟", phoneticLatin: "Afwan, ma fihimt, mumkin tu'eedha?" },
      { dialect: "لهجه مصری", text: "معلش، مافهمتش، تقولها تاني؟", phonetic: "مَعلِش، مافِهِمتِش، تِقولها تانی؟", phoneticLatin: "Ma'lesh, mafhemtesh, ti'olha tani?" },
      { dialect: "انگلیسی آمریکایی", text: "Sorry, I didn't catch that. Could you say it again?", phonetic: "ساری، آی دیدنت کچ دت. کود یو سِی ایت اِگین؟", phoneticLatin: "Sorry, I didn't catch that. Could you say it again?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Sorry, I didn't quite follow. Could you repeat that?", phonetic: "ساری، آی دیدنت کوایت فالو. کود یو ریپیت دت؟", phoneticLatin: "Sorry, I didn't quite follow. Could you repeat that?", lang: "english" }
    ]
  },
  {
    id: "c7",
    titleFa: "راست برو، بعد سر چهارراه بپیچ چپ",
    entries: [
      { dialect: "لهجه عراقی", text: "سير دغري، وبعدين لف يسار بالتقاطع", phonetic: "سیر دُغری، وَبَعدَین لِف یَسار بِالتَقاطُع", phoneticLatin: "Seer dughri, w ba'dain liff yasar bit-taqatu'" },
      { dialect: "لهجه لبنانی (شامی)", text: "روح دغري، وبعدين لف عليسار عالتقاطع", phonetic: "روح دُغری، وَبَعدِین لِف عَلیَسار عَالتَقاطُع", phoneticLatin: "Rouh dughri, w ba'dein liff 'a-yasar 'at-ta'ato" },
      { dialect: "لهجه خلیجی", text: "روح سيدا، وبعدين لف يسار عند التقاطع", phonetic: "روح سیدا، وَبَعدَین لِف یَسار عِند التَقاطُع", phoneticLatin: "Rooh seeda, w ba'dain liff yasar 'ind at-taqato'" },
      { dialect: "لهجه مصری", text: "امشي على طول، وبعدين لف شمال عند التقاطع", phonetic: "اِمشی عَلَی طول، وَبَعدَین لِف شِمال عِند التَقاطُع", phoneticLatin: "Imshi 'ala tool, w ba'dein liff shimal 'and it-ta'ato'" },
      { dialect: "انگلیسی آمریکایی", text: "Go straight, then turn left at the intersection.", phonetic: "گو استریت، دن ترن لفت اَت دی اینترسکشن", phoneticLatin: "Go straight, then turn left at the intersection.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Go straight on, then take a left at the junction.", phonetic: "گو استریت آن، دن تیک اَ لفت اَت دِ جانکشن", phoneticLatin: "Go straight on, then take a left at the junction.", lang: "english" }
    ]
  },
  {
    id: "c8",
    titleFa: "یه قهوه با شیر می‌خوام، لطفاً",
    entries: [
      { dialect: "لهجه عراقی", text: "اريد قهوة بالحليب لو سمحت", phonetic: "اَرید قَهوَه بِالحَلیب لَو سَمَحت", phoneticLatin: "Areed qahwa bil-haleeb law samaht" },
      { dialect: "لهجه لبنانی (شامی)", text: "بدي قهوة بالحليب لو سمحت", phonetic: "بِدّی قَهوِه بِالحَلیب لَو سَمَحت", phoneticLatin: "Biddi ahwe bil-haleeb law samaht" },
      { dialect: "لهجه خلیجی", text: "أبي قهوة بالحليب لو سمحت", phonetic: "اَبی قَهوَه بِالحَلیب لَو سَمَحت", phoneticLatin: "Abi gahwa bil-haleeb law samaht" },
      { dialect: "لهجه مصری", text: "عايز قهوة باللبن لو سمحت", phonetic: "عایِز قَهوَه بِاللَبَن لَو سَمَحت", phoneticLatin: "Ayez ahwa bil-laban law samaht" },
      { dialect: "انگلیسی آمریکایی", text: "I'll have a coffee with milk, please.", phonetic: "آیل هَو اَ کافی ویث میلک، پلیز", phoneticLatin: "I'll have a coffee with milk, please.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Could I get a white coffee, please?", phonetic: "کود آی گت اَ وایت کافی، پلیز؟", phoneticLatin: "Could I get a white coffee, please?", lang: "english" }
    ]
  },
  {
    id: "c9",
    titleFa: "اسم من... است، از آشنایی‌تون خوشحالم",
    entries: [
      { dialect: "لهجه عراقی", text: "اسمي... وياك فرصة سعيدة", phonetic: "اِسمی... وِیاک فُرصَه سَعیدَه", phoneticLatin: "Ismi... wiyak fursa sa'eeda" },
      { dialect: "لهجه لبنانی (شامی)", text: "اسمي... تشرفنا فيك", phonetic: "اِسمی... تَشَرَّفنا فیک", phoneticLatin: "Ismi... tsharrafna feek" },
      { dialect: "لهجه خلیجی", text: "اسمي... يسعدني التعرف عليك", phonetic: "اِسمی... یِسعِدنی التَعَرُّف عَلَیک", phoneticLatin: "Ismi... yis'idni at-ta'arruf 'alaik" },
      { dialect: "لهجه مصری", text: "اسمي... فرصة سعيدة أوي", phonetic: "اِسمی... فُرصَه سَعیدَه اَوی", phoneticLatin: "Ismi... forsa sa'ida awi" },
      { dialect: "انگلیسی آمریکایی", text: "My name is... nice to meet you!", phonetic: "مای نیم ایز... نایس تو میت یو!", phoneticLatin: "My name is... nice to meet you!", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "My name's... pleased to meet you.", phonetic: "مای نیمز... پلیزد تو میت یو", phoneticLatin: "My name's... pleased to meet you.", lang: "english" }
    ]
  },
  {
    id: "c10",
    titleFa: "خداحافظ، مراقب خودت باش",
    entries: [
      { dialect: "لهجه عراقی", text: "خافظ، دير بالك عل روحك", phonetic: "خافِظ، دیر بالَک عَلَ روحَک", phoneticLatin: "Khafith, deer balak 'al rouhak" },
      { dialect: "لهجه لبنانی (شامی)", text: "يلا باي، اعتني بحالك", phonetic: "یَلّا بای، اِعتِنی بِحالَک", phoneticLatin: "Yalla bye, i'tini bhalak" },
      { dialect: "لهجه خلیجی", text: "مع السلامة، ديروا بالكم", phonetic: "مَعَ السَلامَه، دیروا بالکُم", phoneticLatin: "Ma' as-salama, deeru balkum" },
      { dialect: "لهجه مصری", text: "مع السلامة، خد بالك من نفسك", phonetic: "مَعَ السَلامَه، خُد بالَک مِن نَفسَک", phoneticLatin: "Ma'as-salama, khod balak min nafsak" },
      { dialect: "انگلیسی آمریکایی", text: "Bye, take care of yourself!", phonetic: "بای، تیک کر آو یورسلف!", phoneticLatin: "Bye, take care of yourself!", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Goodbye then, look after yourself.", phonetic: "گودبای دِن، لوک آفتر یورسلف", phoneticLatin: "Goodbye then, look after yourself.", lang: "english" }
    ]
  },
  {
    id: "c11",
    titleFa: "من موافقم / من موافق نیستم",
    entries: [
      { dialect: "لهجه عراقی", text: "اني موافك / اني مو موافك", phonetic: "اَنی موافِک / اَنی مو موافِک", phoneticLatin: "Ani muwafiq / Ani mu muwafiq" },
      { dialect: "لهجه لبنانی (شامی)", text: "أنا موافق / أنا مش موافق", phonetic: "اَنا مُوافِق / اَنا مِش مُوافِق", phoneticLatin: "Ana muwafi' / Ana mish muwafi'" },
      { dialect: "لهجه خلیجی", text: "أنا موافق / أنا ما أوافق", phonetic: "اَنا مُوافِق / اَنا ما اُوافِق", phoneticLatin: "Ana muwafiq / Ana ma uwafiq" },
      { dialect: "لهجه مصری", text: "أنا موافق / أنا مش موافق", phonetic: "اَنا مُوافِق / اَنا مِش مُوافِق", phoneticLatin: "Ana muwafi' / Ana mesh muwafi'" },
      { dialect: "انگلیسی آمریکایی", text: "I agree / I don't agree.", phonetic: "آی اَگری / آی دونت اَگری", phoneticLatin: "I agree / I don't agree.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "I quite agree / I'm afraid I disagree.", phonetic: "آی کوایت اَگری / آیم اَفرید آی دیس‌اَگری", phoneticLatin: "I quite agree / I'm afraid I disagree.", lang: "english" }
    ]
  },
  {
    id: "c12",
    titleFa: "ساعت چنده الان؟",
    entries: [
      { dialect: "لهجه عراقی", text: "الساعة جيهة بيها الحين؟", phonetic: "الساعَه جیهَه بیها الحین؟", phoneticLatin: "Es-sa'ah jeeha beeha al-heen?" },
      { dialect: "لهجه لبنانی (شامی)", text: "قديش الساعة هلق؟", phonetic: "قَدیش الساعَه هَلَق؟", phoneticLatin: "Addesh es-sa'a hallaq?" },
      { dialect: "لهجه خلیجی", text: "الساعة كم الحين؟", phonetic: "الساعَه کَم الحین؟", phoneticLatin: "Es-sa'a kam al-heen?" },
      { dialect: "لهجه مصری", text: "الساعة كام دلوقتي؟", phonetic: "الساعَه کام دِلوَقتی؟", phoneticLatin: "Es-sa'a kam delwa'ti?" },
      { dialect: "انگلیسی آمریکایی", text: "What time is it right now?", phonetic: "وات تایم ایز ایت رایت ناو؟", phoneticLatin: "What time is it right now?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "What's the time, please?", phonetic: "واتس دِ تایم، پلیز؟", phoneticLatin: "What's the time, please?", lang: "english" }
    ]
  },
  {
    id: "c13",
    titleFa: "من راهم را گم کردم، می‌تونید کمکم کنید؟",
    entries: [
      { dialect: "لهجه عراقی", text: "تهت الطريج، تكدر تساعدني؟", phonetic: "تِهِت الطَریج، تِکدَر تِساعِدنی؟", phoneticLatin: "Tihit at-tareej, tigdar tsa'idni?" },
      { dialect: "لهجه لبنانی (شامی)", text: "تهت عن الطريق، فيك تساعدني؟", phonetic: "تِهِت عَن الطَریق، فیک تِساعِدنی؟", phoneticLatin: "Tihit 'an et-tareek, feek tsa'idne?" },
      { dialect: "لهجه خلیجی", text: "تهت وضاع علي الطريق، تقدر تساعدني؟", phonetic: "تِهِت وَضاع عَلَیَّ الطَریق، تِقدَر تِساعِدنی؟", phoneticLatin: "Tihit w dha' 'alay at-tareeq, tigdar tsa'idni?" },
      { dialect: "لهجه مصری", text: "أنا تهت، تقدر تساعدني؟", phonetic: "اَنا تُهت، تِقدَر تِساعِدنی؟", phoneticLatin: "Ana toht, ti'dar tisa'idni?" },
      { dialect: "انگلیسی آمریکایی", text: "I'm lost, can you help me out?", phonetic: "آیم لاست، کن یو هلپ می اوت؟", phoneticLatin: "I'm lost, can you help me out?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "I seem to be lost, could you help me, please?", phonetic: "آی سیم تو بی لاست، کود یو هلپ می، پلیز؟", phoneticLatin: "I seem to be lost, could you help me, please?", lang: "english" }
    ]
  },
  {
    id: "c14",
    titleFa: "گرسنمه / تشنمه",
    entries: [
      { dialect: "لهجه عراقی", text: "أني جوعان / عطشان", phonetic: "اَنی جوعان / عَطشان", phoneticLatin: "Ani jaw'an / atshan" },
      { dialect: "لهجه لبنانی (شامی)", text: "جعان / عطشان", phonetic: "جَعان / عَطشان", phoneticLatin: "Ja'an / atshan" },
      { dialect: "لهجه خلیجی", text: "أنا جوعان / عطشان", phonetic: "اَنا جوعان / عَطشان", phoneticLatin: "Ana jaw'an / atshan" },
      { dialect: "لهجه مصری", text: "أنا جعان / عطشان", phonetic: "اَنا جَعان / عَطشان", phoneticLatin: "Ana ga'an / atshan" },
      { dialect: "انگلیسی آمریکایی", text: "I'm hungry / thirsty.", phonetic: "آیم هانگری / تِرستی", phoneticLatin: "I'm hungry / thirsty.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "I'm a bit peckish / parched.", phonetic: "آیم اَ بیت پِکیش / پارچت", phoneticLatin: "I'm a bit peckish / parched.", lang: "english" }
    ]
  },
  {
    id: "c15",
    titleFa: "شغلت چیه؟",
    entries: [
      { dialect: "لهجه عراقی", text: "شنو شغلك؟", phonetic: "شِنو شُغلَک؟", phoneticLatin: "Shino shughlak?" },
      { dialect: "لهجه لبنانی (شامی)", text: "شو بتشتغل؟", phonetic: "شو بِتِشتِغِل؟", phoneticLatin: "Shu btishteghel?" },
      { dialect: "لهجه خلیجی", text: "وش شغلك؟", phonetic: "وِش شُغلَک؟", phoneticLatin: "Wish shughlak?" },
      { dialect: "لهجه مصری", text: "بتشتغل ايه؟", phonetic: "بِتِشتَغَل اِیه؟", phoneticLatin: "Bitishtaghal eh?" },
      { dialect: "انگلیسی آمریکایی", text: "What do you do for work?", phonetic: "وات دو یو دو فور ورک؟", phoneticLatin: "What do you do for work?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "What do you do, then?", phonetic: "وات دو یو دو، دِن؟", phoneticLatin: "What do you do, then?", lang: "english" }
    ]
  },
  {
    id: "c16",
    titleFa: "دستشویی کجاست؟",
    entries: [
      { dialect: "لهجه عراقی", text: "وين الحمام؟", phonetic: "وِین الحَمّام؟", phoneticLatin: "Wein al-hammam?" },
      { dialect: "لهجه لبنانی (شامی)", text: "وين الحمام هون؟", phonetic: "وِین الحَمّام هون؟", phoneticLatin: "Wein el-hammam hon?" },
      { dialect: "لهجه خلیجی", text: "وين دورة المياه؟", phonetic: "وِین دَورَه المِیاه؟", phoneticLatin: "Wein dawrat al-miyah?" },
      { dialect: "لهجه مصری", text: "فين الحمام؟", phonetic: "فین الحَمّام؟", phoneticLatin: "Fein el-hammam?" },
      { dialect: "انگلیسی آمریکایی", text: "Where's the restroom?", phonetic: "ور از دِ رست‌روم؟", phoneticLatin: "Where's the restroom?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Where's the loo, please?", phonetic: "ور از دِ لو، پلیز؟", phoneticLatin: "Where's the loo, please?", lang: "english" }
    ]
  },
  {
    id: "c17",
    titleFa: "فردا هوا چطوره؟",
    entries: [
      { dialect: "لهجه عراقی", text: "شلون الجو باجر؟", phonetic: "شلون الجَو باجِر؟", phoneticLatin: "Shlon al-jaw bajir?" },
      { dialect: "لهجه لبنانی (شامی)", text: "كيف الطقس بكرا؟", phonetic: "کیف الطَقس بُکرا؟", phoneticLatin: "Kif at-ta's bukra?" },
      { dialect: "لهجه خلیجی", text: "كيف الجو باچر؟", phonetic: "کیف الجَو باچِر؟", phoneticLatin: "Kaif al-jaw bachir?" },
      { dialect: "لهجه مصری", text: "الجو هيكون عامل ايه بكرة؟", phonetic: "الجَو هَیکون عامِل اِیه بُکرَه؟", phoneticLatin: "El-gaw hayekoon amel eh bokra?" },
      { dialect: "انگلیسی آمریکایی", text: "What's the weather like tomorrow?", phonetic: "واتس دِ وِدِر لایک تومارو؟", phoneticLatin: "What's the weather like tomorrow?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "What's the forecast for tomorrow?", phonetic: "واتس دِ فورکست فور تومارو؟", phoneticLatin: "What's the forecast for tomorrow?", lang: "english" }
    ]
  },
  {
    id: "c18",
    titleFa: "بذار مهمون من باشی (دعوت کردن)",
    entries: [
      { dialect: "لهجه عراقی", text: "خلي هذا علي، أنت ضيفي", phonetic: "خَلّی هَذا عَلَیَّ، اَنت ضَیفی", phoneticLatin: "Khalli hadha 'alay, anta dhaifi" },
      { dialect: "لهجه لبنانی (شامی)", text: "خليها عليي، إنت ضيفي اليوم", phonetic: "خَلّیها عَلَیّی، اِنت ضَیفی الیوم", phoneticLatin: "Khalliha 'alayyi, inta dayfi al-yom" },
      { dialect: "لهجه خلیجی", text: "خلها علي، انت ضيفي", phonetic: "خَلّها عَلَیَّ، اَنت ضَیفی", phoneticLatin: "Khalha 'alay, anta dhaifi" },
      { dialect: "لهجه مصری", text: "سيبها عليا، انت ضيفي النهارده", phonetic: "سیبها عَلَیّا، اِنتَ ضَیفی النَهارده", phoneticLatin: "Sibha 'alaya, inta dayfi en-naharda" },
      { dialect: "انگلیسی آمریکایی", text: "Let me get this, it's on me.", phonetic: "لت می گت دیس، ایتس آن می", phoneticLatin: "Let me get this, it's on me.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Let me treat you, my shout.", phonetic: "لت می تریت یو، مای شاوت", phoneticLatin: "Let me treat you, my shout.", lang: "english" }
    ]
  },
  {
    id: "c19",
    titleFa: "ببخشید دیر کردم",
    entries: [
      { dialect: "لهجه عراقی", text: "سماح، تأخرت", phonetic: "سَماح، تَاَخَّرِت", phoneticLatin: "Samah, ta'akhirit" },
      { dialect: "لهجه لبنانی (شامی)", text: "معليش، تأخرت شوي", phonetic: "مَعلیش، تَأَخَّرت شِوَی", phoneticLatin: "Ma'leesh, ta'akhkharet shway" },
      { dialect: "لهجه خلیجی", text: "عفوا، تأخرت شوي", phonetic: "عَفواً، تَاَخَّرت شِوَی", phoneticLatin: "Afwan, ta'akhart shway" },
      { dialect: "لهجه مصری", text: "معلش، اتأخرت شوية", phonetic: "مَعلِش، اِتاَخَّرت شِوَیَه", phoneticLatin: "Ma'lesh, et'akhart shwaya" },
      { dialect: "انگلیسی آمریکایی", text: "Sorry I'm late.", phonetic: "ساری آیم لیت", phoneticLatin: "Sorry I'm late.", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Apologies for being late.", phonetic: "اَپالوجیز فور بیینگ لیت", phoneticLatin: "Apologies for being late.", lang: "english" }
    ]
  },
  {
    id: "c20",
    titleFa: "می‌تونم اینو قرض بگیرم؟",
    entries: [
      { dialect: "لهجه عراقی", text: "أكدر أستلف هذا؟", phonetic: "اَکدَر اَستَلِف هَذا؟", phoneticLatin: "Agdar astilif hadha?" },
      { dialect: "لهجه لبنانی (شامی)", text: "فيني ستقرض هيدا؟", phonetic: "فینی سِتقرِض هَیدا؟", phoneticLatin: "Feeni stiqrid heida?" },
      { dialect: "لهجه خلیجی", text: "أقدر أستعير هذا؟", phonetic: "اَقدَر اَستَعیر هَذا؟", phoneticLatin: "Agdar asta'eer hatha?" },
      { dialect: "لهجه مصری", text: "أقدر استلف ده؟", phonetic: "اَقدَر اَستِلِف دِه؟", phoneticLatin: "A'dar astelef da?" },
      { dialect: "انگلیسی آمریکایی", text: "Can I borrow this?", phonetic: "کن آی بارو دیس؟", phoneticLatin: "Can I borrow this?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Could I possibly borrow this?", phonetic: "کود آی پازِبلی بارو دیس؟", phoneticLatin: "Could I possibly borrow this?", lang: "english" }
    ]
  },
  {
    id: "c21",
    titleFa: "چقدر طول می‌کشه؟",
    entries: [
      { dialect: "لهجه عراقی", text: "بيه وكت لازم؟", phonetic: "بیه وَکت لازِم؟", phoneticLatin: "Bee wakit lazim?" },
      { dialect: "لهجه لبنانی (شامی)", text: "قديش بياخد وقت؟", phonetic: "قَدیش بیاخُد وَقت؟", phoneticLatin: "Addesh biyakhod wa't?" },
      { dialect: "لهجه خلیجی", text: "بكم وقت يحتاج؟", phonetic: "بِکَم وَقت یَحتاج؟", phoneticLatin: "Bikam wa't yahtaj?" },
      { dialect: "لهجه مصری", text: "هياخد قد ايه وقت؟", phonetic: "هَیاخُد قَد اِیه وَقت؟", phoneticLatin: "Hayakhod ad eh wa't?" },
      { dialect: "انگلیسی آمریکایی", text: "How long will it take?", phonetic: "هاو لانگ ویل ایت تیک؟", phoneticLatin: "How long will it take?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "How long is it likely to take?", phonetic: "هاو لانگ ایز ایت لایکلی تو تیک؟", phoneticLatin: "How long is it likely to take?", lang: "english" }
    ]
  },
  {
    id: "c22",
    titleFa: "خیلی خوشمزه بود!",
    entries: [
      { dialect: "لهجه عراقی", text: "طعمة كلش زين، عاشت ايدك", phonetic: "طَعمَه کِلِش زِین، عاشَت اِیدَک", phoneticLatin: "Ta'ma kullish zein, ashat eedak" },
      { dialect: "لهجه لبنانی (شامی)", text: "الأكل كتير طيب، تسلم ايدك", phonetic: "الاَکِل کتیر طَیِّب، تِسلَم اِیدَک", phoneticLatin: "El-akel kteer tayeb, tislam eedak" },
      { dialect: "لهجه خلیجی", text: "الأكل لذيذ مره، يعطيك العافية", phonetic: "الاَکِل لَذیذ مَرَّه، یُعطیک العافیَه", phoneticLatin: "Al-akil ladheedh marra, yu'teek al-'afya" },
      { dialect: "لهجه مصری", text: "الأكل كان جامد أوي", phonetic: "الاَکِل کان جامِد اَوی", phoneticLatin: "El-akl kan gamed awi" },
      { dialect: "انگلیسی آمریکایی", text: "That was delicious!", phonetic: "دَت واز دِلیشِس!", phoneticLatin: "That was delicious!", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "That was absolutely lovely!", phonetic: "دَت واز اَبسولوتلی لاولی!", phoneticLatin: "That was absolutely lovely!", lang: "english" }
    ]
  },
  {
    id: "c23",
    titleFa: "بریم یه دوری بزنیم؟",
    entries: [
      { dialect: "لهجه عراقی", text: "نطلع نتمشه شوية؟", phonetic: "نِطلَع نِتمَشّه شِوَیَه؟", phoneticLatin: "Nitla' nitmasha shwaya?" },
      { dialect: "لهجه لبنانی (شامی)", text: "نطلع نتمشى شوي؟", phonetic: "نِطلَع نِتمَشّی شِوَی؟", phoneticLatin: "Nitla' nitmasha shway?" },
      { dialect: "لهجه خلیجی", text: "نطلع نتمشى شوي؟", phonetic: "نِطلَع نِتمَشّی شِوَی؟", phoneticLatin: "Nitla' nitmasha shwaya?" },
      { dialect: "لهجه مصری", text: "نخرج نتمشى شوية؟", phonetic: "نُخرُج نِتمَشّی شِوَیَه؟", phoneticLatin: "Nukhrog nitmasha shwaya?" },
      { dialect: "انگلیسی آمریکایی", text: "Wanna go for a walk?", phonetic: "وانا گو فور اَ واک؟", phoneticLatin: "Wanna go for a walk?", lang: "english" },
      { dialect: "انگلیسی بریتانیایی/استاندارد", text: "Fancy a walk?", phonetic: "فنسی اَ واک؟", phoneticLatin: "Fancy a walk?", lang: "english" }
    ]
  }
];

// Real, lean scenario role-play definitions. No fake engines, no fabricated
// scoring — the AI actually plays the role via the real /api/chat endpoint,
// and the end-of-scenario report is generated by a real model call over the
// actual conversation transcript (see /api/scenario-report in server.ts).
export interface ScenarioDef {
  id: string;
  titleFa: string;
  category: "travel" | "business" | "social" | "emergency" | "daily";
  location: string;
  objectiveFa: string;
  icon: string;
}

export const SCENARIOS: ScenarioDef[] = [
  { id: "airport_checkin", titleFa: "چک‌این در فرودگاه", category: "travel", location: "کانتر چک‌این فرودگاه", objectiveFa: "پاسپورت و بلیط خود را نشان دهید، درباره وزن چمدان و شماره گیت بپرسید.", icon: "✈️" },
  { id: "hotel_booking", titleFa: "رزرو و ورود به هتل", category: "travel", location: "پذیرش هتل", objectiveFa: "رزرو خود را تأیید کنید، درباره امکانات اتاق و ساعت تسویه بپرسید.", icon: "🏨" },
  { id: "restaurant_order", titleFa: "سفارش غذا در رستوران", category: "travel", location: "یک رستوران محلی", objectiveFa: "منو را بخواهید، یک غذا سفارش دهید و در پایان صورت‌حساب را بخواهید.", icon: "🍽️" },
  { id: "taxi_negotiate", titleFa: "گرفتن تاکسی و چانه‌زنی", category: "travel", location: "خیابان، کنار تاکسی‌های محلی", objectiveFa: "مقصد را بگویید، درباره کرایه چانه بزنید و مسیر را تأیید کنید.", icon: "🚕" },
  { id: "shopping_bargain", titleFa: "خرید و چانه‌زنی در بازار", category: "travel", location: "بازار سنتی", objectiveFa: "قیمت یک کالا را بپرسید، درخواست تخفیف کنید و خرید را نهایی کنید.", icon: "🛍️" },
  { id: "biz_intro", titleFa: "معرفی خود در جلسه کاری", category: "business", location: "اتاق جلسات یک شرکت", objectiveFa: "خودتان، شغل و تجربه‌تان را حرفه‌ای معرفی کنید.", icon: "💼" },
  { id: "social_smalltalk", titleFa: "گپ دوستانه با یک همسایه جدید", category: "social", location: "راهروی آپارتمان", objectiveFa: "احوالپرسی کنید، درباره خودتان بگویید و یک قرار دوستانه بگذارید.", icon: "👋" },
  { id: "emergency_help", titleFa: "درخواست کمک اورژانسی", category: "emergency", location: "خیابان، شرایط اضطراری", objectiveFa: "مشکل را توضیح دهید و درخواست کمک فوری کنید.", icon: "🚨" },
  { id: "doctor_visit", titleFa: "مراجعه به پزشک", category: "emergency", location: "مطب یا درمانگاه", objectiveFa: "علائم خود را توضیح دهید و درباره درمان و دارو بپرسید.", icon: "🩺" },
  { id: "phone_call_friend", titleFa: "تماس تلفنی با یک دوست جدید", category: "social", location: "تماس تلفنی", objectiveFa: "احوالپرسی کنید، درباره برنامه آخر هفته صحبت کنید و یک قرار بگذارید.", icon: "📞" },
  { id: "office_registration", titleFa: "ثبت‌نام در یک اداره یا دانشگاه", category: "business", location: "میز پذیرش اداره/دانشگاه", objectiveFa: "مدارک لازم را توضیح دهید و درباره مراحل بعدی بپرسید.", icon: "🗂️" },
  { id: "lost_item_report", titleFa: "گزارش گم‌شدن وسیله", category: "emergency", location: "اداره اشیای گمشده یا پلیس", objectiveFa: "وسیله گمشده را توصیف کنید و زمان و مکان گم‌شدنش را توضیح دهید.", icon: "🎒" },
  { id: "service_negotiate", titleFa: "چانه‌زنی برای دستمزد یک خدمات", category: "business", location: "با یک تعمیرکار یا آرایشگر", objectiveFa: "کار موردنظر را توضیح دهید و درباره قیمت و زمان تحویل توافق کنید.", icon: "🔧" },
  { id: "street_directions", titleFa: "پرسیدن آدرس از رهگذر", category: "travel", location: "خیابان شلوغ شهر", objectiveFa: "مقصد را بپرسید و مسیر گفته‌شده را برای اطمینان تکرار کنید.", icon: "🗺️" },
  { id: "pharmacy_visit", titleFa: "خرید دارو از داروخانه", category: "emergency", location: "داروخانه", objectiveFa: "علائم را توضیح دهید و دارو یا جایگزین بدون نسخه بخواهید.", icon: "💊" },
  { id: "car_rental", titleFa: "اجاره خودرو", category: "travel", location: "دفتر اجاره خودرو", objectiveFa: "نوع خودرو، مدت اجاره و بیمه را مشخص کنید و قیمت نهایی را تأیید کنید.", icon: "🚗" },
  { id: "job_interview", titleFa: "مصاحبه شغلی کوتاه", category: "business", location: "دفتر یک شرکت", objectiveFa: "خودتان و مهارت‌هایتان را معرفی کنید و به سؤالات ساده مصاحبه‌گر پاسخ دهید.", icon: "🧑‍💼" },
  { id: "return_item", titleFa: "پس‌دادن یک کالای معیوب", category: "travel", location: "فروشگاه", objectiveFa: "مشکل کالا را توضیح دهید و درخواست تعویض یا بازگشت وجه کنید.", icon: "↩️" },
  { id: "gym_signup", titleFa: "عضویت در باشگاه ورزشی", category: "daily", location: "پذیرش باشگاه", objectiveFa: "درباره امکانات، ساعت‌کاری و هزینه عضویت بپرسید.", icon: "🏋️" },
  { id: "apartment_viewing", titleFa: "بازدید از یک آپارتمان اجاره‌ای", category: "daily", location: "یک آپارتمان برای اجاره", objectiveFa: "درباره اجاره، امکانات و شرایط قرارداد سؤال کنید.", icon: "🏠" },
  { id: "haircut_salon", titleFa: "کوتاه‌کردن مو در آرایشگاه", category: "daily", location: "آرایشگاه/سلمانی", objectiveFa: "مدل موردنظرتان را توضیح دهید و درباره قیمت و زمان بپرسید.", icon: "💇" },
  { id: "public_transport_ticket", titleFa: "خرید بلیت مترو یا اتوبوس", category: "travel", location: "باجه بلیت‌فروشی", objectiveFa: "نوع بلیت و مقصد را مشخص کنید و مسیر را بپرسید.", icon: "🎫" },
  { id: "weather_smalltalk_scenario", titleFa: "گپ کوتاه درباره آب‌وهوا با یک غریبه", category: "social", location: "ایستگاه اتوبوس یا صف", objectiveFa: "با یک غریبه دربارهٔ هوا و روزتان گپ دوستانه بزنید.", icon: "☀️" }
];

// Shared AI conversation personas — one per dialect, used by both the live
// AI Chat tab and the Scenario role-play tab so the same character (e.g.
// Ali for Iraqi) is consistent across features.
export interface Persona {
  key: string; // unique per character (dialect id alone is now shared by multiple personas)
  id: string;
  label: string;
  lang: "arabic" | "english";
  personaName: string;
  avatar: string;
  trait: string;
  occupation: string;
  // Real audio differentiation applied to the browser's actual TTS engine
  // (SpeechSynthesisUtterance.pitch/rate + voice selection) — not cosmetic
  // text, actual sound differences between characters of the same dialect.
  pitch: number; // 0.0–2.0, browser TTS standard range
  rateMultiplier: number; // multiplies the user's global speed slider
  voiceHint: string; // substring to prefer when picking an installed voice (e.g. a gender/name hint), falls back gracefully if not found
}

export const PERSONAS: Persona[] = [
  { key: "iraqi_ali", id: "لهجه عراقی", label: "عراقی", lang: "arabic", personaName: "علی", avatar: "🧔🏽", trait: "گرم و مهمان‌نواز، کمی طنازه و زیاد از اصطلاحات خودمانی عراقی استفاده می‌کنه", occupation: "مرد میانسال، صاحب یک مغازه در بغداد", pitch: 0.85, rateMultiplier: 0.95, voiceHint: "Male" },
  { key: "iraqi_zahra", id: "لهجه عراقی", label: "عراقی", lang: "arabic", personaName: "زهراء", avatar: "👩🏽‍🦱", trait: "پرانرژی و شوخ‌طبع، جوان و خیلی راحت با غریبه‌ها گرم می‌گیره", occupation: "زن جوان، دانشجوی بغدادی", pitch: 1.25, rateMultiplier: 1.1, voiceHint: "Female" },
  { key: "lebanese_noor", id: "لهجه لبنانی (شامی)", label: "لبنانی", lang: "arabic", personaName: "نور", avatar: "👩🏻", trait: "شیک و پرانرژی، خیلی راحت و دوستانه صحبت می‌کنه، عاشق موسیقی و غذای لبنانیه", occupation: "زن جوان، طراح مد در بیروت", pitch: 1.2, rateMultiplier: 1.05, voiceHint: "Female" },
  { key: "lebanese_rami", id: "لهجه لبنانی (شامی)", label: "لبنانی", lang: "arabic", personaName: "رامي", avatar: "🧑🏻‍🦰", trait: "آرام و باتجربه، با طنز ظریف صحبت می‌کنه و علاقه زیادی به تاریخ لبنان داره", occupation: "مرد میانسال، راننده تاکسی در بیروت", pitch: 0.8, rateMultiplier: 0.9, voiceHint: "Male" },
  { key: "gulf_salem", id: "لهجه خلیجی", label: "خلیجی", lang: "arabic", personaName: "سالم", avatar: "🧑🏽‍🦱", trait: "مؤدب و باوقار، ولی خیلی گرم و مهمان‌نواز صحبت می‌کنه", occupation: "مرد میانسال، تاجر در دبی", pitch: 0.8, rateMultiplier: 0.85, voiceHint: "Male" },
  { key: "gulf_hind", id: "لهجه خلیجی", label: "خلیجی", lang: "arabic", personaName: "هند", avatar: "🧕🏽", trait: "مهربان و صبور، با آرامش و وضوح صحبت می‌کنه، عالی برای مبتدی‌ها", occupation: "زن جوان، معلم مدرسه در ابوظبی", pitch: 1.15, rateMultiplier: 0.9, voiceHint: "Female" },
  { key: "egyptian_mona", id: "لهجه مصری", label: "مصری", lang: "arabic", personaName: "منى", avatar: "👩🏽", trait: "شوخ و بامزه، عاشق جوک‌گفتن و اصطلاحات عامیانه قاهره‌ای", occupation: "زن جوان، فروشنده در بازار خان‌الخلیلی قاهره", pitch: 1.25, rateMultiplier: 1.1, voiceHint: "Female" },
  { key: "egyptian_karim", id: "لهجه مصری", label: "مصری", lang: "arabic", personaName: "كريم", avatar: "🧔🏻", trait: "پرانرژی و اجتماعی، عاشق فوتبال و بحث‌های داغ درباره تیم محبوبش", occupation: "مرد جوان، گارسون رستوران در اسکندریه", pitch: 0.95, rateMultiplier: 1.05, voiceHint: "Male" },
  { key: "us_jessica", id: "انگلیسی آمریکایی", label: "انگلیسی آمریکایی", lang: "english", personaName: "Jessica", avatar: "👱🏼‍♀️", trait: "casual, upbeat, and encouraging, uses everyday American slang naturally", occupation: "young woman, coffee shop barista in Los Angeles", pitch: 1.2, rateMultiplier: 1.1, voiceHint: "Female" },
  { key: "us_mike", id: "انگلیسی آمریکایی", label: "انگلیسی آمریکایی", lang: "english", personaName: "Mike", avatar: "🧑🏽", trait: "laid-back and friendly, speaks a bit slower, loves talking about sports and food", occupation: "middle-aged man, taxi driver in New York", pitch: 0.85, rateMultiplier: 0.9, voiceHint: "Male" },
  { key: "gb_william", id: "انگلیسی بریتانیایی/استاندارد", label: "انگلیسی بریتانیایی", lang: "english", personaName: "William", avatar: "🧑🏻", trait: "polite, dry sense of humor, speaks proper standard British English", occupation: "middle-aged man, hotel receptionist in London", pitch: 0.8, rateMultiplier: 0.9, voiceHint: "Male" },
  { key: "gb_emma", id: "انگلیسی بریتانیایی/استاندارد", label: "انگلیسی بریتانیایی", lang: "english", personaName: "Emma", avatar: "👩🏻‍🦳", trait: "warm and chatty, speaks clearly and patiently, great for beginners", occupation: "young woman, university student in Manchester", pitch: 1.2, rateMultiplier: 1.0, voiceHint: "Female" }
];
