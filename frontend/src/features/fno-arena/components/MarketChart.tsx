import type { MarketTick } from '../engine/types.ts'
import type { ArenaMarket } from '../arenaScenarios.ts'
import { motion } from 'framer-motion'

function markFor(tick: MarketTick): number {
  return tick.kind === 'option' ? tick.spot : tick.eurUsd
}

export function MarketChart({ history, market, totalIntervals }: { history: MarketTick[]; market: ArenaMarket; totalIntervals: number }) {
  const values = history.map(markFor)
  const lowest = values.length ? Math.min(...values) : 0
  const highest = values.length ? Math.max(...values) : 0
  const range = Math.max(highest - lowest, Math.abs(highest || lowest) * 0.01, 0.0001)
  const min = lowest - range * 0.12
  const max = highest + range * 0.12
  const visibleIntervals = Math.max(1, Math.min(totalIntervals, values.length - 1))
  const xFor = (index: number) => 4 + index / visibleIntervals * 92
  const yFor = (value: number) => 42 - (value - min) / (max - min) * 34
  const points = values.slice(0, -1).map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ')
  const latest = values.at(-1) ?? 0
  const isRising = values.length < 2 || latest >= (values.at(-2) ?? latest)
  const previous = values.at(-2)
  const currentIndex = values.length - 1

  return (
    <div className="arena-panel arena-chart-panel" aria-label="Observed simulated market path">
      <div className="arena-section-heading">
        <div>
          <p className="arena-eyebrow">Observed path · illustrative</p>
          <h2>{market === 'india' ? 'Underlying scenario' : 'EUR/USD scenario'}</h2>
        </div>
        <span className={`arena-price ${isRising ? 'is-up' : 'is-down'}`}>{market === 'india' ? latest.toFixed(2) : latest.toFixed(4)}</span>
      </div>
      <svg className="arena-chart" viewBox="0 0 100 48" role="img" aria-label={`Observed scenario through ${history.length - 1} completed intervals`} preserveAspectRatio="none">
        <line x1="4" y1="44" x2="96" y2="44" className="arena-chart-axis" />
        <line x1="4" y1="8" x2="4" y2="44" className="arena-chart-axis" />
        {points && <polyline points={points} className={`arena-chart-line ${isRising ? 'is-up' : 'is-down'}`} />}
        {previous !== undefined && <motion.line className={`arena-chart-line arena-chart-segment ${isRising ? 'is-up' : 'is-down'}`} initial={false} animate={{ x1: xFor(currentIndex - 1), y1: yFor(previous), x2: xFor(currentIndex), y2: yFor(latest) }} transition={{ duration: 1.1, ease: 'linear' }} />}
        <motion.circle cx={xFor(currentIndex)} cy={yFor(latest)} r="1.4" className={`arena-chart-dot ${isRising ? 'is-up' : 'is-down'}`} animate={{ cx: xFor(currentIndex), cy: yFor(latest) }} transition={{ duration: 1, ease: 'linear' }} />
      </svg>
      <div className="arena-chart-legend"><span>Start</span><span>Only ticks already played are shown</span><span>Now</span></div>
    </div>
  )
}
