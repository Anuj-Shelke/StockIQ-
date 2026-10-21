export const STARTING_CAPITAL_PTS = 1000 as const
export const TBD_VALUE = 'TBD — source verification required' as const

export type ArenaKind = 'india-options' | 'eur-usd-fx'
export type DataStatus = 'VERIFIED' | 'ILLUSTRATIVE' | 'TBD'
export type ScenarioStatus = 'SIMULATED' | 'HISTORICAL'
export type OptionType = 'CALL' | 'PUT'
export type FxDirection = 'LONG' | 'SHORT'
export type RunStatus = 'ACTIVE' | 'GAME_OVER' | 'EXITED'

export interface InstrumentConfig {
  id: string
  arena: ArenaKind
  instrumentType: 'option' | 'fx'
  underlyingSymbol: string
  quoteCurrency: string
  /** Underlying units represented by one contract. */
  contractMultiplier: number | null
  /** Minimum increment in contract count; not an exchange lot unless sourced. */
  lotSize: number | null
  sourceName: string
  sourceUrl: string | null
  sourceDate: string | null
  verifiedAt: string | null
  configVersion: string
  dataStatus: DataStatus
  assumptionsLabel?: string
}

export interface OptionRiskConfig {
  kind: 'option'
  dataStatus: DataStatus
  assumptionsLabel: string
  sourceName?: string
  sourceUrl?: string
  sourceDate?: string
  verifiedAt?: string
  ptsPerQuoteCurrencyUnit: number | null
  maxContracts: number | null
  /** Full bid/ask spread expressed in underlying quote currency per unit. */
  spreadQuotePerUnit: number | null
  transactionCostPtsPerContract: number | null
  fixedTransactionCostPts: number | null
}

export interface FxRiskConfig {
  kind: 'fx'
  dataStatus: DataStatus
  assumptionsLabel: string
  sourceName?: string
  sourceUrl?: string
  sourceDate?: string
  verifiedAt?: string
  leverage: number | null
  maxLeverage: number | null
  maintenanceMarginRatio: number | null
  maxContracts: number | null
  maxBaseUnits: number | null
  ptsPerQuoteCurrencyUnit: number | null
  /** Full bid/ask spread in EUR/USD quote units. */
  spreadQuoteUnits: number | null
  liquidationSlippageQuoteUnits: number | null
  transactionCostPtsPerContract: number | null
  fixedTransactionCostPts: number | null
}

export type RiskConfig = OptionRiskConfig | FxRiskConfig

export interface ScenarioMetadata {
  id: string
  label: string
  status: ScenarioStatus
  sourceName?: string
  sourceUrl?: string
  sourceDate?: string
  /** Required for SIMULATED scenarios so synthetic data cannot be mistaken for market data. */
  assumptionsLabel?: string
}

interface TickBase {
  scenarioId: string
  timestampMs: number
  dataStatus: ScenarioStatus
}

export interface OptionMarketTick extends TickBase {
  kind: 'option'
  spot: number
  volatility: number
  riskFreeRate: number
  dividendYield: number
}

export interface FxMarketTick extends TickBase {
  kind: 'fx'
  eurUsd: number
}

export type MarketTick = OptionMarketTick | FxMarketTick

export interface OptionPosition {
  id: string
  kind: 'option'
  type: OptionType
  contracts: number
  strike: number
  expiryTimestampMs: number
  entryTick: OptionMarketTick
  entryTimeToExpiryYears: number
  entryModelPremium: number
  entryFillPremium: number
  entryDebitPts: number
  entryCostPts: number
  currentModelPremium: number
  currentTick: OptionMarketTick
  status: 'OPEN'
}

export interface FxPosition {
  id: string
  kind: 'fx'
  direction: FxDirection
  contracts: number
  baseUnits: number
  entryTick: FxMarketTick
  entryFillPrice: number
  initialMarginPts: number
  entryCostPts: number
  currentTick: FxMarketTick
  status: 'OPEN'
}

export type OpenPosition = OptionPosition | FxPosition

export interface CompletedTrade {
  positionId: string
  kind: OpenPosition['kind']
  instrumentId: string
  scenarioId: string
  entryTimestampMs: number
  exitTimestampMs: number
  contracts: number
  realizedPnlPts: number
  entryCostPts: number
  exitCostPts: number
  capitalSafeguardShortfallPts: number
  optionAutopsy?: OptionAutopsy | UnavailableAutopsy
  exitReason: 'USER_EXIT' | 'EXPIRY' | 'LIQUIDATION' | 'GAME_OVER'
}

export type EngineEventType =
  | 'POSITION_OPENED'
  | 'TICK_APPLIED'
  | 'MARGIN_CALL'
  | 'POSITION_CLOSED'
  | 'POSITION_EXPIRED'
  | 'LIQUIDATED'
  | 'GAME_OVER'
  | 'RUN_EXITED'

export interface EngineEvent {
  type: EngineEventType
  timestampMs: number
  details: Record<string, string | number | boolean>
}

export interface SimulationState {
  readonly startingCapitalPts: typeof STARTING_CAPITAL_PTS
  seed: number
  rngAlgorithmVersion: 'xorshift32-v1'
  instrument: InstrumentConfig
  risk: RiskConfig
  scenario: ScenarioMetadata
  status: RunStatus
  tickIndex: number
  nextPositionId: number
  currentTick: MarketTick | null
  cashBalancePts: number
  reservedMarginPts: number
  marginCallPending: boolean
  position: OpenPosition | null
  /** Independent open orders. `position` remains the most recently opened slot for compatibility. */
  openPositions: OpenPosition[]
  completedTrades: CompletedTrade[]
  events: EngineEvent[]
}

export interface OptionOrder {
  type: OptionType
  contracts: number
  strike: number
  expiryTimestampMs: number
  tick: OptionMarketTick
}

export interface FxOrder {
  direction: FxDirection
  contracts: number
  tick: FxMarketTick
}

export interface TradeCloseResult {
  state: SimulationState
  trade: CompletedTrade
}

export interface GreekValues {
  label: 'MODEL-BASED'
  delta: number
  gamma: number
  /** Per one calendar year. */
  thetaPerYear: number
  /** Per 1.00 change in decimal volatility. */
  vegaPerVolatilityUnit: number
}

export interface OptionValuation {
  premium: number
  greeks: GreekValues
  timeToExpiryYears: number
}

export interface AutopsyContribution {
  factor: 'UNDERLYING' | 'TIME' | 'VOLATILITY'
  premiumChangePerUnit: number
  contributionPts: number
}

export interface OptionAutopsy {
  available: true
  label: 'ORDERED MODEL ATTRIBUTION'
  entryModelPremium: number
  exitModelPremium: number
  modeledChangePts: number
  contributions: AutopsyContribution[]
  note: string
}

export interface UnavailableAutopsy {
  available: false
  reason: string
}
