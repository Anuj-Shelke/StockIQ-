import { Calendar, TrendingDown, Clock, ShieldCheck, Activity } from 'lucide-react'
import type { StressScenario } from '@/types/riskCheck'
import { GlossaryTooltip } from '@/components/ui/GlossaryTooltip'

interface ScenarioSelectorProps {
  scenarios: StressScenario[]
  selectedScenarioId: string
  onSelectScenario: (id: StressScenario['id']) => void
}

export function ScenarioSelector({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
}: ScenarioSelectorProps) {
  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0]

  return (
    <div className="space-y-4">
      {/* Segmented Scenario Switcher */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-xs">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)}
              className={`flex-1 min-w-[150px] rounded-xl px-4 py-3 text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border border-[var(--hairline-gold)] bg-[var(--gold-soft)] text-[var(--gold-primary)] shadow-sm'
                  : 'border border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="font-semibold text-xs tracking-tight truncate">{scenario.name}</div>
              <div
                className={`text-[10px] font-mono mt-1 ${
                  isSelected ? 'text-[var(--gold-primary)] opacity-90' : 'text-[var(--text-muted)]'
                }`}
              >
                {scenario.period}
              </div>
            </button>
          )
        })}
      </div>

      {/* Scenario Details & Calibrated Impact Grid */}
      <div className="card-surface p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-xl font-bold text-[var(--text-primary)]">
                {activeScenario.name}
              </span>
              <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 text-xs font-mono text-[var(--text-muted)]">
                {activeScenario.period}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {activeScenario.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-canvas)] px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] self-start md:self-auto">
            <Calendar className="h-4 w-4 text-[var(--gold-primary)]" />
            <span><GlossaryTooltip term="Nifty 50 Peak Decline" glossaryKey="niftyPeakDecline">Nifty 50 Peak Decline</GlossaryTooltip>: </span>
            <span className="font-mono font-bold text-[var(--color-danger)]">
              {activeScenario.benchmarkDrawdown}%
            </span>
          </div>
        </div>

        {/* 4-Column Mathematical Impact Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <TrendingDown className="h-4 w-4 text-[var(--color-danger)]" />
              <span className="font-semibold uppercase tracking-wider text-[11px]"><GlossaryTooltip term="Simulated Drawdown" glossaryKey="simulatedDrawdown">Simulated Drawdown</GlossaryTooltip></span>
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-[var(--color-danger)] tabular-nums">
              {activeScenario.portfolioImpact.estimatedDrawdown}%
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Expected max portfolio loss</p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--gold-primary)]" />
              <span className="font-semibold uppercase tracking-wider text-[11px]"><GlossaryTooltip term="Value at Risk (₹ VaR)" glossaryKey="valueAtRisk">Value at Risk (₹ VaR)</GlossaryTooltip></span>
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-[var(--text-primary)] tabular-nums">
              ₹{activeScenario.portfolioImpact.valueAtRisk.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">95% statistical confidence loss</p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Clock className="h-4 w-4 text-[var(--blue-primary)]" />
              <span className="font-semibold uppercase tracking-wider text-[11px]"><GlossaryTooltip term="Estimated Recovery" glossaryKey="estimatedRecovery">Estimated Recovery</GlossaryTooltip></span>
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-[var(--text-primary)] tabular-nums">
              {activeScenario.portfolioImpact.recoveryMonths} Months
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">To reach pre-crisis high</p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Activity className="h-4 w-4 text-[var(--color-warning)]" />
              <span className="font-semibold uppercase tracking-wider text-[11px]"><GlossaryTooltip term="Stress Volatility" glossaryKey="stressVolatility">Stress Volatility</GlossaryTooltip></span>
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-[var(--text-primary)] tabular-nums">
              {activeScenario.portfolioImpact.volatilityIndex}%
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Annualized volatility index</p>
          </div>
        </div>
      </div>
    </div>
  )
}
