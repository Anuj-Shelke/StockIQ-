/**
 * Currency and date formatting helpers for Indian Capital Gains taxation.
 */

export function formatINR(val: number | null | undefined, showDecimals = true): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00'
  const isNegative = val < 0
  const absVal = Math.abs(val)

  const parts = absVal.toFixed(showDecimals ? 2 : 0).split('.')
  let integerPart = parts[0]
  const decimalPart = parts[1]

  // Indian currency numbering system (last 3 digits, then groups of 2 digits)
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3)
    const otherNumbers = integerPart.substring(0, integerPart.length - 3)
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
  }

  const formatted = showDecimals ? `${integerPart}.${decimalPart}` : integerPart
  return `${isNegative ? '-' : ''}₹${formatted}`
}

export function formatDateIndian(dateStr?: string | null): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
