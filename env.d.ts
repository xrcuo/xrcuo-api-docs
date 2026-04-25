/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEV_HOST: string
  readonly VITE_DEV_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string
