import { Capacitor, registerPlugin } from "@capacitor/core";
import { SpeechRecognition as NativeSTT } from "@capacitor-community/speech-recognition";

interface NativeTTSPlugin {
  speak(options: { text: string; lang: string; rate?: number; pitch?: number }): Promise<{ ok: boolean }>;
  stop(): Promise<{ ok: boolean }>;
  isAvailable?(): Promise<{ available: boolean }>;
}

const NativeTTS = registerPlugin<NativeTTSPlugin>("NativeTTS");

export interface RecognitionHandle { stop(): void; }
export interface RecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
  onError?: (message: string, isNoSpeech: boolean) => void;
  onEnd?: () => void;
  onSpeechStart?: () => void;
}

export function startSpeechRecognition(opts: RecognitionOptions): RecognitionHandle | null {
  return Capacitor.isNativePlatform() ? startNative(opts) : startWeb(opts);
}

function startNative(opts: RecognitionOptions): RecognitionHandle {
  let stopped = false;
  let ended = false;
  const finish = () => { if (!ended) { ended = true; opts.onEnd?.(); } };

  (async () => {
    try {
      const availability = await NativeSTT.available();
      if (!availability.available) throw new Error("این دستگاه از تشخیص گفتار پشتیبانی نمی‌کند.");

      const perm = await NativeSTT.checkPermissions();
      if (perm.speechRecognition !== "granted") {
        const req = await NativeSTT.requestPermissions();
        if (req.speechRecognition !== "granted") throw new Error("PERMISSION_DENIED");
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
      if (transcript) opts.onResult(transcript);
      else opts.onError?.("چیزی شنیده نشد.", true);
    } catch (err: any) {
      if (!stopped) {
        const permission = err?.message === "PERMISSION_DENIED";
        opts.onError?.(
          permission ? "اجازه دسترسی به میکروفون داده نشد." : (err?.message || "تشخیص گفتار ناموفق بود."),
          false,
        );
      }
    } finally {
      if (!stopped) finish();
    }
  })();

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      NativeSTT.stop().catch(() => {});
      finish();
    },
  };
}

function startWeb(opts: RecognitionOptions): RecognitionHandle | null {
  const Ctor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  if (!Ctor || !navigator.mediaDevices?.getUserMedia) return null;

  let stopped = false;
  let liveRecognition: any = null;
  let stream: MediaStream | null = null;

  navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
    stream = s;
    if (stopped) { s.getTracks().forEach(t => t.stop()); return; }

    const recognition = new Ctor();
    liveRecognition = recognition;
    recognition.lang = opts.lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    if (opts.onSpeechStart) recognition.onspeechstart = opts.onSpeechStart;
    recognition.onresult = (event: any) => {
      const heard = event.results?.[0]?.[0]?.transcript;
      if (heard) opts.onResult(heard);
    };
    recognition.onerror = (event: any) => {
      const noSpeech = event?.error === "no-speech";
      opts.onError?.(noSpeech ? "چیزی شنیده نشد." : "تشخیص گفتار ناموفق بود.", noSpeech);
    };
    recognition.onend = () => {
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
      opts.onEnd?.();
    };
    recognition.start();
  }).catch(() => {
    if (!stopped) { opts.onError?.("اجازه دسترسی به میکروفون داده نشد.", false); opts.onEnd?.(); }
  });

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      try { liveRecognition?.stop(); } catch {}
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
    },
  };
}

export async function speakNative(text: string, lang: string, opts?: { rate?: number; pitch?: number }): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await NativeTTS.speak({ text, lang, rate: opts?.rate ?? 1.0, pitch: opts?.pitch ?? 1.0 });
  } catch {}
  return true;
}

export function stopNativeSpeech(): void {
  if (Capacitor.isNativePlatform()) NativeTTS.stop().catch(() => {});
}
