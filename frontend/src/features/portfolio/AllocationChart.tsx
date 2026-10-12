import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import type { Holding } from '@/types/portfolio'

interface AllocationChartProps {
  holdings: Holding[]
}

const COLORS = [
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
]

export function AllocationChart({ holdings }: AllocationChartProps) {
  const totalVal = holdings.reduce((sum, h) => sum + h.quantity * (h.current_price || h.buy_price), 0)

  if (holdings.length === 0 || totalVal === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-white/10 bg-ink-950/60 p-6 text-center text-slate-400">
        <p className="text-sm">No holdings in portfolio</p>
        <p className="text-xs text-slate-500 mt-1">Add assets to view your visual allocation breakdown.</p>
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
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Asset Allocation</h3>
        <span className="text-xs font-mono text-slate-400">
          Total: ₹{totalVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload
                  return (
                    <div className="rounded-lg border border-white/10 bg-ink-900/95 p-2.5 shadow-xl text-xs backdrop-blur-md">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-gold-400 font-mono mt-0.5">₹{item.value.toLocaleString('en-IN')}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{item.percentage}% weight</p>
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
              formatter={(value) => <span className="text-xs text-slate-300 font-mono">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
