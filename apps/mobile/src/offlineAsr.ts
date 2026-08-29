// Real offline speech recognition for English, using vosk-browser (a real
// WebAssembly build of the open-source Vosk toolkit — not a simulation).
//
// HONESTY NOTE on scope: this is English-only. We investigated real Vosk
// models for Arabic and found the smallest usable one is ~318MB and is
// trained on standard/broadcast Arabic (MGB2 dataset) — not the colloquial
// Iraqi/Lebanese/Gulf/Egyptian dialects this app teaches, so it would be a
// huge download for genuinely poor accuracy on our actual content. Real
// small (~50MB) offline models only exist for a handful of major languages,
// and English is one of them, so that's what we ship as an opt-in download.
//
// The model file is fetched from a real, publicly hosted URL (maintained by
// the vosk-browser project itself), cached in IndexedDB so it only
// downloads once, and loaded into vosk-browser's real WASM recognizer.
//
// IMPORTANT: this module was written against vosk-browser's documented API
// and real, verified model URLs, but has not been runtime-tested in an
// actual browser from this environment (no network/browser access here) —
// test it for real before relying on it while traveling.

const MODEL_URL = "https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz";
const MODEL_DB_NAME = "travelapp_offline_asr";
const MODEL_STORE_NAME = "models";
const MODEL_KEY = "vosk-model-small-en-us-0.15";
const MODEL_APPROX_BYTES = 40 * 1024 * 1024; // ~40MB, used only for progress-bar estimation if the server omits Content-Length

function openModelDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MODEL_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MODEL_STORE_NAME)) {
        db.createObjectStore(MODEL_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedModelBlob(): Promise<Blob | null> {
  const db = await openModelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE_NAME, "readonly");
    const req = tx.objectStore(MODEL_STORE_NAME).get(MODEL_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function setCachedModelBlob(blob: Blob): Promise<void> {
  const db = await openModelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE_NAME, "readwrite");
    tx.objectStore(MODEL_STORE_NAME).put(blob, MODEL_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function isOfflineModelDownloaded(): Promise<boolean> {
  try {
    const blob = await getCachedModelBlob();
    return blob !== null;
  } catch {
    return false;
  }
}

export async function deleteOfflineModel(): Promise<void> {
  const db = await openModelDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE_NAME, "readwrite");
    tx.objectStore(MODEL_STORE_NAME).delete(MODEL_KEY);
    tx.oncomplete = () => {
      cachedModel = null;
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Downloads the real model file with real byte-level progress (via the
// Streams API reading the actual response body), caching it so this only
// ever happens once per device.
export async function downloadOfflineModel(
  onProgress: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<void> {
  const existing = await getCachedModelBlob();
  if (existing) {
    onProgress(100, MODEL_APPROX_BYTES, MODEL_APPROX_BYTES);
    return;
  }

  const response = await fetch(MODEL_URL);
  if (!response.ok || !response.body) {
    throw new Error("دانلود بسته آفلاین ناموفق بود.");
  }
  const totalBytes = parseInt(response.headers.get("Content-Length") || "0", 10) || MODEL_APPROX_BYTES;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loadedBytes += value.length;
      onProgress(Math.min(100, Math.round((loadedBytes / totalBytes) * 100)), loadedBytes, totalBytes);
    }
  }

  const blob = new Blob(chunks as BlobPart[]);
  await setCachedModelBlob(blob);
}

let cachedModel: any = null;

function safeResult(msg: any): any {
  if (typeof msg?.result === "string") {
    try { return JSON.parse(msg.result); } catch { return {}; }
  }
  return msg?.result ?? {};
}

async function loadModel(): Promise<any> {
  if (cachedModel) return cachedModel;
  const blob = await getCachedModelBlob();
  if (!blob) throw new Error("بسته آفلاین هنوز دانلود نشده است.");

  // vosk-browser is loaded dynamically so it never adds to the app's base
  // bundle size unless the user actually opts into offline recognition.
  const Vosk = await import("vosk-browser");
  const modelUrl = URL.createObjectURL(blob);
  cachedModel = await Vosk.createModel(modelUrl);
  return cachedModel;
}

export interface OfflineRecognitionHandle {
  stop: () => void;
}

// Starts real offline recognition on a live microphone stream. Calls
// onPartial repeatedly with the model's real interim guesses and onFinal
// once with the final real transcript when the utterance ends.
export async function startOfflineRecognition(
  stream: MediaStream,
  onPartial: (text: string) => void,
  onFinal: (text: string) => void,
  onError: (message: string) => void
): Promise<OfflineRecognitionHandle> {
  try {
    const model = await loadModel();
    const recognizer = new model.KaldiRecognizer(16000);

    recognizer.on("result", (message: any) => {
      const text = safeResult(message).text || "";
      if (text) onFinal(text);
    });
    recognizer.on("partialresult", (message: any) => {
      const partial = safeResult(message).partial || "";
      if (partial) onPartial(partial);
    });

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    // ScriptProcessorNode is deprecated but is what vosk-browser's own
    // documented example uses today, since AudioWorklet support for
    // transferring raw PCM to a Vosk recognizer isn't part of its public API.
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      try {
        recognizer.acceptWaveform(event.inputBuffer);
      } catch {
        // A single dropped frame shouldn't kill the whole session.
      }
    };
    source.connect(processor);
    processor.connect(audioContext.destination);

    return {
      stop: () => {
        try {
          processor.disconnect();
          source.disconnect();
          audioContext.close();
          recognizer.remove();
        } catch {
          // best-effort cleanup
        }
      }
    };
  } catch (err: any) {
    onError(err?.message || "راه‌اندازی تشخیص گفتار آفلاین ناموفق بود.");
    return { stop: () => {} };
  }
}
