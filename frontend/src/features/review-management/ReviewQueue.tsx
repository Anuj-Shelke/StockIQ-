import { useState } from 'react'
import { Eye, ArrowUpDown } from 'lucide-react'
import type { ReviewRequestItem } from '@/types/adminReview'

interface ReviewQueueProps {
  items: ReviewRequestItem[]
  onSelectRequest: (item: ReviewRequestItem) => void
}

export function ReviewQueue({ items, onSelectRequest }: ReviewQueueProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = items
    .filter((it) => (statusFilter === 'ALL' ? true : it.status === statusFilter))
    .filter((it) => (severityFilter === 'ALL' ? true : it.severity === severityFilter))
    .sort((a, b) => {
      const tA = new Date(a.createdAt).getTime()
      const tB = new Date(b.createdAt).getTime()
      return sortOrder === 'desc' ? tB - tA : tA - tB
    })

  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="font-semibold text-white">Review Request Queue</h3>
          <p className="text-xs text-slate-400">
            Disputed model forecasts and automated risk anomaly tickets awaiting compliance verification.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="ALL" className="bg-ink-900">All Statuses</option>
            <option value="PENDING" className="bg-ink-900">Pending</option>
            <option value="IN_REVIEW" className="bg-ink-900">In Review</option>
            <option value="RESOLVED" className="bg-ink-900">Resolved</option>
            <option value="REJECTED" className="bg-ink-900">Rejected</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="ALL" className="bg-ink-900">All Severities</option>
            <option value="CRITICAL" className="bg-ink-900">Critical</option>
            <option value="HIGH" className="bg-ink-900">High</option>
            <option value="MEDIUM" className="bg-ink-900">Medium</option>
            <option value="LOW" className="bg-ink-900">Low</option>
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-200 hover:bg-white/10"
            title="Toggle Date Sort Order"
          >
            <ArrowUpDown className="h-3 w-3 text-gold-400" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-slate-400">
            <tr>
              <th className="px-3.5 py-2.5 font-semibold">ID</th>
              <th className="px-3.5 py-2.5 font-semibold">Asset</th>
              <th className="px-3.5 py-2.5 font-semibold">User</th>
              <th className="px-3.5 py-2.5 font-semibold">Reason</th>
              <th className="px-3.5 py-2.5 font-semibold text-center">Severity</th>
              <th className="px-3.5 py-2.5 font-semibold text-center">Status</th>
              <th className="px-3.5 py-2.5 font-semibold">Date</th>
              <th className="px-3.5 py-2.5 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No review requests match current filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                return (
                  <tr key={item.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-3.5 py-3 font-mono font-medium text-slate-300">
                      {item.id}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-white">
                      {item.symbol}
                    </td>
                    <td className="px-3.5 py-3 text-slate-400 truncate max-w-[140px]" title={item.userEmail}>
                      {item.userEmail}
                    </td>
                    <td className="px-3.5 py-3 text-slate-300 max-w-[180px] truncate" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : item.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : item.severity === 'MEDIUM'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          item.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : item.status === 'IN_REVIEW'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <button
                        onClick={() => onSelectRequest(item)}
                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                        title="Audit Review Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
