/// <reference types="vite/client" />

declare const __COMMIT_HASH__: string
declare const __COMMIT_MESSAGE__: string
declare const __BUILD_TIME__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
