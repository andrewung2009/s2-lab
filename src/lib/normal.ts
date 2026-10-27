import type { Phrase } from './phrases'

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const value = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * value)
  const poly =
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t)
  const result = 1 - poly * Math.exp(-value * value)
  return sign * result
}

export function normalCDF(x: number, mu = 0, sigma = 1): number {
  if (sigma <= 0) return Number.NaN
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)))
}

export function normalPDF(x: number, mu = 0, sigma = 1): number {
  if (sigma <= 0) return 0
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

export function normalApproxProbability(
  phrase: Phrase,
  x: number,
  x2: number,
  mu: number,
  sigma: number,
  continuity = true,
): number {
  const half = continuity ? 0.5 : 0
  const safeX = Math.round(x)
  const safeX2 = Math.round(x2)

  let probability: number
  if (phrase === 'exactly') {
    probability = continuity
      ? normalCDF(safeX + half, mu, sigma) - normalCDF(safeX - half, mu, sigma)
      : normalPDF(safeX, mu, sigma)
  } else if (phrase === 'atMost') {
    probability = normalCDF(safeX + half, mu, sigma)
  } else if (phrase === 'atLeast') {
    probability = 1 - normalCDF(safeX - half, mu, sigma)
  } else if (phrase === 'moreThan') {
    probability = 1 - normalCDF(safeX + half, mu, sigma)
  } else {
    const low = Math.min(safeX, safeX2)
    const high = Math.max(safeX, safeX2)
    probability =
      normalCDF(high + half, mu, sigma) - normalCDF(low - half, mu, sigma)
  }

  return Math.min(1, Math.max(0, probability))
}
