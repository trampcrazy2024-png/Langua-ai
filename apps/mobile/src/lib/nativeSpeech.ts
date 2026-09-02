// Bug fix (Android device testing, issue #4 - "دکمه ضبط صدا فعال می‌شود ولی
// عکس‌العمل ندارد" / "تشخیص گفتار ناموفق بود"):
//
// The app's 5 recognition call sites (ChatTab, PodcastTab,
// DialectCompareTab, ScenarioTab, TranslatorTab) all used the browser Web
// Speech API (`webkitSpeechRecognition`/`SpeechRecognition`) directly.
// That API works reliably in the Chrome *app* on Android, but Android's
// embedded System WebView - what every Capacitor app (including this one)
// actually runs in - does not reliably implement it: it may be undefined,
// or exist but fire onerror the instant .start() is called. This is a
// platform gap, not something the earlier permission-request fix
// (MainActivity.java's onPermissionRequest) could address - that fixes
// getUserMedia(), a *different* API from SpeechRecognition.
//
// The real fix is Android's own on-device SpeechRecognizer, reached here
// via the @capacitor-community/speech-recognition plugin instead of the
// WebView's broken Web Speech API shim.
//
// This is a *function*, not a drop-in constructor, specifically so it can
// skip the old getUserMedia() call entirely on native: Android's
// SpeechRecognizer manages microphone access itself, and opening a
// parallel getUserMedia() stream at the same time risks the two fighting
// over the mic on some devices. Each of the 5 call sites replaces its old
// `getUserMedia(...).then(stream => { new SpeechRecognitionCtor() ... })`
// block with one call to startSpeechRecognition() below; on web/dev
// (Capacitor.isNativePlatform() === false) it does exactly what the old
// code did, so browser-based testing is unaffected.
//
// UNVERIFIED WITHOUT A REAL DEVICE: written against the plugin's
// documented API shape, but this environment has no Android
// device/emulator to run it on - please test and share `adb logcat`
// output if recognition still fails after this.

import { Capacitor, registerPlugin } from "@capacitor/core";
import { SpeechRecognition as NativeSTT } from "@capacitor-community/speech-recognition";
import { logEvent } from "./debugLog";
interface NativeTTSPlugin {
  speak(options: { text: string; lang: string; rate?: number; pitch?: number }): Promise<{ ok: boolean }>;
  stop(): Promise<{ ok: boolean }>;
}

const NativeTTS = registerPlugin<NativeTTSPlugin>("NativeTTS");

export interface RecognitionHandle {
  stop(): void;
}

export interface RecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
  /** isNoSpeech lets callers (e.g. ChatTab's Speaking Mode loop) decide
   *  whether to silently retry vs. show an error, matching what the old
   *  per-file `event.error === "no-speech"` checks did. */
  onError?: (message: string, isNoSpeech: boolean) => void;
  onEnd?: () => void;
  onSpeechStart?: () => void;
}

/**
 * Starts one recognition turn and returns a handle to cancel it early.
 * Returns null synchronously only when recognition is unsupported outright
 * (matches the old code's `if (!SpeechRecognitionCtor) { ...; return; }`
 * early-out at each of the 5 call sites) - native-specific failures
 * (engine unavailable, permission denied, no speech heard) surface later
 * through onError/onEnd instead, since those can only be known async.
 */
export function startSpeechRecognition(opts: RecognitionOptions): RecognitionHandle | null {
  return Capacitor.isNativePlatform() ? startNative(opts) : startWeb(opts);
}

function startNative(opts: RecognitionOptions): RecognitionHandle {
  let stopped = false;

  (async () => {
    try {
      const { available } = await NativeSTT.available();
      if (!available) throw new Error("این دستگاه از تشخیص گفتار پشتیبانی نمی‌کند.");

      const perm = await NativeSTT.checkPermissions();
      if (perm.speechRecognition !== "granted") {
        const req = await NativeSTT.requestPermissions();
        if (req.speechRecognition !== "granted") {
          throw new Error("PERMISSION_DENIED");
        }
      }
      if (stopped) return;

      opts.onSpeechStart?.();
      const result = await NativeSTT.start({
        language: opts.lang,
        maxResults: 1,
        partialResults: false,
        popup: false,
      });
      if (stopped) return;

      const transcript = result?.matches?.[0];
      if (transcript) {
        opts.onResult(transcript);
      } else {
        opts.onError?.("چیزی شنیده نشد.", true);
      }
    } catch (err: any) {
      if (!stopped) {
        const isPermission = err?.message === "PERMISSION_DENIED";
        const message = isPermission ? "اجازه دسترسی به میکروفون داده نشد." : (err?.message || "تشخیص گفتار ناموفق بود.");
        logEvent("error", "STT:native", err?.message || String(err));
        opts.onError?.(message, false);
      }
    } finally {
      if (!stopped) opts.onEnd?.();
    }
  })();

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      NativeSTT.stop().catch(() => {});
      opts.onEnd?.();
    },
  };
}

function startWeb(opts: RecognitionOptions): RecognitionHandle | null {
  const Ctor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  if (!Ctor || !navigator.mediaDevices?.getUserMedia) return null;

  let stopped = false;
  let liveRecognition: any = null;

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    if (stopped) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const recognition = new Ctor();
    liveRecognition = recognition;
    recognition.lang = opts.lang;
    recognition.interimResults = false;
    if (opts.onSpeechStart) recognition.onspeechstart = opts.onSpeechStart;
    recognition.onresult = (event: any) => {
      const heard = event.results?.[0]?.[0]?.transcript;
      if (heard) opts.onResult(heard);
    };
    recognition.onerror = (event: any) => {
      const isNoSpeech = event?.error === "no-speech";
      logEvent("warn", "STT:web", String(event?.error || "unknown"));
      opts.onError?.(isNoSpeech ? "چیزی شنیده نشد." : "تشخیص گفتار ناموفق بود.", isNoSpeech);
    };
    recognition.onend = () => {
      stream.getTracks().forEach((t) => t.stop());
      opts.onEnd?.();
    };
    recognition.start();
  }).catch(() => {
    logEvent("error", "STT:web", "getUserMedia rejected (microphone permission denied)");
    if (!stopped) opts.onError?.("اجازه دسترسی به میکروفون داده نشد.", false);
  });

  return {
    stop: () => {
      stopped = true;
      try { liveRecognition?.stop(); } catch {}
    },
  };
}

// Bug fix (Android device testing, issue #3 - "سیستم پخش صوتی در این
// دستگاه در دسترس نیست"): window.speechSynthesis is undefined/unreliable
// in Android's embedded WebView for the same reason SpeechRecognition is -
// it's a real, well-known Chromium-WebView-vs-Chrome-app gap, not a bug in
// how the app picked a voice. Routes through Android's native
// Android TextToSpeech is exposed through the small built-in NativeTTS Capacitor plugin.
//
// Returns true if the native engine handled it (caller should NOT also
// fall back to window.speechSynthesis), false if this isn't a native
// platform at all (caller should use its existing Web Speech API path,
// unchanged from before).
export async function speakNative(
  text: string,
  lang: string,
  opts?: { rate?: number; pitch?: number },
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await NativeTTS.speak({
      text,
      lang,
      rate: opts?.rate ?? 1.0,
      pitch: opts?.pitch ?? 1.0,
    });
  } catch (err) {
    logEvent("warn", "TTS:native", err instanceof Error ? err.message : String(err));
    // Swallow and still report "handled natively" - a native TTS failure
    // (e.g. no voice pack for this language installed) shouldn't make the
    // caller retry via the broken WebView speechSynthesis path too.
  }
  return true;
}

export function stopNativeSpeech(): void {
  if (Capacitor.isNativePlatform()) {
    NativeTTS.stop().catch(() => {});
  }
}
