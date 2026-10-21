import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { PieChart as PieIcon, CheckCircle2 } from 'lucide-react'
import type { AssetAllocationItem } from '@/types/investmentPlanner'
import { formatINR, getRiskColorClass } from './plannerUtils'

interface Props {
  allocations: AssetAllocationItem[]
  investableCapital: number
}

const ASSET_COLORS: Record<string, string> = {
  'Stocks': '#38bdf8',                  // Sky-400
  'Diversified Index Funds': '#818cf8', // Indigo-400
  'Gold': '#fbbf24',                    // Amber-400
  'Fixed Deposits': '#34d399',          // Emerald-400
}

export function AssetAllocationDashboard({ allocations, investableCapital }: Props) {
  const chartData = allocations.map(a => ({
    name: a.asset_class,
    value: a.allocation_pct,
    amount: a.allocated_amount,
    color: ASSET_COLORS[a.asset_class] || '#94a3b8',
  }))

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Recommended Asset Allocation</h2>
            <p className="text-xs text-slate-400">
              Personalized capital distribution across asset classes totaling 100% of investable funds ({formatINR(investableCapital)}).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100.0% Fully Allocated
          </span>
        </div>
      </div>

      {/* Doughnut Chart & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Doughnut Chart */}
        <div className="lg:col-span-5 h-64 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs shadow-xl space-y-1">
                        <p className="font-semibold text-slate-200">{data.name}</p>
                        <p className="text-sky-400 font-bold">{data.value.toFixed(1)}%</p>
                        <p className="text-slate-400">{formatINR(data.amount)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Investable</span>
            <span className="text-base font-bold text-slate-100">{formatINR(investableCapital)}</span>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {allocations.map(item => (
            <div
              key={item.asset_class}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-md"
                    style={{ backgroundColor: ASSET_COLORS[item.asset_class] || '#94a3b8' }}
                  />
                  <span className="text-xs font-semibold text-slate-200">{item.asset_class}</span>
                </div>
                <span className="text-sm font-bold text-slate-100">{item.allocation_pct.toFixed(1)}%</span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Amount:</span>
                <span className="font-semibold text-indigo-400">{formatINR(item.allocated_amount)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Expected CAGR:</span>
                <span className="text-emerald-400 font-medium">~{item.expected_return_pct.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Risk Level:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${getRiskColorClass(item.risk_level)}`}>
                  {item.risk_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Allocation Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="py-3 px-4 font-medium">Asset Class</th>
              <th className="py-3 px-3 font-medium">Allocation %</th>
              <th className="py-3 px-3 font-medium">Amount (INR)</th>
              <th className="py-3 px-3 font-medium">Expected Return</th>
              <th className="py-3 px-3 font-medium">Risk Level</th>
              <th className="py-3 px-3 font-medium">Liquidity</th>
              <th className="py-3 px-4 font-medium">Strategic Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {allocations.map(a => (
              <tr key={a.asset_class} className="hover:bg-slate-800/30 transition">
                <td className="py-3.5 px-4 font-semibold text-slate-200 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: ASSET_COLORS[a.asset_class] || '#94a3b8' }}
                  />
                  <div>
                    <p>{a.asset_class}</p>
                    <p className="text-[10px] text-slate-500 font-normal">{a.category_label}</p>
                  </div>
                </td>
                <td className="py-3.5 px-3 font-bold text-slate-100">{a.allocation_pct.toFixed(1)}%</td>
                <td className="py-3.5 px-3 font-semibold text-indigo-400">{formatINR(a.allocated_amount)}</td>
                <td className="py-3.5 px-3 font-medium text-emerald-400">~{a.expected_return_pct.toFixed(1)}%</td>
                <td className="py-3.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getRiskColorClass(a.risk_level)}`}>
                    {a.risk_level}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-slate-400 text-[11px]">{a.liquidity}</td>
                <td className="py-3.5 px-4 text-slate-300 text-[11px] leading-relaxed max-w-xs">{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
