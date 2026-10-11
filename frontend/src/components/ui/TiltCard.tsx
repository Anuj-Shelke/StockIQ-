import { useRef, type PointerEvent, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Subtle 3D tilt on hover. Writes the transform directly to the element: no React re-render per pointer move. */
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType === 'touch' || !el.current) return
    const r = el.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.current.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`
  }
  const leave = () => {
    if (el.current) el.current.style.transform = ''
  }

  return (
    <div ref={el} onPointerMove={move} onPointerLeave={leave} className={`transition-transform duration-200 ease-out will-change-transform ${className}`}>
      {children}
    </div>
  )
}
