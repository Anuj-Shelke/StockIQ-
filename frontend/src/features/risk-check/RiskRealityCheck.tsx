import { useState } from 'react'
import { Layers } from 'lucide-react'
import { RiskToleranceGauge } from './RiskToleranceGauge'
import { DrawdownChart } from './DrawdownChart'
import { ScenarioSelector } from './ScenarioSelector'
import type {
  StressScenario,
  DrawdownDataPoint,
  AssetDrawdownContribution,
  RiskToleranceProfile,
} from '@/types/riskCheck'

const SCENARIOS: StressScenario[] = [
  {
    id: 'covid-19',
    name: 'COVID-19 Market Crash',
    period: 'Feb 2020 - Mar 2020',
    description:
      'Unprecedented global liquidity squeeze and rapid lock-down panic resulting in the fastest 30% fall in history.',
    benchmarkDrawdown: -38.4,
    recoveryMonths: 7,
    portfolioImpact: {
      estimatedDrawdown: -31.2,
      valueAtRisk: 76440,
      recoveryMonths: 6,
      volatilityIndex: 42.8,
    },
  },
  {
    id: 'gfc-2008',
    name: '2008 Global Financial Crisis',
    period: 'Jan 2008 - Oct 2008',
    description:
      'Structural banking system contagion, credit freeze, and multi-quarter severe macroeconomic recession.',
    benchmarkDrawdown: -59.8,
    recoveryMonths: 24,
    portfolioImpact: {
      estimatedDrawdown: -48.6,
      valueAtRisk: 119070,
      recoveryMonths: 19,
      volatilityIndex: 56.4,
    },
  },
  {
    id: 'rate-shock-2022',
    name: '2022 Global Rate Shock & Inflation',
    period: 'Jan 2022 - Jun 2022',
    description:
      'Aggressive central bank rate hiking cycle causing valuation multiples in equities to compress sharply.',
    benchmarkDrawdown: -18.2,
    recoveryMonths: 9,
    portfolioImpact: {
      estimatedDrawdown: -14.5,
      valueAtRisk: 35525,
      recoveryMonths: 7,
      volatilityIndex: 21.6,
    },
  },
]

const DRAWDOWN_TRAJECTORIES: Record<StressScenario['id'], DrawdownDataPoint[]> = {
  'covid-19': [
    { date: 'Week 1', portfolioDrawdown: -2.1, benchmarkDrawdown: -3.5 },
    { date: 'Week 2', portfolioDrawdown: -8.4, benchmarkDrawdown: -11.2 },
    { date: 'Week 3', portfolioDrawdown: -16.5, benchmarkDrawdown: -21.8 },
    { date: 'Week 4', portfolioDrawdown: -26.3, benchmarkDrawdown: -32.4 },
    { date: 'Trough', portfolioDrawdown: -31.2, benchmarkDrawdown: -38.4 },
    { date: 'M+2', portfolioDrawdown: -18.9, benchmarkDrawdown: -23.1 },
    { date: 'M+4', portfolioDrawdown: -7.5, benchmarkDrawdown: -10.2 },
    { date: 'M+6', portfolioDrawdown: 0.0, benchmarkDrawdown: -2.1 },
  ],
  'gfc-2008': [
    { date: 'Q1', portfolioDrawdown: -12.4, benchmarkDrawdown: -16.2 },
    { date: 'Q2', portfolioDrawdown: -24.8, benchmarkDrawdown: -31.5 },
    { date: 'Q3', portfolioDrawdown: -39.1, benchmarkDrawdown: -49.2 },
    { date: 'Trough', portfolioDrawdown: -48.6, benchmarkDrawdown: -59.8 },
    { date: 'Y+1', portfolioDrawdown: -28.2, benchmarkDrawdown: -36.4 },
    { date: 'Y+1.5', portfolioDrawdown: -11.6, benchmarkDrawdown: -18.9 },
    { date: 'Recovery', portfolioDrawdown: 0.0, benchmarkDrawdown: 0.0 },
  ],
  'rate-shock-2022': [
    { date: 'M1', portfolioDrawdown: -3.2, benchmarkDrawdown: -4.5 },
    { date: 'M2', portfolioDrawdown: -7.1, benchmarkDrawdown: -9.8 },
    { date: 'M3', portfolioDrawdown: -11.4, benchmarkDrawdown: -14.6 },
    { date: 'Trough', portfolioDrawdown: -14.5, benchmarkDrawdown: -18.2 },
    { date: 'M5', portfolioDrawdown: -8.9, benchmarkDrawdown: -11.3 },
    { date: 'M7', portfolioDrawdown: 0.0, benchmarkDrawdown: -3.2 },
  ],
}

const ASSET_CONTRIBUTIONS: AssetDrawdownContribution[] = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    allocationWeight: 42.5,
    maxDecline: -33.4,
    contributionToDrawdown: -14.2,
    status: 'High Vulnerability',
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    allocationWeight: 33.6,
    maxDecline: -28.1,
    contributionToDrawdown: -9.4,
    status: 'Moderate Impact',
  },
  {
    symbol: 'GOLD_24K',
    name: 'Physical Gold (24K)',
    allocationWeight: 23.9,
    maxDecline: -5.2,
    contributionToDrawdown: -1.2,
    status: 'Resilient Anchor',
  },
]

const SAMPLE_PROFILE: RiskToleranceProfile = {
  statedLevel: 'Moderate',
  statedScore: 55,
  historicalRealityScore: 36,
  historicalRealityLevel: 'Fragile',
  gapDescription:
    'Your stated questionnaire answered Moderate risk tolerance, but your high 76% equity concentration would suffer a steep -31.2% crash during a COVID-19 style liquidity shock.',
}

export function RiskRealityCheck() {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<StressScenario['id']>('covid-19')

  const activeScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0]
  const drawdownData = DRAWDOWN_TRAJECTORIES[selectedScenarioId]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          Risk Reality Check & Historical Stress Testing
        </h1>
        <p className="text-sm text-slate-400">
          Discover how your portfolio would have behaved under extreme historical downturns, and align your psychology with mathematical reality.
        </p>
      </div>

      {/* Stated vs Reality Gauge */}
      <RiskToleranceGauge profile={SAMPLE_PROFILE} />

      {/* Historical Stress Scenarios */}
      <ScenarioSelector
        scenarios={SCENARIOS}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={setSelectedScenarioId}
      />

      {/* Underwater Drawdown Chart */}
      <DrawdownChart data={drawdownData} scenarioName={activeScenario.name} />

      {/* Individual Asset Vulnerability Contribution Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Holding Vulnerability & Drawdown Contributions
            </h2>
            <p className="text-xs text-slate-400">
              Breakdown of which holdings trigger the deepest portfolio drawdown during stress.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="h-4 w-4 text-gold-400" />
            <span>Multi-Asset Contribution Model</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ASSET_CONTRIBUTIONS.map((item) => {
            const isHigh = item.status === 'High Vulnerability'
            const isResilient = item.status === 'Resilient Anchor'

            return (
              <div
                key={item.symbol}
                className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{item.symbol}</h3>
                    <p className="text-xs text-slate-400">{item.name}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      isHigh
                        ? 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
                        : isResilient
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Portfolio Weight:</span>
                    <span className="font-mono">{item.allocationWeight}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Max Asset Decline:</span>
                    <span className="font-mono text-rose-400">{item.maxDecline}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-semibold">
                    <span className="text-slate-400">Contribution to Loss:</span>
                    <span className="font-mono text-rose-400">
                      {item.contributionToDrawdown}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default RiskRealityCheck
