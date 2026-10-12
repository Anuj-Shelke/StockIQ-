import { useState, useMemo } from 'react'
import {
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react'

interface OvernightFactor {
  name: string
  impactPoints: number
  percentageContribution: number
  direction: 'positive' | 'negative' | 'neutral'
  description: string
}

interface OpeningQuote {
  symbol: string
  name: string
  exchange: 'NSE' | 'BSE'
  assetType: 'INDEX' | 'EQUITY'
  lastClosePrice: number
  predictedOpenPrice: number
  expectedGapPoints: number
  expectedGapPct: number
  pGapUp: number
  direction: 'GAP_UP' | 'GAP_DOWN' | 'FLAT'
  openP10: number
  openP50: number
  openP90: number
  confidenceScore: number
  overnightFactors: OvernightFactor[]
}

const OPENING_PREDICTIONS: OpeningQuote[] = [
  {
    symbol: '^NSEI',
    name: 'NIFTY 50',
    exchange: 'NSE',
    assetType: 'INDEX',
    lastClosePrice: 22363.35,
    predictedOpenPrice: 22448.00,
    expectedGapPoints: 84.65,
    expectedGapPct: 0.38,
    pGapUp: 0.74,
    direction: 'GAP_UP',
    openP10: 22380.00,
    openP50: 22448.00,
    openP90: 22510.00,
    confidenceScore: 0.89,
    overnightFactors: [
      {
        name: 'GIFT Nifty Overnight Premium (+85 pts)',
        impactPoints: 58.2,
        percentageContribution: 68.5,
        direction: 'positive',
        description: 'GIFT Nifty traded at 22,448 in late Singapore / GIFT City trading.',
      },
      {
        name: 'Wall Street Tech Rally (Nasdaq +0.82%)',
        impactPoints: 24.5,
        percentageContribution: 28.8,
        direction: 'positive',
        description: 'Semiconductor strength carried S&P 500 and Nasdaq into green close.',
      },
      {
        name: 'Brent Crude Oil Softening ($78.40/bbl)',
        impactPoints: 12.3,
        percentageContribution: 14.5,
        direction: 'positive',
        description: 'Crude price contraction curbs domestic inflation and import bill.',
      },
      {
        name: 'USD/INR Currency Inching (₹83.92/USD)',
        impactPoints: -9.9,
        percentageContribution: -11.8,
        direction: 'negative',
        description: 'Minor rupee depreciation puts mild pressure on FPI cash flows.',
      },
    ],
  },
  {
    symbol: '^BSESN',
    name: 'BSE SENSEX',
    exchange: 'BSE',
    assetType: 'INDEX',
    lastClosePrice: 73890.15,
    predictedOpenPrice: 74156.15,
    expectedGapPoints: 266.00,
    expectedGapPct: 0.36,
    pGapUp: 0.73,
    direction: 'GAP_UP',
    openP10: 73950.00,
    openP50: 74156.15,
    openP90: 74320.00,
    confidenceScore: 0.88,
    overnightFactors: [
      {
        name: 'Heavyweight Financials Pre-Market Bid Surge',
        impactPoints: 182.0,
        percentageContribution: 65.0,
        direction: 'positive',
        description: 'Institutional block order indications for top constituent banks.',
      },
      {
        name: 'MSCI Emerging Asia Futures (+0.45%)',
        impactPoints: 78.4,
        percentageContribution: 28.0,
        direction: 'positive',
        description: 'Regional Asian index futures tracking risk-on global sentiment.',
      },
    ],
  },
  {
    symbol: '^NSEBANK',
    name: 'Bank NIFTY',
    exchange: 'NSE',
    assetType: 'INDEX',
    lastClosePrice: 50820.75,
    predictedOpenPrice: 51044.75,
    expectedGapPoints: 224.00,
    expectedGapPct: 0.44,
    pGapUp: 0.77,
    direction: 'GAP_UP',
    openP10: 50890.00,
    openP50: 51044.75,
    openP90: 51230.00,
    confidenceScore: 0.86,
    overnightFactors: [
      {
        name: 'Interbank Liquidity Surplus (+₹1.2L Cr)',
        impactPoints: 142.5,
        percentageContribution: 63.8,
        direction: 'positive',
        description: 'RBI operations indicate abundant domestic liquidity in the system.',
      },
      {
        name: 'US 10-Yr Treasury Yield Cooling (4.18%)',
        impactPoints: 62.0,
        percentageContribution: 27.8,
        direction: 'positive',
        description: 'Yield retreat benefits banking treasury books.',
      },
    ],
  },
  {
    symbol: '^CNXIT',
    name: 'NIFTY IT',
    exchange: 'NSE',
    assetType: 'INDEX',
    lastClosePrice: 42150.30,
    predictedOpenPrice: 42268.30,
    expectedGapPoints: 118.00,
    expectedGapPct: 0.28,
    pGapUp: 0.69,
    direction: 'GAP_UP',
    openP10: 42080.00,
    openP50: 42268.30,
    openP90: 42420.00,
    confidenceScore: 0.85,
    overnightFactors: [
      {
        name: 'Nasdaq 100 Overnight Rally (+0.82%)',
        impactPoints: 88.0,
        percentageContribution: 74.5,
        direction: 'positive',
        description: 'Strong correlation with US enterprise technology discretionary vendors.',
      },
    ],
  },
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    exchange: 'NSE',
    assetType: 'EQUITY',
    lastClosePrice: 2980.50,
    predictedOpenPrice: 2990.95,
    expectedGapPoints: 10.45,
    expectedGapPct: 0.35,
    pGapUp: 0.71,
    direction: 'GAP_UP',
    openP10: 2975.00,
    openP50: 2990.95,
    openP90: 3012.00,
    confidenceScore: 0.87,
    overnightFactors: [
      {
        name: 'Singapore Refining Margins Holding ($6.8/bbl)',
        impactPoints: 6.8,
        percentageContribution: 65.0,
        direction: 'positive',
        description: 'Gross refining margins remain in healthy operating corridor.',
      },
    ],
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services Ltd.',
    exchange: 'NSE',
    assetType: 'EQUITY',
    lastClosePrice: 4120.25,
    predictedOpenPrice: 4132.60,
    expectedGapPoints: 12.35,
    expectedGapPct: 0.30,
    pGapUp: 0.70,
    direction: 'GAP_UP',
    openP10: 4105.00,
    openP50: 4132.60,
    openP90: 4158.00,
    confidenceScore: 0.88,
    overnightFactors: [
      {
        name: 'US Enterprise Tech Resiliency Concurrence',
        impactPoints: 8.5,
        percentageContribution: 70.0,
        direction: 'positive',
        description: 'Global cloud migration bookings remain steady.',
      },
    ],
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd.',
    exchange: 'NSE',
    assetType: 'EQUITY',
    lastClosePrice: 1650.80,
    predictedOpenPrice: 1657.75,
    expectedGapPoints: 6.95,
    expectedGapPct: 0.42,
    pGapUp: 0.76,
    direction: 'GAP_UP',
    openP10: 1645.00,
    openP50: 1657.75,
    openP90: 1672.00,
    confidenceScore: 0.90,
    overnightFactors: [
      {
        name: 'HDB ADR Premium (+0.55% on NYSE)',
        impactPoints: 5.4,
        percentageContribution: 78.0,
        direction: 'positive',
        description: 'American Depositary Receipt closed with positive buying pressure.',
      },
    ],
  },
  {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Ltd.',
    exchange: 'NSE',
    assetType: 'EQUITY',
    lastClosePrice: 975.30,
    predictedOpenPrice: 980.65,
    expectedGapPoints: 5.35,
    expectedGapPct: 0.55,
    pGapUp: 0.75,
    direction: 'GAP_UP',
    openP10: 968.00,
    openP50: 980.65,
    openP90: 994.00,
    confidenceScore: 0.83,
    overnightFactors: [
      {
        name: 'JLR Luxury Order Bank Execution Delivery',
        impactPoints: 4.1,
        percentageContribution: 75.0,
        direction: 'positive',
        description: 'High margin Range Rover global wholesale metrics on plan.',
      },
    ],
  },
]

export function NextDayOpenPredictor() {
  const [filterType, setFilterType] = useState<'ALL' | 'INDICES' | 'EQUITIES' | 'BSE' | 'NSE'>('ALL')
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>('^NSEI')
  const [giftNiftyShift, setGiftNiftyShift] = useState<number>(0)

  const filteredQuotes = useMemo(() => {
    return OPENING_PREDICTIONS.filter((q) => {
      if (filterType === 'INDICES') return q.assetType === 'INDEX'
      if (filterType === 'EQUITIES') return q.assetType === 'EQUITY'
      if (filterType === 'BSE') return q.exchange === 'BSE'
      if (filterType === 'NSE') return q.exchange === 'NSE'
      return true
    }).map((q) => {
      // Dynamic what-if shift based on GIFT Nifty adjustment slider
      const shiftedGap = q.expectedGapPoints + (giftNiftyShift * (q.lastClosePrice / 22363.35) * 0.75)
      const shiftedOpen = q.lastClosePrice + shiftedGap
      const shiftedPct = (shiftedGap / q.lastClosePrice) * 100
      return {
        ...q,
        dynamicOpen: Math.round(shiftedOpen * 100) / 100,
        dynamicGapPoints: Math.round(shiftedGap * 100) / 100,
        dynamicGapPct: Math.round(shiftedPct * 100) / 100,
      }
    })
  }, [filterType, giftNiftyShift])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Next-Day NSE & BSE Opening Price & Gap Predictor
            </h1>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              Quantile ML v2.1
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Machine learning forecast of tomorrow's 9:15 AM IST opening price, gap probability (P_gap_up), and confidence intervals for NIFTY 50, BSE SENSEX, and top equities.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-slate-300">
          <Clock className="h-4 w-4 text-gold-400" />
          <span>Forecast For: Next Trading Session (09:15 IST)</span>
        </div>
      </div>

      {/* Global Macro & Overnight Signals Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">GIFT Nifty Implied Open</span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <span>22,448.00</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">+84.65 pts (+0.38%) Premium</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Wall Street Close</span>
          <div className="mt-1 text-xl font-bold font-mono text-white flex items-center gap-1.5">
            <span>S&P +0.65%</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Nasdaq +0.82% Tech Rally</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Brent Crude Oil</span>
          <div className="mt-1 text-xl font-bold font-mono text-sky-400 flex items-center gap-1.5">
            <span>$78.40 / bbl</span>
            <ArrowDownRight className="h-4 w-4" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">-1.1% Overnight Easing</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Market Opening Bias</span>
          <div className="mt-1 text-xl font-bold text-emerald-400 flex items-center gap-1.5 font-display">
            <span>Bullish Gap Up</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">74% Historical Gap-Up Odds</p>
        </div>
      </div>

      {/* What-If Overnight Futures Simulator */}
      <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sliders className="h-5 w-5 text-gold-400 shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-white">GIFT Nifty Pre-Market Stress Simulator</h4>
            <p className="text-[11px] text-slate-400">
              Slide to simulate sudden pre-market futures swings and see real-time recalculation of Indian market opening coordinates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-72">
          <input
            type="range"
            min={-150}
            max={150}
            step={10}
            value={giftNiftyShift}
            onChange={(e) => setGiftNiftyShift(Number(e.target.value))}
            className="w-full accent-gold-400 cursor-pointer"
          />
          <span className="font-mono text-xs font-bold w-16 text-right text-gold-300">
            {giftNiftyShift >= 0 ? `+${giftNiftyShift}` : giftNiftyShift} pts
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {(['ALL', 'INDICES', 'BSE', 'NSE', 'EQUITIES'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === tab
                  ? 'bg-gold-500 text-ink-950 shadow'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab === 'ALL'
                ? 'All Forecasts'
                : tab === 'INDICES'
                ? 'Benchmark Indices'
                : tab === 'BSE'
                ? 'BSE SENSEX'
                : tab === 'NSE'
                ? 'NSE Indices'
                : 'Top Equities'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredQuotes.length} Quantile Forecasts
        </span>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        {filteredQuotes.map((q) => {
          const isExpanded = expandedSymbol === q.symbol
          const isGapUp = q.dynamicGapPoints >= 0

          return (
            <div
              key={q.symbol}
              className="rounded-2xl border border-white/10 bg-ink-950/70 backdrop-blur-md overflow-hidden transition shadow-lg"
            >
              <div
                onClick={() => setExpandedSymbol(isExpanded ? null : q.symbol)}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
              >
                {/* Asset Identity */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-300 font-bold text-xs font-mono">
                    {q.exchange}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base tracking-wide font-display">
                        {q.name}
                      </span>
                      <span className="font-mono text-xs text-slate-400">({q.symbol})</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                        {q.assetType}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>Prev Close: ₹{q.lastClosePrice.toLocaleString('en-IN')}</span>
                      <span>·</span>
                      <span>Confidence: {(q.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Opening Forecast Numbers */}
                <div className="flex flex-wrap items-center gap-6">
                  {/* Predicted Open */}
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-semibold">
                      Predicted 9:15 AM Open
                    </span>
                    <span className="font-mono text-lg font-bold text-white">
                      ₹{q.dynamicOpen.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Expected Gap */}
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-semibold">
                      Expected Gap
                    </span>
                    <div className={`font-mono text-base font-bold flex items-center gap-1 ${isGapUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isGapUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span>
                        {isGapUp ? `+${q.dynamicGapPoints}` : q.dynamicGapPoints} pts ({isGapUp ? `+${q.dynamicGapPct}%` : `${q.dynamicGapPct}%`})
                      </span>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">P(Gap-Up)</span>
                      <span className="font-bold text-emerald-400">{(q.pGapUp * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${q.pGapUp * 100}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Chevron Toggle */}
                  <button className="text-slate-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Quantile Range & Overnight Factors Drawer */}
              {isExpanded && (
                <div className="border-t border-white/5 bg-black/30 p-5 space-y-4 text-xs">
                  {/* Quantile Confidence Interval (P10 to P90) */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Quantile Regression Range (P10 - P90)</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        90% Confidence Band: ₹{q.openP10.toLocaleString('en-IN')} — ₹{q.openP90.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="relative pt-3 pb-1">
                      <div className="h-2 w-full rounded-full bg-white/10 relative">
                        <div
                          style={{
                            left: '20%',
                            width: '60%',
                          }}
                          className="absolute h-full bg-gold-400/40 rounded-full"
                        />
                        <div
                          style={{ left: '50%' }}
                          className="absolute -top-1 h-4 w-1 bg-gold-400 rounded-full"
                          title={`Median P50: ₹${q.openP50}`}
                        />
                      </div>
                      <div className="flex justify-between mt-2 font-mono text-[10px] text-slate-400">
                        <span>P10 (Bearish Open): ₹{q.openP10.toLocaleString('en-IN')}</span>
                        <span className="text-gold-300 font-bold">P50 (Expected): ₹{q.openP50.toLocaleString('en-IN')}</span>
                        <span>P90 (Bullish Open): ₹{q.openP90.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Overnight Catalyst SHAP Drivers */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2.5">
                      Key Overnight Catalysts & Feature Contributions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.overnightFactors.map((factor, fIdx) => (
                        <div
                          key={fIdx}
                          className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{factor.name}</span>
                            <span className={`font-mono font-bold ${factor.direction === 'positive' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {factor.direction === 'positive' ? `+${factor.impactPoints}` : factor.impactPoints} pts
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{factor.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default NextDayOpenPredictor
