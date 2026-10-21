import React from 'react'
import {
  Sparkles,
  Shield,
  Layers,
  Settings,
  Brain,
} from 'lucide-react'
import type { ExplainabilityInsight } from '../../types/investmentPlanner'

interface ExplainabilityDrawerProps {
  insights: ExplainabilityInsight[]
}

export const ExplainabilityDrawer: React.FC<ExplainabilityDrawerProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'suitability':
      case 'rule_based':
        return <Shield className="h-4 w-4 text-emerald-400" />
      case 'optimization':
      case 'allocation':
        return <Layers className="h-4 w-4 text-sky-400" />
      case 'ml_stock_selection':
        return <Brain className="h-4 w-4 text-indigo-400" />
      default:
        return <Settings className="h-4 w-4 text-purple-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Transparent AI Recommendation Architecture</h3>
                <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-2xs font-semibold text-purple-300">
                  White-Box AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audit trail separating deterministic rules, modern portfolio theory, ML signals, and personal preferences
              </p>
            </div>
          </div>
        </div>

        {/* 4 Pillars Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Shield className="h-4 w-4" />
              <span>1. Rule-Based Core</span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Enforces emergency fund liquidity, DTI caps, and mandatory capital protection guidelines.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Layers className="h-4 w-4" />
              <span>2. Risk Optimization</span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Balances cross-asset covariance matrix to maximize Sharpe ratio and constrain drawdown.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Brain className="h-4 w-4" />
              <span>3. ML & SHAP Signals</span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Filters Nifty stocks with high machine learning forecast confidence and positive SHAP attributions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Settings className="h-4 w-4" />
              <span>4. User Preference Bias</span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Honors targeted investment horizons, risk comfort, and preferred asset exclusions.
            </p>
          </div>
        </div>

        {/* Detailed Insights List */}
        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Decision Attribution Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(ins.category)}
                    <span className="font-semibold text-slate-200 text-xs">{ins.driver}</span>
                  </div>
                  <span className="rounded bg-slate-900 px-2 py-0.5 text-2xs text-slate-400 border border-slate-800">
                    {ins.asset_class}
                  </span>
                </div>
                <p className="text-2xs text-slate-400 leading-relaxed">
                  {ins.explanation}
                </p>

                {ins.shap_features_referenced && ins.shap_features_referenced.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ins.shap_features_referenced.map((feat, fidx) => (
                      <span
                        key={fidx}
                        className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-2xs text-indigo-300 font-mono"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
