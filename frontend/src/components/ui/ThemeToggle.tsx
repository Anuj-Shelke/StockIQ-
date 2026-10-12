import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center rounded-xl p-2 transition-all duration-200 border cursor-pointer ${
        isDark
          ? 'border-white/10 bg-white/5 text-gold-300 hover:bg-white/10 hover:border-gold-500/40'
          : 'border-slate-300 bg-white text-amber-600 shadow-sm hover:bg-slate-100 hover:border-slate-400'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  )
}
