import React from 'react'
import {
  Receipt,
  ShieldCheck,
  Scale,
} from 'lucide-react'
import type { TaxIntegrationSummary } from '../../types/investmentPlanner'
import { formatINR } from './plannerUtils'

interface TaxIntegrationCardProps {
  tax: TaxIntegrationSummary
}

export const TaxIntegrationCard: React.FC<TaxIntegrationCardProps> = ({ tax }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        {/* Header with reuse badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Tax Integration & Net After-Tax Returns</h3>
                <span className="flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-2xs font-semibold text-purple-300">
                  <ShieldCheck className="h-3 w-3" /> Reusing StockIQ Tax Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct integration with StockIQ's Capital Gains Tax Module under Indian Income Tax Act (Finance Act 2024)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Effective Tax Drag</span>
              <span className="text-base font-bold text-purple-300">{tax.effective_tax_rate_pct.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pre-Tax Gain */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 font-medium block">Projected Pre-Tax Capital Gain</span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
              {formatINR(tax.pre_tax_expected_gain)}
            </div>
            <p className="mt-1 text-2xs text-slate-400">Cumulative nominal capital appreciation across all assets</p>
          </div>

          {/* Estimated Tax Liability */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <span className="text-xs text-rose-300 font-medium block">Total Estimated Tax Liability</span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-rose-400">
              -{formatINR(tax.estimated_total_tax)}
            </div>
            <p className="mt-1 text-2xs text-rose-300/80">Section 112A LTCG + Section 56 FD slab + Gold taxation</p>
          </div>

          {/* Post-Tax Net Gain */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <span className="text-xs text-emerald-300 font-medium block">Net Post-Tax Profit & Corpus</span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400">
              {formatINR(tax.post_tax_expected_gain)}
            </div>
            <p className="mt-1 text-2xs text-emerald-300/80">
              Final Net Portfolio: <strong className="text-emerald-200">{formatINR(tax.post_tax_portfolio_value)}</strong>
            </p>
          </div>
        </div>

        {/* Tax Rules Breakdown Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Equity Section 112A */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Equity & Funds (Sec 112A)</span>
              <span className="text-rose-400 font-bold">{formatINR(tax.estimated_equity_ltcg_tax)}</span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              {tax.equity_section_applied || '12.5% LTCG on long-term gains with annual ₹1,25,000 exemption limit.'}
            </p>
          </div>

          {/* FD Section 56 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Fixed Deposits (Sec 56)</span>
              <span className="text-rose-400 font-bold">{formatINR(tax.estimated_fd_slab_tax)}</span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              {tax.fd_tax_provision || 'Taxed as Income from Other Sources at investor marginal income tax slab.'}
            </p>
          </div>

          {/* Gold Section 112 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Gold & Commodities (Sec 112)</span>
              <span className="text-rose-400 font-bold">{formatINR(tax.estimated_gold_tax)}</span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              {tax.gold_tax_provision || '12.5% LTCG rate applied on ETF/metal holdings past 12-month tenure.'}
            </p>
          </div>
        </div>

        {/* Tax Assumptions & Statutory Disclaimer */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Scale className="h-4 w-4 text-purple-400" />
            <span>Taxation Engine Model Assumptions:</span>
          </div>
          <ul className="space-y-1 text-slate-400 text-2xs">
            {tax.tax_assumptions && tax.tax_assumptions.map((assump, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-purple-400 font-bold">•</span>
                <span>{assump}</span>
              </li>
            ))}
          </ul>

          <p className="text-2xs text-slate-500 pt-2 border-t border-slate-800/60 leading-relaxed">
            <strong className="text-slate-400">Statutory Notice: </strong>
            {tax.disclaimer || 'Tax estimates are computed strictly for personal investment planning based on current Indian Income Tax provisions and do not constitute formal chartered accountancy advice.'}
          </p>
        </div>
      </div>
    </div>
  )
}
