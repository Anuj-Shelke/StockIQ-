import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      aria-pressed={isDark}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 text-xs font-medium text-[var(--text-secondary)] shadow-sm transition-all duration-200 hover:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)]/40 ${className}`}
    >
      <div className="relative flex items-center gap-1 px-1.5 py-0.5">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
            isDark
              ? 'bg-[var(--gold-primary)] text-[#070B14] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="Dark Theme"
        >
          <Moon className="h-3.5 w-3.5" />
        </span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
            !isDark
              ? 'bg-[var(--gold-primary)] text-[#070B14] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="Light Theme"
        >
          <Sun className="h-3.5 w-3.5" />
        </span>
      </div>

      {showLabel && (
        <span className="pr-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition">
          {isDark ? 'Midnight' : 'Ivory'}
        </span>
      )}
    </button>
  )
}
