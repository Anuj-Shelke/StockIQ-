import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, CircleUserRound, LogOut, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Disclaimer } from '@/components/landing/Disclaimer'
import { ACCOUNT_NAV_ITEM, NAV_GROUPS, PRIMARY_NAV_ITEMS, type NavItem } from '@/features/customer-dashboard/navItems'
import { useAuth } from '@/hooks/useAuth'

export function CustomerDashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null | undefined>(undefined)
  const activeGroup = NAV_GROUPS.find((group) => group.items.some((item) => item.to === pathname))
  const visibleExpandedGroup = expandedGroup === undefined ? activeGroup?.id ?? null : expandedGroup

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navLink = ({ to, label, icon: Icon, end }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={() => {
        setOpen(false)
        setExpandedGroup(undefined)
      }}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'nav-active border-l-2 border-gold bg-gold/10 text-gold pl-2.5 font-bold'
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
  )

  const nav = (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto">
      {PRIMARY_NAV_ITEMS.map((entry) => <div key={entry.to}>{navLink(entry)}</div>)}

      <div className="my-3 border-t border-theme-subtle" />

      {NAV_GROUPS.map((group) => {
        const expanded = visibleExpandedGroup === group.id
        const containsCurrentPage = group.items.some((item) => item.to === pathname)
        return (
          <section key={group.id} className="space-y-1">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`nav-group-${group.id}`}
              onClick={() => setExpandedGroup(expanded ? null : group.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-[var(--bg-hover)] ${
                containsCurrentPage ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              <span className="truncate">{group.label}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
              <div id={`nav-group-${group.id}`} className="ml-2 space-y-0.5 border-l border-theme-subtle pl-2">
                {group.items.map((entry) => <div key={entry.to}>{navLink(entry)}</div>)}
              </div>
            )}
          </section>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-canvas text-text-primary transition-colors duration-200">
      {/* Sidebar (Desktop) / Drawer (Mobile) - Fixed at one place */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 h-screen flex-col border-r border-theme-subtle bg-surface p-4 transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-theme-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <span className="logo-mark grid h-8 w-8 place-items-center rounded-lg border border-gold/30 bg-gold/10 font-display text-lg text-gold font-bold">
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
        <div className="mt-3 border-t border-theme-subtle pt-3">
          {navLink(ACCOUNT_NAV_ITEM)}
        </div>
      </aside>

      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Workspace Shell */}
      <div className="flex min-w-0 flex-col md:pl-64">
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
            <NavLink
              to="/dashboard/account"
              aria-label={user?.full_name ? `Account for ${user.full_name}` : 'Account'}
              className="inline-flex items-center gap-2 rounded-lg border border-theme-default bg-canvas px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-[var(--border-focus)] hover:text-text-primary"
            >
              <CircleUserRound className="h-4 w-4 text-gold" />
              <span className="hidden sm:inline">Account</span>
            </NavLink>

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
