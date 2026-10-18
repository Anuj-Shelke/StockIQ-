import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { useAuth } from '@/hooks/useAuth'

/** Unauthenticated users are sent to /login and returned to where they were headed after signing in. */
export function ProtectedRoute({ requiredRole }: { requiredRole?: 'investor' | 'admin' }) {
  const { status, user, profileLoading } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <SplashScreen />
  if (status === 'unauthenticated') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (requiredRole && profileLoading) return <SplashScreen />
  if (requiredRole && !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }
  return <Outlet />
}

/** Login / signup are skipped for already-authenticated users. */
export function PublicOnlyRoute() {
  const { status, user } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <SplashScreen />
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    const defaultPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    let hasPendingWelcome = false
    try {
      hasPendingWelcome = user?.role === 'investor' && sessionStorage.getItem('stockiq_welcome_pending') === '1'
    } catch {
      // Continue to the existing dashboard if browser storage is unavailable.
    }
    if (hasPendingWelcome) return <Navigate to="/welcome" replace />
    return <Navigate to={from && from.startsWith('/') && !from.startsWith('//') ? from : defaultPath} replace />
  }
  return <Outlet />
}
