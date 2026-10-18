import { getEquityPts } from './engine/index.ts'
import type { MarketTick, SimulationState } from './engine/types.ts'
import { arenaSeedForCycle, createArenaScenario, createNextArenaCycle, type ArenaMarket, type ReplayScenario } from './arenaScenarios.ts'
import type { MentorMoment } from './mentorRules.ts'
import { arenaSessionStorageKey } from './arenaSessionStorage.ts'

const STORAGE_VERSION = 2

export interface PersistedArenaRun {
  state: SimulationState
  market: ArenaMarket
  replay: ReplayScenario
  ticks: MarketTick[]
  nextTick: number
  history: MarketTick[]
  seed: number
  mentor: MentorMoment
  orderConfig?: ArenaOrderConfig
}

export interface ArenaOrderConfig {
  optionType: 'CALL' | 'PUT'
  direction: 'LONG' | 'SHORT'
  strike: number
  contracts: number
}

const replayScenarios = new Set<ReplayScenario>(['story', 'trend', 'reversal', 'quiet'])
const mentorMoments = new Set<MentorMoment>(['watching', 'entry', 'profit', 'reversal', 'volatility-shock', 'margin-call', 'liquidation', 'expiry', 'result'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyFiniteNumbers(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(hasOnlyFiniteNumbers)
  if (isRecord(value)) return Object.values(value).every(hasOnlyFiniteNumbers)
  return true
}

function isTick(value: unknown, scenarioId: string): value is MarketTick {
  if (!isRecord(value) || value.scenarioId !== scenarioId || !Number.isFinite(value.timestampMs)) return false
  if (value.dataStatus !== 'SIMULATED' && value.dataStatus !== 'HISTORICAL') return false
  if (value.kind === 'option') {
    return Number.isFinite(value.spot) && Number(value.spot) > 0
      && Number.isFinite(value.volatility) && Number(value.volatility) > 0
      && Number.isFinite(value.riskFreeRate) && Number.isFinite(value.dividendYield)
  }
  return value.kind === 'fx' && Number.isFinite(value.eurUsd) && Number(value.eurUsd) > 0
}

function isSimulationState(value: unknown): value is SimulationState {
  if (!isRecord(value) || value.startingCapitalPts !== 1000 || !Number.isInteger(value.seed)
    || value.rngAlgorithmVersion !== 'xorshift32-v1'
    || !['ACTIVE', 'GAME_OVER', 'EXITED'].includes(String(value.status))
    || !Number.isInteger(value.tickIndex) || Number(value.tickIndex) < 0
    || !Number.isInteger(value.nextPositionId) || Number(value.nextPositionId) < 1
    || !Number.isFinite(value.cashBalancePts) || Number(value.cashBalancePts) < 0
    || !Number.isFinite(value.reservedMarginPts) || Number(value.reservedMarginPts) < 0
    || typeof value.marginCallPending !== 'boolean'
    || !isRecord(value.scenario) || typeof value.scenario.id !== 'string'
    || !isRecord(value.instrument) || !isRecord(value.risk)
    || !Array.isArray(value.openPositions) || !Array.isArray(value.completedTrades) || !Array.isArray(value.events)) return false

  const scenarioId = (value.scenario as Record<string, unknown>).id as string
  const marketTick = value.currentTick
  if (marketTick !== null && !isTick(marketTick, scenarioId)) return false
  if (value.position !== null && value.position !== undefined) {
    if (!isRecord(value.position) || value.position.status !== 'OPEN'
      || typeof value.position.id !== 'string'
      || (value.position.kind !== 'option' && value.position.kind !== 'fx')
      || !isTick(value.position.currentTick, scenarioId)
      || !isTick(value.position.entryTick, scenarioId)) return false
  }
  if (!value.openPositions.every((position) => isRecord(position) && typeof position.id === 'string'
    && position.status === 'OPEN' && (position.kind === 'option' || position.kind === 'fx')
    && isTick(position.currentTick, scenarioId) && isTick(position.entryTick, scenarioId))) return false
  const positionIds = value.openPositions.map((position) => (position as Record<string, unknown>).id as string)
  if (new Set(positionIds).size !== positionIds.length) return false
  if (positionIds.some((id) => {
    const match = /^position-(\d+)$/.exec(id)
    return !match || Number(match[1]) < 1 || Number(match[1]) >= Number(value.nextPositionId)
  })) return false
  if (JSON.stringify(value.position ?? null) !== JSON.stringify(value.openPositions.at(-1) ?? null)) return false
  return hasOnlyFiniteNumbers(value)
}

export function isPersistedArenaRun(value: unknown): value is PersistedArenaRun {
  if (!isRecord(value) || (value.market !== 'india' && value.market !== 'global')
    || !replayScenarios.has(value.replay as ReplayScenario)
    || !Number.isInteger(value.seed) || !Number.isInteger(value.nextTick)
    || Number(value.nextTick) < 0 || !Array.isArray(value.ticks) || !Array.isArray(value.history)
    || value.history.length !== Number(value.nextTick) + 1
    || Number(value.nextTick) > value.ticks.length
    || !mentorMoments.has(value.mentor as MentorMoment)
    || !isSimulationState(value.state)) return false

  if (value.orderConfig !== undefined && (!isRecord(value.orderConfig)
    || !['CALL', 'PUT'].includes(String(value.orderConfig.optionType))
    || !['LONG', 'SHORT'].includes(String(value.orderConfig.direction))
    || !Number.isFinite(value.orderConfig.strike) || Number(value.orderConfig.strike) <= 0
    || !Number.isInteger(value.orderConfig.contracts) || Number(value.orderConfig.contracts) < 1)) return false

  const market = value.market as ArenaMarket
  const replay = value.replay as ReplayScenario
  const seed = value.seed as number
  const scenarioId = value.state.scenario.id
  const expectedScenarioId = `arena-${market}-${replay}-${seed}`
  if (scenarioId !== expectedScenarioId || value.state.tickIndex !== value.nextTick) return false
  const fixture = createArenaScenario(market, replay, seed)
  if (value.ticks.length < fixture.ticks.length || value.ticks.length % fixture.ticks.length !== 0) return false
  if (JSON.stringify(value.state.scenario) !== JSON.stringify(fixture.scenario)
    || JSON.stringify(value.state.instrument) !== JSON.stringify(fixture.instrument)
    || JSON.stringify(value.state.risk) !== JSON.stringify(fixture.risk)) return false
  if (value.state.seed !== value.seed || !value.history.every((tick) => isTick(tick, scenarioId))
    || !value.ticks.every((tick) => isTick(tick, scenarioId))) return false
  if (getEquityPts(value.state) < 0) return false
  if (value.state.status !== 'ACTIVE' && value.state.openPositions.length !== 0) return false
  if (value.state.status === 'GAME_OVER' && getEquityPts(value.state) !== 0) return false
  if (value.state.status === 'ACTIVE' && getEquityPts(value.state) <= 0) return false
  const expectedTicks = [...fixture.ticks]
  const cycleCount = value.ticks.length / fixture.ticks.length
  for (let cycleIndex = 1; cycleIndex < cycleCount; cycleIndex += 1) {
    const lastTick = expectedTicks.at(-1)
    if (!lastTick) return false
    expectedTicks.push(...createNextArenaCycle(
      market,
      replay,
      arenaSeedForCycle(seed, cycleIndex),
      scenarioId,
      lastTick,
    ))
  }
  for (let index = 0; index < expectedTicks.length; index += 1) {
    if (JSON.stringify(value.ticks[index]) !== JSON.stringify(expectedTicks[index])) return false
  }
  const lastHistoryTick = value.history.at(-1)
  if (!lastHistoryTick || JSON.stringify(value.state.currentTick) !== JSON.stringify(lastHistoryTick)) return false
  if (value.state.openPositions.some((position) => JSON.stringify(position.currentTick) !== JSON.stringify(lastHistoryTick))) return false
  if (JSON.stringify(value.history[0]) !== JSON.stringify(fixture.initialTick)) return false
  for (let index = 1; index < value.history.length; index += 1) {
    if (JSON.stringify(value.history[index]) !== JSON.stringify(expectedTicks[index - 1])) return false
  }
  return true
}

export function readPersistedArenaRun(userId: string): { run: PersistedArenaRun | null; warning: string } {
  const key = arenaSessionStorageKey(userId)
  let raw: string | null
  try {
    raw = window.sessionStorage.getItem(key)
  } catch {
    return { run: null, warning: 'This tab cannot read its saved Arena run. Progress may not survive a refresh.' }
  }
  if (raw === null) return { run: null, warning: '' }

  try {
    const stored: unknown = JSON.parse(raw)
    if (!isRecord(stored) || stored.version !== STORAGE_VERSION || !isPersistedArenaRun(stored.run)) {
      clearPersistedArenaRun(userId)
      return { run: null, warning: 'A saved Arena run could not be restored, so a fresh run is ready.' }
    }
    return { run: stored.run, warning: '' }
  } catch {
    clearPersistedArenaRun(userId)
    return { run: null, warning: 'A saved Arena run could not be restored, so a fresh run is ready.' }
  }
}

export function saveArenaRun(userId: string, run: PersistedArenaRun): boolean {
  try {
    if (!isPersistedArenaRun(run)) return false
    window.sessionStorage.setItem(arenaSessionStorageKey(userId), JSON.stringify({ version: STORAGE_VERSION, run }))
    return true
  } catch {
    return false
  }
}

export function clearPersistedArenaRun(userId: string): void {
  try {
    window.sessionStorage.removeItem(arenaSessionStorageKey(userId))
  } catch {
    // Sign-out and Arena exit must still complete when storage is unavailable.
  }
}
