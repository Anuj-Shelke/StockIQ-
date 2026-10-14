import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { DashboardOverview } from '@/features/customer-dashboard/DashboardOverview'
import { PortfolioManager } from '@/features/portfolio/PortfolioManager'
import { NextDayOpenPredictor } from '@/features/market-predictions/NextDayOpenPredictor'
import { RecommendationsView } from '@/features/recommendations/RecommendationsView'
import { RiskRealityCheck } from '@/features/risk-check/RiskRealityCheck'
import { AssetComparison } from '@/features/asset-comparison/AssetComparison'
import { ExplainabilityVisualizer } from '@/features/explainability/ExplainabilityVisualizer'
import { EducationHub } from '@/features/education/EducationHub'
import { HistoryView } from '@/features/analysis-history/HistoryView'
import { ReviewRequestView } from '@/features/review-requests/ReviewRequestView'
import { SebiRagChatbot } from '@/features/sebi-guidelines/SebiRagChatbot'
import { AdminOverview } from '@/features/admin-dashboard/AdminOverview'
import { AdminUsers } from '@/features/admin-dashboard/AdminUsers'
import { AdminLayout } from '@/layouts/AdminLayout'
import { MyReviews } from '@/features/review-requests/MyReviews'
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

      <Route path="/dashboard" element={<ProtectedRoute requiredRole="investor" />}>
        <Route element={<CustomerDashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="next-day-open" element={<NextDayOpenPredictor />} />
          <Route path="recommendations" element={<RecommendationsView />} />
          <Route path="portfolio" element={<PortfolioManager />} />
          <Route path="risk-check" element={<RiskRealityCheck />} />
          <Route path="compare" element={<AssetComparison />} />
          <Route path="explainability" element={<ExplainabilityVisualizer />} />
          <Route path="education" element={<EducationHub />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="sebi-rules" element={<SebiRagChatbot />} />
          <Route path="review-request" element={<ReviewRequestView />} />
          <Route path="reviews" element={<MyReviews />} />
        </Route>
      </Route>

      <Route path="/user/dashboard" element={<ProtectedRoute requiredRole="investor" />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
)

export default App

