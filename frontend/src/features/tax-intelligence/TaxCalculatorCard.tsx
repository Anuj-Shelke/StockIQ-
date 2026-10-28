import { useState } from 'react'
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react'
import type { AcquisitionLotInput, TaxCalculateRequest } from '@/types/tax'

interface TaxCalculatorCardProps {
  onCalculate: (req: TaxCalculateRequest) => void
  isLoading?: boolean
}

export function TaxCalculatorCard({ onCalculate, isLoading = false }: TaxCalculatorCardProps) {
  const [symbol, setSymbol] = useState('RELIANCE.NS')
  const [quantity, setQuantity] = useState<number>(100)
  const [salePrice, setSalePrice] = useState<number>(2950)
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [purchasePrice, setPurchasePrice] = useState<number>(2900)
  const [purchaseDate, setPurchaseDate] = useState<string>('2024-09-01')
  const [eligibleExpenses, setEligibleExpenses] = useState<number>(0)
  const [priorLtcgInFy, setPriorLtcgInFy] = useState<number>(0)
  const [useLots, setUseLots] = useState<boolean>(false)
  const [lots, setLots] = useState<AcquisitionLotInput[]>([
    { lot_id: 'LOT-1', purchase_date: '2023-01-15', quantity: 50, purchase_price: 2400 },
    { lot_id: 'LOT-2', purchase_date: '2024-08-10', quantity: 50, purchase_price: 2850 },
  ])

  // Presets
  const applyPreset = (type: 'stcg' | 'ltcg' | 'fifo' | 'prebudget') => {
    if (type === 'stcg') {
      setUseLots(false)
      setSymbol('RELIANCE.NS')
      setQuantity(100)
      setSalePrice(2950)
      setSaleDate('2024-10-15')
      setPurchasePrice(2900)
      setPurchaseDate('2024-08-15')
      setEligibleExpenses(50)
      setPriorLtcgInFy(0)
    } else if (type === 'ltcg') {
      setUseLots(false)
      setSymbol('TCS.NS')
      setQuantity(100)
      setSalePrice(4300)
      setSaleDate('2024-11-01')
      setPurchasePrice(2300)
      setPurchaseDate('2022-05-10')
      setEligibleExpenses(100)
      setPriorLtcgInFy(0)
    } else if (type === 'fifo') {
      setUseLots(true)
      setSymbol('INFY.NS')
      setQuantity(120)
      setSalePrice(1900)
      setSaleDate('2024-10-20')
      setLots([
        { lot_id: 'LOT-1', purchase_date: '2023-02-10', quantity: 50, purchase_price: 1500 },
        { lot_id: 'LOT-2', purchase_date: '2024-06-01', quantity: 70, purchase_price: 1750 },
      ])
      setEligibleExpenses(120)
    } else if (type === 'prebudget') {
      setUseLots(false)
      setSymbol('HDFCBANK.NS')
      setQuantity(100)
      setSalePrice(1650)
      setSaleDate('2024-05-15') // Prior to 23 July 2024
      setPurchasePrice(1500)
      setPurchaseDate('2024-01-10')
      setEligibleExpenses(40)
      setPriorLtcgInFy(0)
    }
  }

  const handleLotChange = (index: number, field: keyof AcquisitionLotInput, value: any) => {
    const updated = [...lots]
    updated[index] = { ...updated[index], [field]: value }
    setLots(updated)
  }

  const addLot = () => {
    setLots([
      ...lots,
      {
        lot_id: `LOT-${lots.length + 1}`,
        purchase_date: '2024-01-01',
        quantity: 10,
        purchase_price: 1000,
      },
    ])
  }

  const removeLot = (index: number) => {
    setLots(lots.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload: TaxCalculateRequest = {
      symbol: symbol.trim().toUpperCase(),
      sale_date: saleDate,
      quantity: Number(quantity),
      sale_price: Number(salePrice),
      eligible_expenses: Number(eligibleExpenses) || 0,
      prior_ltcg_in_fy: Number(priorLtcgInFy) || 0,
      save_record: true,
    }

    if (useLots) {
      payload.lots = lots.map((lot) => ({
        lot_id: lot.lot_id,
        purchase_date: lot.purchase_date,
        quantity: Number(lot.quantity),
        purchase_price: Number(lot.purchase_price),
      }))
    } else {
      payload.purchase_price = Number(purchasePrice)
      payload.purchase_date = purchaseDate
    }

    onCalculate(payload)
  }

  return (
    <div className="card-surface p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-[var(--gold-soft)] text-[var(--gold-primary)]">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Capital Gains Tax Calculator
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Deterministic statutory calculation with Section 111A, 112A, and Budget 2024 rules.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-[var(--text-muted)] mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('stcg')}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:border-[var(--gold-primary)] hover:text-[var(--text-primary)]"
          >
            STCG 20%
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ltcg')}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:border-[var(--gold-primary)] hover:text-[var(--text-primary)]"
          >
            LTCG 12.5%
          </button>
          <button
            type="button"
            onClick={() => applyPreset('fifo')}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:border-[var(--gold-primary)] hover:text-[var(--text-primary)]"
          >
            FIFO Lots
          </button>
          <button
            type="button"
            onClick={() => applyPreset('prebudget')}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:border-[var(--gold-primary)] hover:text-[var(--text-primary)]"
          >
            Pre-Budget
          </button>
        </div>
      </div>

      {/* Live Computation Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-theme-subtle bg-surface-elevated/30">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted block">Gross Proceeds</span>
          <span className="font-mono text-sm sm:text-base font-bold text-text-primary">
            ₹{(Math.round(quantity * salePrice)).toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted block">Est. Acquisition Cost</span>
          <span className="font-mono text-sm sm:text-base font-bold text-text-primary">
            ₹{useLots 
              ? lots.reduce((acc, l) => acc + (l.quantity * l.purchase_price), 0).toLocaleString('en-IN')
              : (Math.round(quantity * purchasePrice)).toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted block">Estimated Holding</span>
          <span className="font-mono text-sm sm:text-base font-bold text-gold">
            {!useLots && saleDate && purchaseDate ? (
              (() => {
                const diffDays = Math.round((new Date(saleDate).getTime() - new Date(purchaseDate).getTime()) / (1000 * 3600 * 24))
                if (diffDays >= 365) return `${(diffDays / 365).toFixed(1)} Yrs (LTCG)`
                return `${Math.max(1, Math.round(diffDays / 30))} Mos (STCG)`
              })()
            ) : 'Multi-Lot FIFO'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted block">Budget 2024 Regime</span>
          <span className="font-mono text-xs sm:text-sm font-semibold text-emerald-400">
            {new Date(saleDate) >= new Date('2024-07-23') ? 'New Post-Budget Rates' : 'Pre-Budget 2024'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sale & Disposal Transaction Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              1. Sale / Disposal Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Asset Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary uppercase font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
                placeholder="e.g. RELIANCE.NS"
              />
              <span className="text-[10px] text-text-muted block">NSE / BSE Ticker</span>
            </div>

            <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Units Sold
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                required
                className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
              />
              <span className="text-[10px] text-text-muted block">Total shares disposed</span>
            </div>

            <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Sale Price / Unit (₹)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
              />
              <span className="text-[10px] text-text-muted block">Realized market price</span>
            </div>

            <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Sale Date
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
                className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
              />
              <span className="text-[10px] text-text-muted block">Determines Budget 2024 regime</span>
            </div>
          </div>
        </div>

        {/* Acquisition Mode & Purchase Details */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                2. Cost of Acquisition (Purchase)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setUseLots(!useLots)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
            >
              <Layers className="h-4 w-4" />
              {useLots ? 'Switch to Single Acquisition Lot' : 'Switch to Multiple FIFO Lots'}
            </button>
          </div>

          {/* Single Lot Inputs */}
          {!useLots && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Purchase Price per Share (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
                />
                <span className="text-[10px] text-text-muted block">
                  Original cost of acquisition
                </span>
              </div>

              <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Acquisition / Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
                />
                <span className="text-[10px] text-text-muted block">
                  Used to evaluate &gt; 12-month holding for Section 112A
                </span>
              </div>
            </div>
          )}

          {/* Multi-Lot FIFO Inputs */}
          {useLots && (
            <div className="space-y-3 rounded-2xl border border-theme-subtle bg-surface-elevated/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Acquisition Lots (Allocated First-In First-Out)
                  </span>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Lots are depleted in chronological order per Section 45(2A) depository rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addLot}
                  className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Acquisition Lot
                </button>
              </div>

              <div className="space-y-3">
                {lots.map((lot, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-3 items-center rounded-xl border border-theme-subtle bg-surface-elevated/60 p-3 text-xs"
                  >
                    <div className="col-span-3">
                      <span className="block text-[10px] font-semibold text-text-muted uppercase mb-1">Lot Ref</span>
                      <input
                        type="text"
                        value={lot.lot_id}
                        onChange={(e) => handleLotChange(idx, 'lot_id', e.target.value)}
                        className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-xs font-semibold text-text-primary border border-theme-subtle focus:border-gold focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-3">
                      <span className="block text-[10px] font-semibold text-text-muted uppercase mb-1">Purchase Date</span>
                      <input
                        type="date"
                        value={lot.purchase_date}
                        onChange={(e) => handleLotChange(idx, 'purchase_date', e.target.value)}
                        className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-xs font-semibold text-text-primary border border-theme-subtle focus:border-gold focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] font-semibold text-text-muted uppercase mb-1">Lot Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={lot.quantity}
                        onChange={(e) =>
                          handleLotChange(idx, 'quantity', parseInt(e.target.value) || 0)
                        }
                        className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-xs font-semibold text-text-primary border border-theme-subtle focus:border-gold focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <span className="block text-[10px] font-semibold text-text-muted uppercase mb-1">Price (₹)</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={lot.purchase_price}
                        onChange={(e) =>
                          handleLotChange(idx, 'purchase_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-xs font-semibold text-text-primary border border-theme-subtle focus:border-gold focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {lots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLot(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                          title="Remove lot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses & Exemption Adjustments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              3. Deductions &amp; Statutory Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Eligible Transfer Expenses (₹)
                </label>
                <span
                  className="cursor-help text-text-muted"
                  title="Brokerage, stamp duty, exchange turnover fee. Note: Securities Transaction Tax (STT) is NOT deductible per Section 48."
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={eligibleExpenses}
                onChange={(e) => setEligibleExpenses(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
                placeholder="0.00"
              />
              <span className="text-[10px] text-text-muted block">
                Brokerage &amp; stamp duty allowed. STT non-deductible under Sec 48.
              </span>
            </div>

            <div className="card-surface p-4 border border-theme-subtle rounded-xl space-y-1.5 focus-within:border-gold/60 transition">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Prior LTCG Realized this FY (₹)
                </label>
                <span
                  className="cursor-help text-text-muted"
                  title="Cumulative LTCG realized earlier in the year. The annual Section 112A threshold is ₹1,25,000 across all equity trades."
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={priorLtcgInFy}
                onChange={(e) => setPriorLtcgInFy(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-theme-subtle bg-surface-elevated/70 px-4 py-3 text-sm font-semibold text-text-primary font-mono focus:border-gold focus:outline-hidden focus:ring-1 focus:ring-gold/30"
                placeholder="e.g. 25000"
              />
              <span className="text-[10px] text-text-muted block">
                Subtracted from ₹1,25,000 Section 112A annual exemption.
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Computing Statutory Tax...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Calculate Capital Gains &amp; XAI Explanation
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
