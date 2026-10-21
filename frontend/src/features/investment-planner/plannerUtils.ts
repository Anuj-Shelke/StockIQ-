/**
 * Indian currency and financial formatting utilities for Investment Planner
 */

export function formatINR(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export function formatINRDecimal(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

export function formatPercent(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0.0%'
  return `${val.toFixed(1)}%`
}

export function getRiskColorClass(risk: string): string {
  switch (risk.toLowerCase()) {
    case 'very low':
    case 'low':
      return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
    case 'moderate':
    case 'balanced':
      return 'text-amber-400 bg-amber-950/40 border-amber-800/40'
    case 'high':
    case 'aggressive':
      return 'text-rose-400 bg-rose-950/40 border-rose-800/40'
    default:
      return 'text-sky-400 bg-sky-950/40 border-sky-800/40'
  }
}
