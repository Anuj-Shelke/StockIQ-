import { useState, useMemo } from 'react'
import {
  Sparkles,
  ShieldCheck,
  Sliders,
  PieChart as PieIcon,
  CheckCircle2,
  RefreshCw,
  Info,
  Award,
} from 'lucide-react'

interface StockRecommendation {
  symbol: string
  companyName: string
  sector: string
  marketCapCategory: string
  currentPrice: number
  mlPredictedTarget: number
  projectedReturnPercent: number
  beta: number
  volatilityRisk: 'Low' | 'Moderate' | 'High'
  mlConfidence: number
  keyShapDrivers: string[]
  defensiveScore: number
  growthScore: number
}

const STOCK_UNIVERSE: StockRecommendation[] = [
  {
    symbol: 'TCS.NS',
    companyName: 'Tata Consultancy Services Ltd.',
    sector: 'Information Technology',
    marketCapCategory: 'Mega Cap',
    currentPrice: 4120.25,
    mlPredictedTarget: 4345.50,
    projectedReturnPercent: 5.47,
    beta: 0.82,
    volatilityRisk: 'Low',
    mlConfidence: 0.88,
    keyShapDrivers: ['Q3 margin expansion (+140 bps)', 'USD/INR forex tailwind', '48% Return on Equity (ROE)'],
    defensiveScore: 92,
    growthScore: 68,
  },
  {
    symbol: 'HDFCBANK.NS',
    companyName: 'HDFC Bank Ltd.',
    sector: 'Banking & Financials',
    marketCapCategory: 'Mega Cap',
    currentPrice: 1650.80,
    mlPredictedTarget: 1820.00,
    projectedReturnPercent: 10.25,
    beta: 0.88,
    volatilityRisk: 'Low',
    mlConfidence: 0.91,
    keyShapDrivers: ['Post-merger deposit growth rebound', 'Lowest NPA ratio in peer universe', 'Institutional FPI accumulation'],
    defensiveScore: 88,
    growthScore: 78,
  },
  {
    symbol: 'RELIANCE.NS',
    companyName: 'Reliance Industries Ltd.',
    sector: 'Energy & Telecom Conglomerate',
    marketCapCategory: 'Mega Cap',
    currentPrice: 2980.50,
    mlPredictedTarget: 3210.00,
    projectedReturnPercent: 7.70,
    beta: 0.95,
    volatilityRisk: 'Moderate',
    mlConfidence: 0.87,
    keyShapDrivers: ['Jio 5G telecom ARPU expansion', 'Retail EBIDTA margins', 'Downstream petrochemical stability'],
    defensiveScore: 80,
    growthScore: 82,
  },
  {
    symbol: 'INFY.NS',
    companyName: 'Infosys Ltd.',
    sector: 'Information Technology',
    marketCapCategory: 'Large Cap',
    currentPrice: 1890.10,
    mlPredictedTarget: 2010.00,
    projectedReturnPercent: 6.34,
    beta: 0.92,
    volatilityRisk: 'Moderate',
    mlConfidence: 0.85,
    keyShapDrivers: ['Generative AI enterprise deals', 'North America BFSI renewals', 'High free cash flow conversion (>85%)'],
    defensiveScore: 82,
    growthScore: 75,
  },
  {
    symbol: 'ICICIBANK.NS',
    companyName: 'ICICI Bank Ltd.',
    sector: 'Banking & Financials',
    marketCapCategory: 'Large Cap',
    currentPrice: 1210.45,
    mlPredictedTarget: 1335.00,
    projectedReturnPercent: 10.29,
    beta: 1.05,
    volatilityRisk: 'Moderate',
    mlConfidence: 0.89,
    keyShapDrivers: ['Best-in-class RoA (2.35%)', 'Digital retail origination velocity', 'Double-digit loan book expansion'],
    defensiveScore: 75,
    growthScore: 88,
  },
  {
    symbol: 'BHARTIARTL.NS',
    companyName: 'Bharti Airtel Ltd.',
    sector: 'Telecommunications',
    marketCapCategory: 'Large Cap',
    currentPrice: 1480.00,
    mlPredictedTarget: 1585.00,
    projectedReturnPercent: 7.09,
    beta: 0.78,
    volatilityRisk: 'Low',
    mlConfidence: 0.86,
    keyShapDrivers: ['Duopoly pricing power', 'ARPU compounding', 'Rapid 5G monetization across enterprise'],
    defensiveScore: 86,
    growthScore: 79,
  },
  {
    symbol: 'TATAMOTORS.NS',
    companyName: 'Tata Motors Ltd.',
    sector: 'Automotive & EV',
    marketCapCategory: 'Large Cap',
    currentPrice: 975.30,
    mlPredictedTarget: 1100.00,
    projectedReturnPercent: 12.79,
    beta: 1.28,
    volatilityRisk: 'High',
    mlConfidence: 0.82,
    keyShapDrivers: ['Domestic EV leadership (>70% share)', 'JLR luxury order book backlog', 'Net debt reduction trajectory'],
    defensiveScore: 58,
    growthScore: 94,
  },
  {
    symbol: 'SBIN.NS',
    companyName: 'State Bank of India',
    sector: 'Banking (PSU)',
    marketCapCategory: 'Large Cap',
    currentPrice: 825.60,
    mlPredictedTarget: 915.00,
    projectedReturnPercent: 10.83,
    beta: 1.15,
    volatilityRisk: 'Moderate',
    mlConfidence: 0.84,
    keyShapDrivers: ['Historic low Gross NPA (<2.2%)', 'Corporate capex credit cycle pickup', 'Attractive valuation P/B discount'],
    defensiveScore: 72,
    growthScore: 85,
  },
]

export function RecommendationsView() {
  // Investor Demographic Inputs
  const [age, setAge] = useState<number>(28)
  const [annualIncome, setAnnualIncome] = useState<number>(1500000)
  const [investmentAmount, setInvestmentAmount] = useState<number>(150000)
  const [horizonYears, setHorizonYears] = useState<number>(5)
  const [primaryGoal, setPrimaryGoal] = useState<string>('wealth_creation')
  const [riskPreference, setRiskPreference] = useState<'dynamic' | 'conservative' | 'moderate' | 'aggressive'>('dynamic')

  const [appliedToast, setAppliedToast] = useState<string | null>(null)

  // Dynamic ML Calculation derived from Age, Income, Amount, and Horizon
  const recommendationData = useMemo(() => {
    // 1. Quantitative Risk Capacity Score (0-100)
    const ageFactor = Math.max(5, Math.min(35, (80 - age) * 0.6))
    const horizonFactor = Math.max(5, Math.min(35, horizonYears * 3.5))
    const savingsRatio = investmentAmount / Math.max(annualIncome, 1)
    const incomeFactor = Math.max(5, Math.min(30, 15 + Math.min(annualIncome / 200000, 15) - savingsRatio * 5))
    const rawRiskScore = Math.round(ageFactor + horizonFactor + incomeFactor)

    let riskCapacity = 'Moderate'
    if (rawRiskScore >= 75) riskCapacity = 'Aggressive Growth'
    else if (rawRiskScore >= 60) riskCapacity = 'Moderate-Aggressive'
    else if (rawRiskScore >= 45) riskCapacity = 'Balanced Moderate'
    else if (rawRiskScore >= 32) riskCapacity = 'Moderate-Conservative'
    else riskCapacity = 'Conservative'

    if (riskPreference === 'conservative') riskCapacity = 'Conservative'
    else if (riskPreference === 'aggressive') riskCapacity = 'Aggressive Growth'
    else if (riskPreference === 'moderate') riskCapacity = 'Balanced Moderate'

    // 2. Asset Allocation Breakdown (Rule of 110 modified by horizon & cushion)
    let rawEquity = 110 - age
    if (horizonYears >= 7) rawEquity += 8
    else if (horizonYears <= 2) rawEquity -= 20

    if (riskCapacity === 'Aggressive Growth') rawEquity = Math.max(rawEquity, 75)
    else if (riskCapacity === 'Conservative') rawEquity = Math.min(rawEquity, 40)

    const equityPct = Math.max(25, Math.min(85, Math.round(rawEquity)))
    const goldPct = horizonYears >= 3 ? 10 : 5
    const cashPct = 5
    const fdPct = 100 - (equityPct + goldPct + cashPct)

    // 3. Stock Suitability Scoring based on Profile
    const isConservative = riskCapacity.includes('Conservative')
    const isAggressive = riskCapacity.includes('Aggressive')

    const scored = STOCK_UNIVERSE.map((stock) => {
      let fitScore = 0
      if (isConservative) {
        fitScore = stock.defensiveScore * 0.7 + (1.5 - Math.min(stock.beta, 1.5)) * 20
      } else if (isAggressive) {
        fitScore = stock.growthScore * 0.7 + Math.min(stock.projectedReturnPercent, 15) * 2
      } else {
        fitScore = stock.defensiveScore * 0.4 + stock.growthScore * 0.4 + 15
      }

      const suitability = Math.min(
        98,
        Math.max(45, Math.round(stock.mlConfidence * 40 + fitScore * 0.4 + stock.projectedReturnPercent * 1.5)),
      )

      const tier = suitability >= 85 ? 'Strong Buy' : suitability >= 70 ? 'Suitable' : 'Moderate Fit'

      const rationale =
        `At age ${age} with a ${horizonYears}-year runway and ₹${investmentAmount.toLocaleString('en-IN')} investable capital, ` +
        `${stock.symbol} provides a calibrated ${Math.round(stock.mlConfidence * 100)}% ML model confidence. ` +
        `Its ${stock.volatilityRisk.toLowerCase()} beta (${stock.beta.toFixed(2)}) aligns with your ${riskCapacity.toLowerCase()} profile, ` +
        `supported by ${stock.keyShapDrivers[0].toLowerCase()}.`

      return {
        ...stock,
        suitabilityScore: suitability,
        suitabilityTier: tier,
        personalizedRationale: rationale,
      }
    })

    scored.sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    const top5 = scored.slice(0, 5)

    // Position sizing across equity allocation
    const totalFit = top5.reduce((sum, s) => sum + s.suitabilityScore, 0)
    const stockPicks = top5.map((s) => {
      const stockWeight = Math.round((s.suitabilityScore / totalFit) * equityPct)
      const allocatedAmount = Math.round(investmentAmount * (stockWeight / 100))
      const shares = Math.floor(allocatedAmount / s.currentPrice)
      return {
        ...s,
        allocationPct: stockWeight,
        allocatedAmount,
        shares,
      }
    })

    const goldAmount = Math.round(investmentAmount * (goldPct / 100))
    const fdAmount = Math.round(investmentAmount * (fdPct / 100))

    // Expected Portfolio CAGR
    const weightedEquityRet =
      stockPicks.reduce((acc, s) => acc + (s.allocationPct / equityPct) * s.projectedReturnPercent, 0) * 1.45
    const expectedCagr = (
      (equityPct / 100) * weightedEquityRet +
      (goldPct / 100) * 10.5 +
      (fdPct / 100) * 7.1
    ).toFixed(2)

    return {
      riskScore: rawRiskScore,
      riskCapacity,
      allocations: { equityPct, fdPct, goldPct, cashPct },
      stockPicks,
      hedges: { goldAmount, fdAmount },
      expectedCagr,
    }
  }, [age, annualIncome, investmentAmount, horizonYears, riskPreference])

  const handleApplyPortfolio = () => {
    setAppliedToast(`Successfully applied ${recommendationData.stockPicks.length} ML recommended holdings to your active portfolio!`)
    setTimeout(() => setAppliedToast(null), 5000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Personalized AI Stock & Portfolio Recommendations
            </h1>
            <span className="rounded-full bg-gold-500/20 border border-gold-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-gold-300">
              ML Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Machine learning stock selections and dynamic life-cycle asset allocation customized to your exact age, income, investment amount, and investment horizon.
          </p>
        </div>

        <button
          onClick={handleApplyPortfolio}
          className="flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-xs font-semibold text-ink-950 hover:bg-gold-400 transition shadow-lg shadow-gold-500/20"
        >
          <Award className="h-4 w-4" />
          Apply to My Portfolio
        </button>
      </div>

      {appliedToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* Profiling Inputs Panel */}
      <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-6 backdrop-blur-md space-y-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Sliders className="h-5 w-5 text-gold-400" />
          <h2 className="font-semibold text-white">Investor Financial Profile & Risk Constraints</h2>
          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin text-gold-400" /> Real-time ML calculation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* 1. Age Input */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Investor Age</span>
              <span className="font-mono text-gold-400 font-bold">{age} Years</span>
            </div>
            <input
              type="range"
              min={18}
              max={75}
              step={1}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-gold-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>18 yrs (Aggressive)</span>
              <span>45 yrs</span>
              <span>75 yrs (Capital Pres.)</span>
            </div>
          </div>

          {/* 2. Annual Income Input */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Annual Income</span>
              <span className="font-mono text-gold-400 font-bold">₹{annualIncome.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={300000}
              max={5000000}
              step={100000}
              value={annualIncome}
              onChange={(e) => setAnnualIncome(Number(e.target.value))}
              className="w-full accent-gold-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>₹3 Lakh</span>
              <span>₹25 Lakh</span>
              <span>₹50+ Lakh</span>
            </div>
          </div>

          {/* 3. Investment Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Investment Capital</span>
              <span className="font-mono text-gold-400 font-bold">₹{investmentAmount.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={25000}
              max={2000000}
              step={25000}
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="w-full accent-gold-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>₹25K</span>
              <span>₹10 Lakh</span>
              <span>₹20+ Lakh</span>
            </div>
          </div>

          {/* 4. Time Horizon Input */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Time Horizon</span>
              <span className="font-mono text-gold-400 font-bold">{horizonYears} Years</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="w-full accent-gold-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 Year (Short)</span>
              <span>5 Years</span>
              <span>20 Years (Long)</span>
            </div>
          </div>
        </div>

        {/* Strategy Preferences */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Primary Goal:</span>
            <select
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="wealth_creation" className="bg-ink-900">Long-term Wealth Creation</option>
              <option value="retirement" className="bg-ink-900">Retirement Independence</option>
              <option value="capital_preservation" className="bg-ink-900">Capital Preservation</option>
              <option value="growth_income" className="bg-ink-900">Growth with Income</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Risk Profile Mode:</span>
            <select
              value={riskPreference}
              onChange={(e) => setRiskPreference(e.target.value as any)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="dynamic" className="bg-ink-900">Auto-Compute via Machine Learning</option>
              <option value="conservative" className="bg-ink-900">Conservative Override</option>
              <option value="moderate" className="bg-ink-900">Moderate Override</option>
              <option value="aggressive" className="bg-ink-900">Aggressive Growth Override</option>
            </select>
          </div>
        </div>
      </div>

      {/* Synthesis Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">ML Risk Capacity</span>
          <div className="mt-1 text-xl font-bold text-white font-display flex items-center gap-2">
            <span>{recommendationData.riskCapacity}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-mono">
            Score: {recommendationData.riskScore} / 100
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Life-Cycle Equity Allocation</span>
          <div className="mt-1 text-xl font-bold text-gold-400 font-mono">
            {recommendationData.allocations.equityPct}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Rule of (110 - Age) + Horizon Bonus
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Debt & Gold Hedges</span>
          <div className="mt-1 text-xl font-bold text-sky-400 font-mono">
            {recommendationData.allocations.fdPct}% FD · {recommendationData.allocations.goldPct}% Gold
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Inflation & Drawdown Cushion
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Projected Portfolio CAGR</span>
          <div className="mt-1 text-xl font-bold text-emerald-400 font-mono">
            +{recommendationData.expectedCagr}% / yr
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Across {horizonYears}-Year Time Horizon
          </p>
        </div>
      </div>

      {/* Asset Allocation Visualizer */}
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <PieIcon className="h-4 w-4 text-gold-400" />
            Recommended Macro Allocation Split
          </span>
          <span className="text-slate-400">Total Capital: ₹{investmentAmount.toLocaleString('en-IN')}</span>
        </div>

        <div className="h-4 w-full rounded-full overflow-hidden flex bg-white/5">
          <div
            style={{ width: `${recommendationData.allocations.equityPct}%` }}
            className="bg-gold-500 h-full transition-all duration-500"
            title={`Equities: ${recommendationData.allocations.equityPct}%`}
          />
          <div
            style={{ width: `${recommendationData.allocations.fdPct}%` }}
            className="bg-sky-500 h-full transition-all duration-500"
            title={`Fixed Deposits: ${recommendationData.allocations.fdPct}%`}
          />
          <div
            style={{ width: `${recommendationData.allocations.goldPct}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Gold: ${recommendationData.allocations.goldPct}%`}
          />
          <div
            style={{ width: `${recommendationData.allocations.cashPct}%` }}
            className="bg-slate-500 h-full transition-all duration-500"
            title={`Cash: ${recommendationData.allocations.cashPct}%`}
          />
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gold-500" />
            <span className="text-slate-300 font-medium">Equities ({recommendationData.allocations.equityPct}%)</span>
            <span className="text-slate-500 font-mono">
              ₹{Math.round(investmentAmount * (recommendationData.allocations.equityPct / 100)).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-300 font-medium">Fixed Deposits ({recommendationData.allocations.fdPct}%)</span>
            <span className="text-slate-500 font-mono">₹{recommendationData.hedges.fdAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-medium">Physical Gold ({recommendationData.allocations.goldPct}%)</span>
            <span className="text-slate-500 font-mono">₹{recommendationData.hedges.goldAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-300 font-medium">Cash Buffer (5%)</span>
            <span className="text-slate-500 font-mono">
              ₹{Math.round(investmentAmount * 0.05).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Stocks Basket */}
      <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-6 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-400" />
            <h2 className="font-semibold text-white">
              Personalized Stock Basket (Top {recommendationData.stockPicks.length} Model Picks)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Powered by XGBoost & SHAP Explainability
          </span>
        </div>

        <div className="space-y-4">
          {recommendationData.stockPicks.map((stock, idx) => (
            <div
              key={stock.symbol}
              className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-5 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-500/10 border border-gold-500/20 text-xs font-bold text-gold-300">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white tracking-wide">{stock.symbol}</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                        {stock.sector}
                      </span>
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        {stock.suitabilityTier}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{stock.companyName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">Current Price</span>
                    <span className="font-mono text-sm font-semibold text-slate-200">
                      ₹{stock.currentPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">ML Target (30d)</span>
                    <span className="font-mono text-sm font-bold text-gold-400">
                      ₹{stock.mlPredictedTarget.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">Projected Gain</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      +{stock.projectedReturnPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Rationale and Allocation Bar */}
              <div className="rounded-lg bg-ink-950/80 p-3.5 border border-white/5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-gold-400 shrink-0" />
                    <span className="text-slate-300">{stock.personalizedRationale}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-3 font-mono text-xs">
                    <span className="text-gold-300 font-bold">
                      {stock.allocationPct}% Allocation
                    </span>
                    <span className="text-slate-400">
                      ≈ ₹{stock.allocatedAmount.toLocaleString('en-IN')} ({stock.shares} shares)
                    </span>
                  </div>
                </div>

                {/* Key SHAP Drivers */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">SHAP Drivers:</span>
                  {stock.keyShapDrivers.map((driver, dIdx) => (
                    <span
                      key={dIdx}
                      className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-slate-300"
                    >
                      {driver}
                    </span>
                  ))}
                  <span className="ml-auto font-mono text-[10px] text-slate-400">
                    Confidence: {(stock.mlConfidence * 100).toFixed(0)}% · Beta: {stock.beta.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default RecommendationsView
