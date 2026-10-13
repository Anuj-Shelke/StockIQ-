import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Holding, HoldingFormData, StockCatalogItem } from '@/types/portfolio'

interface AddHoldingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: HoldingFormData) => void
  editingHolding?: Holding | null
  catalog: StockCatalogItem[]
}

export function AddHoldingModal({
  isOpen,
  onClose,
  onSave,
  editingHolding,
  catalog,
}: AddHoldingModalProps) {
  const [symbol, setSymbol] = useState(editingHolding?.symbol || '')
  const [name, setName] = useState(editingHolding?.name || '')
  const [assetType, setAssetType] = useState(editingHolding?.asset_type || 'EQUITY')
  const [quantity, setQuantity] = useState(editingHolding?.quantity?.toString() || '1')
  const [buyPrice, setBuyPrice] = useState(editingHolding?.buy_price?.toString() || '')
  const [currentPrice, setCurrentPrice] = useState(
    editingHolding?.current_price?.toString() || ''
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form if editingHolding changes
  React.useEffect(() => {
    if (editingHolding) {
      setSymbol(editingHolding.symbol)
      setName(editingHolding.name || '')
      setAssetType(editingHolding.asset_type)
      setQuantity(editingHolding.quantity.toString())
      setBuyPrice(editingHolding.buy_price.toString())
      setCurrentPrice((editingHolding.current_price || editingHolding.buy_price).toString())
      setSearchQuery(editingHolding.symbol)
    } else {
      setSymbol('')
      setName('')
      setAssetType('EQUITY')
      setQuantity('1')
      setBuyPrice('')
      setCurrentPrice('')
      setSearchQuery('')
    }
    setErrors({})
  }, [editingHolding, isOpen])

  if (!isOpen) return null

  const filteredCatalog = catalog.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectStock = (item: StockCatalogItem) => {
    setSymbol(item.symbol)
    setName(item.name)
    setAssetType('EQUITY')
    setCurrentPrice(item.current_price.toString())
    if (!buyPrice) {
      setBuyPrice(item.current_price.toString())
    }
    setSearchQuery(item.symbol)
    setShowDropdown(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!symbol.trim()) errs.symbol = 'Symbol is required'
    const q = parseFloat(quantity)
    if (isNaN(q) || q <= 0) errs.quantity = 'Quantity must be greater than 0'
    const bp = parseFloat(buyPrice)
    if (isNaN(bp) || bp <= 0) errs.buyPrice = 'Buy price must be greater than 0'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onSave({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || undefined,
      asset_type: assetType,
      quantity: q,
      buy_price: bp,
      current_price: currentPrice ? parseFloat(currentPrice) : bp,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">
            {editingHolding ? 'Edit Holding' : 'Add Holding to Portfolio'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Autocomplete Search */}
          <div className="relative">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Search NSE Stock / Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. RELIANCE, TCS, INFY"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                  if (!symbol) setSymbol(e.target.value)
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
            {showDropdown && searchQuery && filteredCatalog.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-ink-900 shadow-xl">
                {filteredCatalog.map((item) => (
                  <button
                    type="button"
                    key={item.symbol}
                    onClick={() => handleSelectStock(item)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-white/10"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.symbol}</div>
                      <div className="text-slate-400">{item.name}</div>
                    </div>
                    <div className="font-mono text-gold-400">₹{item.current_price}</div>
                  </button>
                ))}
              </div>
            )}
            {errors.symbol && <p className="mt-1 text-xs text-rose-400">{errors.symbol}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Asset Type
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
              >
                <option value="EQUITY" className="bg-ink-900">Equity (NSE)</option>
                <option value="GOLD" className="bg-ink-900">Physical Gold</option>
                <option value="FD" className="bg-ink-900">Fixed Deposit</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Quantity / Shares
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
              />
              {errors.quantity && <p className="mt-1 text-xs text-rose-400">{errors.quantity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Buy Price (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Purchase price"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
              />
              {errors.buyPrice && <p className="mt-1 text-xs text-rose-400">{errors.buyPrice}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Current Market Price (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Market price"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
            >
              {editingHolding ? 'Update Holding' : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
