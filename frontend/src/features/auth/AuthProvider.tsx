import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apiFetch, AUTH_LOGOUT_EVENT } from '@/services/api'
import * as authService from '@/services/auth'
import type { AuthStatus, DashboardResponse, LoginRequest, RegisterRequest, UserMe } from '@/types/auth'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<UserMe | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Bumped on every load and on logout so a slow response can never repopulate a signed-out session.
  const loadId = useRef(0)

  const clearProfile = useCallback(() => {
    loadId.current += 1
    setUser(null)
    setDashboard(null)
    setProfileError(null)
    setProfileLoading(false)
  }, [])

  const clearWelcomeSession = useCallback(() => {
    try {
      sessionStorage.removeItem('stockiq_welcome_pending')
      sessionStorage.removeItem('stockiq_welcome_seen')
    } catch {
      // Storage may be unavailable; signing out must still complete.
    }
  }, [])

  const loadProfile = useCallback(async () => {
    const id = ++loadId.current
    setProfileLoading(true)
    setProfileError(null)
    // The user (/users/me) and the dashboard (/dashboard) are independent: one failing must not hide the other.
    const [me, dash] = await Promise.allSettled([authService.fetchMe(), authService.fetchDashboard()])
    if (id !== loadId.current) return
    if (me.status === 'fulfilled') setUser(me.value)
    let dashboardFailure = dash.status === 'rejected' ? dash.reason : null
    if (dash.status === 'fulfilled') {
      setDashboard(dash.value)
    } else {
      // The overview endpoint can fail independently while the portfolio API
      // remains available. Rebuild the fields this dashboard needs from that
      // source so a transient overview query failure does not blank the page.
      try {
        const portfolios = await apiFetch<Array<{
          id: string
          name: string
          total_value: number
          total_invested: number
          total_gain_loss: number
          return_percentage: number
        }>>('/portfolios')
        if (id !== loadId.current) return
        setDashboard({
          metrics: [],
          portfolios: portfolios.map((p) => ({
            portfolio_id: p.id,
            portfolio_name: p.name,
            current_value: p.total_value,
            invested_value: p.total_invested,
            total_gain_loss: p.total_gain_loss,
            return_percentage: p.return_percentage,
          })),
          recent_activity: [],
        })
        dashboardFailure = null
      } catch {
        // Keep the original dashboard error only if both overview sources fail.
      }
    }
    const failure = me.status === 'rejected' ? me.reason : dashboardFailure
    if (failure) {
      // Non-fatal: pages show an inline error with a retry.
      setProfileError(failure instanceof Error ? failure.message : 'Could not load your dashboard.')
    }
    setProfileLoading(false)
  }, [])

  // Restore a session from the stored refresh token on first load.
  useEffect(() => {
    let cancelled = false
    authService.restoreSession().then(async (ok) => {
      if (cancelled) return
      if (ok) await loadProfile()
      if (!cancelled) setStatus(ok ? 'authenticated' : 'unauthenticated')
    })
    return () => {
      cancelled = true
    }
  }, [loadProfile])

  // The API layer announces unrecoverable 401s (refresh failed).
  useEffect(() => {
    const onLogout = () => {
      clearWelcomeSession()
      clearProfile()
      setStatus('unauthenticated')
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout)
  }, [clearProfile, clearWelcomeSession])

  const login = useCallback(
    async (credentials: LoginRequest) => {
      await authService.login(credentials)
      await loadProfile()
      setStatus('authenticated')
    },
    [loadProfile],
  )

  const register = useCallback(
    async (data: RegisterRequest) => {
      await authService.register(data)
      await loadProfile()
      setStatus('authenticated')
    },
    [loadProfile],
  )

  const loginWithGoogle = useCallback(
    async (payload: { access_token: string }) => {
      await authService.loginWithGoogle(payload)
      await loadProfile()
      setStatus('authenticated')
    },
    [loadProfile],
  )

  const logout = useCallback(() => {
    authService.logout()
    clearWelcomeSession()
    clearProfile()
    setStatus('unauthenticated')
  }, [clearProfile, clearWelcomeSession])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, dashboard, profileError, profileLoading, reloadProfile: loadProfile, login, loginWithGoogle, register, logout }),
    [status, user, dashboard, profileError, profileLoading, loadProfile, login, loginWithGoogle, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
