import React, { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Activity,
  Layers,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  fetchMarketIndices,
  fetchIntradayChart,
  type IndexQuote,
  type MarketStatusInfo,
  type IntradayChartPoint,
} from '../../services/api'

export const NiftyLiveWidget: React.FC = () => {
  const [indices, setIndices] = useState<IndexQuote[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string>('^NSEI')
  const [chartPoints, setChartPoints] = useState<IntradayChartPoint[]>([])
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [chartLoading, setChartLoading] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)

  // Fetch all indices and market status
  const loadMarketData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true)
    setError(null)
    try {
      const data = await fetchMarketIndices()
      setIndices(data.indices)
      setMarketStatus(data.market_status)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Fetch chart points for selected index
  const loadChartData = useCallback(async (symbol: string) => {
    setChartLoading(true)
    try {
      const res = await fetchIntradayChart(symbol, '5m', '1d')
      setChartPoints(res.points)
    } catch (err) {
      console.warn('Failed to load chart points for', symbol, err)
    } finally {
      setChartLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadMarketData()
  }, [loadMarketData])

  // Load chart when index selection changes
  useEffect(() => {
    loadChartData(selectedSymbol)
  }, [selectedSymbol, loadChartData])

  // Auto-refresh interval (every 20 seconds)
  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      loadMarketData(true)
    }, 20000)
    return () => clearInterval(timer)
  }, [autoRefresh, loadMarketData])

  const selectedQuote = indices.find((idx) => idx.symbol === selectedSymbol) || indices[0]
  const isPositive = selectedQuote ? selectedQuote.change >= 0 : true

  // Calculate 52-week progress percent if available
  const yearHigh = selectedQuote?.year_high ?? 0
  const yearLow = selectedQuote?.year_low ?? 0
  const currentPrice = selectedQuote?.current_price ?? 0
  const range52wPercent =
    yearHigh > yearLow
      ? Math.min(Math.max(((currentPrice - yearLow) / (yearHigh - yearLow)) * 100, 0), 100)
      : 50

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/50 transition-all">
      {/* Top Bar: Title, Live Indicator & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">NSE & BSE Live Markets</h2>
              {/* Session Status Pill */}
              {marketStatus && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    marketStatus.is_open
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      marketStatus.is_open ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  {marketStatus.session_label}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {marketStatus?.current_time_ist || 'Indian Standard Time'} • Hours: 09:15 - 15:30 IST
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium cursor-pointer ${
              autoRefresh
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={autoRefresh ? 'Auto-refresh active (every 20s)' : 'Auto-refresh paused'}
          >
            {autoRefresh ? 'Auto (20s)' : 'Manual'}
          </button>

          <button
            onClick={() => {
              loadMarketData()
              loadChartData(selectedSymbol)
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1 rounded-lg font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Index Selector Tabs */}
      <div className="flex items-center gap-2 pt-4 pb-4 overflow-x-auto no-scrollbar">
        {indices.length > 0 ? (
          indices.map((idx) => {
            const isSel = idx.symbol === selectedSymbol
            const isPos = idx.change >= 0
            return (
              <button
                key={idx.symbol}
                onClick={() => setSelectedSymbol(idx.symbol)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-left border transition whitespace-nowrap cursor-pointer ${
                  isSel
                    ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{idx.name}</div>
                  <div className="text-sm font-mono font-bold text-slate-100">
                    {idx.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    isPos
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {isPos ? '+' : ''}
                  {idx.change_percent.toFixed(2)}%
                </span>
              </button>
            )
          })
        ) : loading ? (
          <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
            <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
            Connecting to real-time market feeds...
          </div>
        ) : null}
      </div>

      {/* Main Quote & Chart Display */}
      {error ? (
        <div className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <span>{error}</span>
        </div>
      ) : selectedQuote ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Live Price & Key Metrics */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                Benchmark Index Quote
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                {selectedQuote.name} ({selectedQuote.symbol})
              </h3>

              {/* Big Price Display */}
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight text-white">
                  ₹{selectedQuote.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-base font-bold px-3 py-1 rounded-xl border ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {isPositive ? '+' : ''}
                  {selectedQuote.change.toFixed(2)} ({isPositive ? '+' : ''}
                  {selectedQuote.change_percent.toFixed(2)}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Prev Close: ₹{selectedQuote.previous_close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
                <div className="text-[11px] font-medium text-slate-400">Day's High</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                  ₹{selectedQuote.day_high?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '--'}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
                <div className="text-[11px] font-medium text-slate-400">Day's Low</div>
                <div className="text-sm font-mono font-bold text-rose-400 mt-0.5">
                  ₹{selectedQuote.day_low?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '--'}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
                <div className="text-[11px] font-medium text-slate-400">52-Week High</div>
                <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                  ₹{selectedQuote.year_high?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '--'}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
                <div className="text-[11px] font-medium text-slate-400">52-Week Low</div>
                <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                  ₹{selectedQuote.year_low?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '--'}
                </div>
              </div>
            </div>

            {/* 52-Week Range Progress Slider */}
            {yearHigh > 0 && yearLow > 0 && (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
                <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                  <span>52W Low (₹{yearLow.toLocaleString('en-IN')})</span>
                  <span>52W High (₹{yearHigh.toLocaleString('en-IN')})</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${range52wPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-right text-slate-500 mt-1">
                  Currently at {range52wPercent.toFixed(1)}% of 52-week band
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Intraday Recharts Trend */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                Intraday 5-Min Trajectory ({selectedQuote.name})
              </span>
              <span className="text-[11px] text-slate-500">
                {chartLoading ? 'Updating chart...' : `${chartPoints.length} candles`}
              </span>
            </div>

            <div className="h-56 w-full">
              {chartPoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isPositive ? '#10b981' : '#f43f5e'}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={isPositive ? '#10b981' : '#f43f5e'}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      minTickGap={25}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val: number) => val.toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any) => [
                        `₹${typeof val === 'number' ? val.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                        'Price',
                      ]}
                      labelFormatter={(label) => `Time: ${label} IST`}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? '#10b981' : '#f43f5e'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  {chartLoading ? 'Loading intraday trajectory...' : 'No intraday chart points available'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[11px] text-slate-500">
              <span>Feed source: NSE/BSE via YFinance Engine</span>
              <span className="flex items-center gap-1 text-blue-400">
                Live Data Connected <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
