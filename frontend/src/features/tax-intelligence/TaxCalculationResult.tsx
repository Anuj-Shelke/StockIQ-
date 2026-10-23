import { useState } from 'react'
import {
  Calendar,
  Sparkles,
} from 'lucide-react'
import type { TaxCalculateResponse } from '@/types/tax'
import { formatINR, formatDateIndian } from './taxUtils'
import { TaxExplanationPanel } from './TaxExplanationPanel'

interface TaxCalculationResultProps {
  result: TaxCalculateResponse
}

export function TaxCalculationResult({ result }: TaxCalculationResultProps) {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'xai' | 'lots'>('breakdown')
  const m = result.structured_metrics
  const isLoss = m.net_capital_gain_before_tax < 0
  const isLtcg = m.capital_gain_category.includes('LTCG') || m.applicable_section.includes('112A')

  return (
    <div className="card-surface space-y-6 p-6">
      {/* Top Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-display text-xl font-bold text-[var(--text-primary)]">
              {result.symbol}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
                isLoss
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : isLtcg
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {m.capital_gain_category} ({m.applicable_section})
            </span>
            <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/30">
              {result.financial_year}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Rule Version: <span className="text-[var(--text-secondary)] font-medium">{result.rule_label}</span>
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'breakdown'
                ? 'bg-[var(--gold-primary)] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Tax Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xai')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'xai'
                ? 'bg-[var(--gold-primary)] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            XAI Explanations
          </button>
          {result.lot_allocations && result.lot_allocations.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('lots')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'lots'
                  ? 'bg-[var(--gold-primary)] text-black shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              FIFO Lots ({result.lot_allocations.length})
            </button>
          )}
        </div>
      </div>

      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 min-w-0 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Net Capital Gain
              </span>
              <p
                title={formatINR(m.net_capital_gain_before_tax)}
                className={`mt-1 font-display text-lg sm:text-xl xl:text-2xl font-bold truncate tabular-nums ${
                  isLoss ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatINR(m.net_capital_gain_before_tax)}
              </p>
              <span className="mt-1 block text-[11px] text-[var(--text-muted)] truncate font-mono">
                Gross: {formatINR(m.gross_capital_gain)}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 min-w-0 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Applicable Tax Rate
              </span>
              <p className="mt-1 font-display text-lg sm:text-xl xl:text-2xl font-bold text-amber-400 truncate tabular-nums">
                {(m.applicable_tax_rate * 100).toFixed(1)}%
              </p>
              <span className="mt-1 block text-[11px] text-[var(--text-muted)] truncate font-mono">
                +4% Health & Ed Cess
              </span>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 min-w-0 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300 truncate">
                Estimated Total Tax
              </span>
              <p
                title={formatINR(m.estimated_total_tax)}
                className="mt-1 font-display text-lg sm:text-xl xl:text-2xl font-bold text-rose-400 truncate tabular-nums"
              >
                {formatINR(m.estimated_total_tax)}
              </p>
              <span className="mt-1 block text-[11px] text-rose-300/70 truncate font-mono">
                Sec 288B Rounded
              </span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 min-w-0 overflow-hidden flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 truncate">
                Net In-Hand Profit
              </span>
              <p
                title={formatINR(m.estimated_after_tax_profit)}
                className="mt-1 font-display text-lg sm:text-xl xl:text-2xl font-bold text-emerald-400 truncate tabular-nums"
              >
                {formatINR(m.estimated_after_tax_profit)}
              </p>
              <span className="mt-1 block text-[11px] text-emerald-300/70 truncate font-mono">
                After Tax Realization
              </span>
            </div>
          </div>

          {/* Detailed Statutory Calculation Ledger */}
          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <div className="border-b border-[var(--border-subtle)] bg-white/5 px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Statutory Capital Gains Computation Breakdown
              </h3>
            </div>
            <div className="divide-y divide-[var(--border-subtle)] text-xs">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Gross Sale Consideration</span>
                <span className="font-semibold text-[var(--text-primary)]">{formatINR(m.sale_value)}</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Less: Cost of Acquisition (Purchase Basis)</span>
                <span className="text-rose-400">-{formatINR(m.purchase_value)}</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <span className="text-[var(--text-secondary)]">Less: Eligible Transfer Expenses</span>
                  <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                    (Brokerage, Stamp Duty - Sec 48; STT excluded)
                  </span>
                </div>
                <span className="text-rose-400">-{formatINR(m.eligible_expenses)}</span>
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3.5 font-semibold">
                <span className="text-[var(--text-primary)]">Net Capital Gain Before Exemption</span>
                <span className={isLoss ? 'text-rose-400' : 'text-emerald-400'}>
                  {formatINR(m.net_capital_gain_before_tax)}
                </span>
              </div>

              {m.annual_ltcg_threshold > 0 && (
                <>
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <span className="text-[var(--text-secondary)]">Annual Statutory LTCG Exemption Limit</span>
                      <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                        (Section 112A threshold: ₹1,25,000 / FY)
                      </span>
                    </div>
                    <span className="text-[var(--text-primary)]">{formatINR(m.annual_ltcg_threshold)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-[var(--text-secondary)]">Prior LTCG Utilized in this Financial Year</span>
                    <span className="text-[var(--text-muted)]">{formatINR(m.aggregate_eligible_ltcg)}</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between bg-amber-500/5 p-3.5 font-semibold">
                <span className="text-amber-300">Taxable Capital Gain (Post-Exemption)</span>
                <span className="text-amber-400 font-bold">{formatINR(m.taxable_capital_gain)}</span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">
                  Basic Tax @ {(m.applicable_tax_rate * 100).toFixed(1)}%
                </span>
                <span className="text-[var(--text-primary)]">{formatINR(m.basic_tax)}</span>
              </div>

              {m.surcharge > 0 && (
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-[var(--text-secondary)]">Applicable Surcharge</span>
                  <span className="text-[var(--text-primary)]">{formatINR(m.surcharge)}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Health & Education Cess @ 4%</span>
                <span className="text-[var(--text-primary)]">{formatINR(m.cess)}</span>
              </div>

              <div className="flex items-center justify-between bg-hover p-4 font-bold text-sm">
                <span className="text-[var(--text-primary)]">Final Estimated Capital Gains Tax Payable</span>
                <span className="text-rose-400 font-display text-base">
                  {formatINR(m.estimated_total_tax)}
                </span>
              </div>
            </div>
          </div>

          {/* Holding Period Info Box */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-xs">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[var(--gold-primary)]" />
              <div>
                <span className="text-[var(--text-muted)]">Holding Period: </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {m.holding_period_label} ({m.holding_period_days ?? 'N/A'} days)
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Threshold for Listed Equities:{' '}
              <span className="font-semibold text-[var(--gold-primary)]">12 Months (365 days)</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'xai' && (
        <TaxExplanationPanel
          explanation={result.explanation_sections}
          assumptions={result.assumptions}
          missingInformation={result.missing_information}
          status={result.status}
        />
      )}

      {activeTab === 'lots' && result.lot_allocations && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Transactions matched using the statutory <strong className="text-[var(--text-primary)]">First-In First-Out (FIFO)</strong> method mandated by Section 45(2A) and Section 48 of the Indian Income Tax Act.
          </p>

          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-white/5 uppercase text-[10px] tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="p-3">Lot ID</th>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Buy Price</th>
                  <th className="p-3">Matched Qty</th>
                  <th className="p-3">Holding Period</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Gross Gain</th>
                  <th className="p-3">Estimated Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                {result.lot_allocations.map((lot, idx) => (
                  <tr key={lot.lot_id || idx} className="hover:bg-white/5">
                    <td className="p-3 font-medium text-[var(--text-primary)]">{lot.lot_id || `Lot #${idx + 1}`}</td>
                    <td className="p-3">{formatDateIndian(lot.purchase_date)}</td>
                    <td className="p-3">{formatINR(lot.purchase_price)}</td>
                    <td className="p-3 font-semibold text-[var(--text-primary)]">{lot.quantity_matched}</td>
                    <td className="p-3">{lot.holding_period_days !== null ? `${lot.holding_period_days}d` : 'N/A'}</td>
                    <td className="p-3">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--gold-primary)]">
                        {lot.category}
                      </span>
                    </td>
                    <td className={`p-3 font-semibold ${lot.gross_gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatINR(lot.gross_gain)}
                    </td>
                    <td className="p-3 text-rose-300 font-medium">{formatINR(lot.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statutory Disclaimer */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-elevated p-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
        <strong className="text-[var(--text-secondary)]">Statutory Disclaimer: </strong>
        {result.disclaimer ||
          'StockIQ Capital Gains calculations are simulated estimates for educational and decision-support purposes based on the Indian Income Tax Act, 1961 (Finance Act No. 2, 2024). Actual tax liabilities may vary depending on total slab income, Chapter VI-A deductions, rebate under Section 87A, and grandfathering under Section 112A. Consult a qualified Chartered Accountant before filing your ITR.'}
      </div>
    </div>
  )
}
