import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { useAuth } from '@/hooks/useAuth'

/** Unauthenticated users are sent to /login and returned to where they were headed after signing in. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <SplashScreen />
  if (status === 'unauthenticated') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Login / signup are skipped for already-authenticated users. */
export function PublicOnlyRoute() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <SplashScreen />
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard'} replace />
  }
  return <Outlet />
}
