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
      <div className="rounded-xl border border-white/10 bg-ink-950/60 p-8 text-center text-slate-400">
        <p className="text-base font-medium text-slate-300">No holdings found</p>
        <p className="mt-1 text-sm text-slate-500">
          Click "Add Holding" above to start building your portfolio.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-ink-950/60 backdrop-blur-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Symbol / Asset</th>
            <th className="px-4 py-3 font-semibold text-right">Shares</th>
            <th className="px-4 py-3 font-semibold text-right">Buy Price</th>
            <th className="px-4 py-3 font-semibold text-right">Current Price</th>
            <th className="px-4 py-3 font-semibold text-right">Current Value</th>
            <th className="px-4 py-3 font-semibold text-right">P&L (%)</th>
            <th className="px-4 py-3 font-semibold text-right">Weight</th>
            <th className="px-4 py-3 font-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {holdings.map((h) => {
            const currentPrice = h.current_price || h.buy_price
            const investedVal = h.quantity * h.buy_price
            const currentVal = h.quantity * currentPrice
            const pnl = currentVal - investedVal
            const pnlPercent = investedVal > 0 ? (pnl / investedVal) * 100 : 0
            const weight = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0
            const isProfit = pnl >= 0

            return (
              <tr key={h.id} className="transition hover:bg-white/[0.03]">
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white tracking-wide">{h.symbol}</span>
                    <span className="text-xs text-slate-400">{h.name || h.asset_type}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-200">
                  {h.quantity.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                  ₹{h.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-200">
                  ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-medium text-white">
                  ₹{currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5 text-right font-mono">
                  <div
                    className={`inline-flex items-center gap-1 font-medium ${
                      isProfit ? 'text-emerald-400' : 'text-rose-400'
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
                <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-xs">
                    {weight.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(h)}
                      className="rounded p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      title="Edit Holding"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(h.id)}
                      className="rounded p-1 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-400"
                      title="Delete Holding"
                    >
                      <Trash2 className="h-4 w-4" />
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
