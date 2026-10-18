import { priceEuropeanOption, timeToExpiryAct365, valueEuropeanOption } from './pricingEngine.ts'
import { createSeededRandom, RNG_ALGORITHM_VERSION } from './random.ts'
import { calculateOptionAutopsy } from './autopsy.ts'
import {
  STARTING_CAPITAL_PTS,
  TBD_VALUE,
  type CompletedTrade,
  type EngineEvent,
  type FxMarketTick,
  type FxOrder,
  type FxPosition,
  type FxRiskConfig,
  type InstrumentConfig,
  type MarketTick,
  type OpenPosition,
  type OptionOrder,
  type OptionPosition,
  type OptionRiskConfig,
  type RiskConfig,
  type ScenarioMetadata,
  type SimulationState,
  type TradeCloseResult,
} from './types.ts'

function finite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`)
}

function positive(name: string, value: number | null): asserts value is number {
  if (value === null) throw new Error(`${name}: ${TBD_VALUE}`)
  finite(name, value)
  if (value <= 0) throw new RangeError(`${name} must be greater than zero`)
}

function nonNegative(name: string, value: number | null): asserts value is number {
  if (value === null) throw new Error(`${name}: ${TBD_VALUE}`)
  finite(name, value)
  if (value < 0) throw new RangeError(`${name} cannot be negative`)
}

function assertSourceMetadata(instrument: InstrumentConfig): void {
  if (!instrument.id.trim() || !instrument.underlyingSymbol.trim() || !instrument.quoteCurrency.trim()) {
    throw new TypeError('Instrument id, underlying symbol, and quote currency are required')
  }
  if (!instrument.configVersion.trim()) throw new TypeError('configVersion is required')
  if (instrument.dataStatus === 'TBD') throw new Error(`Instrument configuration: ${TBD_VALUE}`)
  if (instrument.dataStatus === 'VERIFIED') {
    if (!instrument.sourceName.trim() || !instrument.sourceUrl?.trim() || !instrument.sourceDate || !instrument.verifiedAt) {
      throw new Error('Verified instrument data requires source name, URL, source date, and verification date')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(instrument.sourceDate) || !/^\d{4}-\d{2}-\d{2}$/.test(instrument.verifiedAt)) {
      throw new TypeError('Instrument source dates must use YYYY-MM-DD')
    }
  }
  if (instrument.dataStatus === 'ILLUSTRATIVE' && !instrument.assumptionsLabel?.trim()) {
    throw new Error('Illustrative instrument configuration must be explicitly labelled')
  }
  positive('contractMultiplier', instrument.contractMultiplier)
  positive('lotSize', instrument.lotSize)
}

function validateRiskConfig(risk: RiskConfig): void {
  if (risk.dataStatus === 'TBD') throw new Error(`Risk configuration: ${TBD_VALUE}`)
  if (risk.dataStatus === 'ILLUSTRATIVE' && !risk.assumptionsLabel.trim()) {
    throw new Error('Illustrative risk settings must be explicitly labelled')
  }
  if (risk.dataStatus === 'VERIFIED') {
    if (!risk.sourceName?.trim() || !risk.sourceUrl?.trim() || !risk.sourceDate || !risk.verifiedAt) {
      throw new Error('Verified risk settings require source name, URL, source date, and verification date')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(risk.sourceDate) || !/^\d{4}-\d{2}-\d{2}$/.test(risk.verifiedAt)) {
      throw new TypeError('Risk source dates must use YYYY-MM-DD')
    }
  }
  positive('ptsPerQuoteCurrencyUnit', risk.ptsPerQuoteCurrencyUnit)
  positive('maxContracts', risk.maxContracts)
  nonNegative('fixedTransactionCostPts', risk.fixedTransactionCostPts)
  nonNegative('transactionCostPtsPerContract', risk.transactionCostPtsPerContract)

  if (risk.kind === 'option') {
    nonNegative('spreadQuotePerUnit', risk.spreadQuotePerUnit)
  } else {
    positive('leverage', risk.leverage)
    positive('maxLeverage', risk.maxLeverage)
    if (risk.leverage > risk.maxLeverage) throw new RangeError('leverage cannot exceed maxLeverage')
    positive('maintenanceMarginRatio', risk.maintenanceMarginRatio)
    if (risk.maintenanceMarginRatio > 1) throw new RangeError('maintenanceMarginRatio must be at most 1')
    positive('maxBaseUnits', risk.maxBaseUnits)
    nonNegative('spreadQuoteUnits', risk.spreadQuoteUnits)
    nonNegative('liquidationSlippageQuoteUnits', risk.liquidationSlippageQuoteUnits)
  }
}

function assertContracts(contracts: number, instrument: InstrumentConfig, maxContracts: number): void {
  finite('contracts', contracts)
  if (contracts <= 0 || contracts > maxContracts) throw new RangeError('contracts is outside the configured position limit')
  const increment = instrument.lotSize!
  const steps = contracts / increment
  if (Math.abs(steps - Math.round(steps)) > 1e-9) throw new RangeError('contracts must follow the configured lot increment')
}

function assertScenario(scenario: ScenarioMetadata): void {
  if (!scenario.id.trim() || !scenario.label.trim()) throw new TypeError('Scenario id and label are required')
  if (scenario.status === 'SIMULATED' && !scenario.assumptionsLabel?.trim()) {
    throw new Error('Simulated scenarios must be labelled as illustrative')
  }
  if (scenario.status === 'HISTORICAL' && !(scenario.sourceName && scenario.sourceUrl && scenario.sourceDate)) {
    throw new Error(`Historical data provenance: ${TBD_VALUE}`)
  }
}

export function createSimulationState(input: {
  seed: number
  instrument: InstrumentConfig
  risk: RiskConfig
  scenario: ScenarioMetadata
}): SimulationState {
  const { seed, instrument, risk, scenario } = input
  createSeededRandom(seed)
  assertSourceMetadata(instrument)
  validateRiskConfig(risk)
  assertScenario(scenario)
  if (instrument.arena === 'india-options' && (instrument.instrumentType !== 'option' || risk.kind !== 'option')) {
    throw new TypeError('India Arena requires option instrument and risk configuration')
  }
  if (instrument.arena === 'eur-usd-fx' && (instrument.instrumentType !== 'fx' || risk.kind !== 'fx')) {
    throw new TypeError('EUR/USD Arena requires FX instrument and risk configuration')
  }
  if (instrument.arena === 'eur-usd-fx' && instrument.underlyingSymbol !== 'EUR/USD') {
    throw new TypeError('Global V1 supports only the explicitly configured EUR/USD instrument')
  }
  return {
    startingCapitalPts: STARTING_CAPITAL_PTS,
    seed,
    rngAlgorithmVersion: RNG_ALGORITHM_VERSION,
    instrument: { ...instrument },
    risk: { ...risk },
    scenario: { ...scenario },
    status: 'ACTIVE',
    tickIndex: 0,
    nextPositionId: 1,
    currentTick: null,
    cashBalancePts: STARTING_CAPITAL_PTS,
    reservedMarginPts: 0,
    marginCallPending: false,
    position: null,
    openPositions: [],
    completedTrades: [],
    events: [],
  }
}

export function getAvailablePts(state: SimulationState): number {
  return Math.max(0, state.cashBalancePts - state.reservedMarginPts)
}

export function getMaintenanceMarginPts(state: SimulationState): number | null {
  if (state.risk.kind !== 'fx') return null
  const margin = state.openPositions.filter((position): position is FxPosition => position.kind === 'fx')
    .reduce((total, position) => total + position.initialMarginPts, 0)
  return margin > 0 ? margin * state.risk.maintenanceMarginRatio! : null
}

export function getMarginLevel(state: SimulationState): number | null {
  const maintenance = getMaintenanceMarginPts(state)
  if (maintenance === null) return null
  return getEquityPts(state) / maintenance
}

function optionCloseFee(risk: OptionRiskConfig, contracts: number): number {
  return risk.fixedTransactionCostPts! + risk.transactionCostPtsPerContract! * contracts
}

function fxCloseFee(risk: FxRiskConfig, contracts: number): number {
  return risk.fixedTransactionCostPts! + risk.transactionCostPtsPerContract! * contracts
}

function optionLiquidationValue(position: OptionPosition, risk: OptionRiskConfig, instrument: InstrumentConfig): number {
  const sellPrice = Math.max(0, position.currentModelPremium - risk.spreadQuotePerUnit! / 2)
  const value = sellPrice * position.contracts * instrument.contractMultiplier! * risk.ptsPerQuoteCurrencyUnit!
  return value - optionCloseFee(risk, position.contracts)
}

function fxExitPrice(position: FxPosition, risk: FxRiskConfig, liquidation: boolean): number {
  const halfSpread = risk.spreadQuoteUnits! / 2
  const slippage = liquidation ? risk.liquidationSlippageQuoteUnits! : 0
  const adjustment = halfSpread + slippage
  return position.direction === 'LONG'
    ? Math.max(0, position.currentTick.eurUsd - adjustment)
    : position.currentTick.eurUsd + adjustment
}

function fxUnrealizedPnl(position: FxPosition, risk: FxRiskConfig): number {
  const exitPrice = fxExitPrice(position, risk, false)
  const direction = position.direction === 'LONG' ? 1 : -1
  const quotePnl = direction * position.baseUnits * (exitPrice - position.entryFillPrice)
  return quotePnl * risk.ptsPerQuoteCurrencyUnit! - fxCloseFee(risk, position.contracts)
}

export function getEquityPts(state: SimulationState): number {
  let equity = state.cashBalancePts
  for (const position of state.openPositions) {
    if (position.kind === 'option' && state.risk.kind === 'option') {
      equity += optionLiquidationValue(position, state.risk, state.instrument)
    } else if (position.kind === 'fx' && state.risk.kind === 'fx') {
      equity += fxUnrealizedPnl(position, state.risk)
    }
  }
  return Math.max(0, equity)
}

export function getPositionPnlPts(state: SimulationState, positionId: string): number {
  const position = state.openPositions.find((item) => item.id === positionId)
  if (!position) throw new Error('Open position was not found')
  if (position.kind === 'option' && state.risk.kind === 'option') {
    return optionLiquidationValue(position, state.risk, state.instrument) - position.entryDebitPts
  }
  if (position.kind === 'fx' && state.risk.kind === 'fx') {
    return fxUnrealizedPnl(position, state.risk) - position.entryCostPts
  }
  throw new Error('Open position does not match its risk configuration')
}

function makeEvent(type: EngineEvent['type'], timestampMs: number, details: EngineEvent['details']): EngineEvent {
  return { type, timestampMs, details }
}

function assertTick(state: SimulationState, tick: MarketTick, allowSameCurrentTimestamp = false): void {
  if (tick.scenarioId !== state.scenario.id) throw new Error('Tick belongs to a different scenario')
  if (!Number.isFinite(tick.timestampMs)) throw new RangeError('Tick timestamp must be finite')
  if (!Number.isInteger(tick.timestampMs)) throw new RangeError('Tick timestamp must be an integer millisecond value')
  if (state.currentTick) {
    if (allowSameCurrentTimestamp && tick.timestampMs !== state.currentTick.timestampMs) {
      throw new RangeError('Orders must use the current scenario tick')
    }
    if (!allowSameCurrentTimestamp && tick.timestampMs <= state.currentTick.timestampMs) {
      throw new RangeError('Tick timestamps must move forward')
    }
  }
  if (state.scenario.status === 'SIMULATED' && tick.dataStatus !== 'SIMULATED') {
    throw new Error('Simulated scenario cannot accept a tick with different data provenance')
  }
  if (state.scenario.status === 'HISTORICAL' && tick.dataStatus !== 'HISTORICAL') {
    throw new Error('Historical scenario cannot accept a tick with different data provenance')
  }
  if (state.instrument.arena === 'india-options' && tick.kind !== 'option') throw new TypeError('Option run requires option market ticks')
  if (state.instrument.arena === 'eur-usd-fx' && tick.kind !== 'fx') throw new TypeError('FX run requires EUR/USD market ticks')
  if (tick.kind === 'option') {
    positive('spot', tick.spot)
    positive('volatility', tick.volatility)
    finite('riskFreeRate', tick.riskFreeRate)
    finite('dividendYield', tick.dividendYield)
  } else {
    positive('EUR/USD mark', tick.eurUsd)
  }
}

export function openOptionPosition(state: SimulationState, order: OptionOrder): SimulationState {
  if (state.status !== 'ACTIVE') throw new Error('Run is not active')
  if (state.instrument.arena !== 'india-options' || state.risk.kind !== 'option') throw new Error('This run is not configured for options')
  assertTick(state, order.tick, true)
  if (order.tick.kind !== 'option') throw new TypeError('Option order requires an option tick')
  assertContracts(order.contracts, state.instrument, state.risk.maxContracts!)
  positive('strike', order.strike)
  finite('expiryTimestampMs', order.expiryTimestampMs)
  if (!Number.isInteger(order.expiryTimestampMs)) throw new RangeError('Option expiry must be an integer millisecond value')
  if (order.expiryTimestampMs <= order.tick.timestampMs) throw new RangeError('Option expiry must be after entry')

  const timeToExpiryYears = timeToExpiryAct365(order.expiryTimestampMs, order.tick.timestampMs)
  const valuation = valueEuropeanOption({
    spot: order.tick.spot,
    strike: order.strike,
    timeToExpiryYears,
    riskFreeRate: order.tick.riskFreeRate,
    volatility: order.tick.volatility,
    dividendYield: order.tick.dividendYield,
    type: order.type,
  })
  const entryFillPremium = valuation.premium + state.risk.spreadQuotePerUnit! / 2
  const grossDebitPts = entryFillPremium * order.contracts * state.instrument.contractMultiplier! * state.risk.ptsPerQuoteCurrencyUnit!
  const fee = optionCloseFee(state.risk, order.contracts)
  const entryDebitPts = grossDebitPts + fee
  if (entryDebitPts > getAvailablePts(state)) throw new Error('Insufficient available PTS for premium and transaction costs')

  const position: OptionPosition = {
    id: `position-${state.nextPositionId}`,
    kind: 'option',
    type: order.type,
    contracts: order.contracts,
    strike: order.strike,
    expiryTimestampMs: order.expiryTimestampMs,
    entryTick: { ...order.tick },
    entryTimeToExpiryYears: timeToExpiryYears,
    entryModelPremium: valuation.premium,
    entryFillPremium,
    entryDebitPts,
    entryCostPts: fee,
    currentModelPremium: valuation.premium,
    currentTick: { ...order.tick },
    status: 'OPEN',
  }
  const timestampMs = order.tick.timestampMs
  const next: SimulationState = {
    ...state,
    nextPositionId: state.nextPositionId + 1,
    currentTick: { ...order.tick },
    cashBalancePts: state.cashBalancePts - entryDebitPts,
    position,
    openPositions: [...state.openPositions, position],
    events: [...state.events, makeEvent('POSITION_OPENED', timestampMs, {
      positionId: position.id, kind: 'option', type: order.type, contracts: order.contracts, entryModelPremium: valuation.premium,
      entryFillPremium, entryDebitPts, strike: order.strike, expiryTimestampMs: order.expiryTimestampMs,
      pricingLabel: 'MODEL-BASED',
    })],
  }
  if (getEquityPts(next) <= 0) return finalizeDepletedState(exitOption(next, position, 'GAME_OVER').state, timestampMs)
  return next
}

export function openFxPosition(state: SimulationState, order: FxOrder): SimulationState {
  if (state.status !== 'ACTIVE') throw new Error('Run is not active')
  if (state.instrument.arena !== 'eur-usd-fx' || state.risk.kind !== 'fx') throw new Error('This run is not configured for FX')
  assertTick(state, order.tick, true)
  if (order.tick.kind !== 'fx') throw new TypeError('FX order requires an FX tick')
  assertContracts(order.contracts, state.instrument, state.risk.maxContracts!)

  const baseUnits = order.contracts * state.instrument.contractMultiplier!
  if (baseUnits > state.risk.maxBaseUnits!) throw new RangeError('Position exceeds configured maximum base units')
  const directionSign = order.direction === 'LONG' ? 1 : -1
  const entryFillPrice = order.tick.eurUsd + directionSign * state.risk.spreadQuoteUnits! / 2
  if (entryFillPrice <= 0) throw new RangeError('FX spread makes the entry price invalid')
  const notionalPts = baseUnits * order.tick.eurUsd * state.risk.ptsPerQuoteCurrencyUnit!
  const initialMarginPts = notionalPts / state.risk.leverage!
  const entryCostPts = fxCloseFee(state.risk, order.contracts)
  if (initialMarginPts + entryCostPts > getAvailablePts(state)) throw new Error('Insufficient available PTS for FX margin and transaction costs')

  const position: FxPosition = {
    id: `position-${state.nextPositionId}`,
    kind: 'fx', direction: order.direction, contracts: order.contracts, baseUnits,
    entryTick: { ...order.tick }, entryFillPrice, initialMarginPts, entryCostPts,
    currentTick: { ...order.tick }, status: 'OPEN',
  }
  const next: SimulationState = {
    ...state,
    nextPositionId: state.nextPositionId + 1,
    currentTick: { ...order.tick },
    cashBalancePts: state.cashBalancePts - entryCostPts,
    reservedMarginPts: state.reservedMarginPts + initialMarginPts,
    position,
    openPositions: [...state.openPositions, position],
    events: [...state.events, makeEvent('POSITION_OPENED', order.tick.timestampMs, {
      positionId: position.id, kind: 'fx', direction: order.direction, contracts: order.contracts, baseUnits,
      initialMarginPts, leverage: state.risk.leverage!, entryCostPts,
    })],
  }
  if (getEquityPts(next) <= 0) return finalizeDepletedState(exitFx(next, position, 'GAME_OVER').state, order.tick.timestampMs)
  return next
}

function completeTrade(
  state: SimulationState,
  position: OpenPosition,
  exitTimestampMs: number,
  exitCreditPts: number,
  exitCostPts: number,
  reason: CompletedTrade['exitReason'],
  eventType: EngineEvent['type'],
  extraDetails: EngineEvent['details'] = {},
  capitalSafeguardShortfallPts = 0,
  realizedPnlOverride?: number,
  optionAutopsy?: CompletedTrade['optionAutopsy'],
): TradeCloseResult {
  let nextCash = state.cashBalancePts + exitCreditPts
  const shortfallPts = Math.max(0, -nextCash)
  if (nextCash < 0) nextCash = 0
  const entryCostPts = position.entryCostPts
  const realizedPnlPts = realizedPnlOverride ?? (position.kind === 'option'
    ? exitCreditPts - position.entryDebitPts
    : (position.direction === 'LONG' ? 1 : -1)
      * position.baseUnits
      * ((position.currentTick as FxMarketTick).eurUsd - position.entryFillPrice)
      * (state.risk as FxRiskConfig).ptsPerQuoteCurrencyUnit!
      - position.entryCostPts - exitCostPts)
  const trade: CompletedTrade = {
    positionId: position.id,
    kind: position.kind,
    instrumentId: state.instrument.id,
    scenarioId: state.scenario.id,
    entryTimestampMs: position.entryTick.timestampMs,
    exitTimestampMs,
    contracts: position.contracts,
    realizedPnlPts,
    entryCostPts,
    exitCostPts,
    capitalSafeguardShortfallPts: Math.max(shortfallPts, capitalSafeguardShortfallPts),
    ...(optionAutopsy ? { optionAutopsy } : {}),
    exitReason: reason,
  }
  const next: SimulationState = {
    ...state,
    cashBalancePts: nextCash,
    openPositions: state.openPositions.filter((openPosition) => openPosition.id !== position.id),
    reservedMarginPts: state.openPositions
      .filter((openPosition): openPosition is FxPosition => openPosition.id !== position.id && openPosition.kind === 'fx')
      .reduce((total, openPosition) => total + openPosition.initialMarginPts, 0),
    marginCallPending: false,
    position: state.openPositions.filter((openPosition) => openPosition.id !== position.id).at(-1) ?? null,
    completedTrades: [...state.completedTrades, trade],
    events: [...state.events, makeEvent(eventType, exitTimestampMs, {
      positionId: position.id, kind: position.kind, reason, realizedPnlPts, exitCostPts,
      capitalSafeguardShortfallPts: Math.max(shortfallPts, capitalSafeguardShortfallPts), ...extraDetails,
    })],
  }
  return { state: next, trade }
}

function exitOption(state: SimulationState, position: OptionPosition, reason: CompletedTrade['exitReason'], expiry = false): TradeCloseResult {
  if (state.risk.kind !== 'option') throw new Error('Option risk config is missing')
  const time = expiry ? 0 : timeToExpiryAct365(position.expiryTimestampMs, position.currentTick.timestampMs)
  const premium = expiry
    ? priceEuropeanOption({
      spot: position.currentTick.spot, strike: position.strike, timeToExpiryYears: 0,
      riskFreeRate: position.currentTick.riskFreeRate, volatility: position.currentTick.volatility,
      dividendYield: position.currentTick.dividendYield, type: position.type,
    })
    : position.currentModelPremium
  const fillPremium = expiry ? premium : Math.max(0, premium - state.risk.spreadQuotePerUnit! / 2)
  const grossCreditPts = fillPremium * position.contracts * state.instrument.contractMultiplier! * state.risk.ptsPerQuoteCurrencyUnit!
  const exitCostPts = optionCloseFee(state.risk, position.contracts)
  const exitCreditPts = grossCreditPts - exitCostPts
  const optionAutopsy = calculateOptionAutopsy(position, position.currentTick, state.instrument, state.risk)
  return completeTrade(
    { ...state, position: { ...position, currentModelPremium: premium } },
    position,
    position.currentTick.timestampMs,
    exitCreditPts,
    exitCostPts,
    expiry ? 'EXPIRY' : reason,
    expiry ? 'POSITION_EXPIRED' : reason === 'LIQUIDATION' ? 'LIQUIDATED' : 'POSITION_CLOSED',
    { modelPremium: premium, fillPremium, timeToExpiryYears: time },
    0,
    undefined,
    optionAutopsy,
  )
}

function exitFx(state: SimulationState, position: FxPosition, reason: CompletedTrade['exitReason']): TradeCloseResult {
  if (state.risk.kind !== 'fx') throw new Error('FX risk config is missing')
  const liquidation = reason === 'LIQUIDATION' || reason === 'GAME_OVER'
  const exitPrice = fxExitPrice(position, state.risk, liquidation)
  const directionSign = position.direction === 'LONG' ? 1 : -1
  const grossPnlPts = directionSign * position.baseUnits * (exitPrice - position.entryFillPrice) * state.risk.ptsPerQuoteCurrencyUnit!
  const exitCostPts = fxCloseFee(state.risk, position.contracts)
  const rawExitCreditPts = grossPnlPts - exitCostPts
  // Simulation-only safeguard from the spec: the cash account cannot go below zero.
  const exitCreditPts = Math.max(-state.cashBalancePts, rawExitCreditPts)
  const shortfallPts = Math.max(0, -(state.cashBalancePts + rawExitCreditPts))
  return completeTrade(state, position, position.currentTick.timestampMs, exitCreditPts, exitCostPts,
    reason, reason === 'LIQUIDATION' || reason === 'GAME_OVER' ? 'LIQUIDATED' : 'POSITION_CLOSED',
    { exitPrice, grossPnlPts, liquidation }, shortfallPts,
    grossPnlPts - position.entryCostPts - exitCostPts)
}

export function closeOpenPosition(state: SimulationState, reason: 'USER_EXIT' = 'USER_EXIT', positionId?: string): TradeCloseResult {
  if (state.status !== 'ACTIVE') throw new Error('Run is not active')
  const position = positionId
    ? state.openPositions.find((item) => item.id === positionId)
    : state.openPositions.at(-1)
  if (!position || !state.currentTick) throw new Error('There is no matching open position to close')
  const result = position.kind === 'option'
    ? exitOption(state, position, reason)
    : exitFx(state, position, reason)
  return { ...result, state: finalizeDepletedState(result.state, position.currentTick.timestampMs) }
}

function finalizeDepletedState(state: SimulationState, timestampMs: number): SimulationState {
  if (getEquityPts(state) > 0) return state
  let next = state
  for (const position of [...next.openPositions].reverse()) {
    if (!next.openPositions.some((item) => item.id === position.id)) continue
    next = position.kind === 'option'
      ? exitOption(next, position, 'GAME_OVER').state
      : exitFx(next, position, 'GAME_OVER').state
  }
  next.cashBalancePts = 0
  next.reservedMarginPts = 0
  next.position = null
  next.openPositions = []
  next.status = 'GAME_OVER'
  if (!next.events.some((event) => event.type === 'GAME_OVER')) {
    next.events = [...next.events, makeEvent('GAME_OVER', timestampMs, { finalCapitalPts: 0 })]
  }
  return next
}

function closeAtExpiry(state: SimulationState, position: OptionPosition): TradeCloseResult {
  return exitOption(state, position, 'EXPIRY', true)
}

function pendingLiquidation(state: SimulationState): TradeCloseResult {
  const position = [...state.openPositions].reverse().find((item): item is FxPosition => item.kind === 'fx')
  if (!position) throw new Error('Pending liquidation requires an FX position')
  return exitFx(state, position, 'LIQUIDATION')
}

export function advanceSimulationTick(state: SimulationState, tick: MarketTick): SimulationState {
  if (state.status !== 'ACTIVE') throw new Error('Run is not active')
  assertTick(state, tick)
  let next: SimulationState = {
    ...state,
    currentTick: { ...tick },
    tickIndex: state.tickIndex + 1,
    events: [...state.events, makeEvent('TICK_APPLIED', tick.timestampMs, { tickIndex: state.tickIndex + 1, dataStatus: tick.dataStatus })],
  }

  const repricedPositions = next.openPositions.map((position): OpenPosition => {
    if (position.kind === 'option' && tick.kind === 'option') {
      return {
        ...position,
        currentTick: { ...tick },
        currentModelPremium: priceEuropeanOption({
          spot: tick.spot,
          strike: position.strike,
          timeToExpiryYears: timeToExpiryAct365(position.expiryTimestampMs, tick.timestampMs),
          riskFreeRate: tick.riskFreeRate,
          volatility: tick.volatility,
          dividendYield: tick.dividendYield,
          type: position.type,
        }),
      }
    }
    return { ...position, currentTick: { ...tick } } as OpenPosition
  })
  next.openPositions = repricedPositions
  next.position = repricedPositions.at(-1) ?? null

  if (tick.kind === 'option') {
    const expiring = next.openPositions.filter((position): position is OptionPosition => position.kind === 'option' && tick.timestampMs >= position.expiryTimestampMs)
    for (const position of expiring) {
      next = closeAtExpiry(next, position).state
      if (next.status === 'GAME_OVER') break
    }
  } else {
    const fxPositions = next.openPositions.filter((position): position is FxPosition => position.kind === 'fx')
    if (fxPositions.length && state.marginCallPending) {
      for (const position of [...fxPositions].reverse()) {
        if (!next.openPositions.some((item) => item.id === position.id)) continue
        next = pendingLiquidation(next).state
        if (next.status === 'GAME_OVER') break
      }
    } else if (fxPositions.length) {
      const maintenance = getMaintenanceMarginPts(next)!
      if (getEquityPts(next) <= 0) {
        for (const position of [...fxPositions].reverse()) {
          if (!next.openPositions.some((item) => item.id === position.id)) continue
          next = exitFx(next, position, 'GAME_OVER').state
          if (next.status === 'GAME_OVER') break
        }
      } else if (getEquityPts(next) < maintenance) {
        next.marginCallPending = true
        next.events = [...next.events, makeEvent('MARGIN_CALL', tick.timestampMs, {
          equityPts: getEquityPts(next), maintenanceMarginPts: maintenance,
          liquidationScheduledForNextTick: true,
        })]
      }
    }
  }

  return finalizeDepletedState(next, tick.timestampMs)
}

export function getModelGreeks(state: SimulationState, positionId?: string) {
  const position = positionId ? state.openPositions.find((item) => item.id === positionId) : state.position
  if (!position || position.kind !== 'option') throw new Error('No open option position')
  const { currentTick, strike, expiryTimestampMs, type } = position
  return valueEuropeanOption({
    spot: currentTick.spot,
    strike,
    timeToExpiryYears: timeToExpiryAct365(expiryTimestampMs, currentTick.timestampMs),
    riskFreeRate: currentTick.riskFreeRate,
    volatility: currentTick.volatility,
    dividendYield: currentTick.dividendYield,
    type,
  }).greeks
}

export function exitSimulation(state: SimulationState): SimulationState {
  if (state.status !== 'ACTIVE') return state
  if (state.openPositions.length) {
    if (!state.currentTick) throw new Error('Open position has no current tick')
    let resultState = state
    for (const position of [...state.openPositions].reverse()) {
      if (resultState.status !== 'ACTIVE' || !resultState.openPositions.some((item) => item.id === position.id)) continue
      resultState = closeOpenPosition(resultState, 'USER_EXIT', position.id).state
    }
    return {
      ...resultState,
      status: resultState.status === 'GAME_OVER' ? 'GAME_OVER' : 'EXITED',
      events: [...resultState.events, makeEvent('RUN_EXITED', state.currentTick.timestampMs, { finalCapitalPts: resultState.cashBalancePts })],
    }
  }
  return {
    ...state,
    status: 'EXITED',
    events: [...state.events, makeEvent('RUN_EXITED', state.currentTick?.timestampMs ?? 0, { finalCapitalPts: state.cashBalancePts })],
  }
}
