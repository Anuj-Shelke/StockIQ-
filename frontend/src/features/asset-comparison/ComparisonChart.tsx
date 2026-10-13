import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ComparisonDataPoint } from '@/types/assetComparison'

interface ComparisonChartProps {
  data: ComparisonDataPoint[]
  inflationAdjusted: boolean
}

export function ComparisonChart({ data, inflationAdjusted }: ComparisonChartProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h3 className="font-semibold text-white">
            Wealth Accumulation Trajectory
          </h3>
          <p className="text-xs text-slate-400">
            Synchronized growth simulation (₹) across asset classes
            {inflationAdjusted && ' (Adjusted for 6% avg. inflation)'}.
          </p>
        </div>
        <div className="text-xs font-mono text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-1 rounded">
          Portfolio Value (INR)
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
            <XAxis
              dataKey="period"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-white/10 bg-ink-900/95 p-3 shadow-xl text-xs backdrop-blur-md">
                      <p className="font-semibold text-slate-200 mb-2">{label}</p>
                      {payload.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-5 font-mono mb-1 last:mb-0"
                        >
                          <span style={{ color: entry.color }}>{entry.name}:</span>
                          <span className="font-bold text-white">
                            ₹{Number(entry.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              formatter={(val) => <span className="text-xs text-slate-300 font-mono">{val}</span>}
            />
            <Line
              type="monotone"
              dataKey="equity"
              name="Equity (NIFTY 50)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="gold"
              name="Physical Gold"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="fixedDeposit"
              name="Bank FD"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
