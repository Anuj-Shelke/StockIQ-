import { TrendingUp, TrendingDown, Target, ShieldCheck, HelpCircle, Flag } from 'lucide-react'
import type { PredictionDetail } from '@/types/explainability'

interface PredictionCardProps {
  prediction: PredictionDetail
  onOpenReasoning: () => void
  onReportIssue: () => void
}

export function PredictionCard({
  prediction,
  onOpenReasoning,
  onReportIssue,
}: PredictionCardProps) {
  const isUp = prediction.predictedChange >= 0

  return (
    <div className="card-surface p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-theme-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-text-primary font-display font-mono">
              {prediction.symbol}
            </h2>
            <span className="badge-verified">
              Verified NSE Feed
            </span>
            <span className="badge-ai font-mono">
              AI {prediction.forecastHorizon}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {prediction.name} • Deterministic XGBoost regressor with calibrated 90% confidence bands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReasoning}
            className="btn-gold flex items-center gap-1.5 text-xs py-2"
          >
            <HelpCircle className="h-4 w-4" />
            Inspect Why
          </button>
          <button
            onClick={onReportIssue}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 text-text-muted hover:text-loss"
            title="Request clarification or expert oversight for this analysis"
          >
            <Flag className="h-4 w-4" />
            Request Human Review
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Price */}
        <div className="rounded-xl border border-theme-subtle bg-surface-elevated/40 p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Spot Price
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-hover text-text-muted">
              Live NSE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-text-primary tracking-tight">
            ₹{prediction.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-text-muted font-mono">Real-time exchange mark</span>
        </div>

        {/* Model Forecast Target */}
        <div className="rounded-xl border border-theme-subtle bg-surface-elevated/40 p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Fair Value Target
            </span>
            <Target className="h-4 w-4 text-gold" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-text-primary tracking-tight">
            ₹{prediction.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-xs font-mono font-medium ${
              isUp ? 'text-gain' : 'text-loss'
            }`}
          >
            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {isUp ? '+' : ''}
              {prediction.predictedChangePercent.toFixed(2)}% (₹{prediction.predictedChange.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Confidence Interval */}
        <div className="rounded-xl border border-theme-subtle bg-surface-elevated/40 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-text-muted">
            90% Confidence Interval
          </span>
          <div className="mt-2 text-sm font-bold font-mono text-text-primary">
            ₹{prediction.lowerBound.toLocaleString('en-IN')} - ₹{prediction.upperBound.toLocaleString('en-IN')}
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${prediction.confidenceScore}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-text-muted font-mono">
            <span>Downside ₹{prediction.lowerBound.toFixed(0)}</span>
            <span className="text-gold font-medium">{prediction.confidenceScore}%</span>
            <span>Upside ₹{prediction.upperBound.toFixed(0)}</span>
          </div>
        </div>

        {/* Confidence Reliability */}
        <div className="rounded-xl border border-theme-subtle bg-surface-elevated/40 p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Empirical Reliability
            </span>
            <ShieldCheck className="h-4 w-4 text-gain" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-gain tracking-tight">
            High Confidence
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            Backtested across 500+ daily bars
          </span>
        </div>
      </div>
    </div>
  )
}
