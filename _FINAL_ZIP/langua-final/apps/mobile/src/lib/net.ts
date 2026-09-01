import { apiUrl } from "./config";

export async function apiFetch<T>(path: string, init?: any): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = import.meta.env.VITE_TRAVELAPP_SHARED_SECRET || "";
  if (secret) headers["x-travelapp-secret"] = secret;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...(init || {}),
      headers: { ...headers, ...((init && init.headers) || {}) },
      body: init && init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    // The request never even reached a server (DNS/connection refused/no
    // network) - a distinct, clearer case from "got a response we didn't
    // expect" below.
    throw new Error(
      `اتصال به گیت‌وی هوش مصنوعی برقرار نشد. یک گیت‌وی محلی در دسترس نیست یا آدرس آن (VITE_AI_BASE_URL) درست تنظیم نشده — از حالت «روی خود گوشی» استفاده کنید یا گیت‌وی را روی شبکه‌تان اجرا کنید.`
    );
  }

  /*
   * Bug fix: on a real installed app with no VITE_AI_BASE_URL configured
   * (the common "fresh install, no companion PC set up yet" case), a
   * relative fetch("/api/...") resolves to the app's OWN static-asset
   * origin instead of a real backend. Many static/WebView file servers
   * respond to any unmatched path with index.html as an SPA fallback -
   * often with a 200 OK status - so `!res.ok` alone doesn't catch it.
   * Calling res.json() on that HTML then threw a raw, confusing
   * "Unexpected token '<' ... is not valid JSON" straight to the user
   * (this is exactly what showed up on first launch). Checking the
   * actual Content-Type before parsing turns that into one clear,
   * actionable message instead.
   */
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new Error(
      `اتصال به گیت‌وی هوش مصنوعی برقرار نشد (${path} → ${res.status}). یک گیت‌وی محلی در دسترس نیست یا آدرس آن درست تنظیم نشده — از حالت «روی خود گوشی» استفاده کنید یا گیت‌وی را روی شبکه‌تان اجرا کنید.`
    );
  }

  return (await res.json()) as T;
}
