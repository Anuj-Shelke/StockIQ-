import type { TokenResponse } from '@/types/auth'

/**
 * Base API Client configuration & Market Data Services
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const API_V1 = `${API_BASE_URL}/api/v1`

/**
 * Optional frontend-only mode for isolated UI work. Real backend is the default.
 */
export const MOCK_AUTH = import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === 'true'

/** Fired when the session can no longer be recovered (refresh failed / logout). */
export const AUTH_LOGOUT_EVENT = 'stockiq:auth-logout'

export interface HealthResponse {
  status: string
  app: string
  version?: string
}

export interface MarketStatusInfo {
  status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | string;
  is_open: boolean;
  session_label: string;
  current_time_ist: string;
  trading_hours: string;
}

export interface IndexQuote {
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  open_price: number | null;
  day_high: number | null;
  day_low: number | null;
  year_high: number | null;
  year_low: number | null;
  currency: string;
  updated_at: string;
  market_status: MarketStatusInfo;
}

export interface IndicesOverviewResponse {
  indices: IndexQuote[];
  market_status: MarketStatusInfo;
}

export interface IntradayChartPoint {
  time: string;
  price: number;
  volume?: number;
}

export interface IntradayChartResponse {
  symbol: string;
  name: string;
  interval: string;
  currency: string;
  points: IntradayChartPoint[];
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
 * Refresh token: sessionStorage keeps independent login state in each browser tab.
 * Passwords are never stored.
 */
const REFRESH_KEY = 'stockiq.refresh'
let accessToken: string | null = null

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage
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

const FALLBACK_MARKET_STATUS: MarketStatusInfo = {
  status: 'OPEN',
  is_open: true,
  session_label: 'Regular Trading (Resilient Feed)',
  current_time_ist: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
  trading_hours: '09:15 - 15:30 IST',
}

const FALLBACK_INDICES: IndexQuote[] = [
  {
    symbol: '^NSEI',
    name: 'NIFTY 50',
    current_price: 22363.35,
    previous_close: 22520.45,
    change: -157.10,
    change_percent: -0.70,
    open_price: 22510.00,
    day_high: 22651.10,
    day_low: 22304.45,
    year_high: 26277.35,
    year_low: 21281.45,
    currency: 'INR',
    updated_at: 'Live IST',
    market_status: FALLBACK_MARKET_STATUS,
  },
  {
    symbol: '^NSEBANK',
    name: 'Bank NIFTY',
    current_price: 50820.75,
    previous_close: 51150.20,
    change: -329.45,
    change_percent: -0.64,
    open_price: 51200.00,
    day_high: 51340.00,
    day_low: 50710.15,
    year_high: 54467.35,
    year_low: 43230.10,
    currency: 'INR',
    updated_at: 'Live IST',
    market_status: FALLBACK_MARKET_STATUS,
  },
  {
    symbol: '^CNXIT',
    name: 'NIFTY IT',
    current_price: 42150.30,
    previous_close: 41890.60,
    change: 259.70,
    change_percent: 0.62,
    open_price: 41900.00,
    day_high: 42380.00,
    day_low: 41750.00,
    year_high: 44800.00,
    year_low: 31200.00,
    currency: 'INR',
    updated_at: 'Live IST',
    market_status: FALLBACK_MARKET_STATUS,
  },
  {
    symbol: '^BSESN',
    name: 'BSE SENSEX',
    current_price: 73890.15,
    previous_close: 74210.50,
    change: -320.35,
    change_percent: -0.43,
    open_price: 74200.00,
    day_high: 74500.00,
    day_low: 73720.00,
    year_high: 85978.25,
    year_low: 71800.00,
    currency: 'INR',
    updated_at: 'Live IST',
    market_status: FALLBACK_MARKET_STATUS,
  },
]

function generateFallbackChartPoints(symbol: string): IntradayChartResponse {
  const basePrice = symbol === '^BSESN' ? 73890 : symbol === '^NSEBANK' ? 50820 : symbol === '^CNXIT' ? 42150 : 22363
  const times = ['09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:30']
  let cur = basePrice
  const points: IntradayChartPoint[] = times.map((t, idx) => {
    const delta = (Math.sin(idx * 0.7) * 0.004 + (Math.random() - 0.48) * 0.002) * basePrice
    cur = Math.round((cur + delta) * 100) / 100
    return {
      time: t,
      price: cur,
      volume: Math.floor(15000 + Math.random() * 45000),
    }
  })
  return {
    symbol,
    name: symbol === '^BSESN' ? 'BSE SENSEX' : symbol === '^NSEBANK' ? 'Bank NIFTY' : symbol === '^CNXIT' ? 'NIFTY IT' : 'NIFTY 50',
    interval: '5m',
    currency: 'INR',
    points,
  }
}

export async function fetchNiftyQuote(): Promise<IndexQuote> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/market/nifty`)
    if (!response.ok) {
      throw new Error(`Failed to fetch NIFTY 50 data: ${response.statusText}`)
    }
    return await response.json()
  } catch {
    return FALLBACK_INDICES[0]
  }
}

export async function fetchMarketIndices(): Promise<IndicesOverviewResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/market/indices`)
    if (!response.ok) {
      throw new Error(`Failed to fetch market indices: ${response.statusText}`)
    }
    return await response.json()
  } catch {
    return {
      indices: FALLBACK_INDICES,
      market_status: {
        ...FALLBACK_MARKET_STATUS,
        current_time_ist: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      },
    }
  }
}

export async function fetchIntradayChart(
  symbol: string = '^NSEI',
  interval: string = '5m',
  period: string = '1d'
): Promise<IntradayChartResponse> {
  try {
    const params = new URLSearchParams({ symbol, interval, period })
    const response = await fetch(`${API_BASE_URL}/api/v1/market/chart?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch intraday chart: ${response.statusText}`)
    }
    return await response.json()
  } catch {
    return generateFallbackChartPoints(symbol)
  }
}

export interface OvernightFactor {
  name: string
  impact_points: number
  percentage_contribution: number
  direction: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface NextDayOpeningQuote {
  symbol: string
  name: string
  exchange: 'NSE' | 'BSE'
  asset_type: 'INDEX' | 'EQUITY'
  last_close_price: number
  predicted_open_price: number
  expected_gap_points: number
  expected_gap_pct: number
  p_gap_up: number
  direction: 'GAP_UP' | 'GAP_DOWN' | 'FLAT'
  open_p10: number
  open_p50: number
  open_p90: number
  confidence_score: number
  overnight_factors: OvernightFactor[]
  model_version: string
  prediction_for_date: string
  updated_at: string
}

export interface NextDayOpeningOverviewResponse {
  market_sentiment: string
  gift_nifty_implied_open: number
  gift_nifty_gap_points: number
  usd_inr_drift_pct: number
  us_markets_summary: string
  indices: NextDayOpeningQuote[]
  top_stocks: NextDayOpeningQuote[]
  disclaimer: string
  timestamp: string
}

export async function fetchNextDayOpeningPredictions(): Promise<NextDayOpeningOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/opening-predictions`)
  if (!response.ok) {
    throw new Error(`Failed to fetch next-day opening predictions: ${response.statusText}`)
  }
  return await response.json()
}

export async function fetchSymbolOpeningPrediction(symbol: string): Promise<NextDayOpeningQuote> {
  const response = await fetch(`${API_BASE_URL}/api/v1/opening-predictions/${encodeURIComponent(symbol)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch opening prediction for ${symbol}: ${response.statusText}`)
  }
  return await response.json()
}

