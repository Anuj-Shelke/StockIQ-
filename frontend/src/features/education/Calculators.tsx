import { useState } from 'react'
import { Calculator } from 'lucide-react'

export function Calculators() {
  const [activeTab, setActiveTab] = useState<'cagr' | 'sip' | 'volatility'>('sip')

  // SIP Calculator State
  const [sipAmount, setSipAmount] = useState<number>(10000)
  const [sipRate, setSipRate] = useState<number>(12)
  const [sipYears, setSipYears] = useState<number>(10)

  // CAGR Calculator State
  const [cagrStart, setCagrStart] = useState<number>(50000)
  const [cagrEnd, setCagrEnd] = useState<number>(150000)
  const [cagrYears, setCagrYears] = useState<number>(5)

  // Volatility Calculator State
  const [annualStdDev, setAnnualStdDev] = useState<number>(18)
  const [confidenceZ, setConfidenceZ] = useState<number>(1.645) // 90% VaR

  // SIP Math
  const totalMonths = sipYears * 12
  const monthlyRate = sipRate / 100 / 12
  const sipFutureValue =
    monthlyRate > 0
      ? sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
      : sipAmount * totalMonths
  const sipInvested = sipAmount * totalMonths
  const sipReturns = sipFutureValue - sipInvested

  // CAGR Math
  const cagrResult =
    cagrStart > 0 && cagrYears > 0 ? (Math.pow(cagrEnd / cagrStart, 1 / cagrYears) - 1) * 100 : 0

  // Volatility Math (Daily VaR approx)
  const dailyVolatility = annualStdDev / Math.sqrt(252)
  const estimatedVaR = dailyVolatility * confidenceZ

  return (
    <div className="card-surface p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-theme-subtle pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-gold" />
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-tight">Interactive Financial Calculators</h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-theme-subtle bg-surface-elevated p-1 text-xs">
          <button
            onClick={() => setActiveTab('sip')}
            className={`rounded px-3 py-1 font-mono font-semibold transition ${
              activeTab === 'sip' ? 'bg-gold text-canvas shadow' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            SIP Compounding
          </button>
          <button
            onClick={() => setActiveTab('cagr')}
            className={`rounded px-3 py-1 font-mono font-semibold transition ${
              activeTab === 'cagr' ? 'bg-gold text-canvas shadow' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            CAGR Metric
          </button>
          <button
            onClick={() => setActiveTab('volatility')}
            className={`rounded px-3 py-1 font-mono font-semibold transition ${
              activeTab === 'volatility'
                ? 'bg-gold text-canvas shadow'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Downside VaR
          </button>
        </div>
      </div>

      <div className="mt-5">
        {/* SIP Calculator Tab */}
        {activeTab === 'sip' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Monthly SIP Amount (₹)
                </label>
                <input
                  type="number"
                  step="500"
                  value={sipAmount}
                  onChange={(e) => setSipAmount(Number(e.target.value))}
                  className="input-default font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Expected Return (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={sipRate}
                  onChange={(e) => setSipRate(Number(e.target.value))}
                  className="input-default font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Time Period ({sipYears} Years)
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={sipYears}
                  onChange={(e) => setSipYears(Number(e.target.value))}
                  className="w-full accent-gold"
                />
              </div>
            </div>

            <div className="card-surface bg-surface-elevated p-5 flex flex-col justify-between border-l-2 border-l-gold">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
                  Projected Wealth (Corpus)
                </span>
                <div className="mt-2 text-3xl font-bold font-mono text-gold tracking-tight">
                  ₹{Math.round(sipFutureValue).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs border-t border-theme-subtle pt-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Invested:</span>
                  <span className="font-mono text-text-secondary">₹{sipInvested.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Wealth Gain:</span>
                  <span className="font-mono text-gain font-semibold">
                    +₹{Math.round(sipReturns).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAGR Calculator Tab */}
        {activeTab === 'cagr' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Initial Investment Value (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={cagrStart}
                  onChange={(e) => setCagrStart(Number(e.target.value))}
                  className="input-default font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Final Maturity Value (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={cagrEnd}
                  onChange={(e) => setCagrEnd(Number(e.target.value))}
                  className="input-default font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Investment Duration ({cagrYears} Years)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={cagrYears}
                  onChange={(e) => setCagrYears(Number(e.target.value))}
                  className="input-default font-mono"
                />
              </div>
            </div>

            <div className="card-surface bg-surface-elevated p-5 flex flex-col justify-between border-l-2 border-l-gain">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
                  Compound Annual Growth Rate
                </span>
                <div className="mt-2 text-3xl font-bold font-mono text-gain tracking-tight">
                  {cagrResult.toFixed(2)}% p.a.
                </div>
              </div>
              <p className="text-xs text-text-muted mt-4 leading-relaxed">
                CAGR smooths out year-to-year market volatility and computes the geometric mean growth rate of your money.
              </p>
            </div>
          </div>
        )}

        {/* Volatility Tab */}
        {activeTab === 'volatility' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Annualized Standard Deviation (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={annualStdDev}
                  onChange={(e) => setAnnualStdDev(Number(e.target.value))}
                  className="input-default font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono mb-1">
                  Risk Tolerance Confidence Level
                </label>
                <select
                  value={confidenceZ}
                  onChange={(e) => setConfidenceZ(Number(e.target.value))}
                  className="input-default font-mono"
                >
                  <option value={1.645} className="bg-surface text-text-primary">90% Confidence (Z = 1.645)</option>
                  <option value={1.96} className="bg-surface text-text-primary">95% Confidence (Z = 1.960)</option>
                  <option value={2.326} className="bg-surface text-text-primary">99% Confidence (Z = 2.326)</option>
                </select>
              </div>
            </div>

            <div className="card-surface bg-surface-elevated p-5 flex flex-col justify-between border-l-2 border-l-loss">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
                  Estimated 1-Day Downside VaR
                </span>
                <div className="mt-2 text-3xl font-bold font-mono text-loss tracking-tight">
                  -{estimatedVaR.toFixed(2)}%
                </div>
              </div>
              <div className="text-xs text-text-muted mt-4 leading-relaxed">
                Daily implied standard deviation is ~{dailyVolatility.toFixed(2)}%. On normal trading days, maximum single-day decline should not exceed {estimatedVaR.toFixed(2)}%.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
