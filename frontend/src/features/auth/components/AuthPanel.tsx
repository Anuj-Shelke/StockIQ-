import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Loader2, UserRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'
import { validateEmail, validatePassword } from '@/services/auth'

export type AuthVariant = 'login' | 'signup' | 'forgot'

interface Props {
  variant: AuthVariant
  /** false: hidden + inert (3D world still bursting). true: emerges. */
  revealed: boolean
}

const panel: Variants = {
  hide: { opacity: 0, scale: 0.96, y: 18, filter: 'blur(14px)', transition: { duration: 0.35 } },
  show: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.07, delayChildren: 0.12 } },
}
const item: Variants = {
  hide: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs font-semibold tracking-wider uppercase text-text-secondary">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs font-mono text-loss">
          {error}
        </span>
      )}
    </label>
  )
}

/**
 * The Black Financial Card: matte black, thin gold perimeter, embossed ₹.
 * Emerges once the bubble has burst.
 */
export function AuthPanel({ variant, revealed }: Props) {
  const { status, login, register, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [portal, setPortal] = useState<'user' | 'admin'>('user')

  const signup = variant === 'signup'
  const authed = status === 'authenticated'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password, { strict: signup }) ?? undefined,
      confirm: signup && password !== confirm ? 'Passwords do not match.' : undefined,
    }
    setErrors(next)
    if (next.email || next.password || next.confirm) return
    setBusy(true)
    const shouldWelcome = signup || portal !== 'admin'
    if (shouldWelcome) {
      try {
        // Set this before auth state changes so PublicOnlyRoute can preserve the welcome destination.
        sessionStorage.removeItem('stockiq_welcome_seen')
        sessionStorage.setItem('stockiq_welcome_pending', '1')
      } catch {
        // Storage may be unavailable; direct navigation below remains the fallback.
      }
    }
    try {
      if (signup) await register({ email: email.trim(), password, full_name: name.trim() || undefined })
      else await login({ email: email.trim(), password, portal: portal ?? 'user' })
      setPassword('')
      setConfirm('')
      if (shouldWelcome) {
        navigate('/welcome', { replace: true })
      } else {
        navigate(from.startsWith('/admin') ? from : '/admin/dashboard', { replace: true })
      }
    } catch (err) {
      if (shouldWelcome) {
        try {
          sessionStorage.removeItem('stockiq_welcome_pending')
        } catch {
          // Keep the authentication error visible even when storage is unavailable.
        }
      }
      if (err instanceof ApiError && !signup && err.status === 401) {
        setFormError('Invalid email or password.')
      } else if (err instanceof ApiError && !signup && err.status === 403) {
        setFormError(err.message)
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.section
      aria-label={signup ? 'Create account' : 'Sign in'}
      initial="hide"
      animate={revealed ? 'show' : 'hide'}
      variants={panel}
      inert={!revealed}
      className={`auth-panel card-black absolute z-20 max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-3xl p-6 sm:p-8 md:p-10
        inset-x-3 bottom-3
        md:inset-x-auto md:bottom-auto md:right-[6vw] md:top-1/2 md:w-[32rem] md:-translate-y-1/2
        shadow-2xl border border-gold/30 backdrop-blur-xl
        ${revealed ? '' : 'pointer-events-none'}`}
    >
      {/* Subtle embossed ₹ signature watermark */}
      <div className="absolute -right-3 -bottom-8 text-9xl font-mono text-gold/5 pointer-events-none select-none font-bold">
        ₹
      </div>

      <motion.div variants={item} className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/50 bg-gold/10 font-display text-xl text-gold font-bold shadow-sm">₹</span>
          <span className="font-display text-2xl tracking-tight text-text-primary">StockIQ</span>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md bg-gold/10 border border-gold/25 text-gold font-medium">
          Secure Access
        </span>
      </motion.div>

      <motion.h2 variants={item} className="font-display text-2xl md:text-3xl leading-tight tracking-tight text-text-primary">
        {variant === 'forgot' ? 'Reset your password' : signup ? 'Create your account' : (
          <>
            Money talks.
            <br />
            <span className="text-gold">Learn the language.</span>
          </>
        )}
      </motion.h2>
      <motion.p variants={item} className="mb-6 mt-2 text-sm leading-relaxed text-text-secondary">
        {variant === 'forgot' ? 'Password reset is not available yet.' : 'Understand the risk. Explore the data. Know the reasoning.'}
      </motion.p>

      {variant === 'forgot' ? (
        <motion.div variants={item} className="space-y-4 text-xs md:text-sm text-text-secondary">
          <p>
            Self-service reset isn't enabled on this server yet. Please contact the StockIQ team and we'll help you regain access.
          </p>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-gold hover:underline font-mono">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </motion.div>
      ) : authed ? (
        <motion.div variants={item} className="space-y-4">
          <Link to="/dashboard" className="btn-gold w-full min-h-[52px] text-center flex items-center justify-center text-base font-semibold rounded-xl">
            Continue to dashboard
          </Link>
          <button type="button" onClick={logout} className="w-full text-center text-xs text-text-muted hover:text-text-primary transition font-mono">
            Sign out
          </button>
        </motion.div>
      ) : (
        <>
          {!signup && (
            <motion.div variants={item} className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1.5 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => { setPortal('user'); setFormError(null) }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold tracking-wide transition-all ${
                  portal === 'user'
                    ? 'bg-gold/20 text-gold border border-gold/40 shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                }`}
              >
                <UserRound className="h-4 w-4" />
                <span>Investor</span>
              </button>
              <button
                type="button"
                onClick={() => { setPortal('admin'); setFormError(null) }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold tracking-wide transition-all ${
                  portal === 'admin'
                    ? 'bg-gold/20 text-gold border border-gold/40 shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin</span>
              </button>
            </motion.div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            {signup && (
              <motion.div variants={item}>
                <Field label="Full name (optional)">
                  <input className="input-default" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                </Field>
              </motion.div>
            )}
            <motion.div variants={item}>
              <Field label="Email address" error={errors.email}>
                <input
                  className="input-default"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                />
              </Field>
            </motion.div>
            <motion.div variants={item}>
              <Field label="Password" error={errors.password}>
                <span className="relative block">
                  <input
                    className="input-default pr-14"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={signup ? 'At least 8 characters' : 'Enter your password'}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-muted hover:text-gold hover:bg-white/5 transition"
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </span>
              </Field>
            </motion.div>
            {signup && (
              <motion.div variants={item}>
                <Field label="Confirm password" error={errors.confirm}>
                  <input className="input-default" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" />
                </Field>
              </motion.div>
            )}

            {formError && (
              <p role="alert" className="rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-xs text-loss font-mono">
                {formError}
              </p>
            )}

            <motion.div variants={item} className="pt-1">
              <button
                type="submit"
                className="btn-gold w-full min-h-[52px] py-3.5 text-base font-semibold shadow-lg flex items-center justify-center gap-2.5 rounded-xl transition-all"
                disabled={busy}
              >
                {busy && <Loader2 className="h-5 w-5 animate-spin" />}
                {signup ? 'Create account' : portal === 'admin' ? 'Sign in as Admin' : 'Sign in as Investor'}
              </button>
            </motion.div>
          </form>

          <motion.div variants={item} className="mt-6 flex flex-col items-center gap-2 text-xs text-text-muted">
            {!signup && (
              <Link to="/forgot-password" className="hover:text-text-primary transition">
                Forgot password?
              </Link>
            )}
            <p>
              {signup ? 'Already have an account? ' : "Don't have an account? "}
              <Link to={signup ? '/login' : '/signup'} className="font-medium text-gold hover:underline">
                {signup ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </motion.section>
  )
}
