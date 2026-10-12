import { useState } from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { ShapWaterfallChart } from './ShapWaterfallChart'
import { PredictionCard } from './PredictionCard'
import { ExplanationDrawer } from './ExplanationDrawer'
import type { ShapFactor, PredictionDetail } from '@/types/explainability'

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
  const [prediction] = useState<PredictionDetail>(SAMPLE_PREDICTION)
  const [factors] = useState<ShapFactor[]>(SAMPLE_SHAP_FACTORS)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDisputeSubmitted, setIsDisputeSubmitted] = useState(false)

  const handleReportIssue = () => {
    setIsDisputeSubmitted(true)
    setTimeout(() => setIsDisputeSubmitted(false), 5000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Explainable AI & Prediction Attribution
          </h1>
          <p className="text-sm text-slate-400">
            Unpacking the algorithmic reasoning behind ML price forecasts with game-theoretic SHAP feature decomposition.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 rounded-lg">
          <Sparkles className="h-4 w-4" />
          <span>SHAP TreeExplainer Active</span>
        </div>
      </div>

      {/* Dispute Alert Confirmation */}
      {isDisputeSubmitted && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>
            Issue reported successfully. A review request has been logged to the <strong>Admin Review Portal</strong> for audit.
          </span>
        </div>
      )}

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
