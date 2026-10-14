/**
 * DEV-ONLY in-browser mock of the StockIQ backend's auth + user + dashboard endpoints.
 * Enabled in dev builds unless VITE_AUTH_MOCK=false (see MOCK_AUTH in api.ts / main.tsx).
 *
 * It mirrors the REAL backend contract (backend/app/api/v1/auth.py, users.py, dashboard.py and the error format in
 * core/exceptions.py), so switching the mock off needs no frontend changes:
 *   - login/register -> { user_id, email, full_name, role, tokens: { access_token, refresh_token, token_type, expires_in } }
 *   - refresh        -> { access_token, refresh_token, token_type, expires_in }
 *   - users/me       -> { id, email, full_name, role, is_active, created_at }
 *   - dashboard      -> { metrics, portfolios, recent_activity }
 *   - errors         -> { success: false, error: { code, message, details }, request_id }
 *
 * Any well-formed email + password signs in; the password "invalid123" is rejected so the error state can be tested.
 * Sign-up needs 8+ characters (same as the backend). The dashboard numbers are the backend's SAMPLE values, not market data.
 */
import { API_V1 } from './api'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const fail = (status: number, code: string, message: string, details: unknown[] = []) =>
  json(status, { success: false, error: { code, message, details }, request_id: 'mock' })

// btoa/atob only handle Latin-1; go through UTF-8 so any valid email round-trips.
const enc = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)))
const dec = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)))

const EXPIRES_IN = 3600

const tokens = (email: string) => ({
  access_token: `mock-access.${enc(email)}.${Date.now()}`,
  refresh_token: `mock-refresh.${enc(email)}`,
  token_type: 'bearer',
  expires_in: EXPIRES_IN,
})

const emailFrom = (refreshOrAccess: string) => {
  try {
    return dec(refreshOrAccess.split('.')[1] ?? '')
  } catch {
    return 'demo@example.com'
  }
}

/** Names given at sign-up (in memory only; a page reload forgets them, like a fresh mock "server"). */
const names = new Map<string, string | null>()

const userIdFor = (email: string) => `mock-user-${enc(email).replace(/[^A-Za-z0-9]/g, '').slice(0, 12)}`

const authSuccess = (email: string) => ({
  user_id: userIdFor(email),
  email,
  full_name: names.get(email) ?? null,
  role: 'investor',
  tokens: tokens(email),
})

const bearerEmail = (init?: RequestInit): string | null => {
  const auth = new Headers(init?.headers).get('Authorization') ?? ''
  return auth.startsWith('Bearer mock-access.') ? emailFrom(auth.replace('Bearer ', '')) : null
}

export function installMockBackend() {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!url.startsWith(API_V1)) return realFetch(input, init)
    await new Promise((r) => setTimeout(r, 350))
    const path = url.slice(API_V1.length).replace(/\/$/, '')
    const body = init?.body ? JSON.parse(String(init.body)) : {}

    if (path === '/auth/login') {
      if (body.password === 'invalid123') return fail(401, 'UNAUTHORIZED', 'Invalid email or password')
      return json(200, authSuccess(body.email))
    }

    if (path === '/auth/register') {
      if (typeof body.password !== 'string' || body.password.length < 8) {
        return fail(422, 'VALIDATION_ERROR', 'Request validation failed', [
          { field: 'password', message: 'String should have at least 8 characters', type: 'string_too_short' },
        ])
      }
      names.set(body.email, body.full_name || null)
      return json(201, authSuccess(body.email))
    }

    if (path === '/auth/refresh') {
      return body.refresh_token?.startsWith('mock-refresh.')
        ? json(200, tokens(emailFrom(body.refresh_token)))
        : fail(401, 'UNAUTHORIZED', 'Invalid token type: refresh token expected')
    }

    if (path === '/users/me') {
      const email = bearerEmail(init)
      if (!email) return fail(401, 'UNAUTHORIZED', 'Not authenticated')
      return json(200, {
        id: userIdFor(email),
        email,
        full_name: names.get(email) ?? null,
        role: 'investor',
        is_active: true,
        created_at: new Date().toISOString(),
      })
    }

    if (path === '/dashboard') {
      if (!bearerEmail(init)) return fail(401, 'UNAUTHORIZED', 'Not authenticated')
      // Mock registrations start with no user portfolio, matching the real API.
      return json(200, {
        metrics: [],
        portfolios: [],
        recent_activity: [],
      })
    }

    return fail(404, 'NOT_FOUND', 'Not found (mock)')
  }
  console.info('[StockIQ] Dev mock backend enabled (set VITE_AUTH_MOCK=false to use the real FastAPI backend).')
}
