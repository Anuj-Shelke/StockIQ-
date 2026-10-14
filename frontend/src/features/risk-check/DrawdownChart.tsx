import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DrawdownDataPoint } from '@/types/riskCheck'
import { useThemeTokens } from '@/hooks/useThemeTokens'

interface DrawdownChartProps {
  data: DrawdownDataPoint[]
  scenarioName: string
}

export function DrawdownChart({ data, scenarioName }: DrawdownChartProps) {
  const tokens = useThemeTokens()

  return (
    <div className="card-surface p-6 sm:p-7 relative overflow-hidden">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[var(--text-primary)] text-base">
              Underwater Drawdown Trajectory
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5">
              Peak-to-Trough Simulation
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Simulated portfolio recovery vs Nifty 50 benchmark during {scenarioName}.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[var(--gold-primary)] font-semibold">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--gold-primary)]" />
            Your Portfolio
          </span>
          <span className="flex items-center gap-1.5 text-[var(--color-danger)] font-semibold">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-danger)]" />
            Nifty 50
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={tokens.gold} stopOpacity={0.35} />
                <stop offset="95%" stopColor={tokens.gold} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={tokens.danger} stopOpacity={0.25} />
                <stop offset="95%" stopColor={tokens.danger} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.chart.grid} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={tokens.chart.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={tokens.chart.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      className="rounded-xl p-3 shadow-xl text-xs backdrop-blur-md"
                      style={{
                        backgroundColor: tokens.chart.tooltipBg,
                        border: `1px solid ${tokens.chart.tooltipBorder}`,
                        color: tokens.textPrimary,
                      }}
                    >
                      <p className="font-semibold mb-2" style={{ color: tokens.textPrimary }}>
                        {label}
                      </p>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                          <span style={{ color: tokens.textSecondary }}>{entry.name}:</span>
                          <span className="font-mono font-bold" style={{ color: entry.color }}>
                            {entry.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="portfolioDrawdown"
              name="Portfolio"
              stroke={tokens.gold}
              strokeWidth={2}
              fill="url(#portfolioGrad)"
            />
            <Area
              type="monotone"
              dataKey="benchmarkDrawdown"
              name="Nifty 50 Benchmark"
              stroke={tokens.danger}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#benchmarkGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
