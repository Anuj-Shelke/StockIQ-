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
  const [isCustomStock, setIsCustomStock] = useState(false)
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
      setIsCustomStock(false)
    } else {
      setSymbol('')
      setName('')
      setAssetType('EQUITY')
      setQuantity('1')
      setBuyPrice('')
      setCurrentPrice('')
      setSearchQuery('')
      setIsCustomStock(false)
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
    setIsCustomStock(false)
  }

  const handleAddNseTicker = () => {
    const enteredTicker = searchQuery.trim().toUpperCase().replace(/^NSE:/, '')
    const ticker = enteredTicker.replace(/\.NS$/, '')
    if (!/^[A-Z0-9&_-]{1,20}$/.test(ticker)) {
      setErrors({ symbol: 'Enter a valid NSE ticker symbol, for example SBIN or TATAPOWER.' })
      return
    }
    setSymbol(`${ticker}.NS`)
    setName('')
    setAssetType('EQUITY')
    setCurrentPrice('')
    setBuyPrice('')
    setIsCustomStock(true)
    setShowDropdown(false)
    setErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!symbol.trim()) errs.symbol = 'Symbol is required'
    if (isCustomStock && !name.trim()) errs.name = 'Company name is required for a custom NSE ticker'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-theme-default bg-surface p-6 shadow-2xl text-text-primary">
        <div className="mb-6 flex items-center justify-between border-b border-theme-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-text-primary">
              {editingHolding ? 'Edit Position' : 'Add Position to Portfolio'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Configure asset parameters for risk & allocation analytics</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Autocomplete Search */}
          <div className="relative">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
              Search NSE Stock / Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
              placeholder="Search or enter an NSE symbol, e.g. SBIN"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                  if (!symbol) setSymbol(e.target.value)
                }}
                onFocus={() => setShowDropdown(true)}
                className="input-default pl-9 font-mono"
              />
            </div>
            {showDropdown && searchQuery && filteredCatalog.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-theme-default bg-surface-elevated shadow-xl">
                {filteredCatalog.map((item) => (
                  <button
                    type="button"
                    key={item.symbol}
                    onClick={() => handleSelectStock(item)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-surface-hover"
                  >
                    <div>
                      <div className="font-semibold text-text-primary font-mono">{item.symbol}</div>
                      <div className="text-text-muted text-[11px]">{item.name}</div>
                    </div>
                    <div className="font-mono text-gold font-medium">₹{item.current_price}</div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && searchQuery.trim() && filteredCatalog.length === 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-theme-default bg-surface-elevated p-3 shadow-xl">
                <p className="mb-2 text-[11px] text-text-muted">Not in the starter list? Add any NSE ticker and enter its company name and reference prices.</p>
                <button type="button" onClick={handleAddNseTicker} className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-gold transition hover:bg-surface-hover">
                  Add “{searchQuery.trim().toUpperCase()}” as an NSE share
                </button>
              </div>
            )}
            {errors.symbol && <p className="mt-1 text-xs text-loss">{errors.symbol}</p>}
          </div>

          {isCustomStock && <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">Company Name</label>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter the listed company name" className="input-default" maxLength={255} />
            <p className="mt-1 text-[11px] text-text-muted">Ticker: {symbol}. Confirm the NSE symbol and use your own reference prices for this demo holding.</p>
            {errors.name && <p className="mt-1 text-xs text-loss">{errors.name}</p>}
          </div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                Asset Class
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="input-default"
              >
                <option value="EQUITY" className="bg-surface text-text-primary">Equity (NSE)</option>
                <option value="GOLD" className="bg-surface text-text-primary">Physical Gold</option>
                <option value="FD" className="bg-surface text-text-primary">Fixed Deposit</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                Quantity / Shares
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-default font-mono"
              />
              {errors.quantity && <p className="mt-1 text-xs text-loss">{errors.quantity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                Buy Price (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Purchase price"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="input-default font-mono"
              />
              {errors.buyPrice && <p className="mt-1 text-xs text-loss">{errors.buyPrice}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                Current Price (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Market price"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="input-default font-mono"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-theme-subtle">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gold"
            >
              {editingHolding ? 'Update Position' : 'Save Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
