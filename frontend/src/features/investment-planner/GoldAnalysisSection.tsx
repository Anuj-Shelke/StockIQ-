import React from 'react'
import {
  Coins,
  Shield,
} from 'lucide-react'
import type { GoldProductOption } from '../../types/investmentPlanner'
import { formatINR } from './plannerUtils'

interface GoldAnalysisSectionProps {
  goldOptions: GoldProductOption[]
  totalGoldAmount: number
}

export const GoldAnalysisSection: React.FC<GoldAnalysisSectionProps> = ({
  goldOptions,
  totalGoldAmount,
}) => {
  if (!goldOptions || goldOptions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-md">
        <Coins className="mx-auto h-10 w-10 text-slate-600 mb-3" />
        <h4 className="font-semibold text-slate-200">Zero Gold Allocation</h4>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          No capital currently designated to precious metals based on investment horizon or asset preference settings.
        </p>
      </div>
    )
  }

  const getProductBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'gold_etf':
        return { label: 'Gold ETF (Recommended)', style: 'bg-amber-500/10 border-amber-500/30 text-amber-400' }
      case 'sgb':
        return { label: 'Sovereign Gold Bond (SGB)', style: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' }
      default:
        return { label: 'Physical 24K Bullion', style: 'bg-orange-500/10 border-orange-500/30 text-orange-400' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Gold & Precious Metals Hedge Analysis</h3>
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-2xs font-semibold text-amber-300">
                  <Shield className="h-3 w-3" /> Inflation & Crisis Hedge
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional vehicle comparison: Liquidity, Expense Ratios, Tracking Error, and Taxation
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xs text-slate-400 block">Total Gold Allocation</span>
            <span className="text-base font-bold text-amber-400">{formatINR(totalGoldAmount)}</span>
          </div>
        </div>

        {/* Product Comparison Cards */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {goldOptions.map((opt, idx) => {
            const badge = getProductBadge(opt.product_type)

            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-2xs font-bold ${badge.style}`}>
                        {badge.label}
                      </span>
                      <h4 className="font-bold text-slate-100 text-sm mt-2">{opt.product_name}</h4>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">10-Yr Historical CAGR:</span>
                      <span className="font-bold text-emerald-400">{opt.historical_10yr_cagr.toFixed(1)}% p.a.</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Allocated Amount:</span>
                      <span className="font-bold text-slate-200">{formatINR(opt.allocated_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Liquidity:</span>
                      <span className="font-medium text-slate-300">{opt.liquidity}</span>
                    </div>
                  </div>

                  {/* Structural Comparison Details */}
                  <div className="mt-4 rounded-lg bg-slate-900/60 p-3 border border-slate-800/60 space-y-2 text-2xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Transaction & Entry Costs:</span>
                      <span className="text-slate-300">{opt.transaction_costs}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Storage & Custody:</span>
                      <span className="text-slate-300">{opt.storage_costs}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Tracking Error / Spread:</span>
                      <span className="text-slate-300">{opt.tracking_difference}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/60">
                      <span className="text-amber-400 block font-semibold">Tax Treatment (India):</span>
                      <span className="text-slate-300 leading-relaxed">{opt.tax_treatment}</span>
                    </div>
                  </div>
                </div>

                {/* Risk summary at bottom */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-2xs text-slate-400">
                  <span className="text-slate-500 block">Risk Profile:</span>
                  <p className="mt-0.5 leading-relaxed text-slate-300">{opt.risk_summary}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
