import type { FxMarketTick, InstrumentConfig, MarketTick, OptionMarketTick, RiskConfig, ScenarioMetadata } from './engine/types.ts'

export type ArenaMarket = 'india' | 'global'
export type ReplayScenario = 'story' | 'trend' | 'reversal' | 'quiet'

export interface ArenaScenario {
  market: ArenaMarket
  scenario: ScenarioMetadata
  instrument: InstrumentConfig
  risk: RiskConfig
  initialTick: OptionMarketTick | FxMarketTick
  ticks: Array<OptionMarketTick | FxMarketTick>
  tickDurationMs: number
}

const DAY_MS = 24 * 60 * 60 * 1000

const returnsByScenario: Record<ReplayScenario, readonly number[]> = {
  story: [0.012, 0.018, 0.009, -0.004, -0.012, -0.026, -0.034, -0.025, -0.012, 0.006, 0.012, -0.008, -0.01, 0.004, 0.009, -0.006, -0.012, 0.004, 0.008, -0.009, 0.006, -0.004, 0.005, -0.003],
  trend: [0.006, 0.007, 0.005, 0.006, 0.004, 0.007, 0.005, 0.006, 0.004, 0.005, 0.006, 0.004, 0.005, 0.006, 0.004, 0.005, 0.006, 0.004, 0.005, 0.006, 0.004, 0.005, 0.004, 0.005],
  reversal: [0.025, 0.03, 0.02, -0.045, -0.06, -0.04, -0.02, 0.008, -0.006, -0.008, 0.004, -0.007, 0.005, -0.006, 0.004, -0.005, 0.004, -0.003, 0.003, -0.004, 0.004, -0.003, 0.002, -0.002],
  quiet: [0.001, -0.0008, 0.0012, -0.0006, 0.0007, -0.001, 0.0008, -0.0005, 0.001, -0.0007, 0.0006, -0.0008, 0.0011, -0.0005, 0.0006, -0.001, 0.0007, -0.0004, 0.0009, -0.0007, 0.0005, -0.0006, 0.0008, -0.0004],
}

const scenarioNames: Record<ReplayScenario, string> = {
  story: 'Story: confidence and consequence',
  trend: 'Replay: steady trend',
  reversal: 'Replay: sharp reversal',
  quiet: 'Replay: quiet market and time decay',
}

function makeInstrument(market: ArenaMarket): InstrumentConfig {
  return market === 'india'
    ? {
        id: 'stockiq-illustrative-index-option', arena: 'india-options', instrumentType: 'option',
        underlyingSymbol: 'Illustrative India index', quoteCurrency: 'scenario points',
        contractMultiplier: 10, lotSize: 1, sourceName: 'StockIQ authored simulation fixture',
        sourceUrl: null, sourceDate: null, verifiedAt: null, configVersion: 'arena-demo-v1',
        dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Synthetic teaching inputs. Not an NSE/BSE contract or market quote.',
      }
    : {
        id: 'stockiq-illustrative-eurusd', arena: 'eur-usd-fx', instrumentType: 'fx',
        underlyingSymbol: 'EUR/USD', quoteCurrency: 'illustrative quote units',
        contractMultiplier: 10_000, lotSize: 1, sourceName: 'StockIQ authored simulation fixture',
        sourceUrl: null, sourceDate: null, verifiedAt: null, configVersion: 'arena-demo-v1',
        dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Synthetic teaching inputs. Not a broker contract or market quote.',
      }
}

function makeRisk(market: ArenaMarket): RiskConfig {
  return market === 'india'
    ? {
        kind: 'option', dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Demo-only costs and contract settings; not exchange rules.',
        ptsPerQuoteCurrencyUnit: 1, maxContracts: 5, spreadQuotePerUnit: 0.02,
        transactionCostPtsPerContract: 1, fixedTransactionCostPts: 1,
      }
    : {
        kind: 'fx', dataStatus: 'ILLUSTRATIVE', assumptionsLabel: 'Demo-only leverage, margin and execution settings; not broker rules.',
        leverage: 20, maxLeverage: 20, maintenanceMarginRatio: 0.5,
        maxContracts: 1, maxBaseUnits: 10_000, ptsPerQuoteCurrencyUnit: 1,
        spreadQuoteUnits: 0.002, liquidationSlippageQuoteUnits: 0.001,
        transactionCostPtsPerContract: 2, fixedTransactionCostPts: 1,
      }
}

/** Returns a fixed, original, clearly illustrative path. No network or real market feed is used. */
export function createArenaScenario(market: ArenaMarket, replay: ReplayScenario, seed: number): ArenaScenario {
  const instrument = makeInstrument(market)
  const risk = makeRisk(market)
  const id = `arena-${market}-${replay}-${seed}`
  const scenario: ScenarioMetadata = {
    id, label: scenarioNames[replay], status: 'SIMULATED',
    assumptionsLabel: 'ILLUSTRATIVE SCENARIO — authored and simulated for education. Not historical or live market data.',
  }
  const tickDurationMs = DAY_MS
  const initialPrice = market === 'india' ? 100 : 1.1
  const volatility = 0.3
  const riskFreeRate = 0.05
  const dividendYield = 0
  const makeTick = (index: number, price: number) => market === 'india'
    ? {
        kind: 'option' as const, scenarioId: id, timestampMs: index * tickDurationMs,
        dataStatus: 'SIMULATED' as const, spot: price,
        volatility: Math.max(0.12, volatility + (replay === 'quiet' ? 0 : ((index % 6) - 2) * 0.012)),
        riskFreeRate, dividendYield,
      }
    : { kind: 'fx' as const, scenarioId: id, timestampMs: index * tickDurationMs, dataStatus: 'SIMULATED' as const, eurUsd: price }

  let price = initialPrice
  const initialTick = makeTick(0, price)
  const ticks = returnsByScenario[replay].map((change, index) => {
    price *= 1 + change
    return makeTick(index + 1, price)
  })

  return { market, scenario, instrument, risk, initialTick, ticks, tickDurationMs }
}

export function arenaSeedForCycle(seed: number, cycleIndex: number): number {
  return ((seed - 1 + cycleIndex) % 0xffff_fffe) + 1
}

/** Continue a fixed synthetic return path from the last observed mark without resetting account state. */
export function createNextArenaCycle(market: ArenaMarket, replay: ReplayScenario, seed: number, scenarioId: string, lastTick: MarketTick): MarketTick[] {
  const fixture = createArenaScenario(market, replay, seed)
  if (lastTick.kind !== fixture.initialTick.kind) throw new TypeError('Arena cycle instrument does not match the current market')
  if (lastTick.kind === 'option' && fixture.initialTick.kind === 'option') {
    return fixture.ticks.map((tick) => {
      if (tick.kind !== 'option') throw new TypeError('Option cycle contains a non-option tick')
      return {
        ...tick,
        scenarioId,
        timestampMs: lastTick.timestampMs + tick.timestampMs - fixture.initialTick.timestampMs,
        spot: lastTick.spot * tick.spot / (fixture.initialTick as OptionMarketTick).spot,
      }
    })
  }
  if (lastTick.kind === 'fx' && fixture.initialTick.kind === 'fx') {
    return fixture.ticks.map((tick) => {
      if (tick.kind !== 'fx') throw new TypeError('FX cycle contains a non-FX tick')
      return {
        ...tick,
        scenarioId,
        timestampMs: lastTick.timestampMs + tick.timestampMs - fixture.initialTick.timestampMs,
        eurUsd: lastTick.eurUsd * tick.eurUsd / (fixture.initialTick as FxMarketTick).eurUsd,
      }
    })
  }
  throw new TypeError('Arena cycle instrument does not match the current market')
}

export const replayChoices: Array<{ id: ReplayScenario; title: string; description: string }> = [
  { id: 'story', title: 'Story Mode', description: 'A scripted arc of confidence, reversal and consequence.' },
  { id: 'trend', title: 'Steady trend', description: 'A persistent move through a fully simulated path.' },
  { id: 'reversal', title: 'Sharp reversal', description: 'Early strength gives way to a fast drawdown.' },
  { id: 'quiet', title: 'Quiet / time decay', description: 'Small moves make time and model sensitivity easier to notice.' },
]
