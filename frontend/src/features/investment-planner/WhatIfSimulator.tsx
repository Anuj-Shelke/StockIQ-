import React, { useState } from 'react'
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type {
  InvestmentPlanResponse,
  PlanSimulateRequest,
  PlanSimulateResponse,
} from '../../types/investmentPlanner'
import { simulateInvestmentPlan } from '../../services/investmentPlannerService'
import { formatINR } from './plannerUtils'

interface WhatIfSimulatorProps {
  initialPlan: InvestmentPlanResponse
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ initialPlan }) => {
  // Extract initial weights
  const defaultAllocations: Record<string, number> = {}
  initialPlan.asset_allocation.forEach(a => {
    defaultAllocations[a.asset_class] = a.allocation_pct
  })

  const [capital, setCapital] = useState<number>(initialPlan.profile_summary.current_investable_capital)
  const [sip, setSip] = useState<number>(initialPlan.profile_summary.monthly_sip_amount || 0)
  const [horizon, setHorizon] = useState<number>(initialPlan.profile_summary.target_years || 5)
  const [inflation, setInflation] = useState<number>(5.5)
  const [taxSlab, setTaxSlab] = useState<number>(30.0)

  const [allocations, setAllocations] = useState<Record<string, number>>({
    FIXED_DEPOSIT: defaultAllocations.FIXED_DEPOSIT ?? 20,
    GOLD: defaultAllocations.GOLD ?? 10,
    EQUITY_STOCKS: defaultAllocations.EQUITY_STOCKS ?? 45,
    DIVERSIFIED_INDEX_FUNDS: defaultAllocations.DIVERSIFIED_INDEX_FUNDS ?? 25,
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PlanSimulateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalAllocationPct = Object.values(allocations).reduce((sum, v) => sum + v, 0)
  const isAllocationValid = Math.abs(totalAllocationPct - 100) < 0.05

  const handleWeightChange = (key: string, val: number) => {
    setAllocations(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, Math.round(val * 10) / 10)),
    }))
  }

  const handleReset = () => {
    setAllocations({
      FIXED_DEPOSIT: defaultAllocations.FIXED_DEPOSIT ?? 20,
      GOLD: defaultAllocations.GOLD ?? 10,
      EQUITY_STOCKS: defaultAllocations.EQUITY_STOCKS ?? 45,
      DIVERSIFIED_INDEX_FUNDS: defaultAllocations.DIVERSIFIED_INDEX_FUNDS ?? 25,
    })
    setCapital(initialPlan.profile_summary.current_investable_capital)
    setSip(initialPlan.profile_summary.monthly_sip_amount || 0)
    setHorizon(initialPlan.profile_summary.target_years || 5)
    setResult(null)
    setError(null)
  }

  const handleSimulate = async () => {
    if (!isAllocationValid) {
      setError(`Total asset allocation must equal exactly 100.0%. Current sum: ${totalAllocationPct.toFixed(1)}%`)
      return
    }

    setLoading(true)
    setError(null)

    const payload: PlanSimulateRequest = {
      original_plan_id: initialPlan.plan_id,
      investable_capital: capital,
      monthly_sip: sip,
      investment_horizon_years: horizon,
      allocations,
      inflation_rate_pct: inflation,
      investor_tax_slab_pct: taxSlab,
    }

    try {
      const resp = await simulateInvestmentPlan(payload)
      setResult(resp)
    } catch (err: any) {
      setError(err?.message || 'Simulation failed. Please verify inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Interactive What-If Scenario Simulator</h3>
              <p className="text-xs text-slate-400">
                Adjust asset weights, horizon, inflation, and capital to instantly model returns and risk impact
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={loading || !isAllocationValid}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/30"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Sliders Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Asset Class Allocation Sliders */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Custom Asset Mix (Sum must be 100%)
              </h4>
              <span className={`text-xs font-bold ${isAllocationValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                Sum: {totalAllocationPct.toFixed(1)}%
              </span>
            </div>

            {/* FD Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Fixed Deposits (DICGC Safe)</span>
                <span className="font-semibold text-emerald-400">{allocations.FIXED_DEPOSIT}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocations.FIXED_DEPOSIT}
                onChange={e => handleWeightChange('FIXED_DEPOSIT', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Gold Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Gold & Metals (ETF / SGB)</span>
                <span className="font-semibold text-amber-400">{allocations.GOLD}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocations.GOLD}
                onChange={e => handleWeightChange('GOLD', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Direct Equities Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Direct Equities (AI Selected)</span>
                <span className="font-semibold text-indigo-400">{allocations.EQUITY_STOCKS}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocations.EQUITY_STOCKS}
                onChange={e => handleWeightChange('EQUITY_STOCKS', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Index Funds Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Diversified Index Funds (Nifty 50)</span>
                <span className="font-semibold text-sky-400">{allocations.DIVERSIFIED_INDEX_FUNDS}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocations.DIVERSIFIED_INDEX_FUNDS}
                onChange={e => handleWeightChange('DIVERSIFIED_INDEX_FUNDS', parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Capital, Horizon & Tax Parameters */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Macro & Investment Parameters
            </h4>

            {/* Lump sum */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Lump Sum Capital (INR)</span>
                <span className="font-semibold text-slate-200">{formatINR(capital)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="10000000"
                step="10000"
                value={capital}
                onChange={e => setCapital(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Monthly SIP */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Monthly SIP (INR)</span>
                <span className="font-semibold text-slate-200">{formatINR(sip)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="200000"
                step="2000"
                value={sip}
                onChange={e => setSip(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Horizon */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Investment Horizon</span>
                <span className="font-semibold text-slate-200">{horizon} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={horizon}
                onChange={e => setHorizon(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Inflation Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Expected Inflation Rate</span>
                <span className="font-semibold text-amber-400">{inflation}%</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={inflation}
                onChange={e => setInflation(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Tax Slab */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Investor Marginal Tax Slab</span>
                <span className="font-semibold text-purple-400">{taxSlab}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="39"
                step="1"
                value={taxSlab}
                onChange={e => setTaxSlab(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        {result && (
          <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <h4 className="font-bold text-slate-100 text-sm">Simulated Scenario Results</h4>
              </div>
              <span className="text-2xs text-indigo-300">Horizon: {result.investment_horizon_years} Yrs</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                <span className="text-2xs text-slate-400 block">Expected Annual Return</span>
                <span className="text-lg font-bold text-emerald-400">{result.expected_annual_return_pct.toFixed(2)}%</span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                <span className="text-2xs text-slate-400 block">Sharpe Ratio</span>
                <span className="text-lg font-bold text-cyan-400">{result.sharpe_ratio.toFixed(2)}</span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                <span className="text-2xs text-slate-400 block">Annual Volatility</span>
                <span className="text-lg font-bold text-amber-400">{result.annualized_volatility_pct.toFixed(2)}%</span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                <span className="text-2xs text-slate-400 block">Max Drawdown</span>
                <span className="text-lg font-bold text-rose-400">-{result.max_drawdown_pct.toFixed(2)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded-lg bg-slate-900/80 p-3.5 border border-slate-800">
                <span className="text-2xs text-slate-400 block">Nominal Projected Final Value</span>
                <span className="text-xl font-bold text-slate-100">{formatINR(result.nominal_final_value)}</span>
                <span className="text-2xs text-slate-500 block mt-1">
                  Inflation-Adjusted: {formatINR(result.inflation_adjusted_final_value)}
                </span>
              </div>

              <div className="rounded-lg bg-slate-900/80 p-3.5 border border-slate-800">
                <span className="text-2xs text-slate-400 block">Post-Tax Net Portfolio</span>
                <span className="text-xl font-bold text-emerald-400">{formatINR(result.post_tax_portfolio_value)}</span>
                <span className="text-2xs text-rose-300 block mt-1">
                  Estimated Tax: -{formatINR(result.estimated_total_tax)}
                </span>
              </div>
            </div>

            {/* Liquidity note */}
            {result.liquidity_implications && (
              <p className="text-2xs text-slate-400 leading-relaxed pt-2 border-t border-indigo-500/20">
                <strong className="text-indigo-300">Liquidity Impact: </strong>
                {result.liquidity_implications}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
