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
    <div className="card-surface p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-theme-subtle pb-4">
        <div>
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-tight">Review Request Queue</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Disputed model forecasts and automated risk anomaly tickets awaiting compliance verification.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-default font-mono py-1.5 px-3 text-xs w-auto"
          >
            <option value="ALL" className="bg-surface text-text-primary">All Statuses</option>
            <option value="PENDING" className="bg-surface text-text-primary">Pending</option>
            <option value="IN_REVIEW" className="bg-surface text-text-primary">In Review</option>
            <option value="RESOLVED" className="bg-surface text-text-primary">Completed</option>
            <option value="REJECTED" className="bg-surface text-text-primary">Declined</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input-default font-mono py-1.5 px-3 text-xs w-auto"
          >
            <option value="ALL" className="bg-surface text-text-primary">All Severities</option>
            <option value="CRITICAL" className="bg-surface text-text-primary">Critical</option>
            <option value="HIGH" className="bg-surface text-text-primary">High</option>
            <option value="MEDIUM" className="bg-surface text-text-primary">Medium</option>
            <option value="LOW" className="bg-surface text-text-primary">Low</option>
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-mono"
            title="Toggle Date Sort Order"
          >
            <ArrowUpDown className="h-3 w-3 text-gold" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-theme-subtle bg-surface-hover/30 text-[11px] uppercase tracking-wider font-mono text-text-muted">
            <tr>
              <th className="px-3.5 py-2.5 font-medium">ID</th>
              <th className="px-3.5 py-2.5 font-medium">Asset</th>
              <th className="px-3.5 py-2.5 font-medium">User</th>
              <th className="px-3.5 py-2.5 font-medium">Reason</th>
              <th className="px-3.5 py-2.5 font-medium text-center">Severity</th>
              <th className="px-3.5 py-2.5 font-medium text-center">Status</th>
              <th className="px-3.5 py-2.5 font-medium">Date</th>
              <th className="px-3.5 py-2.5 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-subtle">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-text-muted">
                  No review requests match current filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                return (
                  <tr key={item.id} className="transition hover:bg-surface-hover/50">
                    <td className="px-3.5 py-3 font-mono font-medium text-text-secondary">
                      {item.id}
                    </td>
                    <td className="px-3.5 py-3 font-semibold font-mono text-text-primary">
                      {item.symbol}
                    </td>
                    <td className="px-3.5 py-3 text-text-muted truncate max-w-[140px] font-mono text-[11px]" title={item.userEmail}>
                      {item.userName ? <><span className="block text-text-primary">{item.userName}</span><span>{item.userEmail}</span></> : item.userEmail}
                    </td>
                    <td className="px-3.5 py-3 text-text-secondary max-w-[180px] truncate" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                          item.severity === 'CRITICAL'
                            ? 'badge-risk-danger'
                            : item.severity === 'HIGH'
                            ? 'badge-risk-elevated'
                            : item.severity === 'MEDIUM'
                            ? 'badge-risk-moderate'
                            : 'badge-risk-low'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                          item.status === 'RESOLVED'
                            ? 'badge-verified'
                            : item.status === 'IN_REVIEW'
                            ? 'badge-gold'
                            : item.status === 'REJECTED'
                            ? 'badge-risk-danger'
                            : 'badge-ai'
                        }`}
                      >
                        {item.status === 'RESOLVED' ? 'Completed' : item.status === 'REJECTED' ? 'Declined' : item.status === 'IN_REVIEW' ? 'In Review' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-text-muted text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <button
                        onClick={() => onSelectRequest(item)}
                        className="rounded p-1.5 text-text-muted hover:bg-surface-hover hover:text-gold transition"
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
