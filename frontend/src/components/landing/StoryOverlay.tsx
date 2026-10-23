import type { ReactNode } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Disclaimer } from './Disclaimer'

type Win = [number, number, number, number]

/**
 * Soft dark radial scrim behind text. It lifts contrast against the bubble and scene
 * without text-shadows. `-z-10` keeps it behind the copy; it never captures pointer events.
 */
function Scrim({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -z-10 ${className}`}
      style={{ background: 'radial-gradient(closest-side, rgb(3 6 13 / 0.72), rgb(3 6 13 / 0.38) 60%, transparent)' }}
    />
  )
}

function Stage({ progress, win, className, children }: { progress: MotionValue<number>; win: Win; className: string; children: ReactNode }) {
  const opacity = useTransform(progress, win, [0, 1, 1, 0])
  const y = useTransform(progress, win, [28, 0, 0, -28])
  const filter = useTransform(progress, win, ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'])
  return (
    <div className={`pointer-events-none absolute ${className}`}>
      <motion.div style={{ opacity, y, filter }} className="relative isolate">
        {children}
      </motion.div>
    </div>
  )
}

function Kicker({ n, children, align = 'left' }: { n: string; children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <p className={`mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-300 ${align === 'right' ? 'flex-row-reverse justify-end' : ''}`}>
      <span className="h-px w-8 bg-gold-400/80" />
      {n} · {children}
    </p>
  )
}

const H = 'font-display text-4xl leading-[1.05] tracking-tight text-white md:text-6xl'
const P = 'mt-4 max-w-sm text-sm leading-relaxed text-slate-200 md:text-base'

const RAIL: { label: string; win: Win }[] = [
  { label: 'Money', win: [-0.02, 0, 0.12, 0.18] },
  { label: 'Growth', win: [0.12, 0.2, 0.3, 0.36] },
  { label: 'Data', win: [0.32, 0.4, 0.5, 0.57] },
  { label: 'Analysis', win: [0.52, 0.6, 0.7, 0.77] },
  { label: 'Insight', win: [0.72, 0.8, 0.88, 0.94] },
]

function RailItem({ progress, label, win }: { progress: MotionValue<number>; label: string; win: Win }) {
  const opacity = useTransform(progress, win, [0.6, 1, 1, 0.6])
  const color = useTransform(progress, win, ['#cbd5e1', '#f1d98a', '#f1d98a', '#cbd5e1'])
  return (
    <motion.span style={{ opacity, color }} className="text-[10px] font-semibold uppercase tracking-[0.22em] md:text-[11px]">
      {label}
    </motion.span>
  )
}

/** Story copy + chrome. Everything is driven by the scroll MotionValue: no React state, no re-renders on scroll. */
export function StoryOverlay({ progress }: { progress: MotionValue<number> }) {
  const railOpacity = useTransform(progress, [0.86, 0.93], [1, 0])
  const cueOpacity = useTransform(progress, [0, 0.04], [1, 0])
  const captionOpacity = useTransform(progress, [0.34, 0.42, 0.74, 0.8], [0, 1, 1, 0])
  const discOpacity = useTransform(progress, [0.9, 0.96], [1, 0])
  const storyLineHeight = useTransform(progress, [0, 1], ['0%', '100%'])
  const storyDotTop = useTransform(progress, [0, 1], ['0%', '100%'])

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* top bar */}
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-2" aria-label="StockIQ home">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold-400/50 bg-gold-500/10 font-display text-lg text-gold-300">₹</span>
          <span className="font-display text-xl tracking-tight text-white">StockIQ</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-white/20 bg-ink-950/60 px-4 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition hover:border-gold-300 hover:text-gold-300"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-gold-400 px-4 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-gold-300"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* 01 MONEY: hierarchy is wordmark, then tagline, then supporting line (the card sits below) */}
      <Stage progress={progress} win={[-0.02, 0, 0.1, 0.15]} className="inset-x-0 top-[12vh] px-6 text-center md:top-[11vh]">
        <Scrim className="-inset-x-[18%] -inset-y-10" />
        <p className="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
          Stock<span className="text-gold-300">IQ</span>
        </p>
        <h1 className="mt-3 font-display text-2xl leading-[1.12] tracking-tight text-white md:mt-4 md:text-4xl">
          Money talks. <span className="text-gold-300">Learn the language.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm font-medium leading-relaxed text-slate-100 md:text-base">A portfolio is more than a number. See what moves it—and what could pull it down.</p>
        <div className="pointer-events-auto mt-5 flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-gold-500 px-5 py-2 text-xs font-semibold text-ink-950 shadow-lg shadow-gold-500/20 transition hover:bg-gold-400"
          >
            Sign in to StockIQ
          </Link>
          <Link
            to="/signup"
            className="rounded-xl border border-white/20 bg-white/5 px-5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:border-gold-400/50 hover:bg-white/10"
          >
            Create Free Account
          </Link>
        </div>
      </Stage>

      {/* 02 THE HOLDINGS */}
      <Stage progress={progress} win={[0.14, 0.2, 0.3, 0.35]} className="bottom-[22vh] left-6 md:bottom-auto md:left-[7vw] md:top-1/2 md:-translate-y-1/2">
        <Scrim className="-inset-8 md:-inset-x-14 md:-inset-y-12" />
        <span aria-hidden className="absolute -left-2 -top-12 -z-10 font-display text-8xl font-semibold text-white/[0.06] md:-left-8 md:-top-20 md:text-[10rem]">02</span>
        <Kicker n="02">Holdings</Kicker>
        <div className="max-w-lg border-l border-gold-300/50 pl-5 md:pl-7">
          <h2 className={H}>The green days tell one story.</h2>
          <p className={P}>The holdings underneath tell another. See how the pieces of a portfolio fit together.</p>
        </div>
      </Stage>

      {/* 03 THE TURN */}
      <Stage progress={progress} win={[0.34, 0.4, 0.5, 0.56]} className="bottom-[22vh] left-6 md:bottom-auto md:left-auto md:right-[7vw] md:top-1/2 md:-translate-y-1/2 md:text-right">
        <Scrim className="-inset-8 md:-inset-x-14 md:-inset-y-12" />
        <span aria-hidden className="absolute -right-2 -top-12 -z-10 font-display text-8xl font-semibold text-white/[0.06] md:-right-8 md:-top-20 md:text-[10rem]">03</span>
        <Kicker n="03" align="right">When markets turn</Kicker>
        <div className="max-w-lg border-l border-gold-300/50 pl-5 text-left md:border-l-0 md:border-r md:pl-0 md:pr-7 md:text-right">
          <h2 className={H}>A shock travels through the whole portfolio.</h2>
          <p className={`${P} md:ml-auto`}>See how historical market stress could affect a portfolio like yours.</p>
        </div>
      </Stage>

      {/* 04 THE QUESTION */}
      <Stage progress={progress} win={[0.56, 0.62, 0.7, 0.76]} className="bottom-[22vh] left-6 md:bottom-auto md:left-[7vw] md:top-1/2 md:-translate-y-1/2">
        <Scrim className="-inset-8 md:-inset-x-14 md:-inset-y-12" />
        <span aria-hidden className="absolute -left-2 -top-12 -z-10 font-display text-8xl font-semibold text-white/[0.06] md:-left-8 md:-top-20 md:text-[10rem]">04</span>
        <Kicker n="04">The harder question</Kicker>
        <div className="max-w-lg border-l border-gold-300/50 pl-5 md:pl-7">
          <h2 className={H}>What could you lose?</h2>
          <p className={P}>Risk Reality Check puts possible downside beside the numbers you already watch.</p>
        </div>
      </Stage>

      {/* 05 YOUR CALL */}
      <Stage progress={progress} win={[0.76, 0.8, 0.87, 0.92]} className="bottom-[22vh] left-6 md:bottom-auto md:left-auto md:right-[7vw] md:top-1/2 md:-translate-y-1/2 md:text-right">
        <Scrim className="-inset-8 md:-inset-x-14 md:-inset-y-12" />
        <span aria-hidden className="absolute -right-2 -top-12 -z-10 font-display text-8xl font-semibold text-white/[0.06] md:-right-8 md:-top-20 md:text-[10rem]">05</span>
        <Kicker n="05" align="right">Your decision</Kicker>
        <div className="max-w-lg border-l border-gold-300/50 pl-5 text-left md:border-l-0 md:border-r md:pl-0 md:pr-7 md:text-right">
          <h2 className={H}>Clarity before conviction.</h2>
          <p className={`${P} md:ml-auto`}>Explore the data. Understand the reasoning. The decision stays yours.</p>
        </div>
      </Stage>

      {/* illustrative-data caption */}
      <motion.p
        style={{ opacity: captionOpacity }}
        className="absolute bottom-24 right-6 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300 md:bottom-16 md:right-10"
      >
        Illustrative visualization · not a forecast
      </motion.p>

      {/* scroll cue */}
      <motion.div style={{ opacity: cueOpacity }} className="absolute inset-x-0 bottom-16 flex flex-col items-center gap-2 md:bottom-20">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-200">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-gold-300 to-transparent" />
      </motion.div>

      {/* A fine progress mark gives the scroll story a quiet sense of movement. */}
      <div aria-hidden className="pointer-events-none absolute bottom-[26vh] left-[3.2vw] top-[26vh] hidden w-px bg-white/20 md:block">
        <motion.div style={{ height: storyLineHeight }} className="w-px bg-gold-300" />
        <motion.span style={{ top: storyDotTop }} className="absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 rounded-full border border-gold-300 bg-ink-950" />
      </div>

      {/* timeline rail */}
      <motion.nav style={{ opacity: railOpacity }} aria-hidden className="absolute inset-x-0 bottom-9 flex justify-center gap-3 md:bottom-11 md:gap-7">
        {RAIL.map((r) => (
          <span key={r.label} className="flex items-center gap-3 md:gap-7">
            <RailItem progress={progress} label={r.label} win={r.win} />
            {r.label !== RAIL[RAIL.length - 1].label && <span aria-hidden className="h-px w-3 bg-white/20 md:w-6" />}
          </span>
        ))}
      </motion.nav>

      <motion.div style={{ opacity: discOpacity }} className="absolute inset-x-5 bottom-2 md:inset-x-10">
        <Disclaimer className="mx-auto max-w-3xl text-center" />
      </motion.div>
    </div>
  )
}
