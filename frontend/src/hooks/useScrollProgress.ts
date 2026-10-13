import { useRef, type RefObject } from 'react'
import { useScroll, useSpring, type MotionValue } from 'framer-motion'

/**
 * Scroll progress (0..1) of a tall container that holds a sticky 100vh stage.
 * framer-motion's useScroll uses a single passive listener and writes to a MotionValue (no React re-renders);
 * the spring removes wheel-notch jitter so the 3D timeline feels like one continuous scrubbed animation.
 */
export function useScrollProgress(): { ref: RefObject<HTMLDivElement | null>; progress: MotionValue<number> } {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 85, damping: 26, mass: 0.7, restDelta: 0.0002 })
  return { ref, progress }
}
