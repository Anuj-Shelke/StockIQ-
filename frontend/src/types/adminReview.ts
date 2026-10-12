export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'
export type ReviewSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ReviewRequestItem {
  id: string
  userId: string
  userEmail: string
  symbol: string
  analysisSnapshotId: string
  reason: string
  userNotes: string
  status: ReviewStatus
  severity: ReviewSeverity
  createdAt: string
  updatedAt?: string
  assignedReviewer?: string
  resolutionNotes?: string
  snapshotData?: {
    currentPrice: number
    predictedTarget: number
    modelConfidence: number
    timeHorizon: string
  }
}

export interface AdminSystemMetrics {
  totalUsers: number
  totalAnalyses: number
  activeReviewRequests: number
  dataQualityStatus: 'HEALTHY' | 'DEGRADED' | 'OUTAGE'
  nseFeedLatencyMs: number
  ragVectorCoveragePercent: number
}
