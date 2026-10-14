import { useState } from 'react'
import { History, FileDown, RotateCcw, ArrowRight } from 'lucide-react'
import { ExportReportModal } from '@/features/reports/ExportReportModal'
import type { AnalysisSnapshot } from '@/types/snapshotHistory'

export function SnapshotDrawer() {
  const [snapshots] = useState<AnalysisSnapshot[]>([])
  const [selectedSnapshot, setSelectedSnapshot] = useState<AnalysisSnapshot | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [restoredAlert, setRestoredAlert] = useState<string | null>(null)

  const handleRestore = (snp: AnalysisSnapshot) => {
    setRestoredAlert(`Snapshot "${snp.title}" loaded into current workspace.`)
    setTimeout(() => setRestoredAlert(null), 4000)
  }

  const handleExport = (snp: AnalysisSnapshot) => {
    setSelectedSnapshot(snp)
    setIsExportModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Snapshot History & PDF Research Reports
          </h1>
          <p className="text-sm text-slate-400">
            Immutable archive of past portfolio analyses, stress simulations, and one-click exportable client reports.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 rounded-lg">
          <History className="h-4 w-4" />
          <span>{snapshots.length} Snapshots Saved</span>
        </div>
      </div>

      {restoredAlert && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <RotateCcw className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{restoredAlert}</span>
        </div>
      )}

      {snapshots.length === 0 && (
        <div className="rounded-xl border border-theme-default bg-surface p-8 text-center text-text-muted">
          No saved analyses yet. Your analysis history will appear here when available.
        </div>
      )}

      {/* Snapshots Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {snapshots.map((snp) => (
          <div
            key={snp.id}
            className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white tracking-wide">{snp.symbol}</span>
                <span className="font-mono text-slate-500">
                  {new Date(snp.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="mt-1 font-semibold text-slate-200 text-sm">{snp.title}</h3>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-white/[0.02] p-3 border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Target</span>
                  <div className="font-mono font-bold text-gold-400">₹{snp.targetPrice}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Projected Gain</span>
                  <div className="font-mono font-bold text-emerald-400">
                    +{snp.projectedReturnPercent}%
                  </div>
                </div>
              </div>

              {snp.scenarioStressed && (
                <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-gold-400" />
                  <span>Stressed: {snp.scenarioStressed}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
              <button
                onClick={() => handleRestore(snp)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                title="Restore this snapshot"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                Restore
              </button>
              <button
                onClick={() => handleExport(snp)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gold-500 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-400 transition shadow"
                title="Export PDF Report"
              >
                <FileDown className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PDF Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false)
          setSelectedSnapshot(null)
        }}
        snapshot={selectedSnapshot}
      />
    </div>
  )
}
export default SnapshotDrawer
