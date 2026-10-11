import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AuthPanel, type AuthVariant } from '@/features/auth/components/AuthPanel'
import { Disclaimer } from './Disclaimer'
import { SceneBackdrop } from './SceneBackdrop'

/**
 * /login, /signup and /forgot-password: the same 3D world, already past the burst, with the glass panel on top.
 * Keeps the "login is part of the scene" feel for direct visits (no separate flat page).
 */
export function AuthStage({ variant }: { variant: AuthVariant }) {
  const reduced = useReducedMotion()
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 250)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <main className="relative h-[100svh] w-full overflow-hidden">
      <SceneBackdrop mode={reduced ? 'static' : 'revealed'} />
      <Link to="/" className="absolute left-5 top-5 z-10 flex items-center gap-2 md:left-10" aria-label="StockIQ home">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold-500/40 bg-gold-500/10 font-display text-lg text-gold-400">₹</span>
        <span className="font-display text-xl tracking-tight text-white">StockIQ</span>
      </Link>
      <AuthPanel variant={variant} revealed={revealed} />
      <Disclaimer className="absolute inset-x-5 bottom-2 z-10 hidden max-w-3xl md:block md:left-10" />
    </main>
  )
}
