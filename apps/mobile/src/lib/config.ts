// Base URL for the application API. Empty means same-origin and lets the Vite
// dev proxy forward /api/* to server.ts. Set VITE_AI_BASE_URL for a deployed API.
export const AI_BASE_URL: string = import.meta.env.VITE_AI_BASE_URL || "";

export function apiUrl(path: string): string {
  return `${AI_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
}
