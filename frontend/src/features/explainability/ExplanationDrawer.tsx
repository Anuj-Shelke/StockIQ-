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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative h-full w-full max-w-xl border-l border-theme-default bg-surface p-6 shadow-2xl overflow-y-auto text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-text-primary">
                Model Reasoning & Architecture
              </span>
              <span className="badge-gold font-mono">
                {prediction.symbol}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Transparent mathematical architecture & input feature constraints
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm">
          {/* Model Formula & Architecture */}
          <div className="card-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Cpu className="h-4 w-4 text-blue" />
              <span>Model Architecture & Objective Function</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Trained using <strong className="text-text-primary">{prediction.modelArchitecture}</strong> with Huber Loss objective for robustness against outliers:
            </p>
            <div className="rounded-lg bg-canvas p-3 font-mono text-xs text-gold border border-theme-subtle overflow-x-auto">
              ŷ = BaseValue + ∑ᵢ SHAP_Value(Featureᵢ) + ε
            </div>
            <p className="text-[11px] text-text-muted">
              Each input feature is evaluated through Shapley additive value equations grounded in cooperative game theory.
            </p>
          </div>

          {/* Training Window & Features */}
          <div className="card-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Database className="h-4 w-4 text-gain" />
              <span>Historical Training Window</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-surface-elevated border border-theme-subtle p-2.5">
                <span className="text-text-muted text-[10px] uppercase font-mono">Data Range</span>
                <p className="font-mono text-text-primary mt-0.5 font-medium">{prediction.historicalDataWindow}</p>
              </div>
              <div className="rounded-lg bg-surface-elevated border border-theme-subtle p-2.5">
                <span className="text-text-muted text-[10px] uppercase font-mono">Features Examined</span>
                <p className="font-mono text-text-primary mt-0.5 font-medium">{prediction.featuresConsidered} Signals</p>
              </div>
            </div>
            <p className="text-xs text-text-muted pt-1 leading-relaxed">
              Includes 200-day EMA, RSI-14, MACD histograms, Crude Oil (Brent) prices, USD/INR exchange rate, and quarterly earnings delta.
            </p>
          </div>

          {/* Model Limitations & Disclaimers */}
          <div className="card-surface p-4 space-y-2 border-l-2 border-l-gold">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <AlertCircle className="h-4 w-4 text-gold" />
              <span>Model Boundary Limitations</span>
            </div>
            <ul className="space-y-1.5 text-xs text-text-muted list-disc list-inside">
              {prediction.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Regulatory Citation */}
          <div className="rounded-xl border border-theme-subtle bg-surface-elevated/50 p-4 flex items-start gap-3 text-xs text-text-muted">
            <FileText className="h-4 w-4 text-text-secondary mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              StockIQ algorithmic forecasts are provided for educational and decision-support purposes only under SEBI RA regulations. All projections carry probabilistic downside risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
