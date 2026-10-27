import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, apiFetch } from '@/services/api'
import type { ReviewStatus, ReviewSeverity } from '@/types/adminReview'
import { ShieldCheck, Plus, X, RefreshCw } from 'lucide-react'

interface MyReview {
  id: string
  symbol: string
  analysis_snapshot_id?: string | null
  reason: string
  user_notes: string
  status: ReviewStatus
  severity: ReviewSeverity
  created_at: string
  resolution_notes?: string | null
  reviewed_at?: string | null
}

const label = (status: ReviewStatus) =>
  status === 'RESOLVED'
    ? 'Completed'
    : status === 'REJECTED'
      ? 'Declined'
      : status === 'IN_REVIEW'
        ? 'In Review'
        : 'Pending'

export function MyReviews() {
  const [items, setItems] = useState<MyReview[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [symbol, setSymbol] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await apiFetch<MyReview[]>('/review-requests'))
      setError(null)
    } catch (err) {
      setItems([])
      setError(err instanceof ApiError ? err.message : 'Could not load your review requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreateReview(e: FormEvent) {
    e.preventDefault()
    if (!symbol.trim() || !reason.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch('/review-requests', {
        method: 'POST',
        body: {
          symbol: symbol.trim().toUpperCase(),
          reason: reason.trim(),
          user_notes: notes.trim() || 'Direct request from My Reviews',
          severity: 'MEDIUM',
        },
      })
      setSymbol('')
      setReason('')
      setNotes('')
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit review request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">My Reviews</h1>
          <p className="mt-1 text-sm text-text-muted">Track expert review requests and verified human responses.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Raise Human Verification</span>
        </button>
      </header>

      {/* Modal Popup to Raise Human Verification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="card-surface w-full max-w-lg border-gold/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-theme-subtle pb-3">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <span>Raise Human Verification Request</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Stock / Asset Symbol
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RELIANCE.NS, TCS.NS, INFY.NS"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="input-default font-mono uppercase"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  What would you like verified?
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify price target vs high PE valuation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-default"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Additional Details &amp; Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any specific context or question for the analyst..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-default"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-theme-subtle">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold px-5 py-2 text-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Loading review requests...</p>
      ) : items.length === 0 ? (
        <div className="card-surface p-8 text-center space-y-3">
          <p className="text-base font-semibold text-text-primary">No human review requests yet.</p>
          <p className="text-xs text-text-muted">Click the button above to submit an asset or AI prediction for certified human audit.</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gold inline-flex items-center gap-2 text-xs px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>Raise Your First Verification</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="card-surface space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-mono text-sm font-semibold text-text-primary">
                    {item.symbol} · {item.id}
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Submitted {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="badge-gold px-2 py-1 text-xs">{label(item.status)}</span>
              </div>
              <p className="text-sm text-text-secondary">{item.reason}</p>
              {item.user_notes && (
                <p className="text-xs text-text-muted bg-surface-elevated/40 p-2.5 rounded-lg border border-theme-subtle">
                  {item.user_notes}
                </p>
              )}
              {item.resolution_notes && (
                <div className="rounded-lg border border-theme-subtle bg-surface-elevated/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Reviewer response</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{item.resolution_notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <button
        className="btn-secondary px-4 py-2 text-xs inline-flex items-center gap-1.5"
        onClick={() => void load()}
        disabled={loading}
      >
        <RefreshCw className="h-3 w-3" />
        <span>Refresh</span>
      </button>
    </section>
  )
}