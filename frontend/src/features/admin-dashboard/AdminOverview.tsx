import { useState, useEffect } from 'react'
import { Users, FileCheck2, ClipboardList, Activity, ShieldCheck, Database } from 'lucide-react'
import { apiFetch } from '@/services/api'
import { ReviewQueue } from '@/features/review-management/ReviewQueue'
import { ReviewDetailModal } from '@/features/review-management/ReviewDetailModal'
import type { ReviewRequestItem, AdminSystemMetrics, ReviewStatus } from '@/types/adminReview'

const SAMPLE_METRICS: AdminSystemMetrics = {
  totalUsers: 14820,
  totalAnalyses: 89410,
  activeReviewRequests: 14,
  dataQualityStatus: 'HEALTHY',
  nseFeedLatencyMs: 42,
  ragVectorCoveragePercent: 98.4,
}

const SAMPLE_REQUESTS: ReviewRequestItem[] = [
  {
    id: 'REV-1042',
    userId: 'usr-9812',
    userEmail: 'rohit.sharma@example.com',
    symbol: 'RELIANCE.NS',
    analysisSnapshotId: 'snp-8123',
    reason: 'Target price feels inflated given recent petrochemical spread contraction',
    userNotes:
      'The 30-day forecast projects an 8.2% upward surge, but European refining margins fell by 18% last week. Did the model account for this crude delta?',
    status: 'PENDING',
    severity: 'HIGH',
    createdAt: '2026-10-11T14:30:00Z',
    snapshotData: {
      currentPrice: 2980.5,
      predictedTarget: 3225.0,
      modelConfidence: 81,
      timeHorizon: '30-Day',
    },
  },
  {
    id: 'REV-1041',
    userId: 'usr-4412',
    userEmail: 'priya.nair@example.com',
    symbol: 'INFY.NS',
    analysisSnapshotId: 'snp-7731',
    reason: 'Risk Reality Check drawdown seems too optimistic',
    userNotes:
      'During 2022 rate hikes, INFY fell ~26%, yet the simulator displays only an 11% estimated portfolio drawdown.',
    status: 'IN_REVIEW',
    severity: 'MEDIUM',
    createdAt: '2026-10-10T09:15:00Z',
    snapshotData: {
      currentPrice: 1890.1,
      predictedTarget: 1940.0,
      modelConfidence: 89,
      timeHorizon: '60-Day',
    },
  },
  {
    id: 'REV-1039',
    userId: 'usr-2384',
    userEmail: 'vikram.mehta@example.com',
    symbol: 'TCS.NS',
    analysisSnapshotId: 'snp-6519',
    reason: 'SHAP factor interpretation query',
    userNotes:
      'The model states USD/INR is positive push, but client payments in USD depreciated this quarter.',
    status: 'RESOLVED',
    severity: 'LOW',
    createdAt: '2026-10-08T11:20:00Z',
    resolutionNotes: 'Verified currency hedging contracts in financial statement notes.',
    snapshotData: {
      currentPrice: 4120.25,
      predictedTarget: 4345.5,
      modelConfidence: 86,
      timeHorizon: '30-Day',
    },
  },
]

export function AdminOverview() {
  const [metrics, setMetrics] = useState<AdminSystemMetrics>(SAMPLE_METRICS)
  const [requests, setRequests] = useState<ReviewRequestItem[]>(SAMPLE_REQUESTS)
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequestItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const liveItems = await apiFetch<Array<{
          id: string
          user_id?: string
          user_email: string
          symbol: string
          analysis_snapshot_id?: string
          reason: string
          user_notes: string
          status: ReviewStatus
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          created_at: string
          assigned_reviewer?: string
          resolution_notes?: string
          snapshot_data?: Record<string, unknown>
        }>>('/admin/reviews')

        if (Array.isArray(liveItems) && liveItems.length > 0) {
          const mapped: ReviewRequestItem[] = liveItems.map((r) => ({
            id: r.id,
            userId: r.user_id || 'usr-anon',
            userEmail: r.user_email,
            symbol: r.symbol,
            analysisSnapshotId: r.analysis_snapshot_id || '',
            reason: r.reason,
            userNotes: r.user_notes,
            status: r.status,
            severity: r.severity,
            createdAt: r.created_at,
            assignedReviewer: r.assigned_reviewer,
            resolutionNotes: r.resolution_notes,
            snapshotData: r.snapshot_data
              ? {
                  currentPrice: Number(r.snapshot_data.currentPrice ?? 2500),
                  predictedTarget: Number(r.snapshot_data.predictedTarget ?? 2650),
                  modelConfidence: Number(r.snapshot_data.modelConfidence ?? 82),
                  timeHorizon: String(r.snapshot_data.timeHorizon ?? '30-Day'),
                }
              : undefined,
          }))
          setRequests(mapped)
        }
      } catch (err) {
        console.warn('Could not load live admin reviews from backend, using baseline queue:', err)
      }

      try {
        const liveMetrics = await apiFetch<{
          total_users?: number
          total_analyses?: number
          active_review_requests?: number
          data_quality_status?: 'HEALTHY' | 'DEGRADED' | 'OUTAGE'
          nse_feed_latency_ms?: number
          rag_vector_coverage_percent?: number
        }>('/admin/dashboard/metrics')

        if (liveMetrics) {
          setMetrics({
            totalUsers: liveMetrics.total_users ?? SAMPLE_METRICS.totalUsers,
            totalAnalyses: liveMetrics.total_analyses ?? SAMPLE_METRICS.totalAnalyses,
            activeReviewRequests: liveMetrics.active_review_requests ?? SAMPLE_METRICS.activeReviewRequests,
            dataQualityStatus: liveMetrics.data_quality_status ?? SAMPLE_METRICS.dataQualityStatus,
            nseFeedLatencyMs: liveMetrics.nse_feed_latency_ms ?? SAMPLE_METRICS.nseFeedLatencyMs,
            ragVectorCoveragePercent: liveMetrics.rag_vector_coverage_percent ?? SAMPLE_METRICS.ragVectorCoveragePercent,
          })
        }
      } catch {
        // keep baseline metrics
      }
    }

    void fetchAdminData()
    // Live auto-polling every 3.5 seconds for instant real-time sync with user submissions
    const interval = setInterval(fetchAdminData, 3500)
    return () => clearInterval(interval)
  }, [])

  const handleAuditRequest = (item: ReviewRequestItem) => {
    setSelectedRequest(item)
    setIsModalOpen(true)
  }

  const handleUpdateStatus = async (id: string, newStatus: ReviewStatus, notes: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              resolutionNotes: notes,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    )

    try {
      await apiFetch(`/admin/reviews/${id}`, {
        method: 'PATCH',
        body: { status: newStatus, resolution_notes: notes },
      })
    } catch (err) {
      console.warn('Backend update error, optimistic status retained:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Admin Governance & Operational Portal
          </h1>
          <p className="text-sm text-slate-400">
            System health indicators, real-time data feeds, and compliance review request queue for authorised auditors.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-mono font-medium text-gold-300">
          <ShieldCheck className="h-4 w-4" />
          <span>Role: Compliance Administrator</span>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Total Registered</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {metrics.totalUsers.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Active investor accounts</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Analyses Computed</span>
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {metrics.totalAnalyses.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">ML price & stress forecasts</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Active Reviews</span>
            <ClipboardList className="h-4 w-4 text-gold-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-gold-400">
            {requests.filter((r) => r.status === 'PENDING' || r.status === 'IN_REVIEW').length}
          </div>
          <div className="mt-1 text-xs text-slate-400">Awaiting auditor sign-off</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Data Quality</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-lg font-bold font-mono text-white">{metrics.dataQualityStatus}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>NSE: {metrics.nseFeedLatencyMs}ms</span>
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3 text-gold-400" /> {metrics.ragVectorCoveragePercent}% RAG
            </span>
          </div>
        </div>
      </div>

      {/* Review Queue Management Table */}
      <ReviewQueue items={requests} onSelectRequest={handleAuditRequest} />

      {/* Review Detail Modal */}
      <ReviewDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedRequest(null)
        }}
        request={selectedRequest}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  )
}
export default AdminOverview
