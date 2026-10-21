import React, { useState } from 'react'
import {
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react'
import type { StockAllocationItem } from '../../types/investmentPlanner'
import { formatINR } from './plannerUtils'

interface StockAllocationSectionProps {
  stocks: StockAllocationItem[]
  totalEquityAmount: number
}

export const StockAllocationSection: React.FC<StockAllocationSectionProps> = ({
  stocks,
  totalEquityAmount,
}) => {
  const [expandedStock, setExpandedStock] = useState<string | null>(null)

  const toggleStockShap = (symbol: string) => {
    setExpandedStock(prev => (prev === symbol ? null : symbol))
  }

  const getSignalBadge = (signal: string) => {
    switch (signal.toUpperCase()) {
      case 'STRONG_BUY':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      case 'BUY':
        return 'bg-teal-500/10 border-teal-500/30 text-teal-400'
      case 'HOLD':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      case 'medium':
      case 'moderate':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    }
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-md">
        <Cpu className="mx-auto h-10 w-10 text-slate-600 mb-3" />
        <h4 className="font-semibold text-slate-200">Zero Direct Equity Allocation</h4>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          Based on your conservative risk profile or short horizon, capital has been protected in Fixed Deposits, Gold, and Liquid Reserves.
        </p>
      </div>
    )
  }

  const avgConfidence = (
    stocks.reduce((sum, s) => sum + s.ml_confidence, 0) / stocks.length
  ).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">AI Stock Picks & SHAP Feature Attribution</h3>
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-2xs font-semibold text-indigo-300">
                  <Sparkles className="h-3 w-3" /> StockIQ Core ML
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct equities selected via machine learning forecast confidence, fundamental metrics, and SHAP explainability
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Total Equity Allocated</span>
              <span className="text-base font-bold text-slate-100">{formatINR(totalEquityAmount)}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Avg ML Confidence</span>
              <span className="text-base font-bold text-indigo-400">{avgConfidence}%</span>
            </div>
          </div>
        </div>

        {/* Stock Cards Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {stocks.map(stock => {
            const isExpanded = expandedStock === stock.symbol
            const upsidePct = stock.current_price > 0
              ? (((stock.target_price - stock.current_price) / stock.current_price) * 100).toFixed(1)
              : '0.0'

            return (
              <div
                key={stock.symbol}
                className="group rounded-xl border border-slate-800 bg-slate-950/70 p-5 transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Symbol, Sector, Signals */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {stock.symbol}
                        </span>
                        <span className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-2xs font-medium text-slate-300">
                          {stock.market_cap_category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{stock.company_name} • {stock.sector}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-md border px-2 py-0.5 text-2xs font-bold ${getSignalBadge(stock.recommendation_signal)}`}>
                        {stock.recommendation_signal}
                      </span>
                      <span className="text-2xs text-slate-500 flex items-center gap-1.5">
                        <span>Beta: {stock.beta.toFixed(2)}</span>
                        {stock.volatility_risk && (
                          <span className={`rounded px-1.5 py-0.5 border text-2xs font-semibold ${getRiskBadge(stock.volatility_risk)}`}>
                            {stock.volatility_risk}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Pricing and Return Metrics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-900/60 p-3 border border-slate-800/60 text-xs">
                    <div>
                      <span className="text-2xs text-slate-400 block">Current Price</span>
                      <span className="font-semibold text-slate-200">₹{stock.current_price.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block">Target (1-Yr)</span>
                      <span className="font-semibold text-emerald-400">₹{stock.target_price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xs text-slate-400 block">Target Upside</span>
                      <span className="font-semibold text-emerald-400">+{upsidePct}%</span>
                    </div>
                  </div>

                  {/* Allocation and Weight */}
                  <div className="mt-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Allocation:</span>
                      <span className="font-bold text-slate-100">{formatINR(stock.allocated_amount)}</span>
                      <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-2xs font-semibold text-indigo-400">
                        {stock.weight_pct.toFixed(1)}% of Equities
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">ML Confidence:</span>
                      <span className="font-bold text-indigo-300">{stock.ml_confidence.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* SHAP Explainability Accordion */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => toggleStockShap(stock.symbol)}
                      className="w-full flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Why did AI select this? (SHAP Drivers)
                      </span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-3 space-y-2 text-xs">
                        <div className="text-2xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Key Attributing Features (SHAP Values):
                        </div>
                        <ul className="space-y-1.5">
                          {stock.key_shap_drivers && stock.key_shap_drivers.map((driver, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-slate-300 text-2xs leading-relaxed">
                              <span className="text-indigo-400 font-bold">•</span>
                              <span>{driver}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
