import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'stockiq-theme'
const LEGACY_STORAGE_KEY = 'stockiq_theme'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = (localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as Theme | null
      if (stored === 'light' || stored === 'dark') {
        return stored
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light'
      }
    }
    return 'dark'
  })

  // Synchronize DOM attributes and localStorage
  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    const root = document.documentElement
    root.setAttribute('data-theme', newTheme)
    if (newTheme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      localStorage.setItem(LEGACY_STORAGE_KEY, newTheme)
    } catch {
      // ignore quota / private mode errors
    }
  }, [])

  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme, applyThemeToDOM])

  const setThemeWithTransition = useCallback((nextTheme: Theme) => {
    // Check for View Transitions API and reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = document as any

    if (!prefersReducedMotion && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        setThemeState(nextTheme)
        applyThemeToDOM(nextTheme)
      })
    } else {
      setThemeState(nextTheme)
      applyThemeToDOM(nextTheme)
    }
  }, [applyThemeToDOM])

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setThemeWithTransition(nextTheme)
  }, [theme, setThemeWithTransition])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeWithTransition(newTheme)
  }, [setThemeWithTransition])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
