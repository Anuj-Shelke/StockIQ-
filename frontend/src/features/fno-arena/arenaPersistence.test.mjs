import test from 'node:test'
import assert from 'node:assert/strict'
import { arenaSeedForCycle, createArenaScenario, createNextArenaCycle } from './arenaScenarios.ts'
import { advanceSimulationTick, closeOpenPosition, createSimulationState, openOptionPosition } from './engine/index.ts'
import {
  clearPersistedArenaRun,
  readPersistedArenaRun,
  saveArenaRun,
  isPersistedArenaRun,
} from './arenaPersistence.ts'
import { arenaSessionStorageKey } from './arenaSessionStorage.ts'

const TEST_USER_ID = 'investor-123'

function makeRun() {
  const fixture = createArenaScenario('india', 'story', 20261018)
  const state = openOptionPosition(createSimulationState({
    seed: 20261018,
    instrument: fixture.instrument,
    risk: fixture.risk,
    scenario: fixture.scenario,
  }), {
    type: 'CALL',
    contracts: 1,
    strike: 100,
    expiryTimestampMs: fixture.ticks.length * fixture.tickDurationMs,
    tick: fixture.initialTick,
  })
  return {
    state,
    market: 'india',
    replay: 'story',
    ticks: fixture.ticks,
    nextTick: 0,
    history: [fixture.initialTick],
    seed: 20261018,
    mentor: 'entry',
  }
}

function withSessionStorage(t, initial = {}) {
  const values = new Map(Object.entries(initial))
  const originalWindow = globalThis.window
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  }
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  })
  return values
}

test('run state round-trips through same-tab session storage', (t) => {
  const storage = withSessionStorage(t)
  const run = makeRun()
  assert.equal(saveArenaRun(TEST_USER_ID, run), true)
  const restored = readPersistedArenaRun(TEST_USER_ID)
  assert.equal(restored.warning, '')
  assert.deepEqual(restored.run, run)
  assert.ok(storage.has(arenaSessionStorageKey(TEST_USER_ID)))
})

test('volatility-shock mentor moment restores without changing the run state', (t) => {
  withSessionStorage(t)
  const run = makeRun()
  run.mentor = 'volatility-shock'
  assert.equal(saveArenaRun(TEST_USER_ID, run), true)
  assert.deepEqual(readPersistedArenaRun(TEST_USER_ID).run, run)
})

test('market-watching session restores before a simulated position is entered', (t) => {
  withSessionStorage(t)
  const fixture = createArenaScenario('india', 'story', 20261018)
  const state = {
    ...createSimulationState({ seed: 20261018, instrument: fixture.instrument, risk: fixture.risk, scenario: fixture.scenario }),
    currentTick: fixture.initialTick,
  }
  const run = {
    state, market: 'india', replay: 'story', ticks: fixture.ticks,
    nextTick: 0, history: [fixture.initialTick], seed: 20261018, mentor: 'watching',
    orderConfig: { optionType: 'CALL', direction: 'LONG', strike: 100, contracts: 1 },
  }
  assert.equal(saveArenaRun(TEST_USER_ID, run), true)
  assert.deepEqual(readPersistedArenaRun(TEST_USER_ID).run, run)
})

test('corrupt or unsupported saved data is discarded instead of resumed', (t) => {
  const storage = withSessionStorage(t, {
    [arenaSessionStorageKey(TEST_USER_ID)]: JSON.stringify({ version: 999, run: makeRun() }),
  })
  const restored = readPersistedArenaRun(TEST_USER_ID)
  assert.equal(restored.run, null)
  assert.match(restored.warning, /could not be restored/)
  assert.equal(storage.has(arenaSessionStorageKey(TEST_USER_ID)), false)
})

test('storage failures fall back safely and clearing does not block exit', (t) => {
  const originalWindow = globalThis.window
  globalThis.window = { sessionStorage: {
    getItem() { throw new Error('storage blocked') },
    setItem() { throw new Error('storage blocked') },
    removeItem() { throw new Error('storage blocked') },
  } }
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  })
  assert.equal(readPersistedArenaRun(TEST_USER_ID).run, null)
  assert.match(readPersistedArenaRun(TEST_USER_ID).warning, /may not survive a refresh/)
  assert.equal(saveArenaRun(TEST_USER_ID, makeRun()), false)
  assert.doesNotThrow(() => clearPersistedArenaRun(TEST_USER_ID))
})

test('mid-run restore produces the same seeded result as uninterrupted play', (t) => {
  withSessionStorage(t)
  const uninterrupted = makeRun()
  const interrupted = makeRun()
  for (let i = 0; i < 5; i += 1) {
    const tick = uninterrupted.ticks[uninterrupted.nextTick]
    uninterrupted.state = advanceSimulationTick(uninterrupted.state, tick)
    uninterrupted.history.push(tick)
    uninterrupted.nextTick += 1
    interrupted.state = advanceSimulationTick(interrupted.state, tick)
    interrupted.history.push(tick)
    interrupted.nextTick += 1
  }
  assert.equal(saveArenaRun(TEST_USER_ID, interrupted), true)
  const restored = readPersistedArenaRun(TEST_USER_ID).run
  assert.ok(restored)
  for (let i = uninterrupted.nextTick; i < uninterrupted.ticks.length && uninterrupted.state.position; i += 1) {
    const tick = uninterrupted.ticks[uninterrupted.nextTick]
    uninterrupted.state = advanceSimulationTick(uninterrupted.state, tick)
    interrupted.state = advanceSimulationTick(restored.state, tick)
    restored.state = interrupted.state
    uninterrupted.history.push(tick)
    restored.history.push(tick)
    uninterrupted.nextTick += 1
    restored.nextTick += 1
  }
  if (uninterrupted.state.position) uninterrupted.state = closeOpenPosition(uninterrupted.state).state
  if (restored.state.position) restored.state = closeOpenPosition(restored.state).state
  assert.deepEqual(restored.state, uninterrupted.state)
})

test('finished trade restores as a finished run', (t) => {
  withSessionStorage(t)
  const run = makeRun()
  const closed = closeOpenPosition(run.state)
  run.state = closed.state
  run.mentor = 'result'
  assert.equal(saveArenaRun(TEST_USER_ID, run), true)
  const restored = readPersistedArenaRun(TEST_USER_ID).run
  assert.equal(restored?.state.status, 'ACTIVE')
  assert.equal(restored?.state.completedTrades.length, 1)
  assert.equal(restored?.state.position, null)
})

test('multi-cycle market run restores and continues from its saved PTS and tick', (t) => {
  withSessionStorage(t)
  const fixture = createArenaScenario('india', 'quiet', 20261018)
  const state = { ...createSimulationState({ seed: 20261018, instrument: fixture.instrument, risk: fixture.risk, scenario: fixture.scenario }), currentTick: fixture.initialTick }
  const run = { state, market: 'india', replay: 'quiet', ticks: [...fixture.ticks], nextTick: 0, history: [fixture.initialTick], seed: 20261018, mentor: 'watching' }
  for (const tick of fixture.ticks) {
    run.state = advanceSimulationTick(run.state, tick)
    run.history.push(tick)
    run.nextTick += 1
  }
  const nextCycle = createNextArenaCycle('india', 'quiet', arenaSeedForCycle(run.seed, 1), run.state.scenario.id, run.ticks.at(-1))
  run.ticks.push(...nextCycle)
  const cycleTick = run.ticks[run.nextTick]
  run.state = advanceSimulationTick(run.state, cycleTick)
  run.history.push(cycleTick)
  run.nextTick += 1
  assert.equal(saveArenaRun(TEST_USER_ID, run), true)
  const restored = readPersistedArenaRun(TEST_USER_ID).run
  assert.deepEqual(restored, run)
  const followingTick = run.ticks[run.nextTick]
  run.state = advanceSimulationTick(run.state, followingTick)
  restored.state = advanceSimulationTick(restored.state, followingTick)
  assert.deepEqual(restored.state, run.state)
})

test('multiple independent open order slots restore with their positions and margin', (t) => {
  withSessionStorage(t)
  const fixture = createArenaScenario('india', 'quiet', 20261018)
  let state = { ...createSimulationState({ seed: 20261018, instrument: fixture.instrument, risk: fixture.risk, scenario: fixture.scenario }), currentTick: fixture.initialTick }
  for (const type of ['CALL', 'PUT']) {
    state = openOptionPosition(state, {
      type, contracts: 1, strike: 100,
      expiryTimestampMs: fixture.ticks.at(-1).timestampMs,
      tick: fixture.initialTick,
    })
  }
  const run = {
    state, market: 'india', replay: 'quiet', ticks: fixture.ticks,
    nextTick: 0, history: [fixture.initialTick], seed: 20261018, mentor: 'entry',
  }
  assert.equal(state.openPositions.length, 2)
  assert.equal(saveArenaRun(TEST_USER_ID, run), true)
  assert.deepEqual(readPersistedArenaRun(TEST_USER_ID).run, run)
})

test('saved runs are isolated by authenticated user id', (t) => {
  const storage = withSessionStorage(t)
  assert.equal(saveArenaRun('user-a', makeRun()), true)
  assert.equal(readPersistedArenaRun('user-b').run, null)
  assert.ok(storage.has(arenaSessionStorageKey('user-a')))
  assert.equal(storage.has(arenaSessionStorageKey('user-b')), false)
})

test('restore validation rejects negative points and unknown scenario paths', () => {
  const run = makeRun()
  assert.equal(isPersistedArenaRun({ ...run, state: { ...run.state, cashBalancePts: -1 } }), false)
  assert.equal(isPersistedArenaRun({ ...run, replay: 'not-a-scenario' }), false)
})
