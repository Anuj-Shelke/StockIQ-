import { useEffect, useState } from 'react'
import { Layers, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/services/api'
import { RiskToleranceGauge } from './RiskToleranceGauge'
import { DrawdownChart } from './DrawdownChart'
import { ScenarioSelector } from './ScenarioSelector'
import { Badge } from '@/components/ui/Badge'
import type { StressScenario, DrawdownDataPoint, AssetDrawdownContribution, RiskToleranceProfile } from '@/types/riskCheck'

interface RiskAnalysis {
  portfolio_name: string
  total_value: number
  scenarios: Array<{
    id: StressScenario['id']; name: string; period: string; description: string; benchmark_drawdown: number
    recovery_months: number; portfolio_impact: { estimated_drawdown: number; value_at_risk_inr: number; recovery_months: number; volatility_index: number }
  }>
  active_scenario_id: StressScenario['id']
  drawdown_series: Array<{ date: string; portfolio_drawdown: number; benchmark_drawdown: number }>
  risk_tolerance_profile: { stated_level: RiskToleranceProfile['statedLevel']; stated_score: number; historical_reality_score: number; historical_reality_level: RiskToleranceProfile['historicalRealityLevel']; gap_description: string }
  asset_contributions: Array<{ symbol: string; name: string; allocation_weight: number; max_decline: number; contribution_to_drawdown: number; status: AssetDrawdownContribution['status'] }>
}

export function RiskRealityCheck() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<StressScenario['id']>('covid-19')
  const [portfolioId, setPortfolioId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null)
  const [empty, setEmpty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const portfolios = await apiFetch<Array<{ id: string; holdings: unknown[] }>>('/portfolios')
        const portfolio = portfolios.find((item) => item.holdings.length > 0)
        if (!portfolio) { if (active) { setPortfolioId(null); setAnalysis(null); setEmpty(true) }; return }
        const result = await apiFetch<RiskAnalysis>(`/analyses/risk-reality-check/${portfolio.id}?scenario_id=${selectedScenarioId}`)
        if (active) { setPortfolioId(portfolio.id); setAnalysis(result); setEmpty(false) }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your risk analysis.')
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [selectedScenarioId, retryCount])

  if (loading) return <div className="card-surface p-8 text-center text-text-muted">Loading your portfolio analysis…</div>
  if (error) return <div role="alert" className="card-surface p-8 text-center text-text-primary">{error}<button className="ml-3 text-gold underline" onClick={() => setRetryCount((count) => count + 1)}>Retry</button></div>
  if (empty || !analysis || !portfolioId) return <section className="card-surface mx-auto max-w-2xl space-y-4 p-8 text-center"><h2 className="text-xl font-semibold text-text-primary">Add holdings to run your Risk Reality Check.</h2><p className="text-sm text-text-muted">Your analysis will be calculated from your portfolio.</p><Link to="/dashboard/portfolio" className="btn-gold inline-flex">Add holdings</Link></section>

  const scenarios: StressScenario[] = analysis.scenarios.map((item) => ({
    id: item.id, name: item.name, period: item.period, description: item.description,
    benchmarkDrawdown: item.benchmark_drawdown, recoveryMonths: item.recovery_months,
    portfolioImpact: {
      estimatedDrawdown: item.portfolio_impact.estimated_drawdown,
      valueAtRisk: item.portfolio_impact.value_at_risk_inr,
      recoveryMonths: item.portfolio_impact.recovery_months,
      volatilityIndex: item.portfolio_impact.volatility_index,
    },
  }))
  const activeScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0]
  const drawdownData: DrawdownDataPoint[] = analysis.drawdown_series.map((point) => ({
    date: point.date, portfolioDrawdown: point.portfolio_drawdown, benchmarkDrawdown: point.benchmark_drawdown,
  }))
  const profile: RiskToleranceProfile = {
    statedLevel: analysis.risk_tolerance_profile.stated_level,
    statedScore: analysis.risk_tolerance_profile.stated_score,
    historicalRealityScore: analysis.risk_tolerance_profile.historical_reality_score,
    historicalRealityLevel: analysis.risk_tolerance_profile.historical_reality_level,
    gapDescription: analysis.risk_tolerance_profile.gap_description,
  }
  const contributions: AssetDrawdownContribution[] = analysis.asset_contributions.map((item) => ({
    symbol: item.symbol, name: item.name, allocationWeight: item.allocation_weight,
    maxDecline: item.max_decline, contributionToDrawdown: item.contribution_to_drawdown, status: item.status,
  }))

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-primary)]" /><span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--gold-primary)]">Core StockIQ Differentiator</span></div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">Risk Reality Check &amp; Historical Stress Testing</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Portfolio analysis: {analysis.portfolio_name} · Value ₹{analysis.total_value.toLocaleString('en-IN')}</p>
      </div>
      <RiskToleranceGauge profile={profile} />
      <ScenarioSelector scenarios={scenarios} selectedScenarioId={selectedScenarioId} onSelectScenario={setSelectedScenarioId} />
      <DrawdownChart data={drawdownData} scenarioName={activeScenario.name} />
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h2 className="text-lg font-bold text-[var(--text-primary)]">Holding Vulnerability &amp; Drawdown Contributions</h2><p className="text-xs text-[var(--text-secondary)]">Calculated from holdings in your portfolio.</p></div><div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"><Layers className="h-4 w-4 text-[var(--gold-primary)]" /><span>Multi-Asset Factor Risk Decomposition</span></div></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{contributions.map((item) => {
          const isHigh = item.status === 'High Vulnerability'
          const isResilient = item.status === 'Resilient Anchor'
          return <div key={item.symbol} className="card-surface p-5"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-[var(--text-primary)] text-sm">{item.symbol}</h3><p className="text-xs text-[var(--text-muted)] mt-0.5">{item.name}</p></div><Badge variant={isHigh ? 'danger' : isResilient ? 'low' : 'moderate'}>{isResilient && <ShieldCheck className="h-3 w-3" />}{item.status}</Badge></div><div className="mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-3 text-xs"><p className="flex justify-between"><span>Portfolio Weight</span><strong>{item.allocationWeight}%</strong></p><p className="flex justify-between"><span>Max Asset Decline</span><strong>{item.maxDecline}%</strong></p><p className="flex justify-between border-t border-[var(--border-subtle)] pt-1.5"><span>Contribution to Drawdown</span><strong>{item.contributionToDrawdown}%</strong></p></div></div>
        })}</div>
      </div>
    </div>
  )
}

export default RiskRealityCheck
