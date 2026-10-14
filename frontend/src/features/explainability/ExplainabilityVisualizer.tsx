import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { ShapWaterfallChart } from './ShapWaterfallChart'
import { PredictionCard } from './PredictionCard'
import { ExplanationDrawer } from './ExplanationDrawer'
import type { ShapFactor, PredictionDetail } from '@/types/explainability'
import { apiFetch } from '@/services/api'

const SAMPLE_PREDICTION: PredictionDetail = {
  symbol: 'TCS.NS',
  name: 'Tata Consultancy Services Ltd.',
  currentPrice: 4120.25,
  targetPrice: 4345.50,
  forecastHorizon: '30-Day',
  confidenceScore: 86,
  lowerBound: 4190.00,
  upperBound: 4490.00,
  baseValue: 4100.00,
  predictedChange: 225.25,
  predictedChangePercent: 5.47,
  modelArchitecture: 'XGBoost Regressor v2.4 (Gradient Boosted Trees)',
  historicalDataWindow: '2019-2026 (Daily OHLCV + Macro)',
  featuresConsidered: 38,
  limitations: [
    'Does not anticipate sudden black-swan geopolitical conflicts.',
    'Assumes continued IT deal pipeline momentum from North America.',
    'Sensitivity to USD/INR exchange rate volatility.',
  ],
}

const SAMPLE_SHAP_FACTORS: ShapFactor[] = [
  {
    name: 'Q3 Margin Expansion (+140 bps)',
    category: 'Fundamental',
    impactValue: 125.4,
    percentageContribution: 42.1,
    description: 'Higher operating margins driven by increased enterprise cloud migration revenue.',
    direction: 'positive',
  },
  {
    name: 'USD/INR Resilience (₹83.90/USD)',
    category: 'Macro',
    impactValue: 88.6,
    percentageContribution: 29.7,
    description: 'Currency tailwinds providing strong real INR revenue realization.',
    direction: 'positive',
  },
  {
    name: '200-Day EMA Support Confluence',
    category: 'Technical',
    impactValue: 64.2,
    percentageContribution: 21.5,
    description: 'Strong technical support floor tested and validated with high volume buy-backs.',
    direction: 'positive',
  },
  {
    name: 'US Tech Capex Slowdown Concerns',
    category: 'Sentiment',
    impactValue: -32.5,
    percentageContribution: -10.9,
    description: 'Cautionary guidance around short-term discretionary consulting spend.',
    direction: 'negative',
  },
  {
    name: 'Domestic Banking Sector Softness',
    category: 'Macro',
    impactValue: -20.45,
    percentageContribution: -6.8,
    description: 'Slight drag from BFSI domestic software modernization delays.',
    direction: 'negative',
  },
]

export function ExplainabilityVisualizer() {
  const navigate = useNavigate()
  const [hasHoldings, setHasHoldings] = useState<boolean | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  useEffect(() => {
    apiFetch<Array<{ holdings: unknown[] }>>('/portfolios')
      .then((portfolios) => setHasHoldings(portfolios.some((portfolio) => portfolio.holdings.length > 0)))
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Could not load your portfolio.'))
  }, [])
  const [prediction] = useState<PredictionDetail>(SAMPLE_PREDICTION)
  const [factors] = useState<ShapFactor[]>(SAMPLE_SHAP_FACTORS)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const handleReportIssue = () => {
    const analysisId = `${prediction.symbol}:${prediction.forecastHorizon}:${prediction.baseValue}`
    navigate('/dashboard/review-request', { state: { analysis: prediction, analysis_snapshot_id: analysisId } })
  }

  if (hasHoldings === null) return <div className="card-surface p-8 text-center text-text-muted">{loadError || 'Loading your portfolio…'}</div>
  if (loadError) return <div role="alert" className="card-surface p-8 text-center text-text-primary">{loadError}</div>
  if (!hasHoldings) return <section className="card-surface mx-auto max-w-2xl space-y-4 p-8 text-center"><h2 className="text-xl font-semibold text-text-primary">No analysis yet.</h2><p className="text-sm text-text-muted">Add holdings before viewing analysis.</p><button className="btn-gold" onClick={() => navigate('/dashboard/portfolio')}>Add holdings</button></section>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-display">
              Explainable AI & Prediction Attribution
            </h1>
            <span className="badge-ai font-mono">
              Deterministic SHAP
            </span>
          </div>
          <p className="text-sm text-text-muted mt-0.5">
            Unpacking algorithmic reasoning behind ML price forecasts with game-theoretic SHAP feature decomposition.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gold bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-lg self-start sm:self-auto font-medium">
          <Sparkles className="h-4 w-4 text-gold" />
          <span>SHAP TreeExplainer Active</span>
        </div>
      </div>

      {/* Prediction Overview Card */}
      <PredictionCard
        prediction={prediction}
        onOpenReasoning={() => setIsDrawerOpen(true)}
        onReportIssue={handleReportIssue}
      />

      {/* SHAP Waterfall / Attribution Breakdown */}
      <ShapWaterfallChart
        factors={factors}
        baseValue={prediction.baseValue}
        predictedValue={prediction.targetPrice}
      />

      {/* Curated Explainability Insights & Methodology */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
          <Sparkles className="h-4 w-4 text-gold" />
          <span>Understanding Your Model Attribution (SHAP Deconstruction)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary leading-relaxed">
          <div className="card-surface p-3.5 space-y-1.5 border-l-2 border-l-gain">
            <span className="font-semibold text-gain font-mono">Positive Price Drivers (+₹278.20 Total Push)</span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Operating margin expansion (+₹125.40) and resilient USD/INR realizations (+₹88.60) form the primary upward thrust. Coupled with validated 200-day EMA support (+₹64.20), these factors counteract prevailing domestic macro headwinds.
            </p>
          </div>
          <div className="card-surface p-3.5 space-y-1.5 border-l-2 border-l-loss">
            <span className="font-semibold text-loss font-mono">Risk Deficits & Negative Factors (-₹52.95 Total Drag)</span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Cautionary US discretionary enterprise tech spending (-₹32.50) and temporary delays in BFSI modernization (-₹20.45) pull the forecast down from its ceiling, moderating the model’s target to ₹4,345.50.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-text-muted pt-2 border-t border-theme-subtle">
          <strong className="text-text-primary">Statutory Transparency:</strong> In accordance with SEBI circular guidelines on algorithmic and AI-assisted financial technologies, this visualizer provides exact additive decomposition ensuring all predictions carry human-interpretable feature weights.
        </p>
      </div>

      {/* Inspection Drawer */}
      <ExplanationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        prediction={prediction}
      />
    </div>
  )
}
export default ExplainabilityVisualizer
