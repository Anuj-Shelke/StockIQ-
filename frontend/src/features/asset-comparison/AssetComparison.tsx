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
  const [goldCagrOverride, setGoldCagrOverride] = useState<number>(10.8)
  const [fdRateOverride, setFdRateOverride] = useState<number>(7.1)
  const [inflationAdjusted, setInflationAdjusted] = useState<boolean>(false)

  const years = timeHorizon === '1Y' ? 1 : timeHorizon === '3Y' ? 3 : timeHorizon === '5Y' ? 5 : 10

  // Nominal historical CAGR expectations in Indian markets
  const equityCagrNominal = 0.135 // ~13.5%
  const goldCagrNominal = goldCagrOverride / 100   // Configurable Gold CAGR
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
  }, [initialInvestment, monthlySip, years, goldCagrNominal, fdRateNominal, inflationRate])

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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-display">
            Cross-Asset Comparison Visualizer
          </h1>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 font-medium">
            Tri-Asset Compounding
          </span>
        </div>
        <p className="text-sm text-text-muted mt-0.5">
          Compare multi-asset compounding, tax efficiencies, and drawdown behaviors across Equities, Gold, and Fixed Deposits on equal footing.
        </p>
      </div>

      {/* Control Panel: Horizons & Config */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-theme-subtle pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-gold" />
            <span className="text-sm font-semibold text-text-primary uppercase tracking-tight">Investment Parameters</span>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-theme-subtle bg-surface-elevated p-1 text-xs">
            {(['1Y', '3Y', '5Y', '10Y'] as TimeHorizon[]).map((hz) => (
              <button
                key={hz}
                onClick={() => setTimeHorizon(hz)}
                className={`rounded px-3 py-1 font-mono font-semibold transition ${
                  timeHorizon === hz
                    ? 'bg-gold text-canvas shadow'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {hz}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
              Initial Lump Sum (₹)
            </label>
            <input
              type="number"
              step="5000"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Math.max(0, Number(e.target.value)))}
              className="input-default font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
              Monthly SIP (₹)
            </label>
            <input
              type="number"
              step="1000"
              value={monthlySip}
              onChange={(e) => setMonthlySip(Math.max(0, Number(e.target.value)))}
              className="input-default font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
              Gold CAGR (% p.a.)
            </label>
            <input
              type="number"
              step="0.1"
              value={goldCagrOverride}
              onChange={(e) => setGoldCagrOverride(Number(e.target.value))}
              className="input-default font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
              Bank FD Rate (% p.a.)
            </label>
            <input
              type="number"
              step="0.1"
              value={fdRateOverride}
              onChange={(e) => setFdRateOverride(Number(e.target.value))}
              className="input-default font-mono"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-theme-subtle bg-surface-elevated px-3 py-2 text-sm text-text-secondary hover:border-theme-default transition">
              <input
                type="checkbox"
                checked={inflationAdjusted}
                onChange={(e) => setInflationAdjusted(e.target.checked)}
                className="rounded border-theme-subtle text-gold focus:ring-0"
              />
              <span className="text-xs font-mono">Adjust 6% Inflation</span>
            </label>
          </div>
        </div>
      </div>

      {/* Synchronized Multi-Line Recharts Chart */}
      <ComparisonChart data={comparisonData} inflationAdjusted={inflationAdjusted} />

      {/* Comparative Summary Cards */}
      <ComparisonMatrix metrics={summaryMetrics} />

      {/* Curated Explainability Note: Gold vs Equities vs FDs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-surface p-4 space-y-2 border-l-2 border-l-gold">
          <div className="flex items-center gap-2 text-gold font-semibold text-sm">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span>Why Hold Gold vs Equity SIP?</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Gold acts as an essential macroeconomic volatility shock-absorber. While equities create wealth via earnings expansion, gold has zero counterparty risk and preserves purchasing power through currency devaluation and geopolitical crises.
          </p>
        </div>

        <div className="card-surface p-4 space-y-2 border-l-2 border-l-blue">
          <div className="flex items-center gap-2 text-blue font-semibold text-sm">
            <span className="h-2 w-2 rounded-full bg-blue" />
            <span>Equity Compounding Engine</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Equity SIPs benefit from rupee-cost averaging, purchasing more units during market drawdowns. Over 10-year horizons in India, NIFTY 50 nominal CAGR (~13.5%) strongly outpaces both inflation (6%) and fixed deposits (7.1%).
          </p>
        </div>

        <div className="card-surface p-4 space-y-2 border-l-2 border-l-gain">
          <div className="flex items-center gap-2 text-gain font-semibold text-sm">
            <span className="h-2 w-2 rounded-full bg-gain" />
            <span>Tax Arbitrage & SGB Rules</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Under Finance Act 2024, physical gold and equity LTCG are standardized at 12.5%. However, Sovereign Gold Bonds (SGB) held to maturity are 100% exempt from capital gains tax, yielding an additional 2.5% semi-annual coupon.
          </p>
        </div>
      </div>

      {/* Assumptions & Footnotes */}
      <div className="card-surface p-4 text-xs text-text-muted space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-text-secondary uppercase tracking-wider font-mono text-[11px]">
          <Info className="h-4 w-4 text-gold" />
          <span>Methodology & Assumptions</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-text-muted">
          <li>
            <strong className="text-text-primary">Equities (NIFTY 50 TRI):</strong> Projected at 13.5% nominal historical CAGR with recurring monthly compounding. Historical drawdown reflects COVID-19 (-38.4%).
          </li>
          <li>
            <strong className="text-text-primary">Physical Gold (24K / 10g):</strong> Projected at {goldCagrOverride}% nominal historical INR CAGR based on long-term domestic returns.
          </li>
          <li>
            <strong className="text-text-primary">Bank Fixed Deposit:</strong> Compounded quarterly at {fdRateOverride}% p.a. Capital is insured up to ₹5,00,000 by DICGC.
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
