/**
 * The single scroll -> scene mapping. Everything the 3D world does is a pure
 * function of scroll progress `p` (0..1), so the whole experience is one
 * continuous, scrubbable timeline.
 *
 *  0.00-0.14  MONEY     calm: card is the hero, small bubble, orbiting coins, gold bars
 *  0.14-0.34  GROWTH    bubble swells, more coins, particles, objects drift
 *  0.34-0.56  DATA      market line draws itself, data points appear
 *  0.56-0.76  ANALYSIS  portfolio ring, risk gauge, connected data
 *  0.76-0.90  INSIGHT   objects organise into order, camera settles, card faces front
 *  0.93+      BURST     latched, time-based (see SceneRoot), then login reveal
 */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export interface StoryState {
  bubbleR: number
  bubbleY: number
  /** 0..1 surface tension: wobble + ripples grow as the bubble nears its limit */
  tension: number
  coinFraction: number
  growth: number
  chart: number
  analysis: number
  organize: number
  particles: number
  light: number
  cameraZ: number
  cameraY: number
  azimuth: number
  lookY: number
  rupeeSpin: number
}

export const BUBBLE_R_MIN = 0.5
export const BUBBLE_R_MAX = 3.5

export function computeStory(p: number): StoryState {
  const grow = smoother(range(p, 0.04, 0.88))
  const tension = smooth(range(p, 0.8, 0.93))
  return {
    bubbleR: lerp(BUBBLE_R_MIN, BUBBLE_R_MAX, grow) * (1 + tension * 0.03),
    bubbleY: lerp(-0.84, 0.55, smooth(range(p, 0.04, 0.88))),
    tension,
    coinFraction: smooth(range(p, 0.1, 0.5)),
    growth: smooth(range(p, 0.12, 0.34)),
    chart: smooth(range(p, 0.32, 0.56)),
    analysis: smooth(range(p, 0.54, 0.74)),
    organize: smooth(range(p, 0.68, 0.9)),
    particles: smooth(range(p, 0.12, 0.3)),
    light: lerp(0.65, 1.15, smooth(range(p, 0, 0.9))),
    cameraZ: lerp(10.2, 13.2, smooth(range(p, 0.06, 0.9))),
    cameraY: lerp(0.5, 0.9, smooth(range(p, 0, 0.9))),
    azimuth: lerp(-0.18, 0.2, smooth(range(p, 0, 0.9))),
    // Centred on the card (floats near y = 1.15) at the start, easing down so the bubble still fits.
    lookY: lerp(0.85, 0.6, smooth(range(p, 0, 0.9))),
    // One full 360 turn (eased in Rupee.tsx), then it holds facing the viewer through the burst.
    rupeeSpin: Math.PI * 2 * range(p, 0.12, 0.82),
  }
}