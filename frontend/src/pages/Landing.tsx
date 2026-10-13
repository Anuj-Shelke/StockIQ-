import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import { AuthStage } from '@/components/landing/AuthStage'
import { Disclaimer } from '@/components/landing/Disclaimer'
import { SceneBackdrop } from '@/components/landing/SceneBackdrop'
import { StoryOverlay } from '@/components/landing/StoryOverlay'
import { AuthPanel } from '@/features/auth/components/AuthPanel'
import { useScrollProgress } from '@/hooks/useScrollProgress'

/**
 * Cinematic landing. A 600svh track holds one sticky 100svh stage.
 * Extended from 500svh → 600svh so there is 100svh of real DOM space below the sticky stage
 * after it un-sticks — this lets users scroll the page back to the top naturally.
 */
function ScrollStory() {
  const { ref, progress } = useScrollProgress()
  const [revealed, setRevealed] = useState(false)

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div ref={ref} className="relative h-[600svh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <SceneBackdrop mode="scroll" progress={progress} onReveal={setRevealed} />
        <StoryOverlay progress={progress} />
        <AuthPanel variant="login" revealed={revealed} />
        {revealed && <Disclaimer className="absolute inset-x-5 bottom-2 z-10 hidden max-w-3xl md:left-10 md:block" />}

        {/* Scroll-back-up nudge — appears after auth card is revealed */}
        {revealed && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 group"
          >
            <ChevronUp className="h-5 w-5 text-gold-400/80 animate-bounce group-hover:text-gold-300 transition" />
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400 group-hover:text-slate-200 transition">
              Back to top
            </span>
          </motion.button>
        )}
      </div>
      {/* 100svh spacer below sticky stage — this is what lets the page scroll back up
          after the sticky element un-sticks at the bottom of the track */}
      <div className="h-[100svh] w-full bg-ink-950" aria-hidden />
    </div>
  )
}

export default function Landing() {
  const reduced = useReducedMotion()
  return reduced ? <AuthStage variant="login" /> : <ScrollStory />
}
