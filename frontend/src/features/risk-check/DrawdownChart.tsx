import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DrawdownDataPoint } from '@/types/riskCheck'

interface DrawdownChartProps {
  data: DrawdownDataPoint[]
  scenarioName: string
}

export function DrawdownChart({ data, scenarioName }: DrawdownChartProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h3 className="font-semibold text-white">
            Underwater Drawdown Trajectory
          </h3>
          <p className="text-xs text-slate-400">
            Peak-to-trough decline percentage during {scenarioName}.
          </p>
        </div>
        <div className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded">
          Drawdown % (Negative)
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
            <XAxis
              dataKey="date"
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
              tickFormatter={(v) => `${v}%`}
              domain={['dataMin - 5', 0]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-white/10 bg-ink-900/95 p-3 shadow-xl text-xs backdrop-blur-md">
                      <p className="font-semibold text-slate-200 mb-1">{label}</p>
                      {payload.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-4 font-mono"
                        >
                          <span style={{ color: entry.color }}>{entry.name}:</span>
                          <span className="font-bold text-white">
                            {Number(entry.value).toFixed(2)}%
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
              iconType="plainline"
              formatter={(val) => <span className="text-xs text-slate-300 font-mono">{val}</span>}
            />
            <Area
              type="monotone"
              dataKey="portfolioDrawdown"
              name="Simulated Portfolio"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#portfolioGrad)"
            />
            <Area
              type="monotone"
              dataKey="benchmarkDrawdown"
              name="NIFTY 50 Benchmark"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#benchmarkGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
