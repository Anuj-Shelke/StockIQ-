import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ScanLine } from 'lucide-react'
import type { CompletedTrade, SimulationState } from '../engine/types.ts'
import { getEquityPts } from '../engine/index.ts'
import { getCapitalScore } from '../arenaScore.ts'
import { GlossaryTooltip } from '@/components/ui/GlossaryTooltip'
import type { MarketTick } from '../engine/types.ts'
import { mentorLine } from '../mentorRules.ts'

function pts(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)} PTS`
}

function eventNumber(state: SimulationState, eventType: string, name: string, trade: CompletedTrade): number | null {
  const event = [...state.events].reverse().find((item) => item.type === eventType
    && item.timestampMs === trade.exitTimestampMs && item.details.positionId === trade.positionId)
  const value = event?.details[name]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function TradeAutopsyPanel({ state, trade, entryTick, exitTick, expiryTimestampMs, onReplay, onChooseScenario }: {
  state: SimulationState
  trade: CompletedTrade
  entryTick: MarketTick
  exitTick: MarketTick
  expiryTimestampMs: number
  onReplay: () => void
  onChooseScenario: () => void
}) {
  const endingPts = getEquityPts(state)
  const direction = trade.realizedPnlPts >= 0 ? 'up' : 'down'
  const optionAutopsy = trade.optionAutopsy
  const entryEvent = [...state.events].reverse().find((item) => item.type === 'POSITION_OPENED'
    && item.timestampMs === trade.entryTimestampMs && item.details.positionId === trade.positionId)
  const entryDetails = entryEvent?.details ?? {}
  const entryValue = trade.kind === 'option' && entryTick.kind === 'option' ? entryTick.spot
    : trade.kind === 'fx' && entryTick.kind === 'fx' ? entryTick.eurUsd : null
  const exitValue = trade.kind === 'option' && exitTick.kind === 'option' ? exitTick.spot
    : trade.kind === 'fx' && exitTick.kind === 'fx' ? exitTick.eurUsd : null
  const underlyingMove = entryValue !== null && exitValue !== null ? exitValue - entryValue : null
  const entryPrice = entryValue === null ? 'Unavailable' : entryValue.toFixed(trade.kind === 'option' ? 2 : 4)
  const exitPrice = exitValue === null ? 'Unavailable' : exitValue.toFixed(trade.kind === 'option' ? 2 : 4)
  const entryVolatility = entryTick.kind === 'option' ? `${(entryTick.volatility * 100).toFixed(1)}%` : null
  const exitVolatility = exitTick.kind === 'option' ? `${(exitTick.volatility * 100).toFixed(1)}%` : null
  const remainingScenarioDays = trade.kind === 'option'
    ? Math.max(0, Math.ceil((expiryTimestampMs - trade.exitTimestampMs) / 86_400_000))
    : null
  const fxGross = trade.kind === 'fx' ? eventNumber(state, 'LIQUIDATED', 'grossPnlPts', trade)
    ?? eventNumber(state, 'POSITION_CLOSED', 'grossPnlPts', trade) : null
  const rows = optionAutopsy?.available
    ? [
        ...optionAutopsy.contributions.map((item) => ({
          label: item.factor === 'UNDERLYING' ? 'Underlying movement'
            : item.factor === 'TIME' ? 'Time passage' : 'Volatility movement',
          value: item.contributionPts,
        })),
        { label: 'Costs & configured execution', value: trade.realizedPnlPts - optionAutopsy.modeledChangePts },
      ]
    : trade.kind === 'fx' && fxGross !== null
      ? [
          { label: 'Underlying movement & configured fills', value: fxGross },
          { label: 'Transaction costs', value: trade.realizedPnlPts - fxGross },
        ]
      : []
  const largestDrag = optionAutopsy?.available
    ? [...optionAutopsy.contributions].sort((a, b) => a.contributionPts - b.contributionPts)[0]
    : null

  return (
    <section className="arena-result" aria-labelledby="arena-result-title">
      <div className="arena-result-head">
        <div className="arena-result-icon">{state.status === 'GAME_OVER' ? <AlertTriangle /> : <ScanLine />}</div>
        <div>
          <p className="arena-eyebrow">Run complete · illustrative simulation</p>
          <h1 id="arena-result-title">{state.status === 'GAME_OVER' ? 'Game over.' : 'Trade complete.'}</h1>
          <p className="arena-copy">{state.status === 'GAME_OVER' ? 'The run ended when the simulator reached zero PTS.' : 'Review the modeled result before choosing a replay.'}</p>
        </div>
      </div>

      <div className="arena-result-stats">
        <div className="arena-stat-card"><span>Final equity</span><strong>{endingPts.toFixed(2)} PTS</strong></div>
        <div className="arena-stat-card"><span><GlossaryTooltip term="P&L" definition="Profit and Loss. It shows how much your trade has gained or lost so far."><span>Trade P&amp;L</span></GlossaryTooltip></span><strong className={direction === 'up' ? 'arena-positive' : 'arena-negative'}>{pts(trade.realizedPnlPts)}</strong></div>
        <div className="arena-stat-card"><span>Capital score</span><strong>{getCapitalScore(state)} / 100</strong></div>
      </div>
      <p className="arena-score-note">Capital score shows final PTS relative to the 1,000 PTS start, capped at 100. It is not a skill rating or personal assessment.</p>
      <div className="arena-result-mentor"><span className="arena-mentor-mark" aria-hidden="true">M</span><div><small>MIRA SEN · FICTIONAL STOCKIQ MENTOR</small><p>{mentorLine('result')}</p></div></div>

      <div className="arena-autopsy">
        <div className="arena-section-heading">
          <div><p className="arena-eyebrow">Trade Autopsy</p><h2>What moved the result?</h2></div>
          <span className="arena-tag">{trade.exitReason.replace('_', ' ')}</span>
        </div>
        <p className="arena-copy">{trade.realizedPnlPts < 0 ? 'The position ended at a loss in this scenario.' : 'The position ended at a gain in this scenario.'} The breakdown below uses the engine’s recorded repricing and trade result.</p>
        <dl className="arena-autopsy-facts" aria-label="Recorded trade details">
          <div><dt>Position</dt><dd>{trade.kind === 'option'
            ? `Long ${entryDetails.type === 'PUT' ? 'Put' : 'Call'} · strike ${typeof entryDetails.strike === 'number' ? entryDetails.strike.toFixed(2) : '—'}`
            : `${entryDetails.direction === 'SHORT' ? 'Short' : 'Long'} EUR/USD`}</dd></div>
          <div><dt>Size</dt><dd>{trade.contracts} contract{trade.contracts === 1 ? '' : 's'}</dd></div>
          <div><dt>Underlying · entry → exit</dt><dd>{entryPrice} → {exitPrice}{underlyingMove !== null ? ` (${underlyingMove >= 0 ? '+' : ''}${underlyingMove.toFixed(trade.kind === 'option' ? 2 : 4)})` : ''}</dd></div>
          {trade.kind === 'option' && <>
            <div><dt>Model volatility · entry → exit</dt><dd>{entryVolatility} → {exitVolatility}</dd></div>
            <div><dt>Simulated time left at exit</dt><dd>{remainingScenarioDays} day{remainingScenarioDays === 1 ? '' : 's'}</dd></div>
            <div><dt>Maximum modeled loss · entry debit</dt><dd>{typeof entryDetails.entryDebitPts === 'number' ? `${entryDetails.entryDebitPts.toFixed(2)} PTS` : 'Unavailable'}</dd></div>
            <div><dt>Model premium · entry</dt><dd>{typeof entryDetails.entryModelPremium === 'number' ? `${entryDetails.entryModelPremium.toFixed(3)} model units` : 'Unavailable'}</dd></div>
          </>}
          {trade.kind === 'fx' && <>
            <div><dt>Simulated base units</dt><dd>{typeof entryDetails.baseUnits === 'number' ? entryDetails.baseUnits.toLocaleString() : 'Unavailable'}</dd></div>
            <div><dt>Simulated leverage</dt><dd>{typeof entryDetails.leverage === 'number' ? `${entryDetails.leverage}×` : 'Unavailable'}</dd></div>
            <div><dt>Initial margin · risk exposure</dt><dd>{typeof entryDetails.initialMarginPts === 'number' ? `${entryDetails.initialMarginPts.toFixed(2)} PTS` : 'Unavailable'}</dd></div>
          </>}
          <div><dt>Exit</dt><dd>{trade.exitReason.replace('_', ' ')} · interval {state.tickIndex}</dd></div>
        </dl>
        {rows.length > 0 ? (
          <div className="arena-autopsy-rows">
            {rows.map(({ label, value }) => (
              <div className="arena-autopsy-row" key={label}>
                <span>{value >= 0 ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}{label}</span>
                <strong className={value >= 0 ? 'arena-positive' : 'arena-negative'}>{pts(value)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="arena-note"><AlertTriangle aria-hidden="true" /> The engine did not provide a complete attribution for this trade. No breakdown has been estimated.</div>
        )}
        {optionAutopsy?.available && largestDrag && largestDrag.contributionPts < 0 && (
          <p className="arena-autopsy-insight"><CheckCircle2 aria-hidden="true" /> Largest modeled drag: {largestDrag.factor.toLowerCase()} ({pts(largestDrag.contributionPts)}). This is an ordered model attribution, not a unique causal explanation or forecast.</p>
        )}
        {trade.kind === 'fx' && <p className="arena-score-note">FX results use the simulated underlying path and configured fills. Option time-decay and volatility attribution do not apply to this instrument.</p>}
        {trade.capitalSafeguardShortfallPts > 0 && <p className="arena-score-note">A zero-balance safeguard recorded a simulated shortfall of {pts(trade.capitalSafeguardShortfallPts)}. This is a game convention, not real-world limited liability.</p>}
        {optionAutopsy?.available && <p className="arena-score-note">{optionAutopsy.note}</p>}
      </div>

      <div className="arena-result-actions">
        <button type="button" className="arena-button arena-button-primary" onClick={onReplay}>Replay this scenario <span aria-hidden="true">→</span></button>
        <button type="button" className="arena-button arena-button-secondary" onClick={onChooseScenario}>Choose another arena</button>
      </div>
    </section>
  )
}
