import { X, Cpu, Database, AlertCircle, FileText } from 'lucide-react'
import type { PredictionDetail } from '@/types/explainability'

interface ExplanationDrawerProps {
  isOpen: boolean
  onClose: () => void
  prediction: PredictionDetail
}

export function ExplanationDrawer({
  isOpen,
  onClose,
  prediction,
}: ExplanationDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="relative h-full w-full max-w-xl border-l border-white/10 bg-ink-950 p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-white">
                Understand the Reasoning
              </span>
              <span className="rounded bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 text-xs font-mono text-gold-400">
                {prediction.symbol}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent mathematical architecture & input feature constraints
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm">
          {/* Model Formula & Architecture */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span>Model Architecture & Objective Function</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained using <strong>{prediction.modelArchitecture}</strong> with Huber Loss objective for robustness against outliers:
            </p>
            <div className="rounded-lg bg-black/50 p-3 font-mono text-xs text-gold-300 border border-white/5 overflow-x-auto">
              ŷ = BaseValue + ∑ᵢ SHAP_Value(Featureᵢ) + ε
            </div>
            <p className="text-[11px] text-slate-500">
              Each input feature is evaluated through Shapley additive value equations grounded in cooperative game theory.
            </p>
          </div>

          {/* Training Window & Features */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Historical Training Window</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded bg-white/5 p-2">
                <span className="text-slate-400 text-[10px] uppercase">Data Range</span>
                <p className="font-mono text-white mt-0.5">{prediction.historicalDataWindow}</p>
              </div>
              <div className="rounded bg-white/5 p-2">
                <span className="text-slate-400 text-[10px] uppercase">Features Examined</span>
                <p className="font-mono text-white mt-0.5">{prediction.featuresConsidered} Signals</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Includes 200-day EMA, RSI-14, MACD histograms, Crude Oil (Brent) prices, USD/INR exchange rate, and quarterly earnings delta.
            </p>
          </div>

          {/* Model Limitations & Disclaimers */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>Model Boundary Limitations</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              {prediction.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Regulatory Citation */}
          <div className="rounded-xl border border-white/5 bg-ink-900/60 p-4 flex items-start gap-3 text-xs text-slate-400">
            <FileText className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              StockIQ algorithmic forecasts are provided for educational and decision-support purposes only under SEBI RA regulations. All projections carry probabilistic downside risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
