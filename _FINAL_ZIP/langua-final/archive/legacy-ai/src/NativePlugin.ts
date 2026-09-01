/*
 * Minimal structural contract for the native LocalAI Capacitor
 * plugin, owned here (in packages/ai) instead of reached for via
 * `window.Capacitor.Plugins.LocalAI` (review fix #2).
 *
 * apps/mobile/src/services/localAI.ts's registered `LocalAI`
 * plugin instance already satisfies this shape structurally - no
 * cross-package import needed, and no risk of grabbing a stale or
 * missing window global on a real device/WebView.
 */
export interface LocalAINativePlugin {
  isAvailable(): Promise<{ value: boolean }>;

  loadModel(options: { path: string }): Promise<{ ok: boolean; loaded: boolean }>;

  unloadModel(): Promise<{ ok: boolean; loaded: boolean }>;

  streamChat(options: {
    message: string;
  }): Promise<{
    value: string;
    status?: 'done' | 'error' | 'cancelled';
  }>;

  cancelGeneration(): Promise<{ ok: boolean }>;

  addListener(
    eventName: 'generationToken',
    listenerFunc: (event: { token: string }) => void
  ): Promise<{ remove(): Promise<void> }>;

  addListener(
    eventName: 'generationStatus',
    listenerFunc: (event: { status: string }) => void
  ): Promise<{ remove(): Promise<void> }>;
}
