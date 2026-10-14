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
import { useThemeTokens } from '@/hooks/useThemeTokens'

interface ComparisonChartProps {
  data: ComparisonDataPoint[]
  inflationAdjusted: boolean
}

export function ComparisonChart({ data, inflationAdjusted }: ComparisonChartProps) {
  const tokens = useThemeTokens()

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-theme-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary text-sm uppercase tracking-tight">
              Wealth Accumulation Trajectory
            </h3>
            {inflationAdjusted && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-medium">
                6% Real CPI Adjusted
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Synchronized compounding model for ₹10,000 monthly SIP across primary Indian asset classes.
          </p>
        </div>
        <div className="text-xs font-mono text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-md self-start sm:self-auto font-medium">
          Portfolio Value (INR)
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.chart.grid} vertical={false} />
            <XAxis
              dataKey="period"
              stroke={tokens.chart.axis}
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: tokens.chart.grid }}
            />
            <YAxis
              stroke={tokens.chart.axis}
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: tokens.chart.grid }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      className="rounded-lg p-3 shadow-xl text-xs backdrop-blur-md border"
                      style={{
                        backgroundColor: tokens.chart.tooltipBg,
                        borderColor: tokens.chart.tooltipBorder,
                        color: tokens.textPrimary,
                      }}
                    >
                      <p className="font-semibold text-text-primary mb-2 font-mono">{label}</p>
                      {payload.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-6 font-mono mb-1.5 last:mb-0"
                        >
                          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                            {entry.name}:
                          </span>
                          <span className="font-bold text-text-primary">
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
              formatter={(val) => <span className="text-xs text-text-secondary font-mono mr-2">{val}</span>}
            />
            <Line
              type="monotone"
              dataKey="equity"
              name="Equity (NIFTY 50)"
              stroke={tokens.blue}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: tokens.blue }}
              activeDot={{ r: 5, stroke: tokens.surface, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="gold"
              name="Physical Gold (24K)"
              stroke={tokens.gold}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: tokens.gold }}
              activeDot={{ r: 5, stroke: tokens.surface, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="fixedDeposit"
              name="Scheduled Bank FD"
              stroke={tokens.success}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2, fill: tokens.success }}
              activeDot={{ r: 4, stroke: tokens.surface, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
