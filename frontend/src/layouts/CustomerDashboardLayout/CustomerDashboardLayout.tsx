import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { BackendStatus } from '@/components/ui/BackendStatus'
import { Disclaimer } from '@/components/landing/Disclaimer'
import { NAV_ITEMS } from '@/features/customer-dashboard/navItems'
import { useAuth } from '@/hooks/useAuth'

/** Clean, practical shell for signed-in customers. Intentionally flat: the 3D lives on the landing experience. */
export function CustomerDashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive ? 'bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-ink-900 text-slate-100 md:grid md:grid-cols-[16rem_1fr]">
      {/* sidebar (desktop) / drawer (mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-ink-950 p-4 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold-500/40 bg-gold-500/10 font-display text-lg text-gold-400">₹</span>
            <span className="font-display text-xl text-white">StockIQ</span>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        {nav}
      </aside>
      {open && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <BackendStatus />
            <span className="hidden max-w-[12rem] truncate text-xs text-slate-400 sm:block">{user?.email}</span>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-gold-500/40 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-white/5 px-4 py-4 md:px-8">
          <Disclaimer />
        </footer>
      </div>
    </div>
  )
}