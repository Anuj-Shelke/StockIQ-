import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Rendering tier for the 3D scene: mobile simplifies particles, reflections, hover and transmission cost. */
export function useSceneTier() {
  const mobile = useMediaQuery('(max-width: 767px)')
  const tablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  return { mobile, tablet }
}
