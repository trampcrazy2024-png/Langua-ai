import React, { useState } from "react";
import { saveClip, getClip, deleteClip, StoredClip } from "../mediaStore";

// Lets the user attach their own audio recording, or an uploaded audio/video
// clip, to a specific phrase for extra practice material — persisted in
// IndexedDB so it survives app restarts and works fully offline.
export default function PhraseMediaAttachment({
  phraseId,
  triggerToast
}: {
  phraseId: string;
  triggerToast: (msg: string) => void;
}) {
  const [clip, setClip] = useState<StoredClip | null>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  React.useEffect(() => {
    getClip(phraseId).then((c) => {
      if (c) {
        setClip(c);
        setClipUrl(URL.createObjectURL(c.blob));
      }
    });
  }, [phraseId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind: "audio" | "video" = file.type.startsWith("video") ? "video" : "audio";
    await saveClip(phraseId, file, kind, file.name);
    const saved = await getClip(phraseId);
    if (saved) {
      setClip(saved);
      setClipUrl(URL.createObjectURL(saved.blob));
      triggerToast("🎬 فایل آموزشی شما ذخیره شد (فقط روی همین دستگاه).");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRecordOwn = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      triggerToast("⚠️ ضبط صدا در این مرورگر ممکن نیست.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await saveClip(phraseId, blob, "audio", "ضبط شخصی");
        const saved = await getClip(phraseId);
        if (saved) {
          setClip(saved);
          setClipUrl(URL.createObjectURL(saved.blob));
        }
        stream.getTracks().forEach((t) => t.stop());
        triggerToast("🎙️ کلیپ صوتی شخصی شما ذخیره شد.");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
        setRecording(false);
      }, 8000);
    } catch {
      triggerToast("⚠️ اجازه دسترسی به میکروفون داده نشد.");
    }
  };

  const handleDelete = async () => {
    await deleteClip(phraseId);
    setClip(null);
    setClipUrl(null);
    triggerToast("🗑️ فایل آموزشی حذف شد.");
  };

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] text-[#94A3B8] hover:text-[#14B8A6] underline"
      >
        {clip ? "📎 فایل آموزشی شخصی پیوست شده" : "+ افزودن صدا/ویدیوی آموزشی شخصی"}
      </button>
      {open && (
        <div className="mt-2 bg-[#090D16] border border-[#1E293B] rounded-lg p-2.5 space-y-2 text-right animate-fadeIn">
          {clip && clipUrl ? (
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#94A3B8]">{clip.label}</span>
              {clip.kind === "video" ? (
                <video controls src={clipUrl} className="w-full rounded-lg max-h-40" />
              ) : (
                <audio controls src={clipUrl} className="w-full h-9" />
              )}
              <button
                onClick={handleDelete}
                className="text-[10px] text-red-400 hover:text-red-300"
              >
                حذف فایل
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] px-2.5 py-1.5 rounded-lg"
              >
                📁 انتخاب فایل صوتی/ویدیویی از گوشی
              </button>
              <button
                onClick={handleRecordOwn}
                disabled={recording}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg ${
                  recording ? "bg-red-500 text-white animate-pulse" : "bg-[#14B8A6] text-black"
                }`}
              >
                {recording ? "🔴 در حال ضبط (۸ ثانیه)..." : "🎙️ ضبط صدای خودم"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
