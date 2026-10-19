import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateOptionAutopsy } from './autopsy.ts'
import { calculateEuropeanGreeks, priceEuropeanOption, timeToExpiryAct365 } from './pricingEngine.ts'
import { createSeededRandom, generateSeededFxTicks, generateSeededOptionTicks } from './random.ts'
import {
  advanceSimulationTick,
  closeOpenPosition,
  createSimulationState,
  getAvailablePts,
  getEquityPts,
  getMarginLevel,
  getMaintenanceMarginPts,
  getPositionPnlPts,
  openFxPosition,
  openOptionPosition,
} from './simulationEngine.ts'
import { STARTING_CAPITAL_PTS, TBD_VALUE } from './types.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const YEAR_MS = 365 * DAY_MS

const scenario = {
  id: 'test-scenario',
  label: 'Test-only illustrative scenario',
  status: 'SIMULATED',
  assumptionsLabel: 'Test fixture; not market data.',
}

function optionInstrument(overrides = {}) {
  return {
    id: 'test-option', arena: 'india-options', instrumentType: 'option', underlyingSymbol: 'TEST',
    quoteCurrency: 'TEST-QUOTE', contractMultiplier: 1, lotSize: 1,
    sourceName: 'Test-only illustrative fixture', sourceUrl: null, sourceDate: null, verifiedAt: null,
    configVersion: 'test-v1', dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Test-only, not an exchange specification.',
    ...overrides,
  }
}

function optionRisk(overrides = {}) {
  return {
    kind: 'option', dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Test-only cost/risk settings.',
    ptsPerQuoteCurrencyUnit: 1, maxContracts: 10, spreadQuotePerUnit: 0.02,
    transactionCostPtsPerContract: 1, fixedTransactionCostPts: 0,
    ...overrides,
  }
}

function fxInstrument(overrides = {}) {
  return {
    id: 'test-eurusd', arena: 'eur-usd-fx', instrumentType: 'fx', underlyingSymbol: 'EUR/USD',
    quoteCurrency: 'USD', contractMultiplier: 1000, lotSize: 1,
    sourceName: 'Test-only illustrative fixture', sourceUrl: null, sourceDate: null, verifiedAt: null,
    configVersion: 'test-v1', dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Test-only, not a broker contract specification.',
    ...overrides,
  }
}

function fxRisk(overrides = {}) {
  return {
    kind: 'fx', dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Test-only leverage, margin and costs.',
    leverage: 10, maxLeverage: 10, maintenanceMarginRatio: 0.5,
    maxContracts: 2, maxBaseUnits: 2000, ptsPerQuoteCurrencyUnit: 1,
    spreadQuoteUnits: 0.002, liquidationSlippageQuoteUnits: 0,
    transactionCostPtsPerContract: 1, fixedTransactionCostPts: 1,
    ...overrides,
  }
}

function makeOptionTick(timestampMs, overrides = {}) {
  return {
    kind: 'option', scenarioId: scenario.id, timestampMs, dataStatus: 'SIMULATED',
    spot: 100, volatility: 0.2, riskFreeRate: 0.05, dividendYield: 0,
    ...overrides,
  }
}

function makeFxTick(timestampMs, eurUsd) {
  return { kind: 'fx', scenarioId: scenario.id, timestampMs, dataStatus: 'SIMULATED', eurUsd }
}

function assertFiniteAccountState(state) {
  for (const amount of [state.cashBalancePts, state.reservedMarginPts, getAvailablePts(state), getEquityPts(state)]) {
    assert.ok(Number.isFinite(amount))
    assert.ok(amount >= 0)
  }
}

test('Black–Scholes prices calls and puts and returns model-based Greeks', () => {
  const input = {
    spot: 100, strike: 100, timeToExpiryYears: 1, riskFreeRate: 0.05,
    volatility: 0.2, dividendYield: 0, type: 'CALL',
  }
  assert.ok(Math.abs(priceEuropeanOption(input) - 10.4506) < 0.0002)
  assert.ok(Math.abs(priceEuropeanOption({ ...input, type: 'PUT' }) - 5.5735) < 0.0002)
  const greeks = calculateEuropeanGreeks(input)
  assert.equal(greeks.label, 'MODEL-BASED')
  assert.ok(Math.abs(greeks.delta - 0.6368) < 0.001)
  assert.ok(greeks.gamma > 0)
  assert.ok(greeks.vegaPerVolatilityUnit > 0)
  assert.ok(Number.isFinite(greeks.thetaPerYear))
})

test('expiry uses intrinsic value and the documented finite Greek boundary convention', () => {
  const input = {
    spot: 105, strike: 100, timeToExpiryYears: 0, riskFreeRate: 0.05,
    volatility: 0.2, dividendYield: 0, type: 'CALL',
  }
  assert.equal(priceEuropeanOption(input), 5)
  const atTheMoneyPut = calculateEuropeanGreeks({ ...input, spot: 100, type: 'PUT' })
  assert.equal(atTheMoneyPut.delta, -0.5)
  assert.equal(atTheMoneyPut.gamma, 0)
  assert.equal(atTheMoneyPut.thetaPerYear, 0)
  assert.equal(atTheMoneyPut.vegaPerVolatilityUnit, 0)
  for (const [type, spot, expectedDelta] of [
    ['CALL', 105, 1], ['CALL', 95, 0], ['CALL', 100, 0.5],
    ['PUT', 95, -1], ['PUT', 105, 0], ['PUT', 100, -0.5],
  ]) {
    const boundary = calculateEuropeanGreeks({ ...input, type, spot })
    assert.equal(boundary.delta, expectedDelta)
    assert.deepEqual([boundary.gamma, boundary.thetaPerYear, boundary.vegaPerVolatilityUnit], [0, 0, 0])
  }
})

test('pricing rejects invalid inputs and ACT/365 time never becomes negative', () => {
  assert.throws(() => priceEuropeanOption({
    spot: 0, strike: 100, timeToExpiryYears: 1, riskFreeRate: 0, volatility: 0.2,
    dividendYield: 0, type: 'CALL',
  }), /spot must be greater than zero/)
  assert.equal(timeToExpiryAct365(10, 20), 0)
  assert.equal(timeToExpiryAct365(YEAR_MS, 0), 1)
})

test('option position debits premium, reprices through time and settles once at expiry', () => {
  let state = createSimulationState({ seed: 42, instrument: optionInstrument(), risk: optionRisk(), scenario })
  assert.equal(state.cashBalancePts, STARTING_CAPITAL_PTS)
  state = openOptionPosition(state, {
    type: 'CALL', contracts: 1, strike: 100, expiryTimestampMs: YEAR_MS,
    tick: makeOptionTick(0),
  })
  const originalValue = state.position.entryModelPremium
  assert.ok(state.cashBalancePts < STARTING_CAPITAL_PTS)
  const openEvent = state.events.find((event) => event.type === 'POSITION_OPENED')
  assert.equal(openEvent.details.strike, 100)
  assert.equal(openEvent.details.expiryTimestampMs, YEAR_MS)

  state = advanceSimulationTick(state, makeOptionTick(DAY_MS))
  assert.ok(state.position.currentModelPremium < originalValue, 'positive theta should reduce this unchanged-input model premium')

  state = advanceSimulationTick(state, makeOptionTick(YEAR_MS, { spot: 105 }))
  assert.equal(state.position, null)
  assert.equal(state.completedTrades.length, 1)
  assert.equal(state.completedTrades[0].exitReason, 'EXPIRY')
  assert.equal(state.completedTrades[0].optionAutopsy.available, true)
  assert.equal(state.status, 'ACTIVE')
})

test('independent option orders can be opened together and sold one slot at a time', () => {
  const tick = makeOptionTick(0)
  let state = createSimulationState({ seed: 20261018, instrument: optionInstrument(), risk: optionRisk(), scenario })
  state = { ...state, currentTick: tick }
  state = openOptionPosition(state, { type: 'CALL', contracts: 2, strike: 100, expiryTimestampMs: 90 * DAY_MS, tick })
  const firstId = state.position.id
  state = openOptionPosition(state, { type: 'PUT', contracts: 1, strike: 100, expiryTimestampMs: 90 * DAY_MS, tick })
  const secondId = state.position.id
  assert.notEqual(firstId, secondId)
  assert.equal(state.openPositions.length, 2)
  assert.ok(Number.isFinite(getPositionPnlPts(state, firstId)))
  assert.ok(Number.isFinite(getPositionPnlPts(state, secondId)))
  assert.ok(Math.abs(state.openPositions.reduce((total, position) => total + getPositionPnlPts(state, position.id), 0) - (getEquityPts(state) - STARTING_CAPITAL_PTS)) < 1e-9)
  const balanceAfterBuys = state.cashBalancePts
  const closed = closeOpenPosition(state, 'USER_EXIT', firstId)
  state = closed.state
  assert.equal(closed.trade.positionId, firstId)
  assert.equal(state.openPositions.length, 1)
  assert.equal(state.position.id, secondId)
  assert.ok(state.cashBalancePts > balanceAfterBuys)
  state = closeOpenPosition(state, 'USER_EXIT', secondId).state
  assert.equal(state.openPositions.length, 0)
  assert.equal(state.position, null)
  assert.equal(state.completedTrades.length, 2)
  state = openOptionPosition(state, { type: 'CALL', contracts: 1, strike: 100, expiryTimestampMs: 90 * DAY_MS, tick })
  assert.equal(state.openPositions.length, 1, 'a new order can be opened after selling the earlier slots')
})

test('multiple FX slots aggregate reserved and maintenance margin independently', () => {
  const tick = makeFxTick(0, 1.1)
  let state = createSimulationState({ seed: 20261018, instrument: fxInstrument(), risk: fxRisk(), scenario })
  state = { ...state, currentTick: tick }
  state = openFxPosition(state, { direction: 'LONG', contracts: 1, tick })
  const firstId = state.position.id
  state = openFxPosition(state, { direction: 'SHORT', contracts: 1, tick })
  const secondId = state.position.id
  assert.equal(state.openPositions.length, 2)
  assert.equal(state.reservedMarginPts, 220)
  assert.equal(getMaintenanceMarginPts(state), 110)
  state = closeOpenPosition(state, 'USER_EXIT', firstId).state
  assert.equal(state.openPositions.length, 1)
  assert.equal(state.position.id, secondId)
  assert.equal(state.reservedMarginPts, 110)
  assert.equal(getMaintenanceMarginPts(state), 55)
})

test('option autopsy attributes underlying, time, and volatility changes without residual', () => {
  let state = createSimulationState({ seed: 12, instrument: optionInstrument(), risk: optionRisk(), scenario })
  state = openOptionPosition(state, {
    type: 'CALL', contracts: 2, strike: 100, expiryTimestampMs: YEAR_MS,
    tick: makeOptionTick(0),
  })
  const exitTick = makeOptionTick(DAY_MS, { spot: 104, volatility: 0.25 })
  const autopsy = calculateOptionAutopsy(state.position, exitTick, state.instrument, state.risk)
  assert.equal(autopsy.available, true)
  if (!autopsy.available) return
  assert.deepEqual(autopsy.contributions.map(({ factor }) => factor), ['UNDERLYING', 'TIME', 'VOLATILITY'])
  const sum = autopsy.contributions.reduce((total, item) => total + item.contributionPts, 0)
  assert.ok(Math.abs(sum - autopsy.modeledChangePts) < 1e-10)
  const modeledPnlDifference = (autopsy.exitModelPremium - autopsy.entryModelPremium)
    * state.position.contracts * state.instrument.contractMultiplier * state.risk.ptsPerQuoteCurrencyUnit
  assert.ok(Math.abs(sum - modeledPnlDifference) < 1e-10)
  assert.deepEqual(autopsy, calculateOptionAutopsy(state.position, exitTick, state.instrument, state.risk))
  assert.equal(calculateOptionAutopsy(state.position, makeOptionTick(DAY_MS, { riskFreeRate: 0.06 }), state.instrument, state.risk).available, false)
})

test('changing one option factor at a time moves only that attribution component in the expected direction', () => {
  let state = createSimulationState({ seed: 22, instrument: optionInstrument(), risk: optionRisk(), scenario })
  state = openOptionPosition(state, {
    type: 'CALL', contracts: 1, strike: 100, expiryTimestampMs: YEAR_MS, tick: makeOptionTick(0),
  })
  const position = state.position
  const movedSpot = calculateOptionAutopsy(position, makeOptionTick(0, { spot: 105 }), state.instrument, state.risk)
  assert.equal(movedSpot.available, true)
  if (!movedSpot.available) return
  assert.ok(movedSpot.contributions[0].contributionPts > 0)
  assert.equal(movedSpot.contributions[1].contributionPts, 0)
  assert.equal(movedSpot.contributions[2].contributionPts, 0)

  const movedVolatility = calculateOptionAutopsy(position, makeOptionTick(0, { volatility: 0.3 }), state.instrument, state.risk)
  assert.equal(movedVolatility.available, true)
  if (!movedVolatility.available) return
  assert.equal(movedVolatility.contributions[0].contributionPts, 0)
  assert.equal(movedVolatility.contributions[1].contributionPts, 0)
  assert.ok(movedVolatility.contributions[2].contributionPts > 0)

  const timeOnly = calculateOptionAutopsy(position, makeOptionTick(DAY_MS), state.instrument, state.risk)
  assert.equal(timeOnly.available, true)
  if (!timeOnly.available) return
  assert.equal(timeOnly.contributions[0].contributionPts, 0)
  assert.ok(timeOnly.contributions[1].contributionPts < 0)
  assert.equal(timeOnly.contributions[2].contributionPts, 0)
})

test('near-expiry option prices and Greeks remain finite; zero volatility is rejected', () => {
  const nearExpiry = {
    spot: 100, strike: 100, timeToExpiryYears: Number.EPSILON, riskFreeRate: 0,
    volatility: 1e-12, dividendYield: 0, type: 'CALL',
  }
  const nearExpiryPrice = priceEuropeanOption(nearExpiry)
  const nearExpiryGreeks = calculateEuropeanGreeks(nearExpiry)
  assert.ok(Number.isFinite(nearExpiryPrice))
  for (const value of Object.values(nearExpiryGreeks)) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value))
  }
  assert.throws(() => priceEuropeanOption({ ...nearExpiry, volatility: 0 }), /volatility must be greater than zero/)
  const expiryGreeks = calculateEuropeanGreeks({ ...nearExpiry, timeToExpiryYears: 0, volatility: 0.2 })
  assert.deepEqual(
    [expiryGreeks.delta, expiryGreeks.gamma, expiryGreeks.thetaPerYear, expiryGreeks.vegaPerVolatilityUnit],
    [0.5, 0, 0, 0],
  )
})

test('FX position P&L follows signed units, spread, fees, and PTS conversion', () => {
  let state = createSimulationState({ seed: 7, instrument: fxInstrument(), risk: fxRisk(), scenario })
  state = openFxPosition(state, { direction: 'LONG', contracts: 1, tick: makeFxTick(0, 1.1) })
  assert.equal(state.cashBalancePts, 998)
  assert.equal(state.reservedMarginPts, 110)
  assert.equal(state.position.initialMarginPts, 110)
  assert.equal(getAvailablePts(state), state.cashBalancePts - state.reservedMarginPts)
  assertFiniteAccountState(state)
  state = advanceSimulationTick(state, makeFxTick(DAY_MS, 1.2))
  const result = closeOpenPosition(state)
  assert.ok(Math.abs(result.trade.realizedPnlPts - 94) < 1e-9)
  assert.ok(Math.abs(result.state.cashBalancePts - 1094) < 1e-9)
  assert.equal(result.state.reservedMarginPts, 0)
  assertFiniteAccountState(result.state)

  let shortState = createSimulationState({ seed: 17, instrument: fxInstrument(), risk: fxRisk(), scenario })
  shortState = openFxPosition(shortState, { direction: 'SHORT', contracts: 1, tick: makeFxTick(0, 1.1) })
  shortState = advanceSimulationTick(shortState, makeFxTick(DAY_MS, 1.0))
  const shortResult = closeOpenPosition(shortState)
  assert.ok(Math.abs(shortResult.trade.realizedPnlPts - 94) < 1e-9)
})

test('FX margin call liquidates on the next tick and gap losses are safeguarded at zero PTS', () => {
  let state = createSimulationState({
    seed: 8,
    instrument: fxInstrument({ contractMultiplier: 10_000, assumptionsLabel: 'Test-only high notional fixture.' }),
    risk: fxRisk({ leverage: 100, maxLeverage: 100, maxContracts: 1, maxBaseUnits: 10_000 }),
    scenario,
  })
  state = openFxPosition(state, { direction: 'LONG', contracts: 1, tick: makeFxTick(0, 1.1) })
  assert.equal(state.position.initialMarginPts, 110)
  state = advanceSimulationTick(state, makeFxTick(DAY_MS, 1.0065))
  assert.equal(state.marginCallPending, true)
  assert.ok(getMarginLevel(state) < 1)
  assert.ok(state.position?.kind === 'fx')
  assert.equal(state.position.initialMarginPts * state.risk.maintenanceMarginRatio, 55)
  assertFiniteAccountState(state)
  state = advanceSimulationTick(state, makeFxTick(2 * DAY_MS, 1.0065))
  assert.equal(state.position, null)
  assert.equal(state.completedTrades[0].exitReason, 'LIQUIDATION')
  assert.ok(Math.abs(state.completedTrades[0].realizedPnlPts - (-959)) < 1e-9)
  assert.ok(Math.abs(state.cashBalancePts - 41) < 1e-9)
  assert.equal(state.status, 'ACTIVE')
  assertFiniteAccountState(state)

  let gapState = createSimulationState({
    seed: 9,
    instrument: fxInstrument({ contractMultiplier: 10_000 }),
    risk: fxRisk({ leverage: 100, maxLeverage: 100, maxContracts: 1, maxBaseUnits: 10_000 }),
    scenario,
  })
  gapState = openFxPosition(gapState, { direction: 'LONG', contracts: 1, tick: makeFxTick(0, 1.1) })
  gapState = advanceSimulationTick(gapState, makeFxTick(DAY_MS, 0.8))
  assert.equal(gapState.status, 'GAME_OVER')
  assert.equal(gapState.cashBalancePts, 0)
  assert.equal(gapState.position, null)
  assert.ok(gapState.completedTrades[0].capitalSafeguardShortfallPts > 0)
  assert.ok(Math.abs(gapState.completedTrades[0].realizedPnlPts - (-3024)) < 1e-9)
  assertFiniteAccountState(gapState)
})

test('FX margin call uses a strict below-maintenance boundary', () => {
  const configured = {
    seed: 81,
    instrument: fxInstrument({ contractMultiplier: 10_000 }),
    risk: fxRisk({ leverage: 100, maxLeverage: 100, maxContracts: 1, maxBaseUnits: 10_000 }),
    scenario,
  }
  let atBoundary = createSimulationState(configured)
  atBoundary = openFxPosition(atBoundary, { direction: 'LONG', contracts: 1, tick: makeFxTick(0, 1.1) })
  // This illustrative fixture places net equity exactly at its 55 PTS maintenance requirement.
  atBoundary = advanceSimulationTick(atBoundary, makeFxTick(DAY_MS, 1.0079))
  assert.ok(Math.abs(getEquityPts(atBoundary) - 55) < 1e-9)
  assert.equal(atBoundary.marginCallPending, false)

  let belowBoundary = createSimulationState({ ...configured, seed: 82 })
  belowBoundary = openFxPosition(belowBoundary, { direction: 'LONG', contracts: 1, tick: makeFxTick(0, 1.1) })
  belowBoundary = advanceSimulationTick(belowBoundary, makeFxTick(DAY_MS, 1.007899))
  assert.ok(getEquityPts(belowBoundary) < 55)
  assert.equal(belowBoundary.marginCallPending, true)
  assertFiniteAccountState(atBoundary)
  assertFiniteAccountState(belowBoundary)
})

test('seeded xorshift and generated market paths reproduce and remain labelled simulated', () => {
  const firstRandom = createSeededRandom(123)
  const secondRandom = createSeededRandom(123)
  assert.deepEqual([firstRandom.nextUint32(), firstRandom.nextUint32()], [secondRandom.nextUint32(), secondRandom.nextUint32()])
  const config = {
    scenarioId: 'generated', startTimestampMs: 0, tickDurationMs: 300_000,
    startingPrice: 1.1, maxAbsReturnPerTick: 0.01, tickCount: 50,
  }
  const first = generateSeededFxTicks(77, config)
  assert.deepEqual(first, generateSeededFxTicks(77, config))
  assert.notDeepEqual(first, generateSeededFxTicks(78, config))
  assert.ok(first.every((tick) => tick.dataStatus === 'SIMULATED' && tick.eurUsd > 0))
  const optionPathConfig = { ...config, volatility: 0.2, riskFreeRate: 0, dividendYield: 0 }
  const optionPath = generateSeededOptionTicks(77, optionPathConfig)
  assert.deepEqual(optionPath, generateSeededOptionTicks(77, optionPathConfig))
  assert.ok(optionPath.every((tick) => tick.dataStatus === 'SIMULATED' && tick.volatility === 0.2))
  assert.throws(() => createSeededRandom(0), /nonzero unsigned/)
})

test('run refuses unresolved exchange configuration instead of filling guessed values', () => {
  assert.throws(() => createSimulationState({
    seed: 1,
    instrument: optionInstrument({ contractMultiplier: null, lotSize: null, dataStatus: 'TBD' }),
    risk: optionRisk(), scenario,
  }), new RegExp(TBD_VALUE))
})
