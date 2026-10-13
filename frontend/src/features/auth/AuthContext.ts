import { createContext } from 'react'
import type { AuthStatus, DashboardResponse, LoginRequest, RegisterRequest, UserMe } from '@/types/auth'

export interface AuthContextValue {
  status: AuthStatus
  /** Signed-in user, from GET /users/me (null until loaded). */
  user: UserMe | null
  /** Latest GET /dashboard payload: metrics, portfolios, recent activity (null until loaded). */
  dashboard: DashboardResponse | null
  /** Set when loading the user or dashboard failed (e.g. server offline); cleared on success. */
  profileError: string | null
  /** True while the user + dashboard requests are in flight. */
  profileLoading: boolean
  reloadProfile: () => Promise<void>
  login: (credentials: LoginRequest) => Promise<void>
  loginWithGoogle: (payload?: { email?: string; full_name?: string; id_token?: string }) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)