import { Edit2, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import type { Holding } from '@/types/portfolio'

interface HoldingsTableProps {
  holdings: Holding[]
  totalPortfolioValue: number
  onEdit: (holding: Holding) => void
  onDelete: (id: string) => void
}

export function HoldingsTable({
  holdings,
  totalPortfolioValue,
  onEdit,
  onDelete,
}: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="card-surface p-8 text-center text-text-muted border-dashed">
        <p className="text-base font-medium text-text-primary">No Holdings Recorded</p>
        <p className="mt-1 text-sm text-text-muted">
          Click "Add Holding" above to start populating your portfolio assets.
        </p>
      </div>
    )
  }

  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-theme-subtle bg-surface-hover/30 text-[11px] uppercase tracking-wider font-mono text-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Symbol / Asset</th>
            <th className="px-4 py-3 font-medium text-right">Shares</th>
            <th className="px-4 py-3 font-medium text-right">Buy Price</th>
            <th className="px-4 py-3 font-medium text-right">Current Price</th>
            <th className="px-4 py-3 font-medium text-right">Current Value</th>
            <th className="px-4 py-3 font-medium text-right">P&L (%)</th>
            <th className="px-4 py-3 font-medium text-right">Weight</th>
            <th className="px-4 py-3 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-subtle">
          {holdings.map((h) => {
            const currentPrice = h.current_price || h.buy_price
            const investedVal = h.quantity * h.buy_price
            const currentVal = h.quantity * currentPrice
            const pnl = currentVal - investedVal
            const pnlPercent = investedVal > 0 ? (pnl / investedVal) * 100 : 0
            const weight = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0
            const isProfit = pnl >= 0

            return (
              <tr key={h.id} className="transition hover:bg-surface-hover/50">
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-primary tracking-wide font-mono text-sm">{h.symbol}</span>
                    <span className="text-xs text-text-muted">{h.name || h.asset_type}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-text-secondary">
                  {h.quantity.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-text-muted">
                  ₹{h.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-text-secondary">
                  ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-medium text-text-primary">
                  ₹{currentVal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3.5 text-right font-mono">
                  <div
                    className={`inline-flex items-center gap-1 font-medium ${
                      isProfit ? 'text-gain' : 'text-loss'
                    }`}
                  >
                    {isProfit ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {isProfit ? '+' : ''}
                      {pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-text-muted">
                  <span className="rounded bg-surface-elevated border border-theme-subtle px-2 py-0.5 text-xs">
                    {weight.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(h)}
                      className="rounded p-1.5 text-text-muted hover:text-gold hover:bg-surface-hover transition"
                      title="Edit Holding"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(h.id)}
                      className="rounded p-1.5 text-text-muted hover:text-loss hover:bg-loss/10 transition"
                      title="Delete Holding"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
