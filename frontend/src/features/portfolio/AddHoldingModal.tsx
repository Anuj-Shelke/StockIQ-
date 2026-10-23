import { useState, useEffect } from 'react'
import { X, Search, CheckCircle2, RefreshCw } from 'lucide-react'
import type { Holding, HoldingFormData, StockCatalogItem } from '@/types/portfolio'
import { apiFetch } from '@/services/api'

interface AddHoldingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (holding: HoldingFormData) => void
  catalog: StockCatalogItem[]
  editingHolding?: Holding | null
}

export function AddHoldingModal({
  isOpen,
  onClose,
  onSave,
  catalog,
  editingHolding,
}: AddHoldingModalProps) {
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState('EQUITY')
  const [quantity, setQuantity] = useState('1')
  const [buyPrice, setBuyPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCustomStock, setIsCustomStock] = useState(false)
  const [exchangeFilter, setExchangeFilter] = useState<'ALL' | 'NSE' | 'BSE'>('ALL')
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [liveQuote, setLiveQuote] = useState<{ price: number; change?: number; changePercent?: number; updatedAt?: string } | null>(null)

  useEffect(() => {
    if (editingHolding) {
      setSymbol(editingHolding.symbol)
      setName(editingHolding.name || '')
      setAssetType(editingHolding.asset_type || 'EQUITY')
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
      setLiveQuote(null)
    }
    setErrors({})
  }, [editingHolding, isOpen])

  if (!isOpen) return null

  const isEquity = assetType === 'EQUITY' || assetType.toLowerCase() === 'stock'
  const isGold = assetType.toLowerCase() === 'gold'
  const isFixedDeposit = assetType.toLowerCase() === 'fd'
  const isOther = assetType.toLowerCase() === 'other'
  const isManualAsset = !isEquity

  const filteredCatalog = catalog.filter((item) => {
    if (exchangeFilter !== 'ALL' && item.exchange?.toUpperCase() !== exchangeFilter) {
      return false
    }
    const q = searchQuery.toLowerCase()
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      (item.sector && item.sector.toLowerCase().includes(q))
    )
  })

  const fetchLiveQuote = async (targetSymbol: string) => {
    if (!targetSymbol) return
    setFetchingPrice(true)
    try {
      const q = await apiFetch<any>(`/stocks/quote/${encodeURIComponent(targetSymbol)}`)
      if (q && q.current_price > 0) {
        setCurrentPrice(q.current_price.toString())
        if (!buyPrice) {
          setBuyPrice(q.current_price.toString())
        }
        if (q.name && !name) {
          setName(q.name)
        }
        setLiveQuote({
          price: q.current_price,
          change: q.change,
          changePercent: q.change_percent,
          updatedAt: q.updated_at,
        })
      }
    } catch {
      // Fallback cleanly
    } finally {
      setFetchingPrice(false)
    }
  }

  const handleAssetTypeChange = (value: string) => {
    setAssetType(value)
    setSymbol(value === 'GOLD' ? 'GOLD' : value === 'FD' ? 'FD' : '')
    setName(value === 'GOLD' ? 'Gold' : value === 'FD' ? 'Fixed Deposit' : '')
    setSearchQuery('')
    setShowDropdown(false)
    setIsCustomStock(false)
    setCurrentPrice('')
    setBuyPrice('')
    setQuantity(value === 'FD' ? '1' : '1')
    setLiveQuote(null)
    setErrors({})
  }

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
    void fetchLiveQuote(item.symbol)
  }

  const handleAddCustomTicker = (exchange: 'NSE' | 'BSE' = 'NSE') => {
    const raw = searchQuery.trim().toUpperCase()
    let ticker = raw.replace(/^(NSE|BSE):/, '').replace(/(\.NS|\.BO)$/, '')
    if (!/^[A-Z0-9&_-]{1,20}$/.test(ticker)) {
      setErrors({ symbol: `Enter a valid ${exchange} ticker symbol, for example SBIN or 500325.` })
      return
    }
    const fullSym = exchange === 'BSE' ? `${ticker}.BO` : `${ticker}.NS`
    setSymbol(fullSym)
    setName('')
    setAssetType('EQUITY')
    setIsCustomStock(true)
    setShowDropdown(false)
    setErrors({})
    void fetchLiveQuote(fullSym)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (isEquity && !symbol.trim()) errs.symbol = 'Choose or enter a stock symbol'
    if (isCustomStock && !name.trim()) errs.name = 'Company name is required for a custom ticker'
    if (isManualAsset && !name.trim()) errs.name = 'Enter an investment name'

    const q = parseFloat(quantity)
    if (isNaN(q) || q <= 0) errs.quantity = 'Quantity must be greater than 0'
    const bp = parseFloat(buyPrice)
    if (isNaN(bp) || bp <= 0) errs.buyPrice = 'Buy price must be greater than 0'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const customSymbol = isOther && !editingHolding
      ? `OTHER-${name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 8)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
      : symbol.trim().toUpperCase()

    onSave({
      symbol: customSymbol,
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
              {editingHolding ? 'Edit Holding' : 'Add Position to Portfolio'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Select or search any NSE &amp; BSE stock with real-time market synchronization
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">What are you adding?</label>
            <select value={assetType.toUpperCase() === 'STOCK' ? 'EQUITY' : assetType.toUpperCase()} onChange={(e) => handleAssetTypeChange(e.target.value)} className="input-default">
              <option value="EQUITY">Indian share (NSE/BSE)</option>
              <option value="GOLD">Physical Gold / ETF</option>
              <option value="FD">Fixed Deposit</option>
              <option value="OTHER">Other investment</option>
            </select>
          </div>

          {/* Autocomplete Search for Equities */}
          {isEquity && (
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                  Search NSE &amp; BSE Stocks ({catalog.length} available)
                </label>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  {(['ALL', 'NSE', 'BSE'] as const).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setExchangeFilter(ex)}
                      className={`px-2 py-0.5 rounded border ${
                        exchangeFilter === ex
                          ? 'border-gold text-gold bg-gold/10'
                          : 'border-theme-subtle text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search symbol (e.g. RELIANCE, TCS, SBIN, HDFCBANK, 500325)"
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

              {/* Dropdown Results */}
              {showDropdown && searchQuery && filteredCatalog.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-theme-default bg-surface-elevated shadow-xl divide-y divide-theme-subtle">
                  {filteredCatalog.map((item) => (
                    <button
                      type="button"
                      key={item.symbol}
                      onClick={() => handleSelectStock(item)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition hover:bg-surface-hover"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-text-primary font-mono">
                          <span>{item.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-theme-subtle text-text-muted">
                            {item.exchange || 'NSE'}
                          </span>
                        </div>
                        <div className="text-text-muted text-[11px] truncate max-w-[280px]">{item.name}</div>
                        {item.sector && <div className="text-[10px] text-text-muted/70">{item.sector}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-gold font-bold">₹{item.current_price?.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-gain">Live price</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && searchQuery.trim() && filteredCatalog.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-theme-default bg-surface-elevated p-3 shadow-xl space-y-2">
                  <p className="text-[11px] text-text-muted">
                    Custom symbol entered. Add directly with live market price sync:
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddCustomTicker('NSE')}
                      className="flex-1 rounded-md px-3 py-1.5 text-center text-xs font-semibold bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
                    >
                      Add {searchQuery.trim().toUpperCase()} (NSE)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCustomTicker('BSE')}
                      className="flex-1 rounded-md px-3 py-1.5 text-center text-xs font-semibold bg-blue/10 text-blue border border-blue/30 hover:bg-blue/20"
                    >
                      Add {searchQuery.trim().toUpperCase()} (BSE)
                    </button>
                  </div>
                </div>
              )}
              {errors.symbol && <p className="mt-1 text-xs text-loss">{errors.symbol}</p>}
            </div>
          )}

          {/* Selected Stock Live Banner */}
          {isEquity && symbol && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-text-primary">{symbol}</span>
                {name && <span className="ml-2 text-text-muted">({name})</span>}
                {liveQuote && (
                  <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                    <span className="text-gain flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Live Real-Time Price: ₹{liveQuote.price.toLocaleString('en-IN')}
                    </span>
                    {liveQuote.changePercent !== undefined && (
                      <span className={`font-mono ${liveQuote.changePercent >= 0 ? 'text-gain' : 'text-loss'}`}>
                        ({liveQuote.changePercent >= 0 ? '+' : ''}{liveQuote.changePercent.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => void fetchLiveQuote(symbol)}
                disabled={fetchingPrice}
                className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1"
                title="Refresh Real-Time Quote"
              >
                <RefreshCw className={`w-3 h-3 ${fetchingPrice ? 'animate-spin' : ''}`} />
                <span>{fetchingPrice ? 'Syncing...' : 'Live Sync'}</span>
              </button>
            </div>
          )}

          {!isEquity && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">{isGold ? 'Holding name' : isFixedDeposit ? 'Deposit name' : 'Investment name'}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-default" placeholder={isGold ? 'e.g. 24K gold / Sovereign Gold Bond' : isFixedDeposit ? 'e.g. HDFC 1-Year FD' : 'e.g. Life Insurance Policy'} maxLength={100} />
              <p className="mt-1 text-[11px] text-text-muted">Manually tracked investment; reference prices are managed by you.</p>
              {errors.name && <p className="mt-1 text-xs text-loss">{errors.name}</p>}
            </div>
          )}

          {isEquity && isCustomStock && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                Company Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter company name"
                className="input-default"
                maxLength={255}
              />
              {errors.name && <p className="mt-1 text-xs text-loss">{errors.name}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                {isEquity ? 'Shares' : isGold ? 'Quantity (grams)' : isFixedDeposit ? 'Deposit units' : 'Units / policies'}
              </label>
              <input
                type="number"
                step="any"
                min={isFixedDeposit ? '1' : '0.001'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-default font-mono"
              />
              {errors.quantity && <p className="mt-1 text-xs text-loss">{errors.quantity}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                {isFixedDeposit ? 'Principal (₹)' : isGold ? 'Purchase price (₹ / gram)' : isOther ? 'Purchase value (₹ / unit)' : 'Buy price (₹ / share)'}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary">
                  {isFixedDeposit ? 'Current value (₹)' : isGold ? 'Current value (₹ / gram)' : isOther ? 'Current value (₹ / unit)' : 'Current price (₹ / share)'}
                </label>
                {isEquity && <span className="text-[10px] text-gain font-mono">Live Sync</span>}
              </div>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder={isEquity ? 'Live market price' : 'Enter current value'}
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
              {editingHolding ? 'Update Position' : 'Save Position to Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
