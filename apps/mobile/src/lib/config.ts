// Base URL for the application API.
//
// Bug fix (Android device testing): VITE_AI_BASE_URL is a *build-time* env
// var - it's baked into the bundle when the APK is built. It was never set
// anywhere in the build pipeline (package.json/.github/workflows), so on
// every installed APK it silently defaulted to "" (same-origin), meaning
// every /api/* and /health call resolved against the WebView's own virtual
// origin (capacitor.config.ts's androidScheme: 'https' -> "https://localhost")
// instead of any real backend. There is no server listening there, so this
// looked exactly like "no internet" / "gateway unavailable" even with the
// phone's actual internet working fine - the request never left the device.
//
// The phone's gateway (a machine on the user's LAN running server.ts/
// gateway.py - see README.md) is inherently something that varies per
// network and can't be hardcoded at build time. So this now also checks a
// runtime override the user can set from ChatTab's gateway settings field
// (persisted to localStorage), which takes priority over the build-time
// env var. Native on-device inference (see aiProviders.ts's nativeProvider)
// remains the default/primary path either way - this only matters when the
// user explicitly wants the gateway path.
const GATEWAY_URL_STORAGE_KEY = "travelapp_gateway_base_url";

export function getGatewayBaseUrl(): string {
  try {
    const stored = localStorage.getItem(GATEWAY_URL_STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage unavailable - fall through to build-time default
  }
  return import.meta.env.VITE_AI_BASE_URL || "";
}

export function setGatewayBaseUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed) localStorage.setItem(GATEWAY_URL_STORAGE_KEY, trimmed);
    else localStorage.removeItem(GATEWAY_URL_STORAGE_KEY);
  } catch {
    // best-effort only; the in-memory value for this session still updates
    // via the caller's own state, this only affects persistence across restarts
  }
}

export function apiUrl(path: string): string {
  const base = getGatewayBaseUrl();
  return `${base.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
}
