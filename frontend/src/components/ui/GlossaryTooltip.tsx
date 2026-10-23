import React, { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { financialGlossary } from '@/data/financialGlossary'

interface GlossaryTooltipContextValue {
  openId: string | null
  setOpenId: (id: string | null) => void
}

const GlossaryTooltipContext = createContext<GlossaryTooltipContextValue | null>(null)

/** Shares open/close state so only one glossary definition is shown at a time. */
export function GlossaryTooltipProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null)
    }
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-glossary-root], [data-glossary-popup]')) {
        setOpenId(null)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOutside)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOutside)
    }
  }, [])

  return <GlossaryTooltipContext.Provider value={{ openId, setOpenId }}>{children}</GlossaryTooltipContext.Provider>
}

interface GlossaryTooltipProps {
  term: string
  /** Existing callers can continue passing their own definition. */
  definition?: string
  /** Optional shared glossary entry; explicit definitions retain precedence. */
  glossaryKey?: string
  /** Attach the tooltip behavior to an existing interactive element, such as a tab button. */
  asChild?: boolean
  children: React.ReactNode
}

export function GlossaryTooltip({ term, definition, glossaryKey, asChild = false, children }: GlossaryTooltipProps) {
  const context = useContext(GlossaryTooltipContext)
  const localOpen = useState(false)
  const id = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const popupRef = useRef<HTMLSpanElement>(null)
  const wasOpenOnPointerDown = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [position, setPosition] = useState<{ left: number; top: number; placement: 'top' | 'bottom' | 'center' } | null>(null)
  const isOpen = context ? context.openId === id : localOpen[0]
  const setIsOpen = (open: boolean) => context ? context.setOpenId(open ? id : null) : localOpen[1](open)

  const resolvedDefinition = definition ?? (glossaryKey ? glossaryDefinitions[glossaryKey] : undefined) ?? ''
  const tooltipId = `glossary-${id}`

  useLayoutEffect(() => {
    if (!isOpen || !rootRef.current) return
    const trigger = rootRef.current.getBoundingClientRect()
    const margin = 8
    const width = Math.min(256, window.innerWidth - margin * 2)
    const left = Math.max(margin, Math.min(trigger.left + trigger.width / 2 - width / 2, window.innerWidth - width - margin))
    const popupHeight = popupRef.current?.offsetHeight ?? 100
    const roomAbove = trigger.top - margin
    const roomBelow = window.innerHeight - trigger.bottom - margin
    const showAbove = roomAbove >= popupHeight || roomBelow < popupHeight
    const placement = roomAbove < popupHeight && roomBelow < popupHeight ? 'center' : showAbove ? 'top' : 'bottom'
    const top = placement === 'center' ? window.innerHeight / 2 : showAbove ? trigger.top - 8 : trigger.bottom + 8
    setPosition({
      left,
      top,
      placement,
    })

    const reposition = () => {
      const current = rootRef.current?.getBoundingClientRect()
      if (!current) return
      const nextWidth = Math.min(256, window.innerWidth - margin * 2)
      const height = popupRef.current?.offsetHeight ?? 100
      const above = current.top - margin
      const below = window.innerHeight - current.bottom - margin
      const nextShowAbove = above >= height || below < height
      const nextPlacement = above < height && below < height ? 'center' : nextShowAbove ? 'top' : 'bottom'
      setPosition({
        left: Math.max(margin, Math.min(current.left + current.width / 2 - nextWidth / 2, window.innerWidth - nextWidth - margin)),
        top: nextPlacement === 'center' ? window.innerHeight / 2 : nextShowAbove ? current.top - 8 : current.bottom + 8,
        placement: nextPlacement,
      })
    }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [isOpen])

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setIsOpen(false), 120)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    wasOpenOnPointerDown.current = isOpen
    if (asChild && React.isValidElement<React.HTMLAttributes<HTMLButtonElement>>(children)) {
      children.props.onPointerDown?.(event)
    }
  }
  const handlePointerEnter = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (asChild && React.isValidElement<React.HTMLAttributes<HTMLButtonElement>>(children)) {
      children.props.onPointerEnter?.(event)
    }
    if (event.pointerType === 'mouse') { cancelClose(); setIsOpen(true) }
  }
  const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (asChild && React.isValidElement<React.HTMLAttributes<HTMLButtonElement>>(children)) {
      children.props.onPointerLeave?.(event)
    }
    if (event.pointerType === 'mouse') scheduleClose()
  }
  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    if (asChild && React.isValidElement<React.HTMLAttributes<HTMLButtonElement>>(children)) {
      children.props.onFocus?.(event)
    }
    cancelClose()
    setIsOpen(true)
  }
  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    if (asChild && React.isValidElement<React.HTMLAttributes<HTMLButtonElement>>(children)) {
      children.props.onBlur?.(event)
    }
    if (!rootRef.current?.contains(event.relatedTarget as Node | null)) scheduleClose()
  }
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (asChild && React.isValidElement<React.HTMLAttributes<HTMLButtonElement>>(children)) {
      children.props.onClick?.(event)
    }
    cancelClose()
    setIsOpen(event.detail === 0 ? true : !wasOpenOnPointerDown.current)
  }

  const childTrigger = asChild && React.isValidElement<React.HTMLAttributes<HTMLButtonElement>>(children)
    ? React.cloneElement(children, {
        'aria-describedby': tooltipId,
        'aria-expanded': isOpen,
        onPointerDown: handlePointerDown,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onClick: handleClick,
        className: `${children.props.className ?? ''} relative after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']`,
      })
    : null

  return (
    <span ref={rootRef} data-glossary-root className="inline-block align-baseline">
      {childTrigger ?? <button
        type="button"
        aria-describedby={tooltipId}
        aria-expanded={isOpen}
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        className="relative after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] rounded-sm border-0 bg-transparent p-0 align-baseline font-[inherit] leading-[inherit] text-inherit cursor-help underline decoration-dotted decoration-gold-400/60 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
      >
        {children}
      </button>}
      <span id={tooltipId} role="tooltip" className="sr-only">{term}. {resolvedDefinition}</span>
      {isOpen && position && (
        <span
          ref={popupRef}
          aria-hidden="true"
          data-glossary-popup
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          className={`theme-dark-surface fixed z-[100] max-h-[calc(100vh-1rem)] w-[min(16rem,calc(100vw-1rem))] overflow-auto rounded-lg border border-white/10 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur-md ${position.placement === 'top' ? '-translate-y-full' : position.placement === 'center' ? '-translate-y-1/2' : ''}`}
          style={{ left: position.left, top: position.top }}
        >
          <span className="font-semibold text-gold-300 flex items-center gap-1 mb-1">
            <Info className="h-3 w-3" />
            {term}
          </span>
          <span className="block leading-relaxed text-slate-300 font-normal">{resolvedDefinition}</span>
        </span>
      )}
    </span>
  )
}

const glossaryDefinitions: Record<string, string> = financialGlossary

export default GlossaryTooltip
