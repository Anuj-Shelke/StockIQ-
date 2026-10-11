import { AuthStage } from '@/components/landing/AuthStage'

/** Backend has no reset endpoint yet; the panel says so honestly (see docs/api/auth-contract.md). */
export default function ForgotPassword() {
  return <AuthStage variant="forgot" />
}
