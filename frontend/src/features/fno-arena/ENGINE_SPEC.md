# F&O Arena Engine Specification

**Status:** Phase 2A specification; implementation has not started
**Competition deadline:** 18 October 2026, IST; exact time unknown
**Purpose:** deterministic educational simulation only. No real-money trading, investment advice, or order execution.

## 1. V1 instruments and scope

| Arena | V1 instrument | Position types | Pricing |
|---|---|---|---|
| India | Configured index/equity option | Long Call or Long Put only | Black–Scholes model premium |
| Global | EUR/USD leveraged position | Long or short | Scenario-provided underlying price; no option pricing |

No option writing, spreads, multi-leg strategies, or unlimited-loss strategies. Do not encode a venue-specific contract as supported until its instrument, lot, expiry, trading calendar, and contract rules have verified configuration metadata.

The simulator permits multiple independent single-leg order slots in one run. Each slot has its own entry, mark, costs, close action, and autopsy record. Every order is checked against remaining available PTS; FX margin and maintenance requirements aggregate across open FX slots. A margin liquidation closes the open FX slots under the existing deterministic simulation convention. This does not enable multi-leg strategies or option writing.

## 2. Contract and lot configuration

Engine inputs must use explicit, versioned configuration; no exchange-specific values may be inferred or remembered. Configuration shape:

```ts
interface InstrumentConfig {
  id: string
  arena: 'india-options' | 'eur-usd-fx'
  instrumentType: 'option' | 'fx'
  underlyingSymbol: string
  quoteCurrency: string
  contractMultiplier: number
  lotSize: number
  sourceName: string
  sourceUrl: string
  sourceDate: string // ISO date of the source or verification
  verifiedAt: string // ISO date
  configVersion: string
}
```

For EUR/USD, `contractMultiplier`/units and supported lot increments are **TBD — source verification required**; simulation leverage is a game configuration and must not be presented as broker/exchange margin. India symbol, option contract multiplier, lot size, strike increments, expiry calendar, and any applicable contract-specific rules are **TBD — source verification required**. Until populated from dated, recorded sources, the affected live instrument is unavailable. Synthetic Story/Replay scenarios may use clearly labelled illustrative parameters and must not be described as exchange specifications.

## 3. Option pricing

Use European Black–Scholes for long calls and puts. Required inputs per valuation: spot `S > 0`, strike `K > 0`, year fraction to expiry `T >= 0`, continuously compounded annual risk-free rate `r`, annualized volatility `σ > 0`, and option type. Dividend yield `q` defaults to zero only when the scenario/config explicitly states that assumption; otherwise it is a required input. No default market values are embedded.

For `T > 0`:

```text
d1 = [ln(S/K) + (r - q + σ²/2)T] / [σ√T]
d2 = d1 - σ√T
Call premium = S e^(-qT) N(d1) - K e^(-rT) N(d2)
Put premium  = K e^(-rT) N(-d2) - S e^(-qT) N(-d1)
```

At expiry (`T = 0`), premium is intrinsic value: `max(S-K, 0)` for a call and `max(K-S, 0)` for a put. Expired positions cannot be reopened; expiry settlement rules for a real contract are **TBD — source verification required**. Scenario volatility, risk-free rate, dividend yield, and time-to-expiry are explicit scenario/config inputs; any externally sourced values need source and date. Unverified values are **TBD — source verification required**.

**Limitations:** Black–Scholes is a model, assumes simplified market behavior and inputs, and does not reproduce an exchange order book, actual option quote, liquidity, jumps, early exercise, taxes, or execution. Prices and outputs are illustrative/model-based, not forecasts or executable quotes.

## 4. Model Greeks

All Greeks must be labeled **MODEL-BASED** in UI and exported data. For `T > 0`, let `φ` be the standard normal density and `N` the standard normal CDF:

```text
Call Delta = e^(-qT)N(d1)              Put Delta = e^(-qT)(N(d1)-1)
Gamma = e^(-qT)φ(d1) / (Sσ√T)          (same for call and put)
Vega = S e^(-qT)φ(d1)√T                (per 1.00 change in decimal volatility)
Call Theta/year = -S e^(-qT)φ(d1)σ/(2√T) - rK e^(-rT)N(d2) + qS e^(-qT)N(d1)
Put Theta/year  = -S e^(-qT)φ(d1)σ/(2√T) + rK e^(-rT)N(-d2) - qS e^(-qT)N(-d1)
```

If displayed per one volatility point or per calendar day, scale Vega by `0.01` or Theta by `1/365` and label the unit. At expiry/undefined boundaries, return a documented finite/undefined state rather than `NaN`/`Infinity`; boundary convention is **TBD — approve with implementation**. Greeks are local model sensitivities, not predictions.

## 5. Risk mechanics

All game capital, premiums, fees, P&L, margin, and equity are denominated in **PTS**. Underlying prices retain their scenario-defined quote units and are never labelled PTS or ₹. No live account/broker margin rules are implied.

- Long option initial cash debit: premium × contracts × contract multiplier + configured transaction costs. Maximum modeled loss is the paid premium plus costs; no margin borrowing for long options.
- FX notional: absolute units × EUR/USD scenario price. Simulated initial margin: notional ÷ configured leverage. Leverage, maintenance-margin ratio, max contracts/units, transaction/spread costs, and liquidation slippage are all **TBD — source verification required** if intended to represent any real venue/provider; otherwise mark and identify them as illustrative game parameters before play.
- Position size must satisfy both configured maximum size and available PTS after required premium/margin and costs. Reject an order if either check fails.
- Track a cash balance, reserved FX margin, option liquidation value, and open FX unrealized P&L separately. `available PTS = cash balance - reserved FX margin`; `equity = cash balance + current option liquidation value + open FX unrealized P&L`. `margin level = equity / maintenance margin` when maintenance margin is positive. This avoids treating reserved margin as a loss or double-counting an option premium.
- A margin call occurs when equity is below maintenance margin. Liquidation is deterministic at the next eligible simulation tick using that tick's scenario mark plus configured costs. Exact maintenance threshold, liquidation buffer, spread, transaction cost, and slippage inputs are **TBD — source verification required** or explicitly illustrative.
- Never permit new risk after game over. If a scenario gap would create negative PTS after liquidation, close at no more than remaining equity, floor PTS at zero, and record the shortfall as a simulation safeguard; do not represent this as real-world limited liability.

## 6. Time model and expiry

Use an integer game tick as the only engine clock. The scenario config maps each tick to a deterministic simulated timestamp; Story Mode supplies its own scripted timestamps/path. The proposed base mapping is one decision tick per five simulated minutes, configurable for a scenario and subject to approval; it does not model a real exchange session. Tick interval, timezone/calendar mapping, holidays, market hours, and FX weekend schedule are **TBD — source verification required** before a Live arena can use them.

For options, compute `T` from configured expiry timestamp and valuation timestamp using ACT/365 seconds (`remainingSeconds / (365 × 24 × 60 × 60)`), clamped at zero. Each tick recomputes premium and Greeks from current scenario inputs. At expiry, settle at intrinsic value once, then mark the position expired. For FX, time passage alone does not alter mark-to-market; any financing/rollover is disabled in V1 unless separately specified and sourced. Time decay is the change from repricing the same option with later time and otherwise-held inputs, not a guaranteed monotonic loss in every market state.

## 7. Market/tick model

The engine consumes validated tick inputs; it does not fetch market data. A tick contains scenario time, underlying mark(s), option volatility input(s), and scenario/event metadata. Story Mode price path is scripted and deterministic. Replay scenarios are fixed scenario fixtures or seeded synthetic paths, always labelled `HISTORICAL` only with verified provenance, otherwise `ILLUSTRATIVE SCENARIO — simulated for educational purposes`.

Reject non-finite/negative prices, invalid volatility, backwards timestamps, and ticks after terminal state. No missing value is silently replaced with a market value. Option model marks are generated from the pricing section and remain **MODEL-BASED**; FX scenario marks are `SIMULATED` unless sourced live/delayed in a separately approved phase.

## 8. Seeded randomness and reproducibility

Use a versioned 32-bit xorshift PRNG (`x ^= x << 13; x ^= x >>> 17; x ^= x << 5`) with nonzero unsigned 32-bit seed. Convert output to `[0,1)` by dividing the unsigned result by `2^32`. Store the seed, algorithm/version, scenario version, config version, and ordered player decisions with a run. Same versions, seed, tick inputs, and decisions must produce byte-for-byte equivalent engine state/output (excluding presentation timestamps generated outside the engine). Story Mode must not need randomness for its scripted market path; randomness must never override player choices.

## 9. P&L formulas

Use signed quantities and decimal arithmetic policy defined before implementation; round only for display and settlement boundaries. Numeric precision/rounding policy is **TBD — approve with implementation**.

```text
Option entry debit PTS = entryPremium × contracts × contractMultiplier + entryCosts
Option exit credit PTS = exitPremium × contracts × contractMultiplier - exitCosts
Option realized P&L PTS = exit credit - entry debit
Option unrealized P&L PTS = (currentModelPremium - entryPremium) × openContracts × contractMultiplier
                         - allocated entry costs - estimated close costs

FX signed units = +units for long, -units for short
FX gross P&L in quote currency = signed EUR units × (exitEURUSD - entryEURUSD)
FX gross P&L PTS = gross P&L in quote currency × configured PTS-per-quote-currency-unit
FX net P&L PTS = gross P&L PTS - entry costs - exit costs - configured financing (V1 financing = 0)
Available PTS = cash balance - reserved FX margin
Equity PTS = cash balance + current option liquidation value + open FX unrealized P&L
```

FX unit conversion and cost configuration are **TBD — source verification required** or explicitly illustrative. For an open FX position, margin is reserved from available PTS but remains part of the cash balance; on close, release it and apply realized net P&L once. For a long option, premium is debited from cash at entry; its current liquidation value is included in equity until closed/expired. Do not mix underlying quote values with PTS. Entry, exit, mark, cost, and P&L records must be retained for autopsy.

## 10. Capital rules

Every new run starts with exactly **1000 PTS**. No deposits, top-ups, withdrawals, transfers from other runs, or purchased currency. Refresh resumes the current run from same-tab `sessionStorage`; logout clears it. Storage failure must fall back safely and must not fabricate a successful persisted run. At PTS `<= 0`, stop new positions and transition to `GAME OVER` then Trade Autopsy. A fresh run is allowed only after game over or explicit exit. PTS are fictional simulation points, never ₹, cash, or a claim about account balance.

## 11. Trade Autopsy attribution

For long options, attribute modeled premium change using deterministic one-factor-at-a-time repricing from entry inputs. Apply the factors in this fixed order:

1. Underlying: reprice at exit spot while holding entry time-to-expiry and entry volatility/rates constant.
2. Time passage: reprice at exit spot and exit time-to-expiry while holding entry volatility/rates constant.
3. Volatility: reprice at exit spot, exit time-to-expiry, and exit volatility/rates.

Each contribution is the difference between successive model premiums, multiplied by open quantity and contract multiplier. Sum is the modeled option premium change before transaction costs; show costs separately. This ordering allocates interaction effects to the later factor, so label it **ordered model attribution**, not a unique causal decomposition. If an input is missing or invalid, mark attribution unavailable; never invent or normalize contributions. For FX, report underlying movement and costs; option time/volatility attribution does not apply.

## 12. Engine boundaries

Pure TypeScript modules only: no React imports, browser UI logic, `fetch`/network calls, storage access, wall-clock reads, or random global calls. Inputs (including time, seed, prices, volatility, and config) are explicit. Engine functions should be deterministic and return typed state/events/errors. UI, persistence adapter, live providers, and rendering remain outside the engine.

## 13. Required tests

After test-runner approval, cover at minimum:

- Black–Scholes call/put values, intrinsic expiry values, invalid inputs, and Greek units/boundaries.
- Long-option and FX P&L formulas, costs, direction, and PTS denomination.
- Initial/maintenance margin, sizing rejection, margin-call boundary, and liquidation/game-over behavior.
- Expiry settlement and prohibition on expired positions.
- Time-to-expiry reduction and controlled time-decay repricing.
- Same seed/config/ticks/decisions gives identical result; changed seed affects seeded paths; Story path remains scripted.
- Capital starts at 1000 PTS, cannot top up, and reaches terminal state at zero.
- Autopsy one-factor repricing contributions sum to modeled option change before costs and handle missing factors without fabricated output.

No frontend test runner is installed in the audited repository. **Preferred lightweight approach:** use Node's built-in `node:test` and strict assertions against the pure TypeScript engine, after verifying the installed Node version can execute the selected TypeScript format; otherwise evaluate a minimal TypeScript-aware runner. Do not add or install any test dependency in Phase 2A. Dependency choice/setup is deferred until this spec is approved.

## 14. Explicit TBD register

All of the following stay unimplemented until reviewed and verified:

- Supported India underlying/contract identifiers, lot sizes, multipliers, strike increments, expiry schedule, settlement and contract rules.
- Sources and dates for any external spot, rate, volatility, dividend, or historical scenario input.
- EUR/USD units/multiplier, lot increments, quote-to-PTS conversion, and any venue-specific trading calendar.
- Any real-world leverage, initial/maintenance margin, max position size, margin-call/liquidation threshold, spread, fees, slippage, financing, or rollover rule.
- Live/delayed data vendor, licensing, availability, freshness, and permitted display/use.
- Numeric precision/rounding/settlement policy and Greek boundary conventions.
- Exact competition deadline time (date is 18 October 2026, IST).

Every unresolved externally dependent value must be represented as **`TBD — source verification required`**, not as a guessed default.
