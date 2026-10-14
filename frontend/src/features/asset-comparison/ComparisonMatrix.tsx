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
            className="card-surface p-5 flex flex-col justify-between transition hover:border-theme-default"
          >
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-theme-subtle">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono text-text-muted">
                  {metric.assetClass}
                </span>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
              </div>

              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                  ₹{metric.totalFinalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-gain">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+{metric.totalReturnPercent.toFixed(1)}% Compounded Return</span>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-theme-subtle pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Annualized CAGR:</span>
                  <span className="font-mono font-semibold text-text-primary">
                    {metric.cagr.toFixed(1)}% p.a.
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Max Historical Drawdown:</span>
                  <span className="font-mono text-loss font-semibold">
                    {metric.maxDrawdown}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Liquidity Horizon:</span>
                  <span className="text-text-secondary">{metric.liquidity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tax Treatment:</span>
                  <span className="text-text-secondary truncate max-w-[150px] font-mono" title={metric.taxImplication}>
                    {metric.taxImplication}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-theme-subtle flex items-center justify-between text-xs">
              <span className="text-text-muted">Risk Profile:</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium ${
                  metric.riskLevel === 'High'
                    ? 'badge-risk-elevated'
                    : metric.riskLevel === 'Medium'
                    ? 'badge-risk-moderate'
                    : 'badge-risk-low'
                }`}
              >
                {metric.riskLevel === 'Low' ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {metric.riskLevel} Volatility
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
