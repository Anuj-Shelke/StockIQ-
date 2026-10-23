import { useState, useEffect } from 'react'
import {
  CalendarDays,
  CircleUserRound,
  Mail,
  ShieldCheck,
  Edit3,
  Check,
  X,
  User,
  Briefcase,
  Phone,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/services/api'

function formatMemberSince(value: string | undefined) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(date)
}

interface StoredPreferences {
  phone?: string
  occupation?: string
  bio?: string
  experienceLevel?: string
}

export function AccountPage() {
  const { user, profileLoading, profileError, reloadProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [occupation, setOccupation] = useState('')
  const [bio, setBio] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Intermediate')

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      try {
        const stored = localStorage.getItem(`stockiq_profile_prefs_${user.email}`)
        if (stored) {
          const parsed: StoredPreferences = JSON.parse(stored)
          setPhone(parsed.phone || '')
          setOccupation(parsed.occupation || '')
          setBio(parsed.bio || '')
          setExperienceLevel(parsed.experienceLevel || 'Intermediate')
        }
      } catch {
        // localStorage fallback
      }
    }
  }, [user])

  if (profileLoading && !user) {
    return <div className="mx-auto max-w-4xl py-12 text-sm text-text-muted">Loading account details…</div>
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl rounded-2xl border border-theme-default bg-surface p-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">Account</h1>
        <p className="mt-2 text-sm text-text-secondary">{profileError || 'Account details are currently unavailable.'}</p>
        <button type="button" onClick={() => void reloadProfile()} className="btn-secondary mt-4">Try again</button>
      </section>
    )
  }

  const displayName = fullName.trim() || user.full_name?.trim() || 'Name not provided'
  const accountType = user.role === 'admin' ? 'Administrator' : 'Investor'

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setErrorMessage('Full name cannot be empty.')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // 1. Update backend user record
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: { full_name: fullName.trim() },
      })

      // 2. Persist extended profile preferences locally
      try {
        const prefs: StoredPreferences = {
          phone: phone.trim(),
          occupation: occupation.trim(),
          bio: bio.trim(),
          experienceLevel,
        }
        localStorage.setItem(`stockiq_profile_prefs_${user.email}`, JSON.stringify(prefs))
      } catch {
        // Ignore storage errors
      }

      await reloadProfile()
      setIsEditing(false)
      setSuccessMessage('Profile details updated successfully!')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(user.full_name || '')
    try {
      const stored = localStorage.getItem(`stockiq_profile_prefs_${user.email}`)
      if (stored) {
        const parsed: StoredPreferences = JSON.parse(stored)
        setPhone(parsed.phone || '')
        setOccupation(parsed.occupation || '')
        setBio(parsed.bio || '')
        setExperienceLevel(parsed.experienceLevel || 'Intermediate')
      }
    } catch {
      // Ignore
    }
    setErrorMessage(null)
    setIsEditing(false)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Your StockIQ profile</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-text-primary">Account</h1>
          <p className="mt-2 text-sm text-text-secondary">Manage your investor identity, profile data, and access permissions.</p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="btn-gold flex items-center gap-2 self-start sm:self-auto"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </button>
        )}
      </header>

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-gain/30 bg-gain/10 p-4 text-xs font-medium text-gain animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-loss/30 bg-loss/10 p-4 text-xs font-medium text-loss animate-fade-in">
          <X className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <section aria-label="Account profile" className="overflow-hidden rounded-2xl border border-theme-default bg-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-theme-subtle bg-canvas/60 p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-inner">
              <CircleUserRound className="h-8 w-8" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="truncate font-display text-xl font-bold text-text-primary">{displayName}</h2>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold border border-gold/30 font-mono">
                  {accountType}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-text-muted font-mono">{user.email}</p>
              {bio && <p className="mt-1 text-xs text-text-secondary line-clamp-1 italic">"{bio}"</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              user.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-loss/15 text-loss border border-loss/30'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-loss'}`} />
              {user.is_active ? 'Active Account' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Edit Mode Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary mb-1.5">
                  Full Name <span className="text-gold">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="input-default pl-10.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary mb-1.5">
                  Email Address (Primary Identity)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input-default pl-10.5 opacity-65 cursor-not-allowed bg-canvas/40 font-mono text-xs"
                  />
                </div>
                <p className="mt-1 text-[10px] text-text-muted">Registered authentication email cannot be altered directly.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary mb-1.5">
                  Phone / WhatsApp (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-default pl-10.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary mb-1.5">
                  Occupation / Professional Role
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Software Engineer, Business Owner"
                    className="input-default pl-10.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary mb-1.5">
                  Market Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="input-default"
                >
                  <option value="Beginner">Beginner (&lt; 2 years in equities)</option>
                  <option value="Intermediate">Intermediate (2–5 years active investing)</option>
                  <option value="Advanced">Advanced (5+ years / active F&amp;O &amp; portfolio management)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono text-text-secondary mb-1.5">
                  Investor Bio / Focus Tagline
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Long-term compounder focused on Indian manufacturing &amp; tech"
                  className="input-default"
                  maxLength={120}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-subtle">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="btn-secondary flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-gold flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* Read Mode Grid */
          <dl className="grid gap-px bg-theme-subtle sm:grid-cols-2">
            <div className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                <User className="h-4 w-4 text-gold" aria-hidden="true" /> Full Name
              </dt>
              <dd className="mt-2 text-sm font-semibold text-text-primary">{displayName}</dd>
            </div>

            <div className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                <Mail className="h-4 w-4 text-gold" aria-hidden="true" /> Email Address
              </dt>
              <dd className="mt-2 break-all text-sm font-mono text-text-primary">{user.email}</dd>
            </div>

            <div className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                <ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" /> Account Role &amp; Access
              </dt>
              <dd className="mt-2 text-sm font-medium text-text-primary">{accountType}</dd>
            </div>

            <div className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" /> Member Since
              </dt>
              <dd className="mt-2 text-sm font-medium text-text-primary">{formatMemberSince(user.created_at)}</dd>
            </div>

            <div className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                <Briefcase className="h-4 w-4 text-gold" aria-hidden="true" /> Occupation &amp; Experience
              </dt>
              <dd className="mt-2 text-sm font-medium text-text-primary">
                {occupation ? `${occupation} · ` : ''}{experienceLevel}
              </dd>
            </div>

            <div className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                <Phone className="h-4 w-4 text-gold" aria-hidden="true" /> Contact Phone
              </dt>
              <dd className="mt-2 text-sm font-mono text-text-primary">{phone || 'Not provided'}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* Security and Credentials Note */}
      <div className="rounded-xl border border-theme-subtle bg-surface/50 p-4 flex items-center justify-between text-xs text-text-muted">
        <span>StockIQ encrypts all session credentials. Passwords cannot be viewed in plain text.</span>
        <span className="font-mono text-gold flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> 256-Bit SSL Secured
        </span>
      </div>
    </div>
  )
}

export default AccountPage
