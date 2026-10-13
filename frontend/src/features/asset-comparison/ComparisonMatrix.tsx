import { ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react'
import type { AssetSummaryMetric } from '@/types/assetComparison'

interface ComparisonMatrixProps {
  metrics: AssetSummaryMetric[]
}

export function ComparisonMatrix({ metrics }: ComparisonMatrixProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {metrics.map((metric) => {
        return (
          <div
            key={metric.assetClass}
            className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {metric.assetClass}
                </span>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
              </div>

              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-white">
                  ₹{metric.totalFinalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+{metric.totalReturnPercent.toFixed(1)}% Total Return</span>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-white/5 pt-4 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Annualized CAGR:</span>
                  <span className="font-mono font-semibold text-white">
                    {metric.cagr.toFixed(1)}% p.a.
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Max Historical Drawdown:</span>
                  <span className="font-mono text-rose-400">
                    {metric.maxDrawdown}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Liquidity Horizon:</span>
                  <span className="text-slate-200">{metric.liquidity}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Tax Treatment:</span>
                  <span className="text-slate-200 truncate max-w-[150px]" title={metric.taxImplication}>
                    {metric.taxImplication}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Risk Assessment:</span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                  metric.riskLevel === 'High'
                    ? 'bg-rose-500/10 text-rose-300'
                    : metric.riskLevel === 'Medium'
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {metric.riskLevel === 'Low' ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {metric.riskLevel} Risk
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
