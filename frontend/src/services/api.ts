import type { TokenResponse } from '@/types/auth'

/**
 * Base API Client configuration
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const API_V1 = `${API_BASE_URL}/api/v1`

/**
 * Frontend-only mode: serve /auth/* and /dashboard from the in-browser mock (services/mockBackend.ts).
 * ON by default in `npm run dev`; set VITE_AUTH_MOCK=false to talk to a real backend. Always OFF in production builds.
 */
export const MOCK_AUTH = import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK !== 'false'

/** Fired when the session can no longer be recovered (refresh failed / logout). */
export const AUTH_LOGOUT_EVENT = 'stockiq:auth-logout'

export interface HealthResponse {
  status: string
  app: string
  version?: string
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  // Public health endpoint lives at the server root (GET /health), not under /api/v1.
  const response = await fetch(`${API_BASE_URL}/health`)
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`)
  }
  return response.json()
}

/* ------------------------------------------------------------------ */
/* Token storage                                                       */
/* ------------------------------------------------------------------ */
/*
 * Access token: memory only (never persisted, never rendered).
 * Refresh token: localStorage so a reload keeps the session. This is exposed to
 * XSS by design; if the backend can issue it as an httpOnly cookie instead,
 * switch to that and delete the localStorage path (see docs/api/auth-contract.md).
 * Passwords are never stored.
 */
const REFRESH_KEY = 'stockiq.refresh'
let accessToken: string | null = null

function safeStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh: () => safeStorage()?.getItem(REFRESH_KEY) ?? null,
  set(tokens: TokenResponse) {
    accessToken = tokens.access_token
    if (tokens.refresh_token) safeStorage()?.setItem(REFRESH_KEY, tokens.refresh_token)
  },
  clear() {
    accessToken = null
    safeStorage()?.removeItem(REFRESH_KEY)
  },
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */
export class ApiError extends Error {
  status: number
  /** Backend error code, e.g. UNAUTHORIZED, CONFLICT, VALIDATION_ERROR (when provided). */
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface ParsedError {
  message: string
  code?: string
}

/**
 * StockIQ backend errors: `{ success:false, error:{ code, message, details:[{field,message}] }, request_id }`.
 * Plain FastAPI errors (`{detail: string | [{msg}]}`) are still understood as a fallback.
 */
function parseErrorBody(body: unknown, fallback: string): ParsedError {
  if (body && typeof body === 'object') {
    const err = (body as { error?: unknown }).error
    if (err && typeof err === 'object') {
      const { code, message, details } = err as { code?: unknown; message?: unknown; details?: unknown }
      const lines = Array.isArray(details)
        ? details
            .map((d) => {
              if (!d || typeof d !== 'object') return null
              const { field, message: m } = d as { field?: unknown; message?: unknown }
              if (typeof m !== 'string') return null
              return typeof field === 'string' && field && field !== 'body' ? `${field}: ${m}` : m
            })
            .filter((x): x is string => !!x)
        : []
      return {
        code: typeof code === 'string' ? code : undefined,
        message: lines.length ? lines.join('. ') : typeof message === 'string' && message ? message : fallback,
      }
    }
    if ('detail' in body) {
      const detail = (body as { detail: unknown }).detail
      if (typeof detail === 'string') return { message: detail }
      if (Array.isArray(detail)) {
        const msgs = detail
          .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : null))
          .filter(Boolean)
        if (msgs.length) return { message: msgs.join('. ') }
      }
    }
  }
  return { message: fallback }
}

/* ------------------------------------------------------------------ */
/* Request core                                                        */
/* ------------------------------------------------------------------ */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Attach the access token and handle 401 -> refresh -> retry. Default true. */
  auth?: boolean
  signal?: AbortSignal
}

async function rawRequest(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.getAccess()
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(`${API_V1}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('Cannot reach the StockIQ server. Please check your connection and try again.', 0)
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }
  if (!res.ok) {
    const { message, code } = parseErrorBody(body, `Request failed (${res.status})`)
    throw new ApiError(message, res.status, code)
  }
  return body as T
}

/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
let refreshing: Promise<boolean> | null = null

export function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing
  const refresh = tokenStore.getRefresh()
  if (!refresh) return Promise.resolve(false)
  refreshing = (async () => {
    try {
      const res = await rawRequest('/auth/refresh', { method: 'POST', body: { refresh_token: refresh }, auth: false })
      const tokens = await parse<TokenResponse>(res)
      tokenStore.set(tokens)
      return true
    } catch (err) {
      // Network blip: keep the refresh token so a later attempt can succeed.
      if (err instanceof ApiError && err.status === 0) return false
      tokenStore.clear()
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, opts)
  if (res.status === 401 && opts.auth !== false) {
    const ok = await refreshAccessToken()
    if (!ok) {
      // Refresh token still stored => the refresh call failed only because the server was unreachable.
      // Keep the session and report a connection problem instead of silently signing the user out.
      if (tokenStore.getRefresh()) {
        throw new ApiError('Cannot reach the StockIQ server. Please check your connection and try again.', 0)
      }
      tokenStore.clear()
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
      throw new ApiError('Your session has expired. Please sign in again.', 401)
    }
    res = await rawRequest(path, opts)
  }
  return parse<T>(res)
}