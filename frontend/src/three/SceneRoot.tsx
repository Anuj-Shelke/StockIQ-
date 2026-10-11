import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Group, MathUtils, PointLight, SpotLight } from 'three'
import type { MotionValue } from 'framer-motion'
import { Analysis } from './Analysis'
import { Bubble } from './Bubble'
import { Coins } from './Coins'
import { DataParticles } from './DataParticles'
import { Droplets } from './Droplets'
import { MarketChart } from './MarketChart'
import { Platform } from './Platform'
import { Rupee } from './Rupee'
import { BURST_CLOCK_MAX, BURST_DURATION, REVEAL_AT, createRuntime } from './runtime'
import { clamp01, computeStory, smooth } from './story'

export type SceneMode = 'scroll' | 'revealed' | 'static'

export interface SceneRootProps {
  /** Smoothed scroll progress (0..1). Only read when mode === 'scroll'. */
  progress?: MotionValue<number>
  mode: SceneMode
  mobile: boolean
  tablet: boolean
  onReveal?: (revealed: boolean) => void
}

const BURST_LATCH_ON = 0.93
const BURST_LATCH_OFF = 0.89

/**
 * Owns the per-frame runtime: reads scroll progress, evaluates the story, drives the burst clock,
 * moves the camera, and shifts the world aside once the login panel is revealed.
 * Child components only read `rt` in their own useFrame; nothing here triggers React re-renders
 * except the (rare) reveal callback.
 */
export function SceneRoot({ progress, mode, mobile, tablet, onReveal }: SceneRootProps) {
  const rt = useMemo(() => createRuntime({ mobile, tablet, animate: mode !== 'static' }), [mobile, tablet, mode])
  const world = useRef<Group>(null)
  const spot = useRef<SpotLight>(null)
  const fill = useRef<PointLight>(null)
  const { gl, invalidate } = useThree()
  const onRevealRef = useRef(onReveal)
  useEffect(() => {
    onRevealRef.current = onReveal
  }, [onReveal])

  // Cheaper transmission buffer on small screens (property exists on recent three versions).
  useEffect(() => {
    if (mobile && 'transmissionResolutionScale' in gl) (gl as unknown as { transmissionResolutionScale: number }).transmissionResolutionScale = 0.5
  }, [gl, mobile])

  // Static (reduced-motion) mode renders on demand: nudge a few frames so textures / environment land.
  useEffect(() => {
    if (mode !== 'static') return
    const ids = [0, 200, 600, 1500].map((ms) => window.setTimeout(invalidate, ms))
    return () => ids.forEach(window.clearTimeout)
  }, [mode, invalidate])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    if (rt.animate) rt.time += dt

    const p = mode === 'scroll' && progress ? progress.get() : 1
    rt.p = p
    rt.story = computeStory(p)

    // Burst: scroll latches it on; a real-time clock then plays the tear. Scrolling back re-forms the bubble.
    if (mode === 'scroll') {
      if (!rt.latched && p > BURST_LATCH_ON) rt.latched = true
      else if (rt.latched && p < BURST_LATCH_OFF) rt.latched = false
      rt.burstClock = MathUtils.clamp(rt.burstClock + (rt.latched ? dt : -dt * 1.4), 0, BURST_CLOCK_MAX)
    } else {
      rt.burstClock = BURST_CLOCK_MAX
    }
    rt.burst = clamp01(rt.burstClock / BURST_DURATION)

    const revealed = rt.burstClock > REVEAL_AT
    if (revealed !== rt.revealed) {
      rt.revealed = revealed
      onRevealRef.current?.(revealed)
    }

    // Pointer parallax (desktop only)
    rt.pointer.x = mobile ? 0 : state.pointer.x
    rt.pointer.y = mobile ? 0 : state.pointer.y

    // Camera: dolly back + slow orbit as the world grows; on narrow screens back off so the bubble fits.
    const s = rt.story
    const cam = state.camera as typeof state.camera & { fov: number }
    const aspect = state.size.width / state.size.height
    const halfH = Math.tan(MathUtils.degToRad(cam.fov) / 2)
    const needW = Math.max(4.6, s.bubbleR * 2.25 + 0.8)
    let dist = s.cameraZ
    const w = 2 * dist * halfH * aspect
    if (w < needW) dist *= needW / w
    const az = s.azimuth + rt.pointer.x * 0.05
    const tx = Math.sin(az) * dist
    const tz = Math.cos(az) * dist
    const ty = s.cameraY + rt.pointer.y * 0.12
    const k = rt.animate ? 1 - Math.exp(-6 * dt) : 1
    state.camera.position.x += (tx - state.camera.position.x) * k
    state.camera.position.y += (ty - state.camera.position.y) * k
    state.camera.position.z += (tz - state.camera.position.z) * k
    state.camera.lookAt(0, s.lookY, 0)

    // Slide the world aside for the login panel (right on desktop/tablet, upward on mobile).
    const sh = smooth(clamp01((rt.burstClock - 0.6) / 1.6))
    if (world.current) {
      world.current.position.x = -rt.shiftX * sh
      world.current.position.y = rt.shiftY * sh
    }

    if (spot.current) spot.current.intensity = 140 * s.light
    if (fill.current) fill.current.intensity = 30 * s.light
  }, -1)

  const reflections = !mobile && !tablet

  return (
    <>
      <color attach="background" args={['#03060d']} />
      <fog attach="fog" args={['#03060d', 16, 34]} />

      {/* No network fetch: the studio environment is built from light panels. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={5} color="#fff3dc" position={[0, 6, -3]} rotation-x={Math.PI / 2} scale={[14, 3, 1]} />
        <Lightformer form="rect" intensity={3} color="#ffcf80" position={[-7, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={3.5} color="#9fc4ff" position={[7, 2, 1]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[0, 1, 8]} scale={4} />
        <Lightformer form="rect" intensity={1.2} color="#27447a" position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
        {/* Tall, narrow strip light: a soft highlight glides across the black card face as it turns. */}
        <Lightformer form="rect" intensity={2.2} color="#fff0d2" position={[-3.5, 1.5, 5]} rotation-y={Math.PI / 6} scale={[0.7, 6, 1]} />
      </Environment>
      <ambientLight intensity={0.12} />
      <spotLight ref={spot} position={[3, 7, 5]} angle={0.55} penumbra={1} color="#fff1d6" intensity={90} decay={2} />
      <pointLight ref={fill} position={[-5, 2, 4]} color="#8fb4ff" intensity={20} decay={2} />
      {/* Restrained warm rim light from behind-left: catches the thin gold edge without glow. */}
      <pointLight position={[-2.2, 1.6, -3]} color="#ffb347" intensity={14} decay={2} />

      <group ref={world}>
        <Platform rt={rt} reflections={reflections} />
        <Rupee rt={rt} />
        <Coins rt={rt} />
        <MarketChart rt={rt} />
        <Analysis rt={rt} />
        <DataParticles rt={rt} />
        <Bubble rt={rt} />
        <Droplets rt={rt} />
      </group>
    </>
  )
}