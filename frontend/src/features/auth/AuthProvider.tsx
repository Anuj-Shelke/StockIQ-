import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AUTH_LOGOUT_EVENT } from '@/services/api'
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

  const loadProfile = useCallback(async () => {
    const id = ++loadId.current
    setProfileLoading(true)
    setProfileError(null)
    // The user (/users/me) and the dashboard (/dashboard) are independent: one failing must not hide the other.
    const [me, dash] = await Promise.allSettled([authService.fetchMe(), authService.fetchDashboard()])
    if (id !== loadId.current) return
    if (me.status === 'fulfilled') setUser(me.value)
    if (dash.status === 'fulfilled') setDashboard(dash.value)
    const failure = me.status === 'rejected' ? me.reason : dash.status === 'rejected' ? dash.reason : null
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
      clearProfile()
      setStatus('unauthenticated')
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout)
  }, [clearProfile])

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
    clearProfile()
    setStatus('unauthenticated')
  }, [clearProfile])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, dashboard, profileError, profileLoading, reloadProfile: loadProfile, login, loginWithGoogle, register, logout }),
    [status, user, dashboard, profileError, profileLoading, loadProfile, login, loginWithGoogle, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
