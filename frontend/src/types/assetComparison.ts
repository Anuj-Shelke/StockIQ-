export type TimeHorizon = '1Y' | '3Y' | '5Y' | '10Y'

export interface AssetComparisonParams {
  initialInvestment: number
  monthlySip: number
  timeHorizon: TimeHorizon
  fdRateOverride: number
  inflationAdjusted: boolean
}

export interface ComparisonDataPoint {
  period: string
  equity: number
  gold: number
  fixedDeposit: number
}

export interface AssetSummaryMetric {
  assetClass: 'Equities (NIFTY 50)' | 'Physical Gold (24K)' | 'Bank Fixed Deposit'
  color: string
  totalFinalValue: number
  totalReturnPercent: number
  cagr: number
  maxDrawdown: number
  liquidity: string
  taxImplication: string
  riskLevel: 'High' | 'Medium' | 'Low'
}
