export interface ShapFactor {
  name: string
  category: 'Macro' | 'Fundamental' | 'Technical' | 'Sentiment'
  impactValue: number // positive or negative attribution value in ₹
  percentageContribution: number
  description: string
  direction: 'positive' | 'negative'
}

export interface PredictionDetail {
  symbol: string
  name: string
  currentPrice: number
  targetPrice: number
  forecastHorizon: string
  confidenceScore: number // e.g. 84%
  lowerBound: number
  upperBound: number
  baseValue: number
  predictedChange: number
  predictedChangePercent: number
  modelArchitecture: string
  historicalDataWindow: string
  featuresConsidered: number
  limitations: string[]
}
