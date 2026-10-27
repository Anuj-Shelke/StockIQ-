import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import type { WealthProjectionSummary } from '@/types/investmentPlanner'
import { formatINR } from './plannerUtils'

interface Props {
  projections: WealthProjectionSummary
}

export function WealthProjectionSection({ projections }: Props) {
  const [showRealInflation, setShowRealInflation] = useState<boolean>(true)
  const [showTable, setShowTable] = useState<boolean>(false)

  const chartData = projections.yearly_trajectory.map(pt => ({
    year: `Yr ${pt.year}`,
    'Total Invested': pt.total_invested,
    'Base Scenario': pt.base_value,
    'Conservative Scenario': pt.conservative_value,
    'Optimistic Scenario': pt.optimistic_value,
    'Inflation-Adjusted (Real)': pt.inflation_adjusted_base_value,
  }))

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Multi-Scenario Wealth Projections</h2>
            <p className="text-xs text-slate-400">
              Compound growth trajectory over {projections.investment_horizon_years} years across Conservative, Base, and Optimistic market scenarios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRealInflation(!showRealInflation)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
              showRealInflation
                ? 'bg-amber-950/50 border-amber-600/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showRealInflation ? 'bg-amber-400' : 'bg-slate-600'}`} />
            {showRealInflation ? `Inflation Factored (${projections.inflation_assumption_pct}%)` : 'Nominal View'}
          </button>
        </div>
      </div>

      {/* Trajectory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-xs text-slate-400">Total Principal Invested</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatINR(projections.total_principal_invested)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Lump sum: {formatINR(projections.initial_lump_sum)}
            {projections.monthly_sip > 0 && ` + SIP: ${formatINR(projections.monthly_sip)}/mo`}
          </p>
        </div>

        {/* Conservative Scenario */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Conservative Downside</p>
            <span className="text-[10px] text-slate-500 font-medium">Adverse Cycle</span>
          </div>
          <p className="text-xl font-bold text-slate-200 mt-1">{formatINR(projections.conservative_final_value)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Gain: +{formatINR(projections.conservative_final_value - projections.total_principal_invested)}
          </p>
        </div>

        {/* Base Scenario */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-300">Base Expected Value</p>
            <span className="text-[10px] text-emerald-400 font-bold">Median Track</span>
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatINR(projections.base_final_value)}</p>
          <p className="text-[11px] text-emerald-300/80 mt-1">
            CAGR: {projections.projected_annual_cagr_base.toFixed(1)}% p.a.
          </p>
        </div>

        {/* Optimistic Scenario */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Optimistic Upside</p>
            <span className="text-[10px] text-sky-400 font-medium">Bull Market</span>
          </div>
          <p className="text-xl font-bold text-sky-400 mt-1">{formatINR(projections.optimistic_final_value)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Gain: +{formatINR(projections.optimistic_final_value - projections.total_principal_invested)}
          </p>
        </div>
      </div>

      {/* Inflation Callout Banner */}
      {showRealInflation && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-700/30 text-xs text-amber-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Real Purchasing Power: Adjusted for {projections.inflation_assumption_pct}% annual inflation, your projected base corpus of {formatINR(projections.base_final_value)} is equivalent to <span className="font-bold text-amber-300">{formatINR(projections.base_inflation_adjusted_value)}</span> in today's purchasing power.
            </span>
          </div>
        </div>
      )}

      {/* Recharts Line Chart */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs shadow-2xl space-y-1.5">
                      <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex justify-between gap-4">
                          <span style={{ color: entry.color }}>{entry.name}:</span>
                          <span className="font-semibold text-slate-100">{formatINR(entry.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="Total Invested"
              stroke="#64748b"
              strokeDasharray="4 4"
              dot={false}
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="Conservative Scenario"
              stroke="#94a3b8"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Base Scenario"
              stroke="#10b981"
              dot={{ r: 3 }}
              strokeWidth={2.5}
            />
            <Line
              type="monotone"
              dataKey="Optimistic Scenario"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={2}
            />
            {showRealInflation && (
              <Line
                type="monotone"
                dataKey="Inflation-Adjusted (Real)"
                stroke="#f59e0b"
                strokeDasharray="3 3"
                dot={false}
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Year-by-Year Table Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
        >
          {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showTable ? 'Hide Year-by-Year Breakdown' : 'View Year-by-Year Trajectory Table'}
        </button>

        {showTable && (
          <div className="mt-4 overflow-x-auto border border-slate-800/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-2.5 px-4 font-medium">Timeline</th>
                  <th className="py-2.5 px-3 font-medium">Total Invested</th>
                  <th className="py-2.5 px-3 font-medium text-slate-300">Conservative</th>
                  <th className="py-2.5 px-3 font-medium text-emerald-400">Base Expected</th>
                  <th className="py-2.5 px-3 font-medium text-sky-400">Optimistic</th>
                  <th className="py-2.5 px-4 font-medium text-amber-400">Inflation-Adjusted (Real)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {projections.yearly_trajectory.map(pt => (
                  <tr key={pt.year} className="hover:bg-slate-800/20 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-300">Year {pt.year}</td>
                    <td className="py-2.5 px-3 text-slate-400">{formatINR(pt.total_invested)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{formatINR(pt.conservative_value)}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400">{formatINR(pt.base_value)}</td>
                    <td className="py-2.5 px-3 text-sky-400">{formatINR(pt.optimistic_value)}</td>
                    <td className="py-2.5 px-4 font-medium text-amber-300">{formatINR(pt.inflation_adjusted_base_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statutory Disclaimer */}
      <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-3">
        Disclaimer: {projections.disclaimer}
      </p>
    </div>
  )
}
