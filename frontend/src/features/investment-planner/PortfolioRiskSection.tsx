import React, { useState } from 'react'
import {
  ShieldAlert,
  Activity,
  Award,
  TrendingDown,
  Percent,
  Layers,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'
import type { PortfolioRiskAnalysis, SuitabilityAssessment } from '../../types/investmentPlanner'

interface PortfolioRiskSectionProps {
  risk: PortfolioRiskAnalysis
  suitability?: SuitabilityAssessment
}

export const PortfolioRiskSection: React.FC<PortfolioRiskSectionProps> = ({ risk }) => {
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null)

  const toggleExplanation = (key: string) => {
    setExpandedExplanation(prev => (prev === key ? null : key))
  }

  const getSharpeQuality = (sr: number) => {
    if (sr >= 1.5) return { text: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
    if (sr >= 1.0) return { text: 'Good', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' }
    if (sr >= 0.5) return { text: 'Acceptable', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
    return { text: 'Sub-optimal', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
  }

  const getHHIQuality = (hhi: number) => {
    if (hhi < 0.25) return { text: 'Well Diversified', color: 'text-emerald-400' }
    if (hhi < 0.45) return { text: 'Moderate Concentration', color: 'text-amber-400' }
    return { text: 'High Concentration', color: 'text-rose-400' }
  }

  const sharpeInfo = getSharpeQuality(risk.sharpe_ratio)
  const hhiInfo = getHHIQuality(risk.asset_concentration_hhi)

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Cross-Asset Portfolio Risk & Volatility Analytics</h3>
              <p className="text-xs text-slate-400">
                Institutional covariance matrix modeling, Value-at-Risk (95%), and Sharpe risk-adjusted returns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Liquidity Exposure:</span>
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-xs font-semibold text-sky-400">
              {risk.liquidity_exposure_score}
            </span>
          </div>
        </div>

        {/* 4 Core Risk Metrics Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sharpe Ratio */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Award className="h-4 w-4 text-emerald-400" />
                Sharpe Ratio (Rf = 6.5%)
              </span>
              <button
                type="button"
                onClick={() => toggleExplanation('sharpe_ratio')}
                className="text-slate-500 hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-100">
                {risk.sharpe_ratio.toFixed(2)}
              </span>
              <span className={`rounded-md border px-2 py-0.5 text-2xs font-semibold ${sharpeInfo.color}`}>
                {sharpeInfo.text}
              </span>
            </div>
            <p className="mt-1 text-2xs text-slate-400">Excess return per unit of annualized total portfolio risk</p>
          </div>

          {/* Annualized Volatility */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="h-4 w-4 text-cyan-400" />
                Annualized Volatility (σ)
              </span>
              <button
                type="button"
                onClick={() => toggleExplanation('annualized_volatility')}
                className="text-slate-500 hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-cyan-400">
              {risk.annualized_volatility_pct.toFixed(2)}%
            </div>
            <p className="mt-1 text-2xs text-slate-400">Standard deviation derived from 4-asset cross covariance</p>
          </div>

          {/* 95% Value at Risk (VaR) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingDown className="h-4 w-4 text-rose-400" />
                1-Year VaR (95% Conf.)
              </span>
              <button
                type="button"
                onClick={() => toggleExplanation('var_95')}
                className="text-slate-500 hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-rose-400">
              -{risk.value_at_risk_95_pct.toFixed(2)}%
            </div>
            <p className="mt-1 text-2xs text-slate-400">Statistical maximum expected 1-yr drawdown at 95% confidence</p>
          </div>

          {/* Maximum Drawdown */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Percent className="h-4 w-4 text-amber-400" />
                Max Expected Drawdown
              </span>
              <button
                type="button"
                onClick={() => toggleExplanation('maximum_drawdown')}
                className="text-slate-500 hover:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-amber-400">
              -{risk.maximum_drawdown_pct.toFixed(2)}%
            </div>
            <p className="mt-1 text-2xs text-slate-400">Stress-tested peak-to-trough drop under historical crises</p>
          </div>
        </div>

        {/* Inline Explanation Drawer if an icon was clicked */}
        {expandedExplanation && risk.risk_metrics_explanation && (
          <div className="mt-4 rounded-xl border border-blue/30 bg-blue-soft p-4 text-xs text-text-secondary">
            <div className="flex items-center justify-between font-semibold text-text-primary">
              <span>Formula & Financial Interpretation</span>
              <button onClick={() => setExpandedExplanation(null)} className="hover:text-text-primary">✕</button>
            </div>
            <p className="mt-1.5 leading-relaxed text-text-secondary">
              {risk.risk_metrics_explanation[expandedExplanation] ||
                risk.risk_metrics_explanation.sharpe_ratio ||
                'Calculated via institutional quantitative risk modeling.'}
            </p>
          </div>
        )}
      </div>

      {/* Concentration & Exposure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concentration HHI Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h4 className="font-semibold text-slate-200 text-sm">Asset Concentration (Herfindahl Index)</h4>
            </div>
            <span className={`text-xs font-semibold ${hhiInfo.color}`}>
              {hhiInfo.text}
            </span>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>HHI Score: {(risk.asset_concentration_hhi * 10000).toFixed(0)} / 10,000 ({risk.asset_concentration_hhi.toFixed(3)})</span>
                <span>Target: &lt; 3,500</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    risk.asset_concentration_hhi < 0.35 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, risk.asset_concentration_hhi * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An HHI below 0.35 indicates low concentration risk, ensuring no single asset class dominates portfolio volatility.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Inflation Sensitivity Risk:</span>
              <span className="font-medium text-amber-400">{risk.inflation_risk_rating}</span>
            </div>
          </div>
        </div>

        {/* Sector Concentration */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-cyan-400" />
              <h4 className="font-semibold text-slate-200 text-sm">Equity Sector Concentration</h4>
            </div>
            <span className="text-2xs text-slate-400">Max Single-Sector Cap: 30%</span>
          </div>

          <div className="mt-5 space-y-3">
            {risk.sector_concentration && Object.keys(risk.sector_concentration).length > 0 ? (
              Object.entries(risk.sector_concentration).map(([sector, pct]) => (
                <div key={sector}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">{sector}</span>
                    <span className="font-semibold text-slate-200">{(pct * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, pct * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No equities allocated; zero equity sector concentration.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historical vs Predictive Disclaimer */}
      {risk.historical_vs_predictive_note && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3 text-xs text-amber-200/90">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-amber-300">Predictive vs Historical Notice: </span>
            {risk.historical_vs_predictive_note}
          </p>
        </div>
      )}
    </div>
  )
}
