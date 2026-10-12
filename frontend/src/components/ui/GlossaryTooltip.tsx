import React, { useState } from 'react'
import { Info } from 'lucide-react'

interface GlossaryTooltipProps {
  term: string
  definition: string
  children: React.ReactNode
}

export function GlossaryTooltip({ term, definition, children }: GlossaryTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <span
      className="relative inline-block cursor-help group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="underline decoration-dotted decoration-gold-400/60 underline-offset-2">
        {children}
      </span>
      {isVisible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg border border-white/10 bg-ink-900/95 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur-md pointer-events-none">
          <span className="font-semibold text-gold-300 flex items-center gap-1 mb-1">
            <Info className="h-3 w-3" />
            {term}
          </span>
          <span className="block leading-relaxed text-slate-300 font-normal">
            {definition}
          </span>
        </span>
      )}
    </span>
  )
}
export default GlossaryTooltip
