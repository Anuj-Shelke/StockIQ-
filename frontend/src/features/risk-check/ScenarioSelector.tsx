import { Calendar, AlertOctagon, TrendingDown, Clock } from 'lucide-react'
import type { StressScenario } from '@/types/riskCheck'

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
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-ink-950/60 p-1.5 backdrop-blur-sm">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)}
              className={`flex-1 min-w-[140px] rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                isSelected
                  ? 'bg-gold-500 text-ink-950 shadow-md'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="truncate">{scenario.name}</div>
              <div
                className={`text-[10px] font-mono mt-0.5 ${
                  isSelected ? 'text-ink-900/80' : 'text-slate-400'
                }`}
              >
                {scenario.period}
              </div>
            </button>
          )
        })}
      </div>

      {/* Scenario details & Impact Metrics */}
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-white">
                {activeScenario.name}
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono text-slate-300">
                {activeScenario.period}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{activeScenario.description}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
            <Calendar className="h-4 w-4 text-gold-400" />
            <span>Historical Benchmark Drop: </span>
            <span className="font-mono font-bold text-rose-400">
              {activeScenario.benchmarkDrawdown}%
            </span>
          </div>
        </div>

        {/* Dynamic Impact Grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              <span>Simulated Drawdown</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-rose-400">
              {activeScenario.portfolioImpact.estimatedDrawdown}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Peak-to-trough decline</p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <AlertOctagon className="h-3.5 w-3.5 text-amber-400" />
              <span>Value at Risk (VaR 95%)</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-white">
              ₹{activeScenario.portfolioImpact.valueAtRisk.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Estimated downside at 95% conf.</p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>Est. Recovery Time</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-white">
              {activeScenario.portfolioImpact.recoveryMonths} Months
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">To reach previous high</p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <AlertOctagon className="h-3.5 w-3.5 text-purple-400" />
              <span>Stress Volatility</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-white">
              {activeScenario.portfolioImpact.volatilityIndex}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Annualized during stress</p>
          </div>
        </div>
      </div>
    </div>
  )
}
