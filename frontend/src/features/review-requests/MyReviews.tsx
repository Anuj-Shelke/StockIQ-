import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch } from '@/services/api'
import type { ReviewStatus, ReviewSeverity } from '@/types/adminReview'

interface MyReview {
  id: string; symbol: string; analysis_snapshot_id?: string | null; reason: string; user_notes: string
  status: ReviewStatus; severity: ReviewSeverity; created_at: string; resolution_notes?: string | null
  reviewed_at?: string | null
}
const label = (status: ReviewStatus) => status === 'RESOLVED' ? 'Completed' : status === 'REJECTED' ? 'Declined' : status === 'IN_REVIEW' ? 'In Review' : 'Pending'

export function MyReviews() {
  const [items, setItems] = useState<MyReview[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try { setItems(await apiFetch<MyReview[]>('/review-requests')); setError(null) }
    catch (err) { setItems([]); setError(err instanceof ApiError ? err.message : 'Could not load your review requests.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  return <section className="mx-auto max-w-4xl space-y-5">
    <header><h1 className="font-display text-2xl font-bold text-text-primary">My Reviews</h1><p className="mt-1 text-sm text-text-muted">Track request status and reviewer responses.</p></header>
    {error && <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p>}
    {loading ? <p className="text-sm text-text-muted">Loading review requests…</p> : items.length === 0 ? <div className="card-surface p-5 text-sm text-text-muted">You have no review requests yet.</div> : <div className="space-y-3">{items.map((item) => <article key={item.id} className="card-surface space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-mono text-sm font-semibold text-text-primary">{item.symbol} · {item.id}</h2><p className="mt-1 text-xs text-text-muted">Submitted {new Date(item.created_at).toLocaleString()}</p></div><span className="badge-gold px-2 py-1 text-xs">{label(item.status)}</span></div>
      <p className="text-sm text-text-secondary">{item.reason}</p><p className="text-xs text-text-muted">Analysis: {item.analysis_snapshot_id || '—'}</p>
      {item.resolution_notes && <div className="rounded-lg border border-theme-subtle bg-surface-elevated/40 p-3"><p className="text-[10px] uppercase tracking-wider text-text-muted">Reviewer response</p><p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{item.resolution_notes}</p></div>}
    </article>)}</div>}
    <button className="btn-secondary px-4 py-2 text-xs" onClick={() => void load()} disabled={loading}>Refresh</button>
  </section>
}
