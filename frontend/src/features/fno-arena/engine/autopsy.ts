import { priceEuropeanOption, timeToExpiryAct365 } from './pricingEngine.ts'
import type {
  InstrumentConfig,
  OptionAutopsy,
  OptionMarketTick,
  OptionPosition,
  OptionRiskConfig,
  UnavailableAutopsy,
} from './types.ts'

function unavailable(reason: string): UnavailableAutopsy {
  return { available: false, reason }
}

/** Ordered one-factor-at-a-time Black–Scholes attribution; costs are intentionally excluded. */
export function calculateOptionAutopsy(
  position: OptionPosition,
  exitTick: OptionMarketTick,
  instrument: InstrumentConfig,
  risk: OptionRiskConfig,
): OptionAutopsy | UnavailableAutopsy {
  if (position.status !== 'OPEN') return unavailable('The option position is not open.')
  if (exitTick.scenarioId !== position.entryTick.scenarioId) return unavailable('Entry and exit belong to different scenarios.')
  if (exitTick.dataStatus !== position.entryTick.dataStatus) return unavailable('Entry and exit data provenance does not match.')
  if (!Number.isFinite(exitTick.timestampMs) || !Number.isInteger(exitTick.timestampMs)) return unavailable('Exit timestamp is invalid.')
  if (exitTick.timestampMs < position.entryTick.timestampMs) return unavailable('Exit time precedes entry time.')
  if (![exitTick.spot, exitTick.volatility, exitTick.riskFreeRate, exitTick.dividendYield].every(Number.isFinite)
    || exitTick.spot <= 0 || exitTick.volatility <= 0) {
    return unavailable('Exit model inputs are missing or invalid.')
  }
  if (exitTick.riskFreeRate !== position.entryTick.riskFreeRate
    || exitTick.dividendYield !== position.entryTick.dividendYield) {
    return unavailable('Rate changes are outside the approved three-factor attribution.')
  }
  if (instrument.dataStatus === 'TBD' || instrument.contractMultiplier === null
    || !Number.isFinite(instrument.contractMultiplier) || instrument.contractMultiplier <= 0
    || risk.dataStatus === 'TBD' || risk.ptsPerQuoteCurrencyUnit === null
    || !Number.isFinite(risk.ptsPerQuoteCurrencyUnit) || risk.ptsPerQuoteCurrencyUnit <= 0) {
    return unavailable('Required instrument or PTS conversion configuration is TBD.')
  }

  const entry = {
    spot: position.entryTick.spot,
    strike: position.strike,
    timeToExpiryYears: position.entryTimeToExpiryYears,
    riskFreeRate: position.entryTick.riskFreeRate,
    volatility: position.entryTick.volatility,
    dividendYield: position.entryTick.dividendYield,
    type: position.type,
  } as const
  const exitTimeToExpiryYears = timeToExpiryAct365(position.expiryTimestampMs, exitTick.timestampMs)
  const underlyingPremium = priceEuropeanOption({ ...entry, spot: exitTick.spot })
  const timePremium = priceEuropeanOption({ ...entry, spot: exitTick.spot, timeToExpiryYears: exitTimeToExpiryYears })
  const finalPremium = priceEuropeanOption({ ...entry, spot: exitTick.spot, timeToExpiryYears: exitTimeToExpiryYears, volatility: exitTick.volatility })
  const scaleToPts = position.contracts * instrument.contractMultiplier * risk.ptsPerQuoteCurrencyUnit
  const contributions = [
    { factor: 'UNDERLYING' as const, premiumChangePerUnit: underlyingPremium - position.entryModelPremium },
    { factor: 'TIME' as const, premiumChangePerUnit: timePremium - underlyingPremium },
    { factor: 'VOLATILITY' as const, premiumChangePerUnit: finalPremium - timePremium },
  ].map((item) => ({ ...item, contributionPts: item.premiumChangePerUnit * scaleToPts }))

  return {
    available: true,
    label: 'ORDERED MODEL ATTRIBUTION',
    entryModelPremium: position.entryModelPremium,
    exitModelPremium: finalPremium,
    modeledChangePts: (finalPremium - position.entryModelPremium) * scaleToPts,
    contributions,
    note: 'Contributions are ordered model repricings. Costs are separate; this is not a unique causal decomposition or a forecast.',
  }
}
