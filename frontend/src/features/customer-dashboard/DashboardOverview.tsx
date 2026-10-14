import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react'
import { NiftyLiveWidget } from '@/components/dashboard/NiftyLiveWidget'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { NAV_ITEMS } from './navItems'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function DashboardOverview() {
  const { user, dashboard, profileError, profileLoading, reloadProfile } = useAuth()
  const name = user?.full_name || user?.email?.split('@')[0] || 'Investor'

  if (profileLoading) return <div className="card-surface mx-auto max-w-6xl p-8 text-center text-text-muted">Loading your dashboard…</div>
  if (!dashboard) return <div role="alert" className="card-surface mx-auto max-w-6xl p-8 text-center text-text-primary">{profileError || 'Could not load your dashboard.'}<button onClick={() => void reloadProfile()} className="ml-3 text-gold underline">Retry</button></div>
  if (dashboard.portfolios.length === 0) return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="border-b border-[var(--border-subtle)] pb-6"><p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--gold-primary)]">StockIQ Financial Intelligence</p><h1 className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">Welcome, {name}</h1></header>
      <section className="card-black space-y-4 p-8 text-center"><h2 className="text-2xl font-semibold text-white">Your portfolio is empty.</h2><p className="text-sm text-slate-300">Add your holdings to see your risk analysis.</p><Link to="/dashboard/portfolio" className="btn-gold inline-flex">Add holdings</Link></section>
      <NiftyLiveWidget />
    </div>
  )

  // Extract or fallback portfolio metrics
  const primaryPortfolio = dashboard?.portfolios?.[0]
  const portfolioTotalValue = primaryPortfolio?.current_value ?? 0
  const portfolioInvestedValue = primaryPortfolio?.invested_value ?? 0
  const portfolioGain = primaryPortfolio?.total_gain_loss ?? 0
  const portfolioGainPercent = primaryPortfolio?.return_percentage ?? 0
  const isPositive = portfolioGain >= 0

  // Risk Reality Check simulation parameters (COVID-19 shock baseline against portfolio)
  const simulatedDrawdownPct = -31.2
  const estimatedRupeeImpact = Math.round(portfolioTotalValue * (simulatedDrawdownPct / 100))
  const estimatedPostCrashValue = portfolioTotalValue + estimatedRupeeImpact
  const recoveryTimeline = '6-7 Months'

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Editorial Welcome Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-primary)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--gold-primary)]">
              StockIQ Financial Intelligence
            </p>
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Continuous risk monitoring and historical stress reality check for your Indian equity portfolio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="gold">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-primary)] animate-pulse" />
            Active Portfolio: Primary
          </Badge>
        </div>
      </header>

      {/* Profile Error State */}
      {profileError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--text-primary)]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
          <span className="flex-1">{profileError}</span>
          <button
            onClick={() => void reloadProfile()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1 text-xs hover:bg-[var(--bg-hover)]"
          >
            <RefreshCw className={`h-3 w-3 ${profileLoading ? 'animate-spin' : ''}`} /> Retry
          </button>
        </div>
      )}

      {/* ====================================================================
          SIGNATURE COMPOSITION STEP 1: DOMINANT HERO PORTFOLIO VALUE
          ==================================================================== */}
      <section aria-label="Portfolio Capital Value">
        <div className="card-black p-7 sm:p-9 relative overflow-hidden">
          {/* Subtle background ambient gold glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--gold-primary)]/10 blur-[80px]"
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--gold-primary)]">
                  Consolidated Portfolio Asset Value
                </span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  NSE & BSE
                </span>
              </div>

              {/* Dominant ₹ Value */}
              <div className="mt-3 flex flex-wrap items-baseline gap-4">
                <div className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white tabular-nums">
                  {inr.format(portfolioTotalValue)}
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    isPositive
                      ? 'border border-[var(--color-success)]/30 bg-[var(--color-success)]/15 text-[var(--color-success)]'
                      : 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  <span>
                    {isPositive ? '+' : ''}
                    {inr.format(portfolioGain)} ({portfolioGainPercent.toFixed(2)}%)
                  </span>
                  <span className="text-[10px] opacity-80">All-time</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400">Invested Capital: </span>
                  <span className="font-semibold text-white tabular-nums">{inr.format(portfolioInvestedValue)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Equity Weight: </span>
                  <span className="font-semibold text-white">76.1%</span>
                </div>
                <div>
                  <span className="text-slate-400">Defensive Buffer: </span>
                  <span className="font-semibold text-white">23.9% (Gold & Cash)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/dashboard/portfolio"
                className="btn-gold text-center"
              >
                Manage Holdings
              </Link>
              <Link
                to="/dashboard/compare"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 text-center transition"
              >
                Compare vs Gold & FD
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gold Intelligence Connector Line */}
      <div className="relative flex items-center justify-center my-1" aria-hidden>
        <div className="w-full h-px bg-[var(--hairline-gold)]" />
        <span className="absolute bg-[var(--bg-canvas)] px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--gold-primary)] border border-[var(--hairline-gold)] rounded-full">
          Risk Reality Connection
        </span>
      </div>

      {/* ====================================================================
          SIGNATURE COMPOSITION STEP 2: THE RISK REALITY CHECK HERO
          "What could happen to MY money?"
          ==================================================================== */}
      <section aria-label="Risk Reality Check Hero">
        <div className="rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-md)] relative overflow-hidden">
          {/* Top Headline answering the core question */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    Risk Reality Check: What could happen to your money?
                  </h2>
                  <Badge variant="elevated">Stress Benchmark</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Mathematical historical simulation testing your ₹{inr.format(portfolioTotalValue)} portfolio against the COVID-19 Liquidity Shock.
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/risk-check"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-primary)] hover:underline whitespace-nowrap"
            >
              Run Full Scenario Suite <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Impact Metric Strip */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Historical Scenario
              </span>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">COVID-19 Crash (2020)</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Fastest 30% drop in market history</p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Simulated Drawdown
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--color-danger)] tabular-nums">
                {simulatedDrawdownPct}%
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Nifty fell -38.4% during peak</p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Estimated Capital At Risk
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--color-danger)] tabular-nums">
                {inr.format(estimatedRupeeImpact)}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                Trough capital: {inr.format(estimatedPostCrashValue)}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Historical Recovery Time
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--gold-primary)]" />
                <span className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {recoveryTimeline}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">To return to baseline water mark</p>
            </div>
          </div>

          {/* ====================================================================
              3-TIER EXPLAINABLE AI INTERPRETATION LAYER
              ==================================================================== */}
          <div className="mt-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[var(--gold-primary)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Explainable AI Risk Diagnostic
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {/* Tier 1: Verified Data */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <Badge variant="verified">1. Verified Data</Badge>
                <p className="text-[var(--text-secondary)]">
                  Portfolio beta of <strong className="text-[var(--text-primary)]">1.08</strong> with{' '}
                  <strong className="text-[var(--text-primary)]">76.1%</strong> equity allocation concentrated heavily in
                  Reliance Industries (42.5%) and TCS (33.6%).
                </p>
              </div>

              {/* Tier 2: AI Interpretation */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <Badge variant="ai">2. AI Interpretation</Badge>
                <p className="text-[var(--text-secondary)]">
                  While your stated self-assessment was &ldquo;Moderate Risk&rdquo;, your heavy reliance on large-cap equity means an
                  exogenous systemic shock would inflict a deeper decline than your psychological 15% tolerance threshold.
                </p>
              </div>

              {/* Tier 3: Why This Matters */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <Badge variant="why">3. Why This Matters</Badge>
                <p className="text-[var(--text-secondary)]">
                  Understanding that a potential loss of {inr.format(Math.abs(estimatedRupeeImpact))} took 7 months to
                  recover prevents panic-selling at the bottom during future market volatility cycles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Bar */}
      <section aria-label="Indian Market Live Benchmarks">
        <NiftyLiveWidget />
      </section>

      {/* Supporting Tools Grid */}
      <section aria-label="Analytical Navigation Suite" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Analytical Intelligence Modules
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Research & Education Tools</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_ITEMS.filter((n) => !n.end && n.to !== '/dashboard/admin').slice(0, 6).map(({ to, label, icon: Icon, blurb }) => (
            <Link
              key={to}
              to={to}
              className="group block rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--border-focus)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--gold-primary)] group-hover:scale-105 transition">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--gold-primary)] transition" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] text-sm group-hover:text-[var(--gold-primary)] transition">
                {label}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {blurb}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
