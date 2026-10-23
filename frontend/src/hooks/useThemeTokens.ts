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
        canvas: '#0B0D0C',
        surface: '#121614',
        surfaceElevated: '#1A201D',
        surfaceHover: '#242C28',
        borderSubtle: '#202723',
        borderDefault: '#303A35',
        borderFocus: '#00D09C',
        textPrimary: '#F3F6F5',
        textSecondary: '#B8C3C1',
        textMuted: '#899592',
        gold: '#00D09C',
        goldSoft: 'rgba(0, 208, 156, 0.15)',
        blue: '#60A5FA',
        success: '#00D09C',
        warning: '#F1B84B',
        danger: '#F06A66',
        chart: {
          primary: '#00D09C',
          secondary: '#60A5FA',
          benchmark: '#F06A66',
          accent: '#00D09C',
          grid: '#303A35',
          axis: '#899592',
          tooltipBg: '#1A201D',
          tooltipBorder: '#303A35',
          sequence: ['#00D09C', '#60A5FA', '#F1B84B', '#9B8AFB', '#F06A66', '#4FB5B5', '#B8C3C1'],
        },
      }
    }

    return {
      isDark: false,
      canvas: '#F7F8FC',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      surfaceHover: '#F0ECFA',
      borderSubtle: '#E5E9F0',
      borderDefault: '#CDD5E2',
      borderFocus: '#5A2989',
      textPrimary: '#151B28',
      textSecondary: '#39465B',
      textMuted: '#5C687A',
      gold: '#5A2989',
      goldSoft: 'rgba(90, 41, 137, 0.10)',
      blue: '#315FEA',
      success: '#087A55',
      warning: '#975600',
      danger: '#B4232F',
      chart: {
        primary: '#5A2989',
        secondary: '#315FEA',
        benchmark: '#B4232F',
        accent: '#087A55',
        grid: '#D8DDE8',
        axis: '#5C687A',
        tooltipBg: '#FFFFFF',
        tooltipBorder: '#CDD5E2',
        sequence: ['#5A2989', '#315FEA', '#087A55', '#7A54AB', '#975600', '#1F8E8E', '#5D6677'],
      },
    }
  }, [isDark])
}
