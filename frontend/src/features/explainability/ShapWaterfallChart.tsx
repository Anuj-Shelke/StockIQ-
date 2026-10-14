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
import { useThemeTokens } from '@/hooks/useThemeTokens'

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
  const tokens = useThemeTokens()

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
    <div className="card-surface p-5">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-theme-subtle pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary text-sm uppercase tracking-tight">
              SHAP Feature Attribution (TreeExplainer)
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/20">
              Deterministic Weights
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Mathematical decomposition showing how factors shift valuation from baseline ₹{baseValue.toFixed(2)} to fair target ₹{predictedValue.toFixed(2)}.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto">
          <span className="flex items-center gap-1.5 text-gain font-medium">
            <span className="h-2 w-2 rounded-sm bg-gain" />
            Positive Attribution
          </span>
          <span className="flex items-center gap-1.5 text-loss font-medium">
            <span className="h-2 w-2 rounded-sm bg-loss" />
            Negative Drag
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 20, left: 110, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.chart.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={tokens.chart.axis}
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: tokens.chart.grid }}
              tickFormatter={(v) => `₹${v}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={tokens.textSecondary}
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: tokens.chart.grid }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  const isPos = data.impact >= 0
                  return (
                    <div
                      className="rounded-lg p-3 shadow-xl text-xs backdrop-blur-md max-w-xs border"
                      style={{
                        backgroundColor: tokens.chart.tooltipBg,
                        borderColor: tokens.chart.tooltipBorder,
                        color: tokens.textPrimary,
                      }}
                    >
                      <p className="font-semibold text-text-primary">{data.name}</p>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
                        Category: {data.category}
                      </span>
                      <p
                        className="font-mono font-bold mt-1.5"
                        style={{ color: isPos ? tokens.success : tokens.danger }}
                      >
                        {isPos ? '+' : ''}₹{data.impact.toFixed(2)} impact
                      </p>
                      <p className="mt-1 text-text-muted text-[11px] leading-relaxed">
                        {data.description}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="impact" radius={[3, 3, 3, 3]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.impact >= 0 ? tokens.success : tokens.danger}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
