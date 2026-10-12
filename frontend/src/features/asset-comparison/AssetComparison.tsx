import { useState, useMemo } from 'react'
import { Sliders, Info } from 'lucide-react'
import { ComparisonChart } from './ComparisonChart'
import { ComparisonMatrix } from './ComparisonMatrix'
import type {
  TimeHorizon,
  ComparisonDataPoint,
  AssetSummaryMetric,
} from '@/types/assetComparison'

export function AssetComparison() {
  const [initialInvestment, setInitialInvestment] = useState<number>(100000)
  const [monthlySip, setMonthlySip] = useState<number>(10000)
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('5Y')
  const [fdRateOverride, setFdRateOverride] = useState<number>(7.1)
  const [inflationAdjusted, setInflationAdjusted] = useState<boolean>(false)

  const years = timeHorizon === '1Y' ? 1 : timeHorizon === '3Y' ? 3 : timeHorizon === '5Y' ? 5 : 10

  // Nominal historical CAGR expectations in Indian markets
  const equityCagrNominal = 0.135 // ~13.5%
  const goldCagrNominal = 0.108   // ~10.8%
  const fdRateNominal = fdRateOverride / 100
  const inflationRate = inflationAdjusted ? 0.06 : 0.00 // 6% CPI inflation adjustment

  // Calculate trajectory points
  const comparisonData: ComparisonDataPoint[] = useMemo(() => {
    const points: ComparisonDataPoint[] = []
    const totalMonths = years * 12
    const stepMonths = years === 1 ? 1 : years === 3 ? 3 : years === 5 ? 6 : 12

    let eqVal = initialInvestment
    let goldVal = initialInvestment
    let fdVal = initialInvestment

    const monthlyEqRate = (1 + equityCagrNominal - inflationRate) ** (1 / 12) - 1
    const monthlyGoldRate = (1 + goldCagrNominal - inflationRate) ** (1 / 12) - 1
    const monthlyFdRate = (1 + fdRateNominal - inflationRate) ** (1 / 12) - 1

    points.push({
      period: 'Start',
      equity: Math.round(eqVal),
      gold: Math.round(goldVal),
      fixedDeposit: Math.round(fdVal),
    })

    for (let m = 1; m <= totalMonths; m++) {
      eqVal = eqVal * (1 + monthlyEqRate) + monthlySip
      goldVal = goldVal * (1 + monthlyGoldRate) + monthlySip
      fdVal = fdVal * (1 + monthlyFdRate) + monthlySip

      if (m % stepMonths === 0 || m === totalMonths) {
        const label = years === 1 ? `M${m}` : `Yr ${(m / 12).toFixed(1)}`
        points.push({
          period: label,
          equity: Math.round(eqVal),
          gold: Math.round(goldVal),
          fixedDeposit: Math.round(fdVal),
        })
      }
    }
    return points
  }, [initialInvestment, monthlySip, years, fdRateNominal, inflationRate])

  const totalInvestedCash = initialInvestment + monthlySip * 12 * years
  const lastPoint = comparisonData[comparisonData.length - 1]

  const summaryMetrics: AssetSummaryMetric[] = useMemo(() => {
    const eqFinal = lastPoint.equity
    const goldFinal = lastPoint.gold
    const fdFinal = lastPoint.fixedDeposit

    return [
      {
        assetClass: 'Equities (NIFTY 50)',
        color: '#3b82f6',
        totalFinalValue: eqFinal,
        totalReturnPercent: ((eqFinal - totalInvestedCash) / totalInvestedCash) * 100,
        cagr: (equityCagrNominal - inflationRate) * 100,
        maxDrawdown: -38.4,
        liquidity: 'T+1 Settlement',
        taxImplication: 'LTCG @ 12.5% (> ₹1.25L exempt)',
        riskLevel: 'High',
      },
      {
        assetClass: 'Physical Gold (24K)',
        color: '#f59e0b',
        totalFinalValue: goldFinal,
        totalReturnPercent: ((goldFinal - totalInvestedCash) / totalInvestedCash) * 100,
        cagr: (goldCagrNominal - inflationRate) * 100,
        maxDrawdown: -16.8,
        liquidity: 'Instant (Physical/SGB)',
        taxImplication: 'LTCG @ 12.5% without indexation',
        riskLevel: 'Medium',
      },
      {
        assetClass: 'Bank Fixed Deposit',
        color: '#10b981',
        totalFinalValue: fdFinal,
        totalReturnPercent: ((fdFinal - totalInvestedCash) / totalInvestedCash) * 100,
        cagr: (fdRateNominal - inflationRate) * 100,
        maxDrawdown: 0.0,
        liquidity: 'Instant (Premature penalty 0.5-1%)',
        taxImplication: 'Taxed at investor slab rate',
        riskLevel: 'Low',
      },
    ]
  }, [lastPoint, totalInvestedCash, equityCagrNominal, goldCagrNominal, fdRateNominal, inflationRate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          Cross-Asset Comparison Visualizer
        </h1>
        <p className="text-sm text-slate-400">
          Compare multi-asset compounding, tax efficiencies, and drawdown behaviors across Equities, Gold, and Fixed Deposits on equal footing.
        </p>
      </div>

      {/* Control Panel: Horizons & Config */}
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-gold-400" />
            <span className="text-sm font-semibold text-white">Investment Parameters</span>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1 text-xs">
            {(['1Y', '3Y', '5Y', '10Y'] as TimeHorizon[]).map((hz) => (
              <button
                key={hz}
                onClick={() => setTimeHorizon(hz)}
                className={`rounded px-3 py-1 font-semibold transition ${
                  timeHorizon === hz
                    ? 'bg-gold-500 text-ink-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {hz}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Initial Lump Sum (₹)
            </label>
            <input
              type="number"
              step="5000"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Monthly SIP (₹)
            </label>
            <input
              type="number"
              step="1000"
              value={monthlySip}
              onChange={(e) => setMonthlySip(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Bank FD Rate (% p.a.)
            </label>
            <input
              type="number"
              step="0.1"
              value={fdRateOverride}
              onChange={(e) => setFdRateOverride(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition">
              <input
                type="checkbox"
                checked={inflationAdjusted}
                onChange={(e) => setInflationAdjusted(e.target.checked)}
                className="rounded border-white/20 text-gold-500 focus:ring-0"
              />
              <span className="text-xs">Adjust 6% Inflation (Real Return)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Synchronized Multi-Line Recharts Chart */}
      <ComparisonChart data={comparisonData} inflationAdjusted={inflationAdjusted} />

      {/* Comparative Summary Cards */}
      <ComparisonMatrix metrics={summaryMetrics} />

      {/* Assumptions & Footnotes */}
      <div className="rounded-xl border border-white/5 bg-ink-950/40 p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Info className="h-4 w-4 text-gold-400" />
          <span>Methodology & Assumptions</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
          <li>
            <strong>Equities (NIFTY 50 TRI):</strong> Projected at 13.5% nominal historical CAGR with recurring monthly compounding. Historical drawdown reflects COVID-19 (-38.4%).
          </li>
          <li>
            <strong>Physical Gold (24K / 10g):</strong> Projected at 10.8% nominal historical INR CAGR based on 20-year domestic returns.
          </li>
          <li>
            <strong>Bank Fixed Deposit:</strong> Compounded quarterly at {fdRateOverride}% p.a. Capital is insured up to ₹5,00,000 by DICGC.
          </li>
          <li>
            Past performance is simulated for educational comparison and does not constitute guaranteed future yields.
          </li>
        </ul>
      </div>
    </div>
  )
}
export default AssetComparison
