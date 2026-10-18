import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceSimulationTick,
  closeOpenPosition,
  createSimulationState,
  getEquityPts,
  openFxPosition,
  openOptionPosition,
} from './engine/index.ts'
import { arenaSeedForCycle, createArenaScenario, createNextArenaCycle } from './arenaScenarios.ts'
import { getCapitalScore } from './arenaScore.ts'

const DAY_MS = 24 * 60 * 60 * 1000

test('India scenario is explicitly illustrative and a Call can play through model expiry', () => {
  const fixture = createArenaScenario('india', 'quiet', 20261018)
  assert.equal(fixture.scenario.status, 'SIMULATED')
  assert.match(fixture.scenario.assumptionsLabel, /not historical or live/i)
  assert.equal(fixture.instrument.dataStatus, 'ILLUSTRATIVE')
  assert.equal(fixture.initialTick.kind, 'option')
  assert.equal(fixture.ticks.length, 24)

  let state = createSimulationState({ seed: 20261018, instrument: fixture.instrument, risk: fixture.risk, scenario: fixture.scenario })
  assert.equal(getCapitalScore(state), 100)
  state = openOptionPosition(state, {
    type: 'CALL', contracts: 1, strike: 100,
    expiryTimestampMs: fixture.ticks.length * DAY_MS,
    tick: fixture.initialTick,
  })
  assert.equal(state.startingCapitalPts, 1000)
  for (const tick of fixture.ticks) {
    state = advanceSimulationTick(state, tick)
    if (!state.position) break
  }
  assert.equal(state.position, null)
  assert.equal(state.completedTrades[0].exitReason, 'EXPIRY')
  assert.equal(state.completedTrades[0].optionAutopsy.available, true)
  assert.ok(Number.isFinite(getEquityPts(state)))
  assert.ok(getCapitalScore(state) >= 0 && getCapitalScore(state) <= 100)
})

test('Global reversal scenario reaches margin call then simulator liquidation in sequence', () => {
  const fixture = createArenaScenario('global', 'reversal', 20261018)
  assert.match(fixture.scenario.assumptionsLabel, /not historical or live/i)
  let state = createSimulationState({ seed: 20261018, instrument: fixture.instrument, risk: fixture.risk, scenario: fixture.scenario })
  state = openFxPosition(state, { direction: 'LONG', contracts: 1, tick: fixture.initialTick })
  assert.equal(state.startingCapitalPts, 1000)
  assert.equal(state.position.kind, 'fx')
  let sawMarginCall = false
  for (const tick of fixture.ticks) {
    const hadPendingCall = state.marginCallPending
    state = advanceSimulationTick(state, tick)
    sawMarginCall ||= state.events.some((event) => event.type === 'MARGIN_CALL')
    if (hadPendingCall) break
  }
  assert.equal(sawMarginCall, true)
  assert.equal(state.position, null)
  assert.equal(state.completedTrades[0].exitReason, 'LIQUIDATION')
  assert.ok(Number.isFinite(state.cashBalancePts) && state.cashBalancePts >= 0)
  assert.ok(Number.isFinite(getEquityPts(state)) && getEquityPts(state) >= 0)
})

test('scenario cycles extend the market path continuously and deterministically', () => {
  const fixture = createArenaScenario('india', 'story', 20261018)
  const lastTick = fixture.ticks.at(-1)
  const cycleA = createNextArenaCycle('india', 'story', arenaSeedForCycle(20261018, 1), fixture.scenario.id, lastTick)
  const cycleB = createNextArenaCycle('india', 'story', arenaSeedForCycle(20261018, 1), fixture.scenario.id, lastTick)
  assert.deepEqual(cycleA, cycleB)
  assert.equal(cycleA.length, fixture.ticks.length)
  assert.equal(cycleA[0].timestampMs, lastTick.timestampMs + fixture.tickDurationMs)
  assert.ok(Math.abs(cycleA[0].spot - lastTick.spot * fixture.ticks[0].spot / fixture.initialTick.spot) < 1e-10)
  assert.ok(cycleA.every((tick, index) => tick.scenarioId === fixture.scenario.id && (index === 0 || tick.timestampMs > cycleA[index - 1].timestampMs)))
})

test('a closed position can be followed by another position using remaining capital', () => {
  const fixture = createArenaScenario('india', 'quiet', 20261018)
  let state = createSimulationState({ seed: 20261018, instrument: fixture.instrument, risk: fixture.risk, scenario: fixture.scenario })
  state = openOptionPosition(state, { type: 'CALL', contracts: 1, strike: 100, expiryTimestampMs: fixture.ticks.at(-1).timestampMs, tick: fixture.initialTick })
  state = advanceSimulationTick(state, fixture.ticks[0])
  state = closeOpenPosition(state).state
  const remainingPts = getEquityPts(state)
  const nextTick = fixture.ticks[0]
  state = openOptionPosition(state, { type: 'PUT', contracts: 1, strike: 100, expiryTimestampMs: fixture.ticks.at(-1).timestampMs + DAY_MS, tick: nextTick })
  assert.equal(state.status, 'ACTIVE')
  assert.equal(state.completedTrades.length, 1)
  assert.ok(getEquityPts(state) <= remainingPts)
})
