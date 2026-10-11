import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { DashboardOverview } from '@/features/customer-dashboard/DashboardOverview'
import { FeaturePlaceholder } from '@/features/customer-dashboard/FeaturePlaceholder'
import { NAV_ITEMS } from '@/features/customer-dashboard/navItems'
import { CustomerDashboardLayout } from '@/layouts/CustomerDashboardLayout/CustomerDashboardLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/routes/ProtectedRoute'

// Route-level code splitting: the landing page pulls in three.js; auth pages share it; the dashboard stays light.
const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))

export const App = () => (
  <Suspense fallback={<SplashScreen />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route element={<CustomerDashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          {NAV_ITEMS.filter((n) => !n.end).map((n) => (
            <Route key={n.to} path={n.to.replace('/dashboard/', '')} element={<FeaturePlaceholder title={n.label} blurb={n.blurb} />} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
)

export default App
