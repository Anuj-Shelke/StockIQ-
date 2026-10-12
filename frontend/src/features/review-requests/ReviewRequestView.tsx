import { useState } from 'react'
import { ClipboardCheck, Plus, CheckCircle, ShieldAlert, Clock, AlertTriangle } from 'lucide-react'
import { ReviewQueue } from '@/features/review-management/ReviewQueue'
import { ReviewDetailModal } from '@/features/review-management/ReviewDetailModal'
import type { ReviewRequestItem, ReviewStatus, ReviewSeverity } from '@/types/adminReview'

const INITIAL_REQUESTS: ReviewRequestItem[] = [
  {
    id: 'REV-2026-001',
    userId: 'usr-101',
    userEmail: 'investor@stockiq.internal',
    symbol: 'TCS.NS',
    analysisSnapshotId: 'snp-109',
    reason: 'Model target price (+5.47%) seems high given ongoing global IT discretionary budget cuts.',
    userNotes: 'Requesting quantitative risk officer review of XGBoost feature weights regarding enterprise spend sensitivity.',
    status: 'IN_REVIEW',
    severity: 'MEDIUM',
    createdAt: '2026-10-12T14:30:00Z',
    assignedReviewer: 'Compliance Team A',
    snapshotData: {
      currentPrice: 4120.25,
      predictedTarget: 4345.50,
      modelConfidence: 86,
      timeHorizon: '30-Day',
    },
  },
  {
    id: 'REV-2026-002',
    userId: 'usr-102',
    userEmail: 'portfolio.lead@stockiq.internal',
    symbol: 'RELIANCE.NS',
    analysisSnapshotId: 'snp-108',
    reason: 'Petrochem margin spread assumptions in macro vector embeddings out of date.',
    userNotes: 'Singapore GRM benchmarks dropped 12% last week; ensure vector RAG retrained with latest oil analyst dispatches.',
    status: 'PENDING',
    severity: 'HIGH',
    createdAt: '2026-10-12T16:15:00Z',
    snapshotData: {
      currentPrice: 2980.50,
      predictedTarget: 3210.00,
      modelConfidence: 79,
      timeHorizon: '60-Day',
    },
  },
  {
    id: 'REV-2026-003',
    userId: 'usr-103',
    userEmail: 'analyst@stockiq.internal',
    symbol: 'HDFCBANK.NS',
    analysisSnapshotId: 'snp-107',
    reason: 'LDR (Loan to Deposit Ratio) stress test calibration verification.',
    userNotes: 'Verified against RBI quarterly liquidity coverage ratio guideline update.',
    status: 'RESOLVED',
    severity: 'LOW',
    createdAt: '2026-10-11T09:00:00Z',
    assignedReviewer: 'Dr. S. Mehta (Chief Risk Officer)',
    resolutionNotes: 'Liquidity parameters updated to reflect revised RBI monetary policy committee stance. Calibration approved.',
    snapshotData: {
      currentPrice: 1650.80,
      predictedTarget: 1820.00,
      modelConfidence: 91,
      timeHorizon: '90-Day',
    },
  },
]

export function ReviewRequestView() {
  const [requests, setRequests] = useState<ReviewRequestItem[]>(INITIAL_REQUESTS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequestItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [submittedAlert, setSubmittedAlert] = useState<string | null>(null)

  // New Request Form State
  const [symbol, setSymbol] = useState('INFY.NS')
  const [severity, setSeverity] = useState<ReviewSeverity>('MEDIUM')
  const [reason, setReason] = useState('')
  const [userNotes, setUserNotes] = useState('')

  const handleSelectRequest = (item: ReviewRequestItem) => {
    setSelectedRequest(item)
    setIsModalOpen(true)
  }

  const handleUpdateStatus = (id: string, newStatus: ReviewStatus, notes: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              resolutionNotes: notes,
              updatedAt: new Date().toISOString(),
            }
          : r,
      ),
    )
  }

  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    const newReq: ReviewRequestItem = {
      id: `REV-2026-00${requests.length + 1}`,
      userId: 'usr-current',
      userEmail: 'you@stockiq.internal',
      symbol: symbol.toUpperCase(),
      analysisSnapshotId: `snp-usr-${Date.now().toString().slice(-4)}`,
      reason: reason.trim(),
      userNotes: userNotes.trim() || 'User submitted manual analysis audit ticket.',
      status: 'PENDING',
      severity,
      createdAt: new Date().toISOString(),
      snapshotData: {
        currentPrice: 1890.10,
        predictedTarget: 2010.00,
        modelConfidence: 82,
        timeHorizon: '30-Day',
      },
    }

    setRequests([newReq, ...requests])
    setIsCreating(false)
    setReason('')
    setUserNotes('')
    setSubmittedAlert(`Review ticket #${newReq.id} submitted successfully to the governance team.`)
    setTimeout(() => setSubmittedAlert(null), 5000)
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length
  const inReviewCount = requests.filter((r) => r.status === 'IN_REVIEW').length
  const resolvedCount = requests.filter((r) => r.status === 'RESOLVED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Model Governance & Review Request Center
          </h1>
          <p className="text-sm text-slate-400">
            Submit formal audits for AI price predictions, request second opinions on risk models, and track compliance status.
          </p>
        </div>
        <button
          onClick={() => setIsCreating((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-400 transition shadow"
        >
          <Plus className="h-4 w-4" />
          {isCreating ? 'Close Form' : 'Request New Review'}
        </button>
      </div>

      {submittedAlert && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{submittedAlert}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{pendingCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Under Active Audit</span>
            <AlertTriangle className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{inReviewCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resolved / Approved</span>
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{resolvedCount}</div>
        </div>
      </div>

      {/* Create New Review Form */}
      {isCreating && (
        <form
          onSubmit={handleSubmitNewRequest}
          className="rounded-2xl border border-gold-500/30 bg-ink-950/80 p-6 backdrop-blur-md space-y-4 shadow-xl"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <ClipboardCheck className="h-5 w-5 text-gold-400" />
            <h3 className="font-semibold text-white">Create Analysis Review Ticket</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Stock / Asset Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. INFY.NS, RELIANCE.NS, GOLD_24K"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Audit Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as ReviewSeverity)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-400"
              >
                <option value="LOW" className="bg-ink-900">Low (Clarification on math / formulas)</option>
                <option value="MEDIUM" className="bg-ink-900">Medium (Feature weight skepticism)</option>
                <option value="HIGH" className="bg-ink-900">High (Significant outlier vs macro news)</option>
                <option value="CRITICAL" className="bg-ink-900">Critical (Data corruption / regulatory concern)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Audit Rationale & Disputed Factors</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Summary of why you are requesting human reviewer verification..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Analyst Notes & Citations</label>
            <textarea
              rows={3}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Provide references, external quarterly reports, or specific anomaly observations..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gold-500 px-5 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-400 shadow transition"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      )}

      {/* Review Request Queue */}
      <ReviewQueue items={requests} onSelectRequest={handleSelectRequest} />

      {/* Review Detail Audit Modal */}
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
export default ReviewRequestView
