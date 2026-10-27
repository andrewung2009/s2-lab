export function formatProbability(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—'
  if (value > 0 && value < 10 ** -digits) return `< ${(10 ** -digits).toFixed(digits)}`
  return value.toFixed(digits)
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return Number(value.toFixed(digits)).toString()
}

export function formatLambda(value: number): string {
  return Number(value.toFixed(2)).toString()
}

export function formatSigned(value: number, digits = 4): string {
  const formatted = formatProbability(Math.abs(value), digits)
  return value >= 0 ? `+${formatted}` : `−${formatted}`
}

export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('en-GB')
}
