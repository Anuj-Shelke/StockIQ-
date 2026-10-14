import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, apiFetch } from '@/services/api'
import type { PredictionDetail } from '@/types/explainability'

interface ReviewLocationState { analysis?: PredictionDetail; analysis_snapshot_id?: string }
interface ReviewCreated { id: string; status: string }

export function ReviewRequestView() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as ReviewLocationState | null
  const analysis = state?.analysis
  const analysisId = state?.analysis_snapshot_id
  const [reason, setReason] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<ReviewCreated | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!analysis || !analysisId) return
    setBusy(true)
    setError(null)
    try {
      const response = await apiFetch<ReviewCreated>('/review-requests', {
        method: 'POST',
        body: {
          symbol: analysis.symbol,
          analysis_snapshot_id: analysisId,
          reason: reason.trim(),
          user_notes: userNotes.trim(),
          severity: 'MEDIUM',
          snapshot_data: analysis,
        },
      })
      setCreated(response)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the review request. Please try again.')
    } finally { setBusy(false) }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header><p className="text-xs font-mono uppercase tracking-widest text-gold">Human review</p><h1 className="mt-1 font-display text-2xl font-bold text-text-primary">Request expert oversight</h1><p className="mt-2 text-sm text-text-muted">A reviewer can provide clarification on this analysis. This is not investment advice or a promise of returns.</p></header>
      {!analysis || !analysisId ? (
        <div className="card-surface space-y-3 p-5"><p className="text-sm text-text-secondary">Open an analysis and choose “Request Human Review” to attach the analysis you want reviewed.</p><Link to="/dashboard/explainability" className="btn-gold inline-flex">View an analysis</Link></div>
      ) : created ? (
        <div className="card-surface space-y-3 p-5"><p className="text-sm text-gain">Review requested. Status: Pending.</p><p className="font-mono text-xs text-text-muted">Request {created.id}</p><button className="btn-secondary px-4 py-2 text-xs" onClick={() => navigate('/dashboard/reviews')}>View My Reviews</button></div>
      ) : (
        <form onSubmit={submit} className="card-surface space-y-5 p-5">
          <div className="rounded-lg border border-theme-subtle bg-surface-elevated/40 p-4"><p className="text-xs uppercase tracking-wider text-text-muted">Attached analysis</p><p className="mt-1 font-mono text-sm text-text-primary">{analysis.symbol} · {analysis.forecastHorizon}</p><p className="mt-1 text-xs text-text-muted">Reference: {analysisId}</p><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-text-secondary">{JSON.stringify(analysis, null, 2)}</pre></div>
          <label className="block"><span className="mb-1 block text-xs font-medium text-text-secondary">What would you like clarified?</span><input className="input-default w-full" minLength={3} maxLength={255} required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe the question about this analysis" /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-text-secondary">Additional context</span><textarea className="input-default w-full" rows={4} minLength={5} maxLength={2000} required value={userNotes} onChange={(event) => setUserNotes(event.target.value)} placeholder="Share the detail that would help a reviewer" /></label>
          {error && <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p>}
          <div className="flex justify-end"><button className="btn-gold px-5 py-2 text-xs" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Request Human Review'}</button></div>
        </form>
      )}
    </section>
  )
}
