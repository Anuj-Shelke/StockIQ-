import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ShapFactor } from '@/types/explainability'

interface ShapWaterfallChartProps {
  factors: ShapFactor[]
  baseValue: number
  predictedValue: number
}

export function ShapWaterfallChart({
  factors,
  baseValue,
  predictedValue,
}: ShapWaterfallChartProps) {
  // Sort factors by absolute impact descending
  const sortedFactors = [...factors].sort(
    (a, b) => Math.abs(b.impactValue) - Math.abs(a.impactValue)
  )

  const chartData = sortedFactors.map((f) => ({
    name: f.name,
    impact: f.impactValue,
    category: f.category,
    direction: f.impactValue >= 0 ? 'positive' : 'negative',
    description: f.description,
  }))

  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h3 className="font-semibold text-white">
            SHAP Feature Attribution (TreeExplainer)
          </h3>
          <p className="text-xs text-slate-400">
            Decomposition of how macroeconomic, fundamental, and technical signals shift the price prediction from base ₹{baseValue.toFixed(2)} to target ₹{predictedValue.toFixed(2)}.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Positive Push
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            Negative Drag
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#cbd5e1"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  const isPos = data.impact >= 0
                  return (
                    <div className="rounded-lg border border-white/10 bg-ink-900/95 p-3 shadow-xl text-xs backdrop-blur-md max-w-xs">
                      <p className="font-semibold text-white">{data.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        Category: {data.category}
                      </span>
                      <p
                        className={`font-mono font-bold mt-1 ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? '+' : ''}₹{data.impact.toFixed(2)} attribution
                      </p>
                      <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                        {data.description}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="impact" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.impact >= 0 ? '#10b981' : '#f43f5e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
