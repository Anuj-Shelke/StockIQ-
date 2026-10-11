import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { AuthStage } from '@/components/landing/AuthStage'
import { Disclaimer } from '@/components/landing/Disclaimer'
import { SceneBackdrop } from '@/components/landing/SceneBackdrop'
import { StoryOverlay } from '@/components/landing/StoryOverlay'
import { AuthPanel } from '@/features/auth/components/AuthPanel'
import { useScrollProgress } from '@/hooks/useScrollProgress'

/**
 * Cinematic landing. A 500svh track holds one sticky 100svh stage: scroll progress is the timeline for the whole
 * 3D world (bubble growth, ₹ spin, objects, chart, camera) up to the bubble burst, after which the login card
 * emerges inside the same stage. With prefers-reduced-motion we skip the scrubbed story and show the settled scene.
 */
function ScrollStory() {
  const { ref, progress } = useScrollProgress()
  const [revealed, setRevealed] = useState(false)

  return (
    <div ref={ref} className="relative h-[500svh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <SceneBackdrop mode="scroll" progress={progress} onReveal={setRevealed} />
        <StoryOverlay progress={progress} />
        <AuthPanel variant="login" revealed={revealed} />
        {revealed && <Disclaimer className="absolute inset-x-5 bottom-2 z-10 hidden max-w-3xl md:left-10 md:block" />}
      </div>
    </div>
  )
}

export default function Landing() {
  const reduced = useReducedMotion()
  return reduced ? <AuthStage variant="login" /> : <ScrollStory />
}
