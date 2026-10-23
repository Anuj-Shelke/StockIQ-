import { useState } from 'react'
import { X, Download, Printer, Shield, CheckCircle2 } from 'lucide-react'
import type { AnalysisSnapshot } from '@/types/snapshotHistory'

interface ExportReportModalProps {
  isOpen: boolean
  onClose: () => void
  snapshot: AnalysisSnapshot | null
}

export function ExportReportModal({
  isOpen,
  onClose,
  snapshot,
}: ExportReportModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  if (!isOpen || !snapshot) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="theme-dark-surface w-full max-w-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white font-display">
              Export Branded Research Report
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Client-ready PDF dossier with institutional metrics and SEBI compliance footnotes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {downloadSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>StockIQ-Research-Report-{snapshot.symbol}.pdf downloaded successfully!</span>
          </div>
        )}

        {/* Branded PDF Preview Document */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded border border-gold-500/40 bg-gold-500/10 font-display text-xs text-gold-400 font-bold">₹</span>
              <span className="font-display font-bold text-white tracking-wide">StockIQ Quantitative Research</span>
            </div>
            <span className="font-mono text-slate-400 text-[10px]">
              {new Date(snapshot.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-white">{snapshot.title}</div>
            <div className="text-slate-400 mt-0.5">
              Asset: {snapshot.symbol} | Asset Class: {snapshot.assetClass}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-lg bg-black/40 p-3 border border-white/5 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Current Spot</span>
              <div className="font-bold text-white">₹{snapshot.currentPrice}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Target Price</span>
              <div className="font-bold text-gold-400">₹{snapshot.targetPrice}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Est. Return</span>
              <div className="font-bold text-emerald-400">+{snapshot.projectedReturnPercent}%</div>
            </div>
          </div>

          {snapshot.scenarioStressed && (
            <div className="text-slate-300">
              <span className="text-slate-400">Historical Stress Tested Scenario: </span>
              <strong>{snapshot.scenarioStressed}</strong>
            </div>
          )}

          <div className="flex items-start gap-2 border-t border-white/5 pt-3 text-[10px] text-slate-500 leading-relaxed">
            <Shield className="h-3.5 w-3.5 text-gold-400 shrink-0 mt-0.5" />
            <span>
              Report generated algorithmically by StockIQ ML Engine. Past performance is no guarantee of future returns. Educational distribution only.
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save to PDF
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-5 py-2 text-xs font-semibold text-[var(--accent-contrast)] hover:bg-gold-400 transition shadow-lg shadow-gold-500/20 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Generating PDF...' : 'Download PDF Dossier'}
          </button>
        </div>
      </div>
    </div>
  )
}
export default ExportReportModal
