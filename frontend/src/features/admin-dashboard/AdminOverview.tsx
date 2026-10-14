import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Users } from 'lucide-react'
import { ApiError, apiFetch } from '@/services/api'
import { ReviewQueue } from '@/features/review-management/ReviewQueue'
import { ReviewDetailModal } from '@/features/review-management/ReviewDetailModal'
import type { ReviewRequestItem, ReviewStatus } from '@/types/adminReview'

interface ReviewRow {
  id: string; user_id: string; user_name?: string | null; user_email: string; symbol: string
  analysis_snapshot_id?: string | null; reason: string; user_notes: string; status: ReviewStatus
  severity: ReviewRequestItem['severity']; created_at: string; updated_at?: string | null
  assigned_reviewer?: string | null; reviewer_id?: string | null; reviewed_at?: string | null
  resolution_notes?: string | null; snapshot_data?: Record<string, unknown> | null
}
interface AdminUsersResponse { total: number }

function mapReview(row: ReviewRow): ReviewRequestItem {
  return {
    id: row.id, userId: row.user_id, userName: row.user_name ?? undefined, userEmail: row.user_email,
    symbol: row.symbol, analysisSnapshotId: row.analysis_snapshot_id ?? '', reason: row.reason,
    userNotes: row.user_notes, status: row.status, severity: row.severity, createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined, assignedReviewer: row.assigned_reviewer ?? undefined,
    reviewerId: row.reviewer_id ?? undefined, reviewedAt: row.reviewed_at ?? undefined,
    resolutionNotes: row.resolution_notes ?? undefined, snapshotData: row.snapshot_data ?? undefined,
  }
}

export function AdminOverview() {
  const [requests, setRequests] = useState<ReviewRequestItem[]>([])
  const [userCount, setUserCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequestItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const rows = await apiFetch<ReviewRow[]>('/admin/reviews')
      setRequests(rows.map(mapReview))
      setError(null)
    } catch (err) {
      setRequests([])
      setError(err instanceof ApiError ? err.message : 'Could not load the review queue.')
    }
    try {
      const users = await apiFetch<AdminUsersResponse>('/admin/users?limit=1&offset=0')
      setUserCount(users.total)
    } catch { setUserCount(null) }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => { void load() }, 10000)
    return () => window.clearInterval(interval)
  }, [load])

  const openReview = (item: ReviewRequestItem) => { setSelectedRequest(item); setIsModalOpen(true) }
  const updateStatus = async (id: string, status: ReviewStatus, notes: string) => {
    const row = await apiFetch<ReviewRow>(`/admin/reviews/${id}`, {
      method: 'PATCH', body: { status, resolution_notes: notes },
    })
    const updated = mapReview(row)
    setRequests((current) => current.map((item) => item.id === id ? updated : item))
    setSelectedRequest(updated)
  }

  return (
    <div className="space-y-6">
      <header><h1 className="font-display text-2xl font-bold text-text-primary">Human Review Queue</h1><p className="mt-1 text-sm text-text-muted">Review requests and provide clarification or expert oversight.</p></header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card-surface p-5"><div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted"><Users className="h-4 w-4 text-gold" />Registered users</div><p className="mt-2 font-mono text-2xl text-text-primary">{userCount ?? '—'}</p></div>
        <div className="card-surface p-5"><div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted"><ClipboardList className="h-4 w-4 text-gold" />Active reviews</div><p className="mt-2 font-mono text-2xl text-text-primary">{requests.filter((item) => item.status === 'PENDING' || item.status === 'IN_REVIEW').length}</p></div>
      </div>
      {error && <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p>}
      <ReviewQueue items={requests} onSelectRequest={openReview} />
      <ReviewDetailModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedRequest(null) }} request={selectedRequest} onUpdateStatus={updateStatus} />
    </div>
  )
}

export default AdminOverview
