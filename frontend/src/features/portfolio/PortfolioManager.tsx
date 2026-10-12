import { useEffect, useState } from 'react'
import { Plus, ArrowUpRight, TrendingUp, DollarSign, PieChart as PieIcon, RefreshCw } from 'lucide-react'
import { AllocationChart } from './AllocationChart'
import { HoldingsTable } from './HoldingsTable'
import { AddHoldingModal } from './AddHoldingModal'
import type { Holding, HoldingFormData, StockCatalogItem } from '@/types/portfolio'

const SAMPLE_CATALOG: StockCatalogItem[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Energy', current_price: 2980.50, currency: 'INR' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', exchange: 'NSE', sector: 'IT', current_price: 4120.25, currency: 'INR' },
  { symbol: 'INFY.NS', name: 'Infosys Ltd.', exchange: 'NSE', sector: 'IT', current_price: 1890.10, currency: 'INR' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', exchange: 'NSE', sector: 'Financials', current_price: 1650.80, currency: 'INR' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', exchange: 'NSE', sector: 'Financials', current_price: 1210.45, currency: 'INR' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd.', exchange: 'NSE', sector: 'Automotive', current_price: 975.30, currency: 'INR' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', sector: 'Financials', current_price: 825.60, currency: 'INR' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', exchange: 'NSE', sector: 'Telecom', current_price: 1480.00, currency: 'INR' },
  { symbol: 'GOLD_24K', name: 'Physical Gold (24K / 10g)', exchange: 'MCX', sector: 'Commodities', current_price: 75400.00, currency: 'INR' },
  { symbol: 'HDFC_FD_1Y', name: 'HDFC Bank Fixed Deposit (1Y @ 7.1%)', exchange: 'BANK', sector: 'Fixed Income', current_price: 100000.00, currency: 'INR' },
]

const INITIAL_HOLDINGS: Holding[] = [
  {
    id: 'hold-1',
    portfolio_id: 'default-p1',
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    asset_type: 'EQUITY',
    quantity: 35,
    buy_price: 2750.00,
    current_price: 2980.50,
  },
  {
    id: 'hold-2',
    portfolio_id: 'default-p1',
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services Ltd.',
    asset_type: 'EQUITY',
    quantity: 20,
    buy_price: 3890.00,
    current_price: 4120.25,
  },
  {
    id: 'hold-3',
    portfolio_id: 'default-p1',
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd.',
    asset_type: 'EQUITY',
    quantity: 45,
    buy_price: 1540.00,
    current_price: 1650.80,
  },
  {
    id: 'hold-4',
    portfolio_id: 'default-p1',
    symbol: 'GOLD_24K',
    name: 'Physical Gold (24K)',
    asset_type: 'GOLD',
    quantity: 1,
    buy_price: 71200.00,
    current_price: 75400.00,
  },
]

export function PortfolioManager() {
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem('stockiq.portfolio.holdings')
    return saved ? JSON.parse(saved) : INITIAL_HOLDINGS
  })
  const [catalog, setCatalog] = useState<StockCatalogItem[]>(SAMPLE_CATALOG)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('stockiq.portfolio.holdings', JSON.stringify(holdings))
  }, [holdings])

  // Fetch live stocks catalog from backend if available
  useEffect(() => {
    fetch('/api/v1/stocks?limit=50')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stocks && Array.isArray(data.stocks) && data.stocks.length > 0) {
          setCatalog(data.stocks)
        }
      })
      .catch(() => {
        // Fallback to sample catalog
      })
  }, [])

  const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * h.buy_price, 0)
  const totalCurrentValue = holdings.reduce(
    (sum, h) => sum + h.quantity * (h.current_price || h.buy_price),
    0
  )
  const totalPnL = totalCurrentValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
  const isOverallProfit = totalPnL >= 0

  const handleSaveHolding = (formData: HoldingFormData) => {
    if (editingHolding) {
      setHoldings((prev) =>
        prev.map((h) =>
          h.id === editingHolding.id
            ? {
                ...h,
                ...formData,
                current_price: formData.current_price || formData.buy_price,
              }
            : h
        )
      )
    } else {
      const newHolding: Holding = {
        id: `hold-${Date.now()}`,
        portfolio_id: 'default-p1',
        ...formData,
        current_price: formData.current_price || formData.buy_price,
        created_at: new Date().toISOString(),
      }
      setHoldings((prev) => [newHolding, ...prev])
    }
    setEditingHolding(null)
  }

  const handleEdit = (holding: Holding) => {
    setEditingHolding(holding)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this holding?')) {
      setHoldings((prev) => prev.filter((h) => h.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Portfolio Management
          </h1>
          <p className="text-sm text-slate-400">
            Real-time equity and multi-asset position tracking with quantitative allocation analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingHolding(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-lg shadow-gold-500/20 transition hover:bg-gold-400"
          >
            <Plus className="h-4 w-4" />
            Add Holding
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Total Value</span>
            <DollarSign className="h-4 w-4 text-gold-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            ₹{totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Invested: ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Unrealized P&L</span>
            <TrendingUp className={`h-4 w-4 ${isOverallProfit ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div
            className={`mt-2 text-2xl font-bold font-mono ${
              isOverallProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isOverallProfit ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Return: {isOverallProfit ? '+' : ''}
            {totalPnLPercent.toFixed(2)}%
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Total Holdings</span>
            <PieIcon className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {holdings.length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Across {new Set(holdings.map((h) => h.asset_type)).size} asset classes
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Top Concentration</span>
            <ArrowUpRight className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white truncate">
            {holdings.length > 0
              ? [...holdings].sort(
                  (a, b) =>
                    b.quantity * (b.current_price || b.buy_price) -
                    a.quantity * (a.current_price || a.buy_price)
                )[0].symbol.replace('.NS', '')
              : 'N/A'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Largest individual weight
          </div>
        </div>
      </div>

      {/* Grid: Table & Allocation Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Holdings Details</h2>
            <button
              onClick={() => {
                setHoldings([...INITIAL_HOLDINGS])
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
              title="Reset to sample holdings"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Sample
            </button>
          </div>
          <HoldingsTable
            holdings={holdings}
            totalPortfolioValue={totalCurrentValue}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <div className="lg:col-span-1">
          <AllocationChart holdings={holdings} />
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddHoldingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingHolding(null)
        }}
        onSave={handleSaveHolding}
        editingHolding={editingHolding}
        catalog={catalog}
      />
    </div>
  )
}
export default PortfolioManager
