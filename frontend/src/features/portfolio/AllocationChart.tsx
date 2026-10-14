import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import type { Holding } from '@/types/portfolio'
import { useThemeTokens } from '@/hooks/useThemeTokens'

interface AllocationChartProps {
  holdings: Holding[]
}

export function AllocationChart({ holdings }: AllocationChartProps) {
  const tokens = useThemeTokens()
  const totalVal = holdings.reduce((sum, h) => sum + h.quantity * (h.current_price || h.buy_price), 0)

  if (holdings.length === 0 || totalVal === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-theme-subtle bg-surface/50 p-6 text-center text-text-muted">
        <div className="w-10 h-10 rounded-full bg-surface-elevated border border-theme-subtle flex items-center justify-center mb-3 text-gold">
          <span className="font-mono text-sm font-semibold">₹</span>
        </div>
        <p className="text-sm font-medium text-text-primary">No Holdings Detected</p>
        <p className="text-xs text-text-muted mt-1 max-w-xs">
          Add assets to your portfolio to view your asset allocation and concentration exposure.
        </p>
      </div>
    )
  }

  const data = holdings.map((h) => {
    const val = h.quantity * (h.current_price || h.buy_price)
    const pct = totalVal > 0 ? (val / totalVal) * 100 : 0
    return {
      name: h.symbol.replace('.NS', ''),
      fullName: h.name || h.symbol,
      value: Math.round(val),
      percentage: pct.toFixed(1),
    }
  })

  return (
    <div className="card-surface p-5">
      <div className="mb-3 flex items-center justify-between pb-3 border-b border-theme-subtle">
        <div>
          <h3 className="font-semibold text-text-primary tracking-tight text-sm uppercase">Asset Allocation Breakdown</h3>
          <p className="text-xs text-text-muted mt-0.5">Asset diversification & concentration weighting</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted block">Portfolio Value</span>
          <span className="text-sm font-mono font-semibold text-gold">
            ₹{totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              stroke={tokens.surface}
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={tokens.chart.sequence[index % tokens.chart.sequence.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload
                  return (
                    <div
                      className="rounded-lg p-3 shadow-xl text-xs backdrop-blur-md border"
                      style={{
                        backgroundColor: tokens.chart.tooltipBg,
                        borderColor: tokens.chart.tooltipBorder,
                        color: tokens.textPrimary,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-semibold text-text-primary">{item.name}</span>
                        <span className="text-gold font-mono font-medium">{item.percentage}%</span>
                      </div>
                      <p className="text-text-muted text-[11px] truncate max-w-[180px]">{item.fullName}</p>
                      <p className="font-mono text-sm font-semibold text-text-primary mt-1.5 pt-1.5 border-t border-theme-subtle">
                        ₹{item.value.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs font-mono text-text-secondary mr-2">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
