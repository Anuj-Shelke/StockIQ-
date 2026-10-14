export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'
export type ReviewSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ReviewRequestItem {
  id: string
  userId: string
  userEmail: string
  userName?: string
  symbol: string
  analysisSnapshotId: string
  reason: string
  userNotes: string
  status: ReviewStatus
  severity: ReviewSeverity
  createdAt: string
  updatedAt?: string
  assignedReviewer?: string
  reviewerId?: string
  reviewedAt?: string
  resolutionNotes?: string
  snapshotData?: Record<string, unknown>
}

export interface AdminSystemMetrics {
  totalUsers: number
  totalAnalyses: number
  activeReviewRequests: number
  dataQualityStatus: 'HEALTHY' | 'DEGRADED' | 'OUTAGE'
  nseFeedLatencyMs: number
  ragVectorCoveragePercent: number
}
