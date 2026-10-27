import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, Users, ClipboardList } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Disclaimer } from '@/components/landing/Disclaimer'
import { useAuth } from '@/hooks/useAuth'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = [
    { to: '/admin/dashboard', label: 'Review Queue', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 h-screen flex-col border-r border-theme-subtle bg-surface p-4 overflow-y-auto">
        <div className="mb-6 flex items-center gap-3 border-b border-theme-subtle pb-4">
          <ShieldCheck className="h-6 w-6 text-gold" />
          <div><strong className="font-display text-lg">StockIQ Admin</strong><span className="block text-[9px] uppercase tracking-widest text-text-muted">Review workspace</span></div>
        </div>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold ${isActive ? 'bg-gold/10 text-gold' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-theme-subtle bg-surface/90 px-4 py-3 backdrop-blur-md md:px-8">
          <span className="mr-auto max-w-[14rem] truncate text-xs text-text-muted">{user?.email}</span>
          <ThemeToggle showLabel={false} />
          <button onClick={() => { logout(); navigate('/login', { replace: true }) }} className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </header>
        <main className="flex-1 px-4 py-8 md:px-8"><Outlet /></main>
        <footer className="border-t border-theme-subtle bg-surface px-4 py-4 md:px-8"><Disclaimer /></footer>
      </div>
    </div>
  )
}
