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
    <label className="block">
      <span className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-secondary">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-loss font-mono">
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
  const [portal, setPortal] = useState<'user' | 'admin' | null>(null)

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
    try {
      if (signup) await register({ email: email.trim(), password, full_name: name.trim() || undefined })
      else await login({ email: email.trim(), password, portal: portal ?? 'user' })
      setPassword('')
      setConfirm('')
      navigate(signup || portal !== 'admin' ? (from.startsWith('/dashboard') ? from : '/dashboard') : (from.startsWith('/admin') ? from : '/admin/dashboard'), { replace: true })
    } catch (err) {
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
      className={`card-black absolute z-20 max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-3xl p-6 md:p-8
        inset-x-3 bottom-3
        md:inset-x-auto md:bottom-auto md:right-[5vw] md:top-1/2 md:w-[26rem] md:-translate-y-1/2
        shadow-2xl border border-gold/30 backdrop-blur-xl
        ${revealed ? '' : 'pointer-events-none'}`}
    >
      {/* Subtle embossed ₹ signature watermark */}
      <div className="absolute -right-3 -bottom-8 text-9xl font-mono text-gold/5 pointer-events-none select-none font-bold">
        ₹
      </div>

      <motion.div variants={item} className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold/50 bg-gold/10 font-display text-lg text-gold font-bold">₹</span>
          <span className="font-display text-xl tracking-tight text-text-primary">StockIQ</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold">
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
      <motion.p variants={item} className="mb-5 mt-2 text-xs md:text-sm text-text-muted leading-relaxed">
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
        <motion.div variants={item} className="space-y-3">
          <Link to="/dashboard" className="btn-gold w-full text-center block">
            Continue to dashboard
          </Link>
          <button type="button" onClick={logout} className="w-full text-center text-xs text-text-muted hover:text-text-primary transition font-mono">
            Sign out
          </button>
        </motion.div>
      ) : !signup && !portal ? (
        <motion.div variants={item} className="space-y-3">
          <p className="text-sm font-semibold text-text-primary">How would you like to continue?</p>
          <button type="button" onClick={() => setPortal('user')} className="card-surface flex w-full items-start gap-3 p-4 text-left hover:border-gold/40">
            <UserRound className="mt-0.5 h-5 w-5 text-gold" />
            <span><strong className="block text-sm text-text-primary">User</strong><span className="text-xs text-text-muted">Understand your portfolio and risk</span></span>
          </button>
          <button type="button" onClick={() => setPortal('admin')} className="card-surface flex w-full items-start gap-3 p-4 text-left hover:border-gold/40">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-gold" />
            <span><strong className="block text-sm text-text-primary">Admin</strong><span className="text-xs text-text-muted">Review users, analyses, and expert-review requests</span></span>
          </button>
          <p className="pt-2 text-center text-xs text-text-muted">Don't have an account? <Link to="/signup" className="font-medium text-gold hover:underline">Sign up</Link></p>
        </motion.div>
      ) : (
        <>
          {!signup && portal && <button type="button" onClick={() => { setPortal(null); setFormError(null) }} className="mb-3 inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Change portal · {portal === 'admin' ? 'Admin' : 'User'}</button>}
          <form onSubmit={onSubmit} noValidate className="space-y-3.5">
            {signup && (
              <motion.div variants={item}>
                <Field label="Full name (optional)">
                  <input className="input-default" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </Field>
              </motion.div>
            )}
            <motion.div variants={item}>
              <Field label="Email" error={errors.email}>
                <input
                  className="input-default font-mono"
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
                    className="input-default pr-11 font-mono"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={signup ? 'At least 8 characters' : 'Your password'}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </Field>
            </motion.div>
            {signup && (
              <motion.div variants={item}>
                <Field label="Confirm password" error={errors.confirm}>
                  <input className="input-default font-mono" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </Field>
              </motion.div>
            )}

            {formError && (
              <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss font-mono">
                {formError}
              </p>
            )}

            <motion.div variants={item}>
              <button type="submit" className="btn-gold w-full text-center flex items-center justify-center gap-2" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {signup ? 'Create account' : 'Sign in'}
              </button>
            </motion.div>
          </form>

          <motion.div variants={item} className="mt-4 flex flex-col items-center gap-1.5 text-xs text-text-muted">
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
