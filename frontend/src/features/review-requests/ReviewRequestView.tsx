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

  async function handleDirectSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const sym = (fd.get('symbol') as string || '').trim().toUpperCase()
    const rsn = (fd.get('reason') as string || '').trim()
    const nts = (fd.get('notes') as string || '').trim()
    if (!sym || !rsn) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiFetch<ReviewCreated>('/review-requests', {
        method: 'POST',
        body: { symbol: sym, reason: rsn, user_notes: nts || 'Manual audit request submitted from dashboard', severity: 'MEDIUM' }
      })
      setCreated(res)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Could not submit request.')
    } finally { setBusy(false) }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-gold">Human Verification</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">Request Expert Oversight</h1>
        <p className="mt-2 text-sm text-text-muted">A SEBI-certified analyst or risk expert can review AI forecasts and verify model assumptions.</p>
      </header>

      {created ? (
        <div className="card-surface space-y-3 p-5">
          <p className="text-sm text-gain font-semibold">? Review ticket successfully submitted. Status: Pending Audit.</p>
          <p className="font-mono text-xs text-text-muted">Tracking ID: {created.id}</p>
          <button className="btn-secondary px-4 py-2 text-xs" onClick={() => navigate('/dashboard/reviews')}>View In My Reviews</button>
        </div>
      ) : analysis && analysisId ? (
        <form onSubmit={submit} className="card-surface space-y-5 p-5">
          <div className="rounded-lg border border-theme-subtle bg-surface-elevated/40 p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Attached Analysis</p>
            <p className="mt-1 font-mono text-sm text-text-primary">{analysis.symbol} · {analysis.forecastHorizon}</p>
            <p className="mt-1 text-xs text-text-muted">Snapshot ID: {analysisId}</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">What would you like clarified?</span>
            <input className="input-default w-full" minLength={3} maxLength={255} required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe the question or concern regarding this forecast" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Additional context & observation</span>
            <textarea className="input-default w-full" rows={4} minLength={5} maxLength={2000} required value={userNotes} onChange={(event) => setUserNotes(event.target.value)} placeholder="Share specific metrics or news that contradict the AI prediction" />
          </label>
          {error && <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p>}
          <div className="flex justify-end">
            <button className="btn-gold px-5 py-2 text-xs" type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit for Human Audit'}</button>
          </div>
        </form>
      ) : (
        <div className="card-surface space-y-4 p-6">
          <div className="flex items-center gap-3 border-b border-theme-subtle pb-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold/40 bg-gold/10 font-mono text-gold font-bold">???</span>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Direct Human Verification Request</h2>
              <p className="text-xs text-text-muted">Submit an asset prediction, risk rating, or calculation for human expert audit.</p>
            </div>
          </div>
          <form onSubmit={handleDirectSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Stock / Asset Symbol</label>
              <input name="symbol" required className="input-default font-mono uppercase" placeholder="e.g. RELIANCE.NS, TCS.NS, INFY.NS" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Audit Reason / Doubt</label>
              <input name="reason" required className="input-default" placeholder="e.g. Target price feels aggressive given recent interest rate changes" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Detailed Context & Observations</label>
              <textarea name="notes" rows={3} className="input-default" placeholder="Provide any specific metrics, formulas, or anomalies you want verified..." />
            </div>
            {error && <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p>}
            <div className="flex items-center justify-between pt-2">
              <Link to="/dashboard/explainability" className="text-xs text-gold underline hover:text-text-primary">Or choose from Forecasts ?</Link>
              <button type="submit" disabled={busy} className="btn-gold px-5 py-2 text-xs">{busy ? 'Submitting...' : 'Submit for Human Audit'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}