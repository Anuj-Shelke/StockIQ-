import { apiFetch, refreshAccessToken, tokenStore } from './api'
import type {
  AuthSuccessResponse,
  DashboardResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserMe,
} from '@/types/auth'

/** Login/register nest the tokens under `tokens`; /auth/refresh returns them flat. Accept both. */
function unwrapTokens(res: AuthSuccessResponse | TokenResponse): TokenResponse {
  return 'tokens' in res ? res.tokens : res
}

/** POST /api/v1/auth/login */
export async function login(credentials: LoginRequest): Promise<void> {
  const res = await apiFetch<AuthSuccessResponse>('/auth/login', { method: 'POST', body: credentials, auth: false })
  tokenStore.set(unwrapTokens(res))
}

/**
 * POST /api/v1/auth/register (201 with tokens).
 * If a backend ever returns no tokens we fall back to logging in with the same credentials.
 */
export async function register(data: RegisterRequest): Promise<void> {
  const res = await apiFetch<AuthSuccessResponse | null>('/auth/register', { method: 'POST', body: data, auth: false })
  const tokens = res ? unwrapTokens(res) : null
  if (tokens && typeof tokens.access_token === 'string') {
    tokenStore.set(tokens)
    return
  }
  await login({ email: data.email, password: data.password, portal: 'user' })
}

/**
 * POST /api/v1/auth/google (exchange a verified Google credential for a StockIQ session).
 */
export async function loginWithGoogle(payload: { access_token: string }): Promise<void> {
  const res = await apiFetch<AuthSuccessResponse>('/auth/google', { method: 'POST', body: payload, auth: false })
  tokenStore.set(unwrapTokens(res))
}

/** Local logout. Add a server-side revoke call here if the backend gains one. */
export function logout(): void {
  tokenStore.clear()
}

/** On app start: exchange a stored refresh token for a fresh access token. */
export async function restoreSession(): Promise<boolean> {
  if (!tokenStore.getRefresh()) return false
  return refreshAccessToken()
}

/** GET /api/v1/users/me (protected) */
export function fetchMe(signal?: AbortSignal): Promise<UserMe> {
  return apiFetch<UserMe>('/users/me', { signal })
}

/** GET /api/v1/dashboard (protected) */
export function fetchDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/dashboard', { signal })
}

/* ---- client-side validation (UX only; the backend remains the authority) ---- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Enter your email address.'
  return EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email address.'
}

/** Backend rule: min 8 characters. Sign-up additionally asks for a letter and a number (stricter, UX only). */
export function validatePassword(password: string, { strict = false } = {}): string | null {
  if (!password) return 'Enter your password.'
  if (!strict) return null
  if (password.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.'
  return null
}

/**
 * Validates Indian mobile numbers per TRAI standards:
 * 10 digits starting with 6, 7, 8, or 9, with optional +91, 91, or 0 country prefix.
 */
export function validateIndianMobile(phone: string): string | null {
  if (!phone || !phone.trim()) return null
  const clean = phone.replace(/[\s\-()]/g, '')
  const indianMobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/
  if (!indianMobileRegex.test(clean)) {
    return 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. +91 98765 43210).'
  }
  return null
}
