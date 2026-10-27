import React from 'react'
import {
  Scale,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import type { AlternativePortfolio } from '../../types/investmentPlanner'

interface PortfolioComparisonSectionProps {
  portfolios: AlternativePortfolio[]
}

export const PortfolioComparisonSection: React.FC<PortfolioComparisonSectionProps> = ({
  portfolios,
}) => {
  if (!portfolios || portfolios.length === 0) return null

  const getStyleTheme = (name: string) => {
    switch (name.toLowerCase()) {
      case 'capital_preservation':
        return {
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          iconColor: 'text-emerald-400',
        }
      case 'aggressive_growth':
        return {
          border: 'border-purple-500/30',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          iconColor: 'text-purple-400',
        }
      default: // balanced_growth
        return {
          border: 'border-indigo-500/30',
          badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          iconColor: 'text-indigo-400',
        }
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Alternative Portfolio Comparison</h3>
              <p className="text-xs text-slate-400">
                Explore conservative, balanced, and aggressive asset allocation strategies tailored to your timeline
              </p>
            </div>
          </div>
        </div>

        {/* 3 Columns */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {portfolios.map(p => {
            const theme = getStyleTheme(p.name)

            return (
              <div
                key={p.name}
                className={`rounded-xl border ${theme.border} bg-slate-950/70 p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200`}
              >
                <div>
                  {/* Top: Name & Suitability */}
                  <div className="border-b border-slate-800/80 pb-3">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-2xs font-bold ${theme.badge}`}>
                      {p.label}
                    </span>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">{p.description}</p>
                  </div>

                  {/* Allocation Mix Badges */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {Object.entries(p.allocations).map(([asset, pct]) => (
                      <span
                        key={asset}
                        className="rounded-md bg-slate-900 px-2 py-0.5 text-2xs font-medium text-slate-300 border border-slate-800"
                      >
                        {asset.replace('_', ' ')}: <strong className="text-slate-100">{pct}%</strong>
                      </span>
                    ))}
                  </div>

                  {/* Quantitative Metrics Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs rounded-lg bg-slate-900/60 p-3 border border-slate-800/60">
                    <div>
                      <span className="text-2xs text-slate-400 block">Expected Return</span>
                      <span className="font-bold text-emerald-400">{p.expected_return_pct.toFixed(2)}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block">After-Tax Return</span>
                      <span className="font-bold text-teal-400">{p.estimated_after_tax_return_pct.toFixed(2)}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block">Volatility (σ)</span>
                      <span className="font-bold text-cyan-400">{p.volatility_pct.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block">Sharpe Ratio</span>
                      <span className="font-bold text-indigo-300">{p.sharpe_ratio.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="space-y-1">
                      {p.pros && p.pros.map((pro, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-2xs text-slate-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 pt-1">
                      {p.cons && p.cons.map((con, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-2xs text-slate-400">
                          <XCircle className="h-3 w-3 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suitability Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-2xs">
                  <span className="text-slate-500 block">Best Suited For:</span>
                  <span className="text-slate-300 font-medium">{p.suitability}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
