import { useState } from 'react'
import { X, Send, UserCheck } from 'lucide-react'
import type { ReviewRequestItem, ReviewStatus } from '@/types/adminReview'

interface ReviewDetailModalProps {
  isOpen: boolean
  onClose: () => void
  request: ReviewRequestItem | null
  onUpdateStatus: (id: string, newStatus: ReviewStatus, notes: string) => Promise<void>
}

export function ReviewDetailModal({
  isOpen,
  onClose,
  request,
  onUpdateStatus,
}: ReviewDetailModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [targetStatus, setTargetStatus] = useState<ReviewStatus>('RESOLVED')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!isOpen || !request) return null

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try { await onUpdateStatus(request.id, targetStatus, resolutionNotes); onClose() }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update this review request.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-theme-default bg-surface p-6 shadow-2xl text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary font-display">
                Review Request Audit
              </h2>
              <span className="badge-gold font-mono">
                #{request.id}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 font-mono">
              Initiated by {request.userEmail} on {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          {/* User Dispute Notes */}
          <div className="card-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text-primary uppercase tracking-wider font-mono">Dispute Rationale</span>
              <span className="rounded bg-loss/10 border border-loss/30 px-2 py-0.5 font-mono text-loss">
                {request.reason}
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed bg-canvas p-3 rounded-lg border border-theme-subtle font-mono text-[11px]">
              "{request.userNotes}"
            </p>
          </div>

          {/* Original Analysis Snapshot */}
          {request.snapshotData && (
            <div className="card-surface p-4">
              <span className="font-semibold text-text-primary block mb-2 uppercase tracking-wider font-mono">
                Original Analysis Snapshot ({request.symbol})
              </span>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-theme-subtle bg-canvas p-3 font-mono text-[11px] text-text-secondary">{JSON.stringify(request.snapshotData, null, 2)}</pre>
            </div>
          )}

          {/* Reviewer Action Form */}
          <form onSubmit={handleResolve} className="space-y-4 pt-2 border-t border-theme-subtle">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-secondary font-semibold font-mono uppercase tracking-wider mb-1">
                  Resolution Decision
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as ReviewStatus)}
                  className="input-default font-mono text-xs"
                >
                  <option value="RESOLVED" className="bg-surface text-text-primary">Completed</option>
                  <option value="IN_REVIEW" className="bg-surface text-text-primary">In Review</option>
                  <option value="REJECTED" className="bg-surface text-text-primary">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-semibold font-mono uppercase tracking-wider mb-1">
                  Reviewer
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-theme-subtle bg-surface-elevated px-3 py-2 text-text-secondary">
                  <UserCheck className="h-4 w-4 text-gain" />
                  <span className="font-mono text-xs">Your administrator account</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-text-secondary font-semibold font-mono uppercase tracking-wider mb-1">
                Review response (visible to the user)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Add clarification or expert-review notes for the user..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="input-default text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {error && <p role="alert" className="mr-auto text-xs text-loss">{error}</p>}
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                type="submit"
                className="btn-gold flex items-center gap-1.5"
                disabled={saving}
              >
                <Send className="h-3.5 w-3.5" />
                Submit Resolution
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
