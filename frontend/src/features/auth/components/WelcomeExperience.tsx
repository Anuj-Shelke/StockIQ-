import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import './WelcomeExperience.css'

const scenes = [
  { theme: 'AMBITION', primary: 'Everyone wants their money to grow.', secondary: 'But growth creates responsibility.', visual: 'rise' },
  { theme: 'MONEY', primary: 'Money moves fast.', secondary: 'Understanding should move faster.', visual: 'path' },
  { theme: 'RISK', primary: 'Every return has a story.', secondary: 'Every risk has one too.', visual: 'risk' },
  { theme: 'CONFIDENCE', primary: 'Confidence can open doors.', secondary: 'Overconfidence can close them.', visual: 'bold' },
  { theme: 'REALITY CHECK', primary: "The real question isn't only what you can gain.", secondary: "It's what you can afford to lose.", visual: 'risk' },
  { theme: 'UNDERSTANDING', primary: "Numbers don't tell you everything.", secondary: 'Context does.', visual: 'data' },
  { theme: 'STOCKIQ', primary: 'Understand the risk.', secondary: 'Explore the data. Know the reasoning.', visual: 'converge' },
]

function chooseScene() {
  let previous = -1
  try {
    previous = Number(localStorage.getItem('stockiq_welcome_scene'))
  } catch { /* Scene selection still works without storage. */ }
  const options = scenes.map((_, index) => index).filter((index) => index !== previous)
  const selected = options[Math.floor(Math.random() * options.length)] ?? 0
  try {
    localStorage.setItem('stockiq_welcome_scene', String(selected))
  } catch { /* Scene selection still works without storage. */ }
  return selected
}

export function WelcomeExperience() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { status, user } = useAuth()
  const reducedMotion = useReducedMotion()
  const isWelcomeRoute = pathname === '/welcome'
  const [active, setActive] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const claimed = useRef(false)
  const finishing = useRef(false)
  const ctaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isWelcomeRoute) {
      if (!finishing.current) {
        const frame = requestAnimationFrame(() => {
          setActive(false)
          setExiting(false)
          claimed.current = false
        })
        return () => cancelAnimationFrame(frame)
      }
      return
    }
    if (status === 'loading') return
    if (status !== 'authenticated' || user?.role !== 'investor') return
    if (claimed.current) return
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (cancelled) return
      let pending = false
      try {
        pending = sessionStorage.getItem('stockiq_welcome_pending') === '1' && sessionStorage.getItem('stockiq_welcome_seen') !== '1'
        if (pending) {
          sessionStorage.removeItem('stockiq_welcome_pending')
          sessionStorage.setItem('stockiq_welcome_seen', '1')
        }
      } catch { /* Without session storage, skip directly to the dashboard. */ }
      if (!pending) {
        navigate('/dashboard', { replace: true })
        return
      }
      claimed.current = true
      finishing.current = false
      setSceneIndex(chooseScene())
      setExiting(false)
      setActive(true)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [isWelcomeRoute, navigate, status, user?.role])

  useEffect(() => {
    if (!active) return
    ctaRef.current?.focus()
    let finished = false
    const finish = () => {
      if (finishing.current) return
      finishing.current = true
      navigate('/dashboard', { replace: true })
      // Let React render the dashboard route underneath before fading the welcome away.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (finished) return
        setExiting(true)
        window.setTimeout(() => {
          setActive(false)
          finishing.current = false
          claimed.current = false
          requestAnimationFrame(() => document.querySelector<HTMLElement>('main a[href], main button:not([disabled]), main [tabindex="0"], nav[aria-label="Dashboard"] a[href]')?.focus())
        }, reducedMotion ? 0 : 460)
      }))
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        finish()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      finished = true
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [active, navigate, reducedMotion])

  if (!active) return null
  const scene = scenes[sceneIndex]
  const firstName = user?.full_name?.trim().split(/\s+/)[0]
  const greeting = firstName && /^[\p{L}'-]+$/u.test(firstName)
    ? `Welcome, ${firstName.charAt(0).toLocaleUpperCase()}${firstName.slice(1)}`
    : 'Welcome'

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-auto bg-[#f5f1e8] px-5 py-6 text-[#22211e]"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeInOut' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-greeting"
      aria-describedby="welcome-story"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at 50% 44%, #fffdf8 0%, #f5f1e8 58%, #eee8dc 100%)' }} />
      <div className="relative grid w-full max-w-6xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
        <div className="order-2 text-center md:order-1 md:text-left">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9b762d]">{scene.theme}</p>
          <motion.h1
            className="font-display text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl md:text-5xl"
            id="welcome-greeting"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            aria-live="polite"
          >
            {greeting}
          </motion.h1>
          <p className="mt-3 text-sm text-[#77736b]">Take a moment.</p>
          <motion.div
            className="mt-10 border-l border-[#c39a48] pl-5 text-left"
            id="welcome-story"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.55 }}
          >
            <p className="font-display text-xl leading-snug sm:text-2xl">{scene.primary}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#77736b] sm:text-base">{scene.secondary}</p>
          </motion.div>
          <motion.button
            ref={ctaRef}
            type="button"
            onClick={() => {
              if (finishing.current) return
              finishing.current = true
              navigate('/dashboard', { replace: true })
              requestAnimationFrame(() => requestAnimationFrame(() => {
                setExiting(true)
                window.setTimeout(() => {
                  setActive(false)
                  finishing.current = false
                  claimed.current = false
                  requestAnimationFrame(() => document.querySelector<HTMLElement>('main a[href], main button:not([disabled]), main [tabindex="0"], nav[aria-label="Dashboard"] a[href]')?.focus())
                }, reducedMotion ? 0 : 460)
              }))
            }}
            className="group mt-9 inline-flex min-h-12 items-center gap-3 border-b border-[#b48a37] px-1 pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.19em] text-[#282722] outline-none transition-colors hover:text-[#9b762d] focus-visible:ring-2 focus-visible:ring-[#b48a37] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f5f1e8] sm:text-xs"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.3 }}
          >
            <span>MONEY TALKS. LEARN THE LANGUAGE.<br /><span className="mt-1 inline-block text-[#8c877e]">PRESS ENTER</span></span>
            <span className="text-lg text-[#aa812f] transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </motion.button>
        </div>

        <motion.div
          className={`relative order-1 mx-auto flex aspect-[1.26/1] w-full max-w-[31rem] items-center justify-center md:order-2 ${reducedMotion ? '' : 'welcome-scene'}`}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          aria-hidden="true"
        >
          <div className="absolute left-[8%] right-[8%] top-1/2 h-px bg-[#d5c9b1]" />
          <div className="absolute left-[10%] right-[10%] top-1/2 h-px origin-left bg-[#b48a37] welcome-gold-line" />
          {scene.visual === 'data' && <div className="absolute inset-x-[15%] top-[23%] flex justify-between text-[#b48a37]">{[0, 1, 2, 3, 4].map((dot) => <span key={dot} className="h-1.5 w-1.5 rounded-full bg-current" />)}</div>}
          {scene.visual === 'risk' && <div className="absolute left-[25%] top-[28%] h-32 w-32 rounded-full border border-[#d5c9b1]" />}
          <div className={`relative z-10 flex h-[48%] w-[68%] max-w-[20rem] items-center justify-center overflow-hidden rounded-[1.1rem] border border-[#b79a60]/70 bg-[#171715] shadow-[0_35px_55px_-28px_rgba(22,20,15,.58),inset_0_1px_0_rgba(255,255,255,.12)] ${scene.visual === 'bold' ? 'scale-[1.04]' : ''}`} style={{ transform: 'perspective(900px) rotateX(7deg) rotateY(-9deg)' }}>
            <div className="absolute inset-[5px] rounded-[0.85rem] border border-white/[0.08]" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent" />
            <span className="relative -mt-1 font-display text-7xl font-medium text-[#c6a35a] drop-shadow-[0_2px_1px_rgba(0,0,0,.7)] sm:text-8xl">₹</span>
            <span className="absolute bottom-5 left-6 text-[8px] uppercase tracking-[0.25em] text-white/45">STOCKIQ · RESEARCH &amp; RISK</span>
          </div>
          <span className="absolute bottom-[15%] right-[14%] text-[9px] uppercase tracking-[0.2em] text-[#928c80]">RISK LENS</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
