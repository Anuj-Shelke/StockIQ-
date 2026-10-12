export interface AnalysisSnapshot {
  id: string
  title: string
  symbol: string
  assetClass: string
  createdAt: string
  currentPrice: number
  targetPrice: number
  projectedReturnPercent: number
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive'
  notes?: string
  scenarioStressed?: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'ALERT' | 'REVIEW_UPDATE' | 'MARKET' | 'SYSTEM'
  timestamp: string
  isRead: boolean
  actionUrl?: string
}
