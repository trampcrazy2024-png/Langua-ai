export interface Phrase {
  id: string;
  category: string;
  arabic: string;
  arabicPhonetic: string;
  arabicPhoneticLatin: string;
  english: string;
  farsi: string;
  dialect: string;
  audioTips?: string;
  gender?: "unisex" | "male_speaker" | "female_speaker" | "male_listener" | "female_listener";
  // "arabic" (default when omitted) = the `arabic` field holds Arabic-script text.
  // "english" = the `arabic` field holds the actual English/American sentence text
  // (kept in the same field so every existing screen/search/TTS call keeps working).
  lang?: "arabic" | "english";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "companion";
  text: string;
  translation?: string;
  arabic?: string;
  timestamp: string;
}
