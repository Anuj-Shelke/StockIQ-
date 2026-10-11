import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Info, Minus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { TiltCard } from '@/components/ui/TiltCard'
import { useAuth } from '@/hooks/useAuth'
import type { MetricCard } from '@/types/auth'
import { NAV_ITEMS } from './navItems'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function Trend({ metric }: { metric: MetricCard }) {
  const pct = metric.change_percent
  if (metric.trend === 'neutral' || pct == null) {
    return <Minus className="h-4 w-4 text-slate-500" aria-label="No change shown" />
  }
  const up = metric.trend === 'up'
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      <Icon className="h-3.5 w-3.5" />
      {pct > 0 ? '+' : ''}
      {pct.toFixed(2)}%
    </span>
  )
}

export function DashboardOverview() {
  const { user, dashboard, profileError, profileLoading, reloadProfile } = useAuth()
  const name = user?.full_name || user?.email?.split('@')[0]

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Dashboard</p>
        <h1 className="mt-2 font-display text-3xl text-white md:text-4xl">{name ? `Welcome, ${name}` : 'Welcome to StockIQ'}</h1>
        <p className="mt-2 text-sm text-slate-400">Understand the risk. Explore the data. Know the reasoning.</p>
      </header>

      {profileError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{profileError}</span>
          <button onClick={() => void reloadProfile()} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 px-3 py-1 text-xs hover:bg-amber-400/10">
            <RefreshCw className={`h-3 w-3 ${profileLoading ? 'animate-spin' : ''}`} /> Retry
          </button>
        </div>
      )}

      {dashboard && (
        <>
          <div className="flex items-start gap-2 rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-xs text-gold-200">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Sample data.</span> These figures come from the demo backend. They are not live market
              data, and nothing here is a prediction or advice.
            </p>
          </div>

          {dashboard.metrics.length > 0 && (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key metrics">
              {dashboard.metrics.map((m) => (
                <div key={m.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-wider text-slate-400">{m.title}</p>
                    <Trend metric={m} />
                  </div>
                  <p className="mt-2 font-display text-2xl text-white">{m.value}</p>
                  {m.description && <p className="mt-1 text-xs text-slate-500">{m.description}</p>}
                </div>
              ))}
            </section>
          )}

          {dashboard.portfolios.length > 0 && (
            <section aria-label="Portfolios" className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Portfolios</h2>
              {dashboard.portfolios.map((p) => {
                const gain = p.total_gain_loss >= 0
                return (
                  <div key={p.portfolio_id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-400">Portfolio</p>
                      <p className="font-semibold text-white">{p.portfolio_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Current value</p>
                      <p className="text-white">{inr.format(p.current_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Invested</p>
                      <p className="text-white">{inr.format(p.invested_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Gain / loss</p>
                      <p className={gain ? 'text-emerald-400' : 'text-rose-400'}>
                        {gain ? '+' : ''}
                        {inr.format(p.total_gain_loss)} ({p.return_percentage.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {dashboard.recent_activity.length > 0 && (
            <section aria-label="Recent activity" className="space-y-2">
              <h2 className="text-sm font-semibold text-white">Recent activity</h2>
              <ul className="space-y-1.5 text-sm text-slate-400">
                {dashboard.recent_activity.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-500" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Tools">
        {NAV_ITEMS.filter((n) => !n.end).map(({ to, label, icon: Icon, blurb }) => (
          <TiltCard key={to}>
            <Link to={to} className="group block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-gold-500/40 hover:bg-white/[0.05]">
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-gold-400">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-gold-400" />
              </div>
              <h2 className="font-semibold text-white">{label}</h2>
              <p className="mt-1 text-sm text-slate-400">{blurb}</p>
            </Link>
          </TiltCard>
        ))}
      </section>
    </div>
  )
}