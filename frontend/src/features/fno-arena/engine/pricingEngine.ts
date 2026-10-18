import type { OptionType, OptionValuation } from './types.ts'

const SECONDS_PER_ACT365_YEAR = 365 * 24 * 60 * 60

export interface BlackScholesInput {
  spot: number
  strike: number
  timeToExpiryYears: number
  riskFreeRate: number
  volatility: number
  dividendYield: number
  type: OptionType
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`)
}

function validate(input: BlackScholesInput): void {
  assertFinite('spot', input.spot)
  assertFinite('strike', input.strike)
  assertFinite('timeToExpiryYears', input.timeToExpiryYears)
  assertFinite('riskFreeRate', input.riskFreeRate)
  assertFinite('volatility', input.volatility)
  assertFinite('dividendYield', input.dividendYield)
  if (input.spot <= 0) throw new RangeError('spot must be greater than zero')
  if (input.strike <= 0) throw new RangeError('strike must be greater than zero')
  if (input.timeToExpiryYears < 0) throw new RangeError('timeToExpiryYears cannot be negative')
  if (input.volatility <= 0) throw new RangeError('volatility must be greater than zero')
  if (input.type !== 'CALL' && input.type !== 'PUT') throw new RangeError('Unsupported option type')
}

function normalDensity(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

/** Abramowitz-Stegun approximation; adequate for a deterministic teaching model. */
function normalCdf(x: number): number {
  const absolute = Math.abs(x)
  const t = 1 / (1 + 0.2316419 * absolute)
  const polynomial = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const tail = normalDensity(absolute) * polynomial
  return x >= 0 ? 1 - tail : tail
}

function calculateD(input: BlackScholesInput): { d1: number; d2: number } {
  const { spot, strike, timeToExpiryYears: time, riskFreeRate, volatility, dividendYield } = input
  const rootTime = Math.sqrt(time)
  const d1 = (Math.log(spot / strike) + (riskFreeRate - dividendYield + volatility ** 2 / 2) * time) / (volatility * rootTime)
  return { d1, d2: d1 - volatility * rootTime }
}

export function timeToExpiryAct365(expiryTimestampMs: number, valuationTimestampMs: number): number {
  assertFinite('expiryTimestampMs', expiryTimestampMs)
  assertFinite('valuationTimestampMs', valuationTimestampMs)
  return Math.max(0, (expiryTimestampMs - valuationTimestampMs) / 1000 / SECONDS_PER_ACT365_YEAR)
}

export function priceEuropeanOption(input: BlackScholesInput): number {
  validate(input)
  const { spot, strike, timeToExpiryYears: time, riskFreeRate, dividendYield, type } = input
  if (time === 0) return type === 'CALL' ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0)

  const { d1, d2 } = calculateD(input)
  const discountedSpot = spot * Math.exp(-dividendYield * time)
  const discountedStrike = strike * Math.exp(-riskFreeRate * time)
  const price = type === 'CALL'
    ? discountedSpot * normalCdf(d1) - discountedStrike * normalCdf(d2)
    : discountedStrike * normalCdf(-d2) - discountedSpot * normalCdf(-d1)
  if (!Number.isFinite(price)) throw new RangeError('Option model produced a non-finite premium')
  return Math.max(0, price)
}

export function calculateEuropeanGreeks(input: BlackScholesInput) {
  validate(input)
  const { spot, strike, timeToExpiryYears: time, riskFreeRate, volatility, dividendYield, type } = input
  if (time === 0) {
    const isAtTheMoney = spot === strike
    const delta = type === 'CALL'
      ? (spot > strike ? 1 : isAtTheMoney ? 0.5 : 0)
      : (spot < strike ? -1 : isAtTheMoney ? -0.5 : 0)
    return {
      label: 'MODEL-BASED' as const,
      delta,
      gamma: 0,
      thetaPerYear: 0,
      vegaPerVolatilityUnit: 0,
    }
  }

  const { d1, d2 } = calculateD(input)
  const rootTime = Math.sqrt(time)
  const discountSpot = Math.exp(-dividendYield * time)
  const discountStrike = Math.exp(-riskFreeRate * time)
  const density = normalDensity(d1)
  const delta = type === 'CALL'
    ? discountSpot * normalCdf(d1)
    : discountSpot * (normalCdf(d1) - 1)
  const gamma = discountSpot * density / (spot * volatility * rootTime)
  const vegaPerVolatilityUnit = spot * discountSpot * density * rootTime
  const diffusionTheta = -(spot * discountSpot * density * volatility) / (2 * rootTime)
  const thetaPerYear = type === 'CALL'
    ? diffusionTheta - riskFreeRate * strike * discountStrike * normalCdf(d2) + dividendYield * spot * discountSpot * normalCdf(d1)
    : diffusionTheta + riskFreeRate * strike * discountStrike * normalCdf(-d2) - dividendYield * spot * discountSpot * normalCdf(-d1)

  const result = { label: 'MODEL-BASED' as const, delta, gamma, thetaPerYear, vegaPerVolatilityUnit }
  if (Object.values(result).some((value) => typeof value === 'number' && !Number.isFinite(value))) {
    throw new RangeError('Greek model produced a non-finite value')
  }
  return result
}

export function valueEuropeanOption(input: BlackScholesInput): OptionValuation {
  return {
    premium: priceEuropeanOption(input),
    greeks: calculateEuropeanGreeks(input),
    timeToExpiryYears: input.timeToExpiryYears,
  }
}
