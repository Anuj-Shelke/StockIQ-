export interface StressScenario {
  id: 'covid-19' | 'gfc-2008' | 'rate-shock-2022' | 'demonetization-2016' | 'taper-tantrum-2013' | 'election-flash-2024' | string
  name: string
  period: string
  description: string
  benchmarkDrawdown: number
  recoveryMonths: number
  portfolioImpact: {
    estimatedDrawdown: number
    valueAtRisk: number
    recoveryMonths: number
    volatilityIndex: number
  }
}

export interface DrawdownDataPoint {
  date: string
  portfolioDrawdown: number
  benchmarkDrawdown: number
}

export interface AssetDrawdownContribution {
  symbol: string
  name: string
  allocationWeight: number
  maxDecline: number
  contributionToDrawdown: number
  status: 'High Vulnerability' | 'Moderate Impact' | 'Resilient Anchor'
}

export interface RiskToleranceProfile {
  statedLevel: 'Conservative' | 'Moderate' | 'Aggressive'
  statedScore: number // 1 - 100
  historicalRealityScore: number // 1 - 100
  historicalRealityLevel: 'Fragile' | 'Moderate' | 'Bulletproof' | 'Fragile (Elevated Exposure)'
  gapDescription: string
}
