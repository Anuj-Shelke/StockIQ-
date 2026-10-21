import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Scale,
  RefreshCw,
} from 'lucide-react'
import type { TaxHistoryRecord } from '@/types/tax'
import { taxService } from '@/services/taxService'
import { formatINR, formatDateIndian } from './taxUtils'

export function TaxRulesAndHistory() {
  const [history, setHistory] = useState<TaxHistoryRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await taxService.getHistory(30)
      setHistory(data)
    } catch (err) {
      console.warn('Error fetching tax history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Statutory Rules Guide Card */}
      <div className="card-surface p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <span className="p-2 rounded-lg bg-[var(--gold-soft)] text-[var(--gold-primary)]">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Statutory Capital Gains Rules & Amendments
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Official Indian Income Tax Act frameworks (Section 111A, 112A, 48 & Finance Act 2024).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Post-Budget 2024 */}
          <div className="rounded-xl border border-[var(--gold-primary)]/40 bg-[var(--bg-elevated)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[var(--gold-primary)] px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                Active Framework
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">Effective 23-July-2024 onwards</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">
              Finance (No. 2) Act, 2024 Regime
            </h3>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>STCG (Section 111A):</strong> Flat <span className="text-amber-400 font-bold">20.0%</span> (increased from 15.0%) + 4% Cess.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>LTCG (Section 112A):</strong> Flat <span className="text-emerald-400 font-bold">12.5%</span> (increased from 10.0%) + 4% Cess.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>Exemption Limit:</strong> First <span className="text-[var(--gold-primary)] font-bold">₹1,25,000</span> LTCG per FY is 100% tax-free.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>STT Treatment (Section 48):</strong> Securities Transaction Tax is strictly <em>non-deductible</em> as a transfer expense.
                </span>
              </li>
            </ul>
          </div>

          {/* Pre-Budget 2024 */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-3 opacity-80">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                Historical Regime
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">Transfers up to 22-July-2024</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">
              Pre-Budget 2024 Regime
            </h3>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--text-muted)] font-bold">•</span>
                <span>
                  <strong>STCG (Section 111A):</strong> Flat 15.0% + 4% Cess.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--text-muted)] font-bold">•</span>
                <span>
                  <strong>LTCG (Section 112A):</strong> Flat 10.0% + 4% Cess.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--text-muted)] font-bold">•</span>
                <span>
                  <strong>Exemption Limit:</strong> First ₹1,00,000 LTCG per FY was tax-exempt.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--text-muted)] font-bold">•</span>
                <span>
                  <strong>Holding Period:</strong> 12 months for listed equity shares.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Audit History Log */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4">
          <div>
            <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">
              Saved Tax Calculation Audit Trail
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Complete chronological audit ledger of user calculations and rule versions.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh History
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            Loading calculation audit history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            No saved calculation records in your audit ledger yet. Run a calculation with &ldquo;Save to Audit History&rdquo; enabled to record an entry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-white/5 uppercase text-[10px] tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Rule Version</th>
                  <th className="p-3">Net Gain</th>
                  <th className="p-3">Estimated Tax</th>
                  <th className="p-3">After-Tax Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/5">
                    <td className="p-3 text-[11px] text-[var(--text-muted)]">
                      {formatDateIndian(rec.created_at)}
                    </td>
                    <td className="p-3 font-bold text-[var(--text-primary)]">{rec.asset_symbol}</td>
                    <td className="p-3">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--gold-primary)]">
                        {rec.tax_category}
                      </span>
                    </td>
                    <td className="p-3 text-[11px]">{rec.tax_rule_version}</td>
                    <td
                      className={`p-3 font-semibold ${
                        rec.calculated_gains?.net_capital_gain_before_tax >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {formatINR(rec.calculated_gains?.net_capital_gain_before_tax)}
                    </td>
                    <td className="p-3 font-semibold text-rose-400">{formatINR(rec.estimated_tax)}</td>
                    <td className="p-3 font-semibold text-emerald-400">
                      {formatINR(rec.estimated_after_tax_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
