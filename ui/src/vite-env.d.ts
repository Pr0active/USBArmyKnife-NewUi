/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROXY_PREFIX?: string
  readonly VITE_PROXY_TARGET?: string
  readonly BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
