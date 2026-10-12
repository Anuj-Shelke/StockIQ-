import { useState } from 'react'
import { X, Send, UserCheck } from 'lucide-react'
import type { ReviewRequestItem, ReviewStatus } from '@/types/adminReview'

interface ReviewDetailModalProps {
  isOpen: boolean
  onClose: () => void
  request: ReviewRequestItem | null
  onUpdateStatus: (id: string, newStatus: ReviewStatus, notes: string) => void
}

export function ReviewDetailModal({
  isOpen,
  onClose,
  request,
  onUpdateStatus,
}: ReviewDetailModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [targetStatus, setTargetStatus] = useState<ReviewStatus>('RESOLVED')

  if (!isOpen || !request) return null

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateStatus(request.id, targetStatus, resolutionNotes)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-display">
                Review Request Audit
              </h2>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-mono text-slate-300">
                #{request.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Initiated by {request.userEmail} on {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          {/* User Dispute Notes */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200">Dispute Rationale</span>
              <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 font-mono text-rose-300">
                {request.reason}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
              "{request.userNotes}"
            </p>
          </div>

          {/* Original Analysis Snapshot */}
          {request.snapshotData && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <span className="font-semibold text-slate-200 block mb-2">
                Original Analysis Snapshot ({request.symbol})
              </span>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="rounded bg-white/5 p-2.5">
                  <span className="text-slate-400 text-[10px] uppercase">Spot Price</span>
                  <div className="font-mono font-bold text-white mt-1">
                    ₹{request.snapshotData.currentPrice}
                  </div>
                </div>
                <div className="rounded bg-white/5 p-2.5">
                  <span className="text-slate-400 text-[10px] uppercase">Predicted Target</span>
                  <div className="font-mono font-bold text-gold-400 mt-1">
                    ₹{request.snapshotData.predictedTarget}
                  </div>
                </div>
                <div className="rounded bg-white/5 p-2.5">
                  <span className="text-slate-400 text-[10px] uppercase">Confidence</span>
                  <div className="font-mono font-bold text-emerald-400 mt-1">
                    {request.snapshotData.modelConfidence}%
                  </div>
                </div>
                <div className="rounded bg-white/5 p-2.5">
                  <span className="text-slate-400 text-[10px] uppercase">Horizon</span>
                  <div className="font-mono font-bold text-slate-200 mt-1">
                    {request.snapshotData.timeHorizon}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviewer Action Form */}
          <form onSubmit={handleResolve} className="space-y-4 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Resolution Decision
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as ReviewStatus)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white text-xs focus:border-gold-500 focus:outline-none"
                >
                  <option value="RESOLVED" className="bg-ink-900">Mark as Resolved (Model Updated)</option>
                  <option value="IN_REVIEW" className="bg-ink-900">Keep Under Investigation</option>
                  <option value="REJECTED" className="bg-ink-900">Dismiss Dispute (Working as Expected)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assign Authorised Auditor
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  <span>SEBI Compliance Officer #829</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Auditor Findings & Feedback (Communicated to User)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain the review outcome, model retrain schedule, or mathematical validation..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white text-xs placeholder-slate-500 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-slate-300 hover:bg-white/5"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-5 py-2 font-semibold text-ink-950 hover:bg-gold-400 transition"
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
