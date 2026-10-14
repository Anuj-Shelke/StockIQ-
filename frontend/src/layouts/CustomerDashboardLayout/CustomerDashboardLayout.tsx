import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X, User } from 'lucide-react'
import { BackendStatus } from '@/components/ui/BackendStatus'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Disclaimer } from '@/components/landing/Disclaimer'
import { NAV_ITEMS } from '@/features/customer-dashboard/navItems'
import { useAuth } from '@/hooks/useAuth'

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
            `group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-150 ${
              isActive
                ? 'border-l-2 border-gold bg-gold/10 text-gold pl-2.5 font-bold'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border-l-2 border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-gold' : 'text-text-muted group-hover:text-text-primary'
                }`}
              />
              <span className="truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-canvas text-text-primary md:grid md:grid-cols-[16rem_1fr] transition-colors duration-200">
      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-theme-subtle bg-surface p-4 transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-theme-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold/30 bg-gold/10 font-display text-lg text-gold font-bold">
              ₹
            </span>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-text-primary">StockIQ</span>
              <span className="block text-[9px] uppercase tracking-[0.2em] text-text-muted">Research & Risk</span>
            </div>
          </div>
          <button
            className="md:hidden text-text-muted hover:text-text-primary"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {nav}
      </aside>

      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Workspace Shell */}
      <div className="flex min-w-0 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-theme-subtle bg-surface/90 px-4 py-3 backdrop-blur-md md:px-8">
          <button
            className="md:hidden p-1 rounded-md text-text-secondary hover:bg-white/5"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-3.5">
            <ThemeToggle showLabel={false} />
            <BackendStatus />

            <div className="hidden items-center gap-2 rounded-full border border-theme-default bg-canvas px-3 py-1 text-xs text-text-secondary sm:flex">
              <User className="h-3.5 w-3.5 text-gold" />
              <span className="max-w-[10rem] truncate">{user?.email}</span>
            </div>

            <button
              onClick={signOut}
              className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-theme-subtle bg-surface px-4 py-4 md:px-8">
          <Disclaimer />
        </footer>
      </div>
    </div>
  )
}