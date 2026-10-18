import type { SimulationState } from './engine/types.ts'
import { getEquityPts, STARTING_CAPITAL_PTS } from './engine/index.ts'

/** A transparent capital-preservation indicator, not a trading skill or behavioral diagnosis. */
export function getCapitalScore(state: SimulationState): number {
  return Math.max(0, Math.min(100, Math.round(getEquityPts(state) / STARTING_CAPITAL_PTS * 100)))
}
