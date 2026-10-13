import { computeStory, type StoryState } from './story'

/** Mutable per-frame scene state. Lives outside React: reading it never re-renders. */
export interface Runtime {
  p: number
  story: StoryState
  /** seconds since the bubble began bursting (reversible; clamped 0..BURST_CLOCK_MAX) */
  burstClock: number
  /** 0..1 film-break progress derived from burstClock */
  burst: number
  latched: boolean
  time: number
  revealed: boolean
  /** false => frozen "static" render (reduced motion) */
  animate: boolean
  mobile: boolean
  tablet: boolean
  /** horizontal/vertical shift of the world once the login panel is shown */
  shiftX: number
  shiftY: number
  pointer: { x: number; y: number }
}

export const BURST_DURATION = 1.8
export const BURST_CLOCK_MAX = 4.2
export const REVEAL_AT = 1.5

export function createRuntime(init: { mobile: boolean; tablet: boolean; animate: boolean }): Runtime {
  return {
    p: 0,
    story: computeStory(0),
    burstClock: 0,
    burst: 0,
    latched: false,
    time: 0,
    revealed: false,
    animate: init.animate,
    mobile: init.mobile,
    tablet: init.tablet,
    shiftX: init.mobile ? 0 : init.tablet ? 1.1 : 2.1,
    shiftY: init.mobile ? 1.35 : 0,
    pointer: { x: 0, y: 0 },
  }
}
