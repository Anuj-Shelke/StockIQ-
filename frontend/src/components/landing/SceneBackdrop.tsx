import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import { useSceneTier } from '@/hooks/useMediaQuery'
import type { SceneMode } from '@/three/SceneRoot'

// three.js + R3F are code-split so the app shell and dashboard never pay for them.
// The download starts the moment this module loads (in parallel with rendering), not after the first render.
const stageImport = import('@/three/SceneStage')
void stageImport.catch(() => undefined)
const SceneStage = lazy(() => stageImport)

const POSTER = '/media/stockiq-intro-poster.jpg'

/** Fallback when WebGL is unavailable: the optimised video made once from the reference GIF. */
function VideoBackdrop() {
  return (
    <video className="absolute inset-0 h-full w-full object-cover opacity-80" autoPlay muted loop playsInline poster={POSTER}>
      <source src="/media/stockiq-intro.webm" type="video/webm" />
      <source src="/media/stockiq-intro.mp4" type="video/mp4" />
    </video>
  )
}

/** Same threshold the 3D scene uses to latch the burst (SceneRoot BURST_LATCH_ON). */
const FALLBACK_REVEAL_AT = 0.93

/**
 * Without the 3D scene nothing else would ever call onReveal, so the login card would stay hidden on `/`.
 * Reveal it once the scroll story reaches the point where the bubble would have burst.
 */
function FallbackReveal({ progress, onReveal }: { progress: MotionValue<number>; onReveal?: (revealed: boolean) => void }) {
  useEffect(() => {
    onReveal?.(progress.get() > FALLBACK_REVEAL_AT)
  }, [progress, onReveal])
  useMotionValueEvent(progress, 'change', (v) => onReveal?.(v > FALLBACK_REVEAL_AT))
  return null
}

/** Tells the backdrop the fallback is on screen, so it fades in instead of waiting for the 3D scene. */
function ReadyPing({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady()
  }, [onReady])
  return null
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[StockIQ] 3D scene unavailable, using video fallback.', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

interface Props {
  mode: SceneMode
  progress?: MotionValue<number>
  onReveal?: (revealed: boolean) => void
}

/** The 3D world, its poster while loading, and the vignette that keeps text legible. */
export function SceneBackdrop({ mode, progress, onReveal }: Props) {
  const { mobile, tablet } = useSceneTier()
  const [ready, setReady] = useState(false)
  const markReady = useCallback(() => setReady(true), [])

  // Safety net: never leave the scene hidden if the "ready" signal does not arrive.
  useEffect(() => {
    const id = window.setTimeout(markReady, 4000)
    return () => window.clearTimeout(id)
  }, [markReady])

  return (
    <div className="absolute inset-0 bg-ink-950">
      <img src={POSTER} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" />
      {/* The scene renders (and compiles its shaders) invisibly, then fades in over the poster: no pop, no half-built frames. */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-out" style={{ opacity: ready ? 1 : 0 }}>
        <SceneBoundary
          fallback={
            <>
              <VideoBackdrop />
              <ReadyPing onReady={markReady} />
              {mode === 'scroll' && progress && <FallbackReveal progress={progress} onReveal={onReveal} />}
            </>
          }
        >
          <Suspense fallback={null}>
            <SceneStage mode={mode} progress={progress} mobile={mobile} tablet={tablet} onReveal={onReveal} onReady={markReady} />
          </Suspense>
        </SceneBoundary>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgb(3 6 13 / 0.55) 80%, rgb(3 6 13 / 0.9) 100%)' }}
      />
    </div>
  )
}