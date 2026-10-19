export const RNG_ALGORITHM_VERSION = 'xorshift32-v1' as const
const UINT32_RANGE = 0x1_0000_0000

export interface SeededRandom {
  nextUint32(): number
  next(): number
  getState(): number
}

export function createSeededRandom(seed: number): SeededRandom {
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff) {
    throw new RangeError('Seed must be a nonzero unsigned 32-bit integer')
  }

  let state = seed >>> 0
  const nextUint32 = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state
  }
  return {
    nextUint32,
    next: () => nextUint32() / UINT32_RANGE,
    getState() {
      return state >>> 0
    },
  }
}

export interface SeededPricePathConfig {
  scenarioId: string
  startTimestampMs: number
  tickDurationMs: number
  startingPrice: number
  /** Maximum absolute simple return per tick; must be explicitly supplied. */
  maxAbsReturnPerTick: number
  tickCount: number
}

export interface SimulatedPriceTick {
  scenarioId: string
  timestampMs: number
  dataStatus: 'SIMULATED'
  kind: 'fx'
  eurUsd: number
}

export interface SeededOptionPathConfig extends SeededPricePathConfig {
  volatility: number
  riskFreeRate: number
  dividendYield: number
}

export interface SimulatedOptionTick {
  scenarioId: string
  timestampMs: number
  dataStatus: 'SIMULATED'
  kind: 'option'
  spot: number
  volatility: number
  riskFreeRate: number
  dividendYield: number
}

/** Builds a bounded, synthetic FX path. It does not approximate or claim to reproduce an exchange feed. */
export function generateSeededFxTicks(seed: number, config: SeededPricePathConfig): SimulatedPriceTick[] {
  const { scenarioId, startTimestampMs, tickDurationMs, startingPrice, maxAbsReturnPerTick, tickCount } = config
  if (!scenarioId.trim()) throw new TypeError('scenarioId is required')
  if (!Number.isInteger(startTimestampMs)) throw new RangeError('startTimestampMs must be an integer millisecond value')
  if (!Number.isInteger(tickDurationMs) || tickDurationMs <= 0) throw new RangeError('tickDurationMs must be a positive integer millisecond value')
  if (!Number.isFinite(startingPrice) || startingPrice <= 0) throw new RangeError('startingPrice must be greater than zero')
  if (!Number.isFinite(maxAbsReturnPerTick) || maxAbsReturnPerTick < 0 || maxAbsReturnPerTick >= 1) {
    throw new RangeError('maxAbsReturnPerTick must be in [0, 1)')
  }
  if (!Number.isInteger(tickCount) || tickCount < 0) throw new RangeError('tickCount must be a nonnegative integer')

  const random = createSeededRandom(seed)
  const ticks: SimulatedPriceTick[] = []
  let price = startingPrice
  for (let index = 0; index < tickCount; index += 1) {
    const simpleReturn = (random.next() * 2 - 1) * maxAbsReturnPerTick
    price *= 1 + simpleReturn
    if (!Number.isFinite(price) || price <= 0) throw new RangeError('Generated synthetic price is invalid')
    ticks.push({
      scenarioId,
      timestampMs: startTimestampMs + (index + 1) * tickDurationMs,
      dataStatus: 'SIMULATED',
      kind: 'fx',
      eurUsd: price,
    })
  }
  return ticks
}

/** Builds synthetic option-underlying ticks; all model inputs are explicit and remain illustrative. */
export function generateSeededOptionTicks(seed: number, config: SeededOptionPathConfig): SimulatedOptionTick[] {
  const { scenarioId, startTimestampMs, tickDurationMs, startingPrice, maxAbsReturnPerTick, tickCount,
    volatility, riskFreeRate, dividendYield } = config
  if (!Number.isFinite(volatility) || volatility <= 0) throw new RangeError('volatility must be greater than zero')
  if (!Number.isFinite(riskFreeRate) || !Number.isFinite(dividendYield)) throw new RangeError('Option rates must be finite')
  const priceTicks = generateSeededFxTicks(seed, { scenarioId, startTimestampMs, tickDurationMs, startingPrice, maxAbsReturnPerTick, tickCount })
  return priceTicks.map((tick) => ({
    scenarioId: tick.scenarioId,
    timestampMs: tick.timestampMs,
    dataStatus: 'SIMULATED',
    kind: 'option',
    spot: tick.eurUsd,
    volatility,
    riskFreeRate,
    dividendYield,
  }))
}
