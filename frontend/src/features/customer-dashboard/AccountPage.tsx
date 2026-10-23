import { CalendarDays, CircleUserRound, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

function formatMemberSince(value: string | undefined) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(date)
}

export function AccountPage() {
  const { user, profileLoading, profileError, reloadProfile } = useAuth()

  if (profileLoading && !user) {
    return <div className="mx-auto max-w-4xl py-12 text-sm text-text-muted">Loading account details…</div>
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl rounded-2xl border border-theme-default bg-surface p-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">Account</h1>
        <p className="mt-2 text-sm text-text-secondary">{profileError || 'Account details are currently unavailable.'}</p>
        <button type="button" onClick={() => void reloadProfile()} className="btn-secondary mt-4">Try again</button>
      </section>
    )
  }

  const displayName = user.full_name?.trim() || 'Name not provided'
  const accountType = user.role === 'admin' ? 'Administrator' : 'Investor'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Your StockIQ profile</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-text-primary">Account</h1>
        <p className="mt-2 text-sm text-text-secondary">Your account details and access status.</p>
      </header>

      <section aria-label="Account profile" className="overflow-hidden rounded-2xl border border-theme-default bg-surface shadow-sm">
        <div className="flex items-center gap-4 border-b border-theme-subtle bg-canvas/60 p-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <CircleUserRound className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold text-text-primary">{displayName}</h2>
            <p className="mt-1 truncate text-sm text-text-secondary">{user.email}</p>
          </div>
        </div>

        <dl className="grid gap-px bg-theme-subtle sm:grid-cols-2">
          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              <Mail className="h-4 w-4 text-gold" aria-hidden="true" /> Email address
            </dt>
            <dd className="mt-2 break-all text-sm font-medium text-text-primary">{user.email}</dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              <ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" /> Account type
            </dt>
            <dd className="mt-2 text-sm font-medium text-text-primary">{accountType}</dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" /> Member since
            </dt>
            <dd className="mt-2 text-sm font-medium text-text-primary">{formatMemberSince(user.created_at)}</dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-loss'}`} aria-hidden="true" /> Account status
            </dt>
            <dd className="mt-2 text-sm font-medium text-text-primary">{user.is_active ? 'Active' : 'Inactive'}</dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-text-muted">For your security, StockIQ never displays your password here.</p>
    </div>
  )
}
