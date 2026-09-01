export function getSpeechSynthesis(): any {
  const g = (globalThis as any).speechSynthesis;
  return g || (typeof window !== "undefined" ? (window as any).speechSynthesis : null) || null;
}

/*
 * Critical bug fix: this used to check `tts.SpeechSynthesisUtterance`
 * (a property on the `speechSynthesis` singleton returned by
 * getSpeechSynthesis()) - but SpeechSynthesisUtterance is a GLOBAL
 * constructor (window.SpeechSynthesisUtterance), not a property of
 * the speechSynthesis object itself. That property never exists, so
 * this always fell through to the plain-object fallback below - and
 * calling the real speechSynthesis.speak() with a plain object
 * (instead of an actual SpeechSynthesisUtterance instance) throws a
 * TypeError in every real browser. In practice this meant native
 * pronunciation playback - the core feature every one of this app's
 * 10 tabs calls via playSpeech() - never worked at all, anywhere.
 */
export function newUtterance(text: string): any {
  const Ctor =
    (typeof window !== "undefined" && (window as any).SpeechSynthesisUtterance) ||
    (globalThis as any).SpeechSynthesisUtterance;
  if (Ctor) return new Ctor(text);
  return { text, lang: "en-US", rate: 1, pitch: 1 } as any;
}
