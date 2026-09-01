interface ImportMetaEnv {
  readonly VITE_AI_BASE_URL?: string;
  readonly VITE_TRAVELAPP_SHARED_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
