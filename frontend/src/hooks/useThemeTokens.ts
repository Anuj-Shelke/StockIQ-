import { useMemo } from 'react'
import { useTheme } from '@/context/ThemeContext'

export interface ThemeTokens {
  isDark: boolean
  canvas: string
  surface: string
  surfaceElevated: string
  surfaceHover: string
  borderSubtle: string
  borderDefault: string
  borderFocus: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  gold: string
  goldSoft: string
  blue: string
  success: string
  warning: string
  danger: string
  chart: {
    primary: string
    secondary: string
    benchmark: string
    accent: string
    grid: string
    axis: string
    tooltipBg: string
    tooltipBorder: string
    sequence: string[]
  }
}

export function useThemeTokens(): ThemeTokens {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return useMemo<ThemeTokens>(() => {
    if (isDark) {
      return {
        isDark: true,
        canvas: '#070B14',
        surface: '#0D1424',
        surfaceElevated: '#131C30',
        surfaceHover: '#18233B',
        borderSubtle: '#151E33',
        borderDefault: '#1F2A44',
        borderFocus: '#D4A84B',
        textPrimary: '#E8ECF4',
        textSecondary: '#A8B2C7',
        textMuted: '#6F7A93',
        gold: '#D4A84B',
        goldSoft: 'rgba(212, 168, 75, 0.14)',
        blue: '#5B8DEF',
        success: '#34B58A',
        warning: '#E3A23B',
        danger: '#E5584F',
        chart: {
          primary: '#D4A84B',
          secondary: '#5B8DEF',
          benchmark: '#E5584F',
          accent: '#34B58A',
          grid: '#1F2A44',
          axis: '#6F7A93',
          tooltipBg: '#131C30',
          tooltipBorder: '#1F2A44',
          sequence: ['#D4A84B', '#5B8DEF', '#34B58A', '#9B72CF', '#E3A23B', '#4FB5B5', '#8C97AF'],
        },
      }
    }

    return {
      isDark: false,
      canvas: '#F7F3EA',
      surface: '#FCFBF8',
      surfaceElevated: '#FFFFFF',
      surfaceHover: '#F1ECE0',
      borderSubtle: '#EEE8DA',
      borderDefault: '#E4DDCC',
      borderFocus: '#A87B1F',
      textPrimary: '#101828',
      textSecondary: '#3B4660',
      textMuted: '#6B7488',
      gold: '#A87B1F',
      goldSoft: 'rgba(168, 123, 31, 0.12)',
      blue: '#2F5FC4',
      success: '#0F8A63',
      warning: '#B5730F',
      danger: '#C23B33',
      chart: {
        primary: '#A87B1F',
        secondary: '#2F5FC4',
        benchmark: '#C23B33',
        accent: '#0F8A63',
        grid: '#E4DDCC',
        axis: '#6B7488',
        tooltipBg: '#FFFFFF',
        tooltipBorder: '#E4DDCC',
        sequence: ['#A87B1F', '#2F5FC4', '#0F8A63', '#7A54AB', '#B5730F', '#1F8E8E', '#5D6677'],
      },
    }
  }, [isDark])
}
