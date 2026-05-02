/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEFAULT_MEMBERSHIP_TYPE_UNIQUE_ID?: string;
  readonly VITE_SHOW_REGISTRATION_BACKGROUND_ICONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
