/**
 * Auth + dashboard contract between this React frontend and the StockIQ FastAPI backend
 * (backend/app/api/v1/auth.py, users.py, dashboard.py and their schemas). Update both together.
 */
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
}

export interface RefreshRequest {
  refresh_token: string
}

/** JWT pair. POST /auth/refresh returns exactly this, flat. */
export interface TokenResponse {
  access_token: string
  /** The backend rotates it on every refresh; kept optional so a non-rotating server also works. */
  refresh_token?: string
  token_type?: string
  /** Access-token lifetime in seconds. */
  expires_in?: number
}

/** POST /auth/login and POST /auth/register (201): user fields at the top level, tokens nested. */
export interface AuthSuccessResponse {
  user_id: string
  email: string
  full_name?: string | null
  role: string
  tokens: TokenResponse
}

/** GET /users/me */
export interface UserMe {
  id: string
  email: string
  full_name?: string | null
  role: string
  is_active: boolean
  created_at: string
}

/** GET /dashboard -> metrics / portfolios / recent_activity. (There is no `user` field; use /users/me.) */
export interface MetricCard {
  title: string
  /** Pre-formatted by the backend, e.g. "₹2,45,000.00" or "Moderate". */
  value: string
  change_percent?: number | null
  trend: 'up' | 'down' | 'neutral' | string
  description?: string | null
}

export interface PortfolioPerformanceItem {
  portfolio_id: string
  portfolio_name: string
  current_value: number
  invested_value: number
  total_gain_loss: number
  return_percentage: number
}

export interface DashboardResponse {
  metrics: MetricCard[]
  portfolios: PortfolioPerformanceItem[]
  recent_activity: string[]
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'