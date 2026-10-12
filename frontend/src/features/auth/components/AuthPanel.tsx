import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
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
      <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-rose-300">
          {error}
        </span>
      )}
    </label>
  )
}

/**
 * Glass auth card that fades in over the same 3D scene once the bubble has burst.
 * Auth logic lives in the FastAPI backend; this component only collects input, validates it for UX,
 * calls the auth service through AuthContext and routes on success.
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
      else await login({ email: email.trim(), password })
      setPassword('')
      setConfirm('')
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && !signup && [400, 401, 403, 422].includes(err.status)) {
        // Never reveal whether the email exists or which field was wrong.
        setFormError('Incorrect email or password.')
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
      // `inert` keeps the card out of the tab order and pointer path until it has emerged.
      inert={!revealed}
      className={`glass absolute z-20 max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-3xl p-6 md:p-7
        inset-x-3 bottom-3
        md:inset-x-auto md:bottom-auto md:right-[5vw] md:top-1/2 md:w-[26rem] md:-translate-y-1/2
        ${revealed ? '' : 'pointer-events-none'}`}
    >
      <motion.div variants={item} className="mb-5 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold-500/40 bg-gold-500/10 font-display text-lg text-gold-400">₹</span>
        <span className="font-display text-xl tracking-tight text-white">StockIQ</span>
      </motion.div>

      <motion.h2 variants={item} className="font-display text-3xl leading-tight tracking-tight text-white">
        {variant === 'forgot' ? 'Reset your password' : signup ? 'Create your account' : (
          <>
            Money talks.
            <br />
            <span className="text-gold-400">Learn the language.</span>
          </>
        )}
      </motion.h2>
      <motion.p variants={item} className="mb-5 mt-2 text-sm text-slate-300/90">
        {variant === 'forgot' ? 'Password reset is not available yet.' : 'Understand the risk. Explore the data. Know the reasoning.'}
      </motion.p>

      {variant === 'forgot' ? (
        <motion.div variants={item} className="space-y-4 text-sm text-slate-300">
          <p>
            Self-service reset isn't enabled on this server yet. Please contact the StockIQ team and we'll help you regain access.
          </p>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </motion.div>
      ) : authed ? (
        <motion.div variants={item} className="space-y-3">
          <Link to="/dashboard" className="btn-gold w-full">
            Continue to dashboard
          </Link>
          <button type="button" onClick={logout} className="w-full text-center text-xs text-slate-400 hover:text-white">
            Sign out
          </button>
        </motion.div>
      ) : (
        <>
          <motion.div variants={item}>
            {/* Google OAuth has no backend endpoint yet: shown, but honestly marked unavailable. */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Google sign-in is not available yet"
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 opacity-70"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.4-1.7 4-5.4 4a6 6 0 1 1 0-12c1.9 0 3.1.8 3.8 1.5l2.6-2.5A9.7 9.7 0 0 0 12 2.3a9.7 9.7 0 1 0 0 19.4c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
              </svg>
              Continue with Google
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">Soon</span>
            </button>
          </motion.div>

          <motion.div variants={item} className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </motion.div>

          <form onSubmit={onSubmit} noValidate className="space-y-3.5">
            {signup && (
              <motion.div variants={item}>
                <Field label="Full name (optional)">
                  <input className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </Field>
              </motion.div>
            )}
            <motion.div variants={item}>
              <Field label="Email" error={errors.email}>
                <input
                  className="field"
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
                    className="field pr-11"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </Field>
            </motion.div>
            {signup && (
              <motion.div variants={item}>
                <Field label="Confirm password" error={errors.confirm}>
                  <input className="field" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </Field>
              </motion.div>
            )}

            {formError && (
              <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {formError}
              </p>
            )}

            <motion.div variants={item}>
              <button type="submit" className="btn-gold w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {signup ? 'Create account' : 'Sign in'}
              </button>
            </motion.div>
          </form>

          <motion.div variants={item} className="mt-4 flex flex-col items-center gap-1.5 text-xs text-slate-400">
            {!signup && (
              <Link to="/forgot-password" className="hover:text-white">
                Forgot password?
              </Link>
            )}
            <p>
              {signup ? 'Already have an account? ' : "Don't have an account? "}
              <Link to={signup ? '/login' : '/signup'} className="font-medium text-gold-400 hover:text-gold-300">
                {signup ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </motion.section>
  )
}
