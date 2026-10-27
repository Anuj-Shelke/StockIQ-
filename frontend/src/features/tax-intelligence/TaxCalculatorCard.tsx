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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Transaction Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Symbol (NSE / BSE)
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
              placeholder="e.g. RELIANCE.NS"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Quantity Sold
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Sale Price per Share (₹)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Sale Date
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Acquisition Mode Switch */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Cost of Acquisition Basis:</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {useLots ? 'Multi-lot FIFO matching' : 'Single acquisition lot'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUseLots(!useLots)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-primary)] hover:underline"
          >
            <Layers className="h-3.5 w-3.5" />
            {useLots ? 'Switch to Single Lot' : 'Switch to Multiple FIFO Lots'}
          </button>
        </div>

        {/* Single Lot Inputs */}
        {!useLots && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Purchase Price per Share (₹)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Multi-Lot FIFO Inputs */}
        {useLots && (
          <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Acquisition Lots (Allocated First-In First-Out)
              </span>
              <button
                type="button"
                onClick={addLot}
                className="flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-white/5 px-2.5 py-1 text-xs font-semibold text-[var(--gold-primary)] hover:bg-white/10"
              >
                <Plus className="h-3 w-3" />
                Add Lot
              </button>
            </div>

            <div className="space-y-2">
              {lots.map((lot, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-xs"
                >
                  <div className="col-span-3">
                    <span className="block text-[10px] text-[var(--text-muted)]">Lot ID / Ref</span>
                    <input
                      type="text"
                      value={lot.lot_id}
                      onChange={(e) => handleLotChange(idx, 'lot_id', e.target.value)}
                      className="w-full rounded bg-transparent px-2 py-1 font-medium text-[var(--text-primary)] border border-transparent focus:border-[var(--gold-primary)] focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-3">
                    <span className="block text-[10px] text-[var(--text-muted)]">Date</span>
                    <input
                      type="date"
                      value={lot.purchase_date}
                      onChange={(e) => handleLotChange(idx, 'purchase_date', e.target.value)}
                      className="w-full rounded bg-transparent px-2 py-1 font-medium text-[var(--text-primary)] border border-transparent focus:border-[var(--gold-primary)] focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-[var(--text-muted)]">Qty</span>
                    <input
                      type="number"
                      min="1"
                      value={lot.quantity}
                      onChange={(e) =>
                        handleLotChange(idx, 'quantity', parseInt(e.target.value) || 0)
                      }
                      className="w-full rounded bg-transparent px-2 py-1 font-medium text-[var(--text-primary)] border border-transparent focus:border-[var(--gold-primary)] focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-3">
                    <span className="block text-[10px] text-[var(--text-muted)]">Buy Price (₹)</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={lot.purchase_price}
                      onChange={(e) =>
                        handleLotChange(idx, 'purchase_price', parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded bg-transparent px-2 py-1 font-medium text-[var(--text-primary)] border border-transparent focus:border-[var(--gold-primary)] focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {lots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLot(idx)}
                        className="p-1 text-rose-400 hover:text-rose-300"
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

        {/* Expenses & Exemption Adjustments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Eligible Transfer Expenses (₹)
              </label>
              <span
                className="cursor-help text-[var(--text-muted)]"
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
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
              placeholder="0.00"
            />
            <span className="mt-1 block text-[10px] text-[var(--text-muted)]">
              STT is non-deductible under Section 48 of the Income Tax Act.
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Prior LTCG Realized this Financial Year (₹)
              </label>
              <span
                className="cursor-help text-[var(--text-muted)]"
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
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--gold-primary)] focus:outline-hidden"
              placeholder="e.g. 25000"
            />
            <span className="mt-1 block text-[10px] text-[var(--text-muted)]">
              Deducted from the ₹1,25,000 statutory annual Section 112A threshold.
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Computing Statutory Tax...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Calculate Capital Gains & XAI Explanation
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
