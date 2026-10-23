import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, AlertTriangle, Check, CircleHelp, Clock3, Pause, Play, Shield, Sparkles } from 'lucide-react'
import { GlossaryTooltip } from '@/components/ui/GlossaryTooltip'
import { advanceSimulationTick, closeOpenPosition, createSimulationState, getAvailablePts, getEquityPts, getMaintenanceMarginPts, getMarginLevel, getModelGreeks, getPositionPnlPts, openFxPosition, openOptionPosition, STARTING_CAPITAL_PTS, type CompletedTrade, type FxMarketTick, type FxOrder, type MarketTick, type OptionMarketTick, type OptionOrder, type SimulationState } from './engine/index.ts'
import { arenaSeedForCycle, createArenaScenario, createNextArenaCycle, replayChoices, type ArenaMarket, type ReplayScenario } from './arenaScenarios.ts'
import { mentorLine, type MentorMoment } from './mentorRules.ts'
import { MarketChart } from './components/MarketChart.tsx'
import { TradeAutopsyPanel } from './components/TradeAutopsyPanel.tsx'
import { clearPersistedArenaRun, readPersistedArenaRun, saveArenaRun, type ArenaOrderConfig, type PersistedArenaRun } from './arenaPersistence.ts'
import { useAuth } from '@/hooks/useAuth'
import './fno-arena.css'

type Screen = 'intro' | 'setup' | 'configure'
type OptionType = 'CALL' | 'PUT'
type Direction = 'LONG' | 'SHORT'

interface LaunchSettings {
  market: ArenaMarket
  replay: ReplayScenario
  optionType: OptionType
  direction: Direction
  strike: number
  contracts: number
}

const optionStrikes = [98, 100, 102]
const humanFactor: Record<string, { title: string; definition: string }> = {
  'PTS': { title: 'PTS', definition: 'Fictional points used only inside this educational simulation. They are not rupees, cash, or a real account balance.' },
  'Premium': { title: 'Premium', definition: 'The modelled option price per underlying unit. The simulator uses Black–Scholes; this is not an exchange quote.' },
  'Strike price': { title: 'Strike price', definition: 'The reference price used to define an option’s payoff at expiry.' },
  'Expiry': { title: 'Expiry', definition: 'The simulated time when this option ends. This scenario uses one tick per illustrative day; it is not an exchange calendar.' },
  'Delta': { title: 'Delta', definition: 'A MODEL-BASED estimate of how the option premium may respond to a one-unit move in the simulated underlying, with other inputs held fixed.' },
  'Gamma': { title: 'Gamma', definition: 'A MODEL-BASED estimate of how Delta may change as the simulated underlying moves.' },
  'Theta': { title: 'Theta', definition: 'A MODEL-BASED sensitivity to time passing, per year, with other inputs held fixed. It is not a guaranteed daily loss.' },
  'Vega': { title: 'Vega', definition: 'A MODEL-BASED estimate of premium sensitivity to a 1.00 change in decimal volatility, with other inputs held fixed.' },
  'P&L': { title: 'P&L', definition: 'Profit and Loss. It shows how much your trade has gained or lost so far.' },
  'Volatility': { title: 'Volatility', definition: 'A measure of how much the underlying price is expected to move. Higher volatility can increase an option\'s value, all else equal.' },
  'Margin': { title: 'Margin', definition: 'PTS set aside by this simulation to support the leveraged EUR/USD position. These are demo rules, not broker requirements.' },
  'Leverage': { title: 'Leverage', definition: 'The ratio used by this simulation to set its margin requirement. It does not represent a real broker offer.' },
}

function ToolTerm({ term }: { term: keyof typeof humanFactor }) {
  const entry = humanFactor[term]
  return <GlossaryTooltip term={entry.title} definition={entry.definition}><span>{term}</span></GlossaryTooltip>
}

function MarketMark({ tick, market }: { tick: MarketTick; market: ArenaMarket }) {
  const value = tick.kind === 'option' ? tick.spot : tick.eurUsd
  return <>{market === 'india' ? value.toFixed(2) : value.toFixed(4)}</>
}

function detectMentorMoment(before: SimulationState, after: SimulationState): MentorMoment | null {
  const newEvents = after.events.slice(before.events.length)
  if (newEvents.some((event) => event.type === 'MARGIN_CALL')) return 'margin-call'
  if (newEvents.some((event) => event.type === 'LIQUIDATED' || event.type === 'GAME_OVER')) return 'liquidation'
  if (newEvents.some((event) => event.type === 'POSITION_EXPIRED')) return 'expiry'
  const beforePnl = getEquityPts(before) - STARTING_CAPITAL_PTS
  const afterPnl = getEquityPts(after) - STARTING_CAPITAL_PTS
  if (beforePnl > 0 && afterPnl < 0) return 'reversal'
  if (beforePnl <= 0 && afterPnl > 0) return 'profit'
  if (before.currentTick?.kind === 'option' && after.currentTick?.kind === 'option'
    && Math.abs(after.currentTick.volatility - before.currentTick.volatility) >= 0.012) return 'volatility-shock'
  return null
}

function makeRun(settings: LaunchSettings, seed: number): PersistedArenaRun {
  const fixture = createArenaScenario(settings.market, settings.replay, seed)
  const initialState = createSimulationState({ seed, instrument: fixture.instrument, risk: fixture.risk, scenario: fixture.scenario })
  const state: SimulationState = { ...initialState, currentTick: fixture.initialTick }
  return {
    state, market: settings.market, replay: settings.replay, ticks: fixture.ticks,
    nextTick: 0, history: [fixture.initialTick], seed, mentor: 'watching',
    orderConfig: { optionType: settings.optionType, direction: settings.direction, strike: settings.strike, contracts: settings.contracts },
  }
}

function formatPts(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)} PTS`
}

function Header({ exitArena }: { exitArena: () => void }) {
  const handleBrandExit = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    exitArena()
  }
  return (
    <header className="arena-header">
      <Link className="arena-brand" to="/dashboard" onClick={handleBrandExit} aria-label="StockIQ dashboard">
        <span className="arena-brand-mark">₹</span>
        <span><strong>StockIQ</strong><small>F&amp;O ARENA</small></span>
      </Link>
      <div className="arena-header-right">
        <span className="arena-offline-tag"><span />Offline simulation</span>
        <button className="arena-exit-link" type="button" onClick={exitArena}><ArrowLeft aria-hidden="true" /> Exit Arena</button>
      </div>
    </header>
  )
}

function ScenarioPicker({ selected, onSelect }: { selected: ReplayScenario; onSelect: (id: ReplayScenario) => void }) {
  return (
    <fieldset className="arena-scenario-fieldset">
      <legend className="arena-eyebrow">Choose a scripted scenario</legend>
      <div className="arena-scenario-grid">
        {replayChoices.map((choice) => (
          <button key={choice.id} type="button" className={`arena-scenario-choice ${selected === choice.id ? 'is-selected' : ''}`} onClick={() => onSelect(choice.id)} aria-pressed={selected === choice.id}>
            <span className="arena-choice-check">{selected === choice.id && <Check aria-hidden="true" />}</span>
            <strong>{choice.title}</strong>
            <small>{choice.description}</small>
          </button>
        ))}
      </div>
      <p className="arena-footnote">All paths are fixed, synthetic teaching scenarios. None are live or historical market data.</p>
    </fieldset>
  )
}

export default function FnoArenaPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [initialSession] = useState(() => readPersistedArenaRun(userId))
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' as const }
  const [screen, setScreen] = useState<Screen>('intro')
  const [market, setMarket] = useState<ArenaMarket>(initialSession.run?.market ?? 'india')
  const [replay, setReplay] = useState<ReplayScenario>(initialSession.run?.replay ?? 'story')
  const [optionType, setOptionType] = useState<OptionType>(initialSession.run?.orderConfig?.optionType ?? (initialSession.run?.state.position?.kind === 'option' ? initialSession.run.state.position.type : 'CALL'))
  const [direction] = useState<Direction>(initialSession.run?.orderConfig?.direction ?? (initialSession.run?.state.position?.kind === 'fx' ? initialSession.run.state.position.direction : 'LONG'))
  const [strike, setStrike] = useState(initialSession.run?.orderConfig?.strike ?? (initialSession.run?.state.position?.kind === 'option' ? initialSession.run.state.position.strike : 100))
  const [contracts, setContracts] = useState(initialSession.run?.orderConfig?.contracts ?? initialSession.run?.state.position?.contracts ?? 1)
  const [seed, setSeed] = useState(initialSession.run?.seed ?? 20261018)
  const [run, setRun] = useState<PersistedArenaRun | null>(initialSession.run)
  const [isPlaying, setIsPlaying] = useState(false)
  const advanceTickRef = useRef<() => void>(() => undefined)
  const [persistenceWarning, setPersistenceWarning] = useState(initialSession.warning)
  const [error, setError] = useState('')
  const exitStarted = useRef(false)
  const completeTrade: CompletedTrade | undefined = run?.state.completedTrades.at(-1)
  const isComplete = run?.state.status === 'GAME_OVER'
  const baseCycleLength = run ? createArenaScenario(run.market, run.replay, run.seed).ticks.length : 24
  const cycleNumber = run ? Math.floor(run.nextTick / baseCycleLength) + 1 : 1
  const chartHistory = run?.history.slice(-48) ?? []

  const exitArena = () => {
    if (exitStarted.current) return
    exitStarted.current = true
    setIsPlaying(false)
    clearPersistedArenaRun(userId)
    navigate('/dashboard', { replace: true })
  }

  const commitRun = (nextRun: PersistedArenaRun | null) => {
    setRun(nextRun)
    if (!nextRun) {
      clearPersistedArenaRun(userId)
      setPersistenceWarning('')
      return
    }
    setPersistenceWarning(saveArenaRun(userId, nextRun)
      ? ''
      : 'This tab cannot save the Arena run. Refreshing may reset progress.')
  }

  const startRun = (nextSeed = seed) => {
    setError('')
    const settings: LaunchSettings = { market, replay, optionType, direction, strike, contracts }
    try {
      commitRun(makeRun(settings, nextSeed))
      setSeed(nextSeed)
      setIsPlaying(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The simulation could not start. Please adjust the configuration.')
    }
  }

  const enterPosition = (fxDirection?: Direction) => {
    if (!run || run.state.status !== 'ACTIVE') return
    const tick = run.history.at(-1)
    if (!tick) return
    const config: ArenaOrderConfig = run.orderConfig ?? { optionType, direction, strike, contracts }
    try {
      const cycle = createArenaScenario(run.market, run.replay, run.seed)
      let expiryTimestampMs = run.ticks.at(-1)?.timestampMs ?? tick.timestampMs
      if (expiryTimestampMs <= tick.timestampMs) expiryTimestampMs += cycle.tickDurationMs * cycle.ticks.length
      const nextState = run.market === 'india' && tick.kind === 'option'
        ? openOptionPosition(run.state, {
            type: config.optionType,
            contracts: config.contracts,
            strike: config.strike,
            expiryTimestampMs,
            tick: tick as OptionMarketTick,
          } satisfies OptionOrder)
        : run.market === 'global' && tick.kind === 'fx'
          ? openFxPosition(run.state, { direction: fxDirection ?? config.direction, contracts: 1, tick: tick as FxMarketTick } satisfies FxOrder)
          : run.state
      if (nextState === run.state) return
      commitRun({ ...run, state: nextState, mentor: 'entry' })
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The simulated order could not be placed.')
    }
  }

  const advanceOneTick = () => {
    if (!run || run.state.status !== 'ACTIVE') return
    let currentRun = run
    if (currentRun.nextTick >= currentRun.ticks.length) {
      const lastTick = currentRun.ticks.at(-1)
      if (!lastTick) return
      const fixture = createArenaScenario(currentRun.market, currentRun.replay, currentRun.seed)
      const cycleIndex = Math.floor(currentRun.ticks.length / fixture.ticks.length)
      const nextCycle = createNextArenaCycle(
        currentRun.market,
        currentRun.replay,
        arenaSeedForCycle(currentRun.seed, cycleIndex),
        currentRun.state.scenario.id,
        lastTick,
      )
      currentRun = { ...currentRun, ticks: [...currentRun.ticks, ...nextCycle] }
    }
    const tick = currentRun.ticks[currentRun.nextTick]
    if (!tick) return
    const nextState = advanceSimulationTick(currentRun.state, tick)
    if (nextState.status !== 'ACTIVE') setIsPlaying(false)
    const positionOpenedAt = [...currentRun.state.events].reverse().find((event) => event.type === 'POSITION_OPENED')?.timestampMs
    const observedPositionTicks = positionOpenedAt === undefined ? [] : currentRun.history.filter((item) => item.timestampMs >= positionOpenedAt)
    const hasShownVolatilityMoment = observedPositionTicks.some((previous, index) => {
      const following = observedPositionTicks[index + 1]
      return previous?.kind === 'option' && following?.kind === 'option'
        && Math.abs(following.volatility - previous.volatility) >= 0.012
    })
    const detectedMoment = currentRun.state.position ? detectMentorMoment(currentRun.state, nextState) : null
    const nextMoment = detectedMoment === 'volatility-shock' && hasShownVolatilityMoment ? null : detectedMoment
    const expiry = nextState.events.slice(currentRun.state.events.length).some((event) => event.type === 'POSITION_EXPIRED')
    commitRun({
      ...currentRun,
      state: nextState,
      nextTick: currentRun.nextTick + 1,
      history: [...currentRun.history, tick],
      mentor: nextMoment ?? (expiry ? 'expiry' : currentRun.mentor),
    })
  }

  const closeTrade = (positionId?: string) => {
    if (!run?.state.openPositions.length) return
    try {
      const closed = closeOpenPosition(run.state, 'USER_EXIT', positionId)
      commitRun({ ...run, state: closed.state, mentor: 'result' })
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The position could not be closed.')
    }
  }

  const updateOrderContracts = (nextContracts: number) => {
    setContracts(nextContracts)
    if (!run || run.market !== 'india') return
    const orderConfig = { ...(run.orderConfig ?? { optionType, direction, strike, contracts: nextContracts }), contracts: nextContracts }
    commitRun({ ...run, orderConfig })
  }

  const buyAction = () => {
    if (!run) return
    if (run.market === 'global') enterPosition('LONG')
    else enterPosition()
  }

  const sellAction = () => {
    if (!run) return
    const longPosition = run.state.openPositions.find((position) => position.kind === 'option' || position.direction === 'LONG')
    if (longPosition) closeTrade(longPosition.id)
    else if (run.market === 'global') enterPosition('SHORT')
  }

  const chooseOtherScenario = () => {
    commitRun(null)
    setScreen('setup')
    setError('')
  }

  const replayCurrent = () => {
    const nextSeed = seed >= 0xffff_fffe ? 1 : seed + 1
    startRun(nextSeed)
  }

  useEffect(() => { advanceTickRef.current = advanceOneTick })
  const canAutoAdvance = isPlaying && Boolean(run && run.state.status === 'ACTIVE' && !isComplete)
  useEffect(() => {
    if (!canAutoAdvance) return
    const timer = window.setTimeout(() => advanceTickRef.current(), 1200)
    return () => window.clearTimeout(timer)
  }, [canAutoAdvance, run?.nextTick])

  return (
    <MotionConfig reducedMotion="user">
      <main className="fno-arena-root">
        <Header exitArena={exitArena} />
        {persistenceWarning && <p className="arena-score-note" role="status">{persistenceWarning}</p>}
        <div className="arena-main">
          <AnimatePresence mode="wait" initial={false}>
            {screen === 'intro' && !run && (
              <motion.section key="intro" className="arena-intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={transition} aria-labelledby="arena-title">
                <div className="arena-intro-copy">
                  <span className="arena-kicker"><Sparkles aria-hidden="true" /> STOCKIQ SIMULATION LAB</span>
                  <h1 id="arena-title">F&amp;O <em>Arena</em></h1>
                  <p className="arena-intro-deck">Market scenarios. Zero real money. Real lessons.</p>
                  <motion.aside className="arena-story-prologue" initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: reduceMotion ? 0 : 0.12 }} aria-label="A note from Mira Sen, a fictional StockIQ mentor">
                    <span className="arena-story-kicker">A NOTE FROM MIRA SEN · FICTIONAL MENTOR</span>
                    <blockquote>“Risk hai toh ishq hai.”</blockquote>
                    <p>But first, understand what you could lose. This arena is a simulation; every path is illustrative.</p>
                  </motion.aside>
                  <p className="arena-copy">Step into a scripted market path and see how one position can change as price, time and risk move. Every number is produced by the isolated simulation engine.</p>
                  <div className="arena-capital-ticket"><div><span>YOUR SIMULATION CAPITAL</span><strong>1,000 <ToolTerm term="PTS" /></strong></div><span className="arena-ticket-rule">No top-ups · No cash value</span></div>
                  <div className="arena-intro-actions">
                    <button type="button" className="arena-button arena-button-primary" onClick={() => setScreen('setup')}>Enter the Arena <ArrowRight aria-hidden="true" /></button>
                    <p>Educational simulation only. Not financial advice.</p>
                  </div>
                </div>
                <div className="arena-intro-art" aria-hidden="true">
                  <div className="arena-orbit arena-orbit-one" /><div className="arena-orbit arena-orbit-two" />
                  <div className="arena-card-object"><span className="arena-card-chip">STOCKIQ · SIMULATION</span><strong>₹</strong><span className="arena-card-line" /><small>RISK / REASON / RESULT</small></div>
                  <div className="arena-art-caption"><span>01 / SIMULATED</span><span>Understand the position</span></div>
                </div>
              </motion.section>
            )}

            {screen === 'setup' && !run && (
              <motion.section key="setup" className="arena-setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={transition} aria-labelledby="setup-title">
                <button type="button" className="arena-back-button" onClick={() => setScreen('intro')}><ArrowLeft aria-hidden="true" /> Back to introduction</button>
                <div className="arena-step-label">01 — CHOOSE YOUR SCENARIO</div>
                <h1 id="setup-title">Where would you like to begin?</h1>
                <p className="arena-copy">Both arenas are offline, illustrative simulations. No live market connection is used.</p>
                <div className="arena-market-grid" role="group" aria-label="Choose an arena">
                  <button type="button" className={`arena-market-card ${market === 'india' ? 'is-selected' : ''}`} onClick={() => setMarket('india')} aria-pressed={market === 'india'}>
                    <span className="arena-market-code">01 <span>OPTIONS</span></span><strong>India</strong><span>Long Call or Put</span><p>Illustrative index scenario · European Black–Scholes model</p><span className="arena-market-select">{market === 'india' ? 'Selected' : 'Select arena'} <ArrowRight aria-hidden="true" /></span>
                  </button>
                  <button type="button" className={`arena-market-card ${market === 'global' ? 'is-selected' : ''}`} onClick={() => setMarket('global')} aria-pressed={market === 'global'}>
                    <span className="arena-market-code">02 <span>SIMULATED FX</span></span><strong>Global</strong><span>EUR/USD leveraged long or short</span><p>Illustrative quote path · Simulation-only margin mechanics</p><span className="arena-market-select">{market === 'global' ? 'Selected' : 'Select arena'} <ArrowRight aria-hidden="true" /></span>
                  </button>
                </div>
                <ScenarioPicker selected={replay} onSelect={setReplay} />
                <div className="arena-setup-footer">
                  <span><Shield aria-hidden="true" /> Start capital is always exactly 1,000 PTS.</span>
                  <button type="button" className="arena-button arena-button-primary" onClick={() => setScreen('configure')}>Configure position <ArrowRight aria-hidden="true" /></button>
                </div>
              </motion.section>
            )}

            {screen === 'configure' && !run && (
              <motion.section key="configure" className="arena-setup arena-configure" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={transition} aria-labelledby="configure-title">
                <button type="button" className="arena-back-button" onClick={() => setScreen('setup')}><ArrowLeft aria-hidden="true" /> Change arena</button>
                <div className="arena-step-label">02 — CONFIGURE A SINGLE POSITION</div>
                <h1 id="configure-title">Choose your position.</h1>
                <p className="arena-copy">Choose the position you want to watch for. The market opens first; your simulated order is entered only when you press Buy or Sell.</p>
                <div className="arena-config-grid">
                  <section className="arena-panel arena-config-panel">
                    <p className="arena-eyebrow">{market === 'india' ? 'INDIA OPTIONS · ILLUSTRATIVE' : 'GLOBAL · EUR/USD SIMULATED'}</p>
                    {market === 'india' ? (
                      <>
                        <div className="arena-form-row"><span>Position type</span><div className="arena-toggle-group" role="group" aria-label="Option type">
                          {(['CALL', 'PUT'] as const).map((value) => <button type="button" key={value} onClick={() => setOptionType(value)} aria-pressed={optionType === value} className={optionType === value ? 'is-selected' : ''}>{value === 'CALL' ? 'Long Call' : 'Long Put'}</button>)}
                        </div></div>
                        <label className="arena-form-row"><span><ToolTerm term="Strike price" /></span><select value={strike} onChange={(event) => setStrike(Number(event.target.value))}>{optionStrikes.map((value) => <option key={value} value={value}>{value.toFixed(2)} scenario points</option>)}</select></label>
                        <label className="arena-form-row"><span>Contracts <small>1–5 demo contracts</small></span><select value={contracts} onChange={(event) => setContracts(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                        <div className="arena-form-row"><span><ToolTerm term="Expiry" /></span><span className="arena-form-static">24 simulated days</span></div>
                      </>
                    ) : (
                      <>
                        <div className="arena-form-row"><span>Position direction</span><span className="arena-form-static">Choose Buy or Sell in market watch</span></div>
                        <div className="arena-form-row"><span>Position size</span><span className="arena-form-static">1 illustrative contract</span></div>
                        <div className="arena-form-row"><span><ToolTerm term="Leverage" /></span><span className="arena-form-static">20× simulation setting</span></div>
                        <div className="arena-form-row"><span><ToolTerm term="Margin" /></span><span className="arena-form-static">Set by demo engine rules</span></div>
                      </>
                    )}
                    <div className="arena-assumption-box"><AlertTriangle aria-hidden="true" /><span>Contracts, rates, costs, <ToolTerm term="Volatility" /> and margin here are educational assumptions—not exchange or broker specifications.</span></div>
                  </section>
                  <aside className="arena-config-aside">
                    <div className="arena-capital-card"><span>STARTING CAPITAL</span><strong>1,000 <ToolTerm term="PTS" /></strong><small>Every new run starts here. No top-ups.</small></div>
                    <div className="arena-note"><CircleHelp aria-hidden="true" /><span>At zero equity the run ends. FX margin calls and liquidation follow deterministic simulation conventions.</span></div>
                    {error && <p className="arena-error" role="alert">{error}</p>}
                    <button type="button" className="arena-button arena-button-primary arena-launch" onClick={() => startRun()}>Open market watch · 1,000 PTS <ArrowRight aria-hidden="true" /></button>
                    <button type="button" className="arena-text-button" onClick={() => setScreen('setup')}>Back to scenario</button>
                  </aside>
                </div>
              </motion.section>
            )}

            {run && !isComplete && (
              <motion.section key="run" className="arena-run" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={transition} aria-labelledby="run-title">
                <div className="arena-run-topline">
                  <div><div className="arena-step-label">{run.replay === 'story' ? 'STORY MODE' : 'REPLAY SCENARIO'} · {run.market === 'india' ? 'INDIA OPTIONS' : 'EUR/USD'} · {run.state.openPositions.length ? `${run.state.openPositions.length} OPEN ORDER${run.state.openPositions.length === 1 ? '' : 'S'}` : 'MARKET WATCH'}</div><h1 id="run-title">{run.state.scenario.label}</h1></div>
                  <span className="arena-tag"><span className="arena-tag-dot" /> ILLUSTRATIVE · SIMULATED</span>
                </div>
                <AnimatePresence initial={false}>
                  {run.state.marginCallPending && <motion.div key="margin-warning" className="arena-margin-warning" role="status" initial={{ opacity: 0, y: reduceMotion ? 0 : -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }} transition={transition}><AlertTriangle aria-hidden="true" /><div><strong>Margin call</strong><span>Equity is below the scenario’s maintenance level. The simulator schedules open EUR/USD slots for liquidation on the next tick.</span></div></motion.div>}
                </AnimatePresence>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={run.mentor} className="arena-mentor" aria-live="polite" initial={{ opacity: 0, y: reduceMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -3 }} transition={transition}>
                    <span className="arena-mentor-mark" aria-hidden="true">M</span><div><small>MIRA SEN · FICTIONAL STOCKIQ MENTOR</small><p>{mentorLine(run.mentor)}</p></div>
                  </motion.div>
                </AnimatePresence>
                <div className="arena-live-grid">
                  <div className="arena-primary-column">
                    <MarketChart history={chartHistory} market={run.market} totalIntervals={48} />
                    <section className="arena-panel arena-position-panel">
                      <div className="arena-section-heading"><div><p className="arena-eyebrow">{run.state.openPositions.length ? 'OPEN ORDERS' : 'MARKET WATCH'}</p><h2>{run.state.position?.kind === 'option' ? `Long ${run.state.position.type === 'CALL' ? 'Call' : 'Put'}` : run.state.position?.kind === 'fx' ? `${run.state.position.direction} EUR/USD` : 'Waiting for your entry'}</h2></div><span className="arena-tag">{run.state.openPositions.length ? `${run.state.openPositions.length} order${run.state.openPositions.length === 1 ? '' : 's'} open` : 'No position'}</span></div>
                      {run.state.position?.kind === 'option' ? (
                        <div className="arena-position-details">
                          <div><span><ToolTerm term="Strike price" /></span><strong>{run.state.position.strike.toFixed(2)} scenario points</strong></div>
                          <div><span><ToolTerm term="Premium" /></span><strong>{run.state.position.currentModelPremium.toFixed(3)} model units</strong></div>
                          <div><span>Position value</span><strong>{Math.max(0, getEquityPts(run.state) - run.state.cashBalancePts).toFixed(2)} PTS</strong></div>
                          <div><span><ToolTerm term="Expiry" /></span><strong>{Math.max(0, Math.ceil((run.state.position.expiryTimestampMs - run.state.position.currentTick.timestampMs) / 86_400_000))} simulated days</strong></div>
                        </div>
                      ) : run.state.position?.kind === 'fx' ? (
                        <div className="arena-position-details">
                          <div><span>Simulated units</span><strong>{run.state.position.baseUnits.toLocaleString()}</strong></div>
                          <div><span>Entry fill</span><strong>{run.state.position.entryFillPrice.toFixed(4)}</strong></div>
                          <div><span>Current scenario mark</span><strong><MarketMark tick={run.state.position.currentTick} market="global" /></strong></div>
                        </div>
                      ) : !run.state.openPositions.length ? <div className="arena-watch-note"><strong>{getAvailablePts(run.state).toFixed(2)} PTS available</strong><span>{completeTrade ? `Last trade closed at ${formatPts(completeTrade.realizedPnlPts)}. Your run stays active; you can enter again or exit the Arena.` : 'No trade is open yet. Watch the simulated price path, then choose when to enter.'}</span></div> : null}
                      {run.state.openPositions.length > 0 && <div className="arena-open-order-list"><h3>Open order slots <span>{run.state.openPositions.length}</span></h3>{run.state.openPositions.map((position, index) => { const pnl = getPositionPnlPts(run.state, position.id); return <div className="arena-open-order" key={position.id}><div><strong>{position.kind === 'option' ? `Long ${position.type === 'CALL' ? 'Call' : 'Put'} · ${position.strike.toFixed(2)}` : `${position.direction} EUR/USD`}</strong><span>{position.contracts} {position.contracts === 1 ? 'contract' : 'contracts'} · Slot {index + 1} · <b className={pnl >= 0 ? 'arena-positive' : 'arena-negative'}>{formatPts(pnl)}</b></span></div><button type="button" className="arena-order-close" onClick={() => closeTrade(position.id)}>{position.kind === 'fx' && position.direction === 'SHORT' ? 'Buy to close' : 'Sell to close'}</button></div>})}</div>}
                      {run.state.position?.kind === 'option' && (() => {
                        const greeks = getModelGreeks(run.state)
                        return <div className="arena-greeks"><div className="arena-greeks-title"><span>MODEL-BASED GREEKS</span><span>Educational sensitivities only</span></div><div className="arena-greek-grid">
                          <div><span><ToolTerm term="Delta" /></span><strong>{greeks.delta.toFixed(3)}</strong></div>
                          <div><span><ToolTerm term="Gamma" /></span><strong>{greeks.gamma.toFixed(4)}</strong></div>
                          <div><span><ToolTerm term="Theta" /></span><strong>{greeks.thetaPerYear.toFixed(2)} / year</strong></div>
                          <div><span><ToolTerm term="Vega" /></span><strong>{greeks.vegaPerVolatilityUnit.toFixed(2)}</strong></div>
                        </div></div>
                      })()}
                    </section>
                  </div>
                  <aside className="arena-side-column">
                    <div className="arena-equity-card"><span>SIMULATION EQUITY</span><strong>{getEquityPts(run.state).toFixed(2)} <ToolTerm term="PTS" /></strong><small>Available {getAvailablePts(run.state).toFixed(2)} PTS</small><div className="arena-equity-rule" /><span>Current run <ToolTerm term="P&L" /></span><b className={getEquityPts(run.state) >= STARTING_CAPITAL_PTS ? 'arena-positive' : 'arena-negative'}>{formatPts(getEquityPts(run.state) - STARTING_CAPITAL_PTS)}</b></div>
                    {run.state.position?.kind === 'fx' && (
                      <div className="arena-panel arena-margin-panel"><p className="arena-eyebrow">SIMULATION MARGIN</p><div><span><ToolTerm term="Margin" /> reserved</span><strong>{run.state.reservedMarginPts.toFixed(2)} PTS</strong></div><div><span>Maintenance level</span><strong>{(getMaintenanceMarginPts(run.state) ?? 0).toFixed(2)} PTS</strong></div><div><span>Margin level</span><strong>{((getMarginLevel(run.state) ?? 0) * 100).toFixed(1)}%</strong></div><p className="arena-score-note">Demo calculation only. No broker or exchange rule is implied.</p></div>
                    )}
                    <div className="arena-action-card"><div className="arena-action-heading"><Clock3 aria-hidden="true" /><span>SIMULATED MARKET · AUTO-PLAY</span></div><p>Buy creates a separate order slot. Sell closes one open long slot; repeat Buy or Sell as often as your available PTS allow.</p>{run.market === 'india' && <label className="arena-order-size"><span>Contracts per Buy</span><select value={run.orderConfig?.contracts ?? contracts} onChange={(event) => updateOrderContracts(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'contract' : 'contracts'}</option>)}</select></label>}<div className="arena-trade-buttons"><button type="button" className="arena-button arena-buy-button" onClick={buyAction}>{run.market === 'india' ? `Buy ${run.orderConfig?.contracts ?? contracts} ${run.orderConfig?.optionType === 'PUT' ? 'Puts' : 'Calls'}` : 'Buy EUR/USD'}</button><button type="button" className="arena-button arena-sell-button" onClick={sellAction} disabled={!run.state.openPositions.some((position) => position.kind === 'option' || position.direction === 'LONG') && run.market === 'india'}>{run.market === 'india' ? run.state.openPositions.length ? 'Sell oldest open slot' : 'Sell · no long slot open' : 'Sell EUR/USD'}</button></div><button type="button" className="arena-button arena-button-secondary arena-hold-button" onClick={() => setIsPlaying((playing) => !playing)}>{isPlaying ? <><Pause aria-hidden="true" /> Pause market</> : <><Play aria-hidden="true" /> Resume market</>}</button><button type="button" className="arena-button arena-button-secondary arena-hold-button" onClick={() => { setIsPlaying(false); advanceOneTick() }}>Step one interval <ArrowRight aria-hidden="true" /></button><span className="arena-progress-note">Interval {run.state.tickIndex} · Cycle {cycleNumber}</span></div>
                    {error && <p className="arena-error" role="alert">{error}</p>}
                    <p className="arena-run-disclaimer">Educational simulation only. No real trading, no live feeds, no financial advice.</p>
                  </aside>
                </div>
              </motion.section>
            )}

            {run && isComplete && completeTrade && (
              <motion.div key="result" initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
                <TradeAutopsyPanel
                  state={run.state}
                  trade={completeTrade}
                  entryTick={run.history.find((tick) => tick.timestampMs === completeTrade.entryTimestampMs) ?? run.history[0]}
                  exitTick={run.state.currentTick ?? run.history.at(-1)!}
                  expiryTimestampMs={run.ticks.at(-1)?.timestampMs ?? 0}
                  onReplay={replayCurrent}
                  onChooseScenario={chooseOtherScenario}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {error && screen !== 'configure' && <p className="arena-error" role="alert">{error}</p>}
        </div>
        <footer className="arena-footer"><span>F&amp;O ARENA · SIMULATION BUILD</span><span>Educational only · No real money · Not financial advice</span></footer>
      </main>
    </MotionConfig>
  )
}
