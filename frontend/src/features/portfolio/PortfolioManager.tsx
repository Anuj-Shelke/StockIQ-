import { useCallback, useEffect, useState } from 'react'
import { Plus, ArrowUpRight, PieChart as PieIcon, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AllocationChart } from './AllocationChart'
import { HoldingsTable } from './HoldingsTable'
import { AddHoldingModal } from './AddHoldingModal'
import type { Holding, HoldingFormData, StockCatalogItem } from '@/types/portfolio'
import { apiFetch } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

interface ApiPortfolio {
  id: string; name: string; total_value: number; total_invested: number; total_gain_loss: number
  return_percentage: number; holdings: Holding[]
}
interface ApiStock { symbol: string; name: string; exchange: string; sector: string; current_price: number; currency: string }

export function PortfolioManager() {
  const { reloadProfile } = useAuth()
  const [portfolio, setPortfolio] = useState<ApiPortfolio | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [catalog, setCatalog] = useState<StockCatalogItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPortfolio = useCallback(async () => {
    setLoading(true)
    try {
      const [portfolios, stocks] = await Promise.all([
        apiFetch<ApiPortfolio[]>('/portfolios'),
        apiFetch<{ items: ApiStock[] }>('/stocks?limit=300'),
      ])
      const current = portfolios[0] ?? null
      setPortfolio(current)
      setHoldings(current?.holdings ?? [])
      setCatalog(stocks.items ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your portfolio.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadPortfolio() }, [loadPortfolio])

  const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * h.buy_price, 0)
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.quantity * (h.current_price || h.buy_price), 0)
  const totalPnL = totalCurrentValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? totalPnL / totalInvested * 100 : 0
  const isOverallProfit = totalPnL >= 0

  const handleSaveHolding = async (formData: HoldingFormData) => {
    try {
      let activePortfolio = portfolio
      if (!activePortfolio) {
        activePortfolio = await apiFetch<ApiPortfolio>('/portfolios', {
          method: 'POST', body: { name: 'My Portfolio', holdings: [] },
        })
      }
      const assetType = formData.asset_type === 'EQUITY' ? 'stock' : formData.asset_type.toLowerCase()
      if (editingHolding) {
        await apiFetch(`/portfolios/${activePortfolio.id}/holdings/${editingHolding.id}`, {
          method: 'PATCH', body: { name: formData.name, quantity: formData.quantity, buy_price: formData.buy_price, current_price: formData.current_price },
        })
      } else {
        await apiFetch(`/portfolios/${activePortfolio.id}/holdings`, {
          method: 'POST', body: { symbol: formData.symbol, name: formData.name, asset_type: assetType, quantity: formData.quantity, buy_price: formData.buy_price, current_price: formData.current_price },
        })
      }
      setEditingHolding(null)
      await loadPortfolio()
      await reloadProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this holding.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!portfolio || !confirm('Are you sure you want to delete this holding?')) return
    try {
      await apiFetch(`/portfolios/${portfolio.id}/holdings/${id}`, { method: 'DELETE' })
      await loadPortfolio()
      await reloadProfile()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove this holding.') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight text-text-primary font-display">Portfolio Management</h1>
          <p className="text-sm text-text-muted mt-0.5">Your holdings and portfolio allocation.</p></div>
        <button onClick={() => { setEditingHolding(null); setIsModalOpen(true) }} className="btn-gold flex items-center gap-2"><Plus className="h-4 w-4" />Add Holding</button>
      </div>
      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-loss/30 bg-loss/10 p-4 text-sm text-text-primary"><AlertTriangle className="h-4 w-4" />{error}<button className="ml-auto underline" onClick={() => void loadPortfolio()}>Retry</button></div>}
      {loading ? <div className="card-surface p-8 text-center text-text-muted">Loading your portfolio…</div> : !error && holdings.length === 0 ? (
        <section className="card-surface mx-auto max-w-2xl space-y-4 p-8 text-center">
          <h2 className="text-xl font-semibold text-text-primary">Your portfolio is empty.</h2>
          <p className="text-sm text-text-muted">Add your holdings to see your risk analysis.</p>
          <button onClick={() => { setEditingHolding(null); setIsModalOpen(true) }} className="btn-gold inline-flex items-center gap-2"><Plus className="h-4 w-4" />Add your first holding</button>
        </section>
      ) : !error && <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-black p-5 min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider font-mono text-[var(--accent-on-dark)] truncate">Total Value</span>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-[var(--text-on-dark)] truncate tabular-nums" title={`₹${totalCurrentValue.toLocaleString('en-IN')}`}>
              ₹{totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-1 text-xs text-[var(--text-on-dark-secondary)] truncate tabular-nums">
              Invested: ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="card-surface p-5 min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider font-mono truncate">Unrealized P&amp;L</span>
            <div className={`mt-2 text-xl sm:text-2xl font-bold font-mono truncate tabular-nums ${isOverallProfit ? 'text-gain' : 'text-loss'}`} title={`₹${totalPnL.toLocaleString('en-IN')}`}>
              {isOverallProfit ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-1 text-xs text-text-muted truncate tabular-nums">Return: {totalPnLPercent.toFixed(2)}%</div>
          </div>
          <div className="card-surface p-5 min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider font-mono truncate">Total Holdings</span>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-mono">{holdings.length}</div>
            <PieIcon className="h-4 w-4 text-blue mt-1" />
          </div>
          <div className="card-surface p-5 min-w-0 overflow-hidden flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider font-mono truncate">Top Concentration</span>
            <div className="mt-2 text-xl font-bold truncate font-mono">
              {[...holdings].sort((a,b) => b.quantity * b.current_price - a.quantity * a.current_price)[0]?.symbol ?? 'N/A'}
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="lg:col-span-2"><h2 className="mb-3 text-base font-semibold text-text-primary">Position Breakdown ({holdings.length})</h2><HoldingsTable holdings={holdings} totalPortfolioValue={totalCurrentValue} onEdit={(holding) => { setEditingHolding(holding); setIsModalOpen(true) }} onDelete={handleDelete} /></div><div><AllocationChart holdings={holdings} /></div></div>
        <Link className="text-sm text-gold underline" to="/dashboard/risk-check">View portfolio risk analysis</Link>
      </>}
      <AddHoldingModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingHolding(null) }} onSave={(data) => { void handleSaveHolding(data); setIsModalOpen(false) }} editingHolding={editingHolding} catalog={catalog} />
    </div>
  )
}
export default PortfolioManager
