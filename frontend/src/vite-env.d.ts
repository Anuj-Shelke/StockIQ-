/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** FastAPI base URL, no trailing slash. Default http://localhost:8000 */
  readonly VITE_API_URL?: string
  /** Dev only. 'false' disables the in-browser auth/dashboard mock. Ignored in production builds. */
  readonly VITE_AUTH_MOCK?: string
  /** Google OAuth web client ID used by Google Identity Services. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
