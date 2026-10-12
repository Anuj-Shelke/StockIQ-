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
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-display">
              {prediction.symbol}
            </h2>
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-slate-300">
              {prediction.name}
            </span>
            <span className="rounded border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-gold-400">
              {prediction.forecastHorizon} Forecast
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Powered by Gradient Boosted Ensemble (XGBoost) with probabilistic interval bounds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReasoning}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <HelpCircle className="h-4 w-4 text-gold-400" />
            Understand Reasoning
          </button>
          <button
            onClick={onReportIssue}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
            title="Submit dispute request to human review portal"
          >
            <Flag className="h-4 w-4" />
            Report Issue
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Price */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Current Price
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            ₹{prediction.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500">Live Spot / NSE Feed</span>
        </div>

        {/* Model Forecast Target */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Target Prediction
            </span>
            <Target className="h-4 w-4 text-gold-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            ₹{prediction.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-xs font-mono font-medium ${
              isUp ? 'text-emerald-400' : 'text-rose-400'
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
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            90% Confidence Interval
          </span>
          <div className="mt-2 text-sm font-bold font-mono text-slate-200">
            ₹{prediction.lowerBound.toLocaleString('en-IN')} - ₹{prediction.upperBound.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gold-400"
              style={{ width: `${prediction.confidenceScore}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Lower</span>
            <span>Confidence: {prediction.confidenceScore}%</span>
            <span>Upper</span>
          </div>
        </div>

        {/* Confidence Reliability */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Signal Quality
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            High Confidence
          </div>
          <span className="text-[11px] text-slate-500">
            Cross-validated on 500+ days
          </span>
        </div>
      </div>
    </div>
  )
}
