const LANCZOS = [
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.13857109526572012,
  9.984369578019572e-6,
  1.5056327351493116e-7,
]

const G = 7

export function logGamma(z: number): number {
  if (Number.isNaN(z)) return Number.NaN
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  }

  let x = 0.99999999999980993
  const shifted = z - 1
  for (let i = 0; i < LANCZOS.length; i += 1) {
    x += LANCZOS[i] / (shifted + i + 1)
  }

  const t = shifted + G + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x)
}

export function logFactorial(n: number): number {
  if (n < 0) return Number.NaN
  if (n < 2) return 0
  return logGamma(n + 1)
}

export function logChoose(n: number, k: number): number {
  if (k < 0 || k > n) return Number.NEGATIVE_INFINITY
  const m = Math.min(k, n - k)
  if (m === 0) return 0
  return logGamma(n + 1) - logGamma(m + 1) - logGamma(n - m + 1)
}

export function binomialPMF(n: number, p: number, k: number): number {
  if (!Number.isInteger(k) || k < 0 || k > n) return 0
  if (p <= 0) return k === 0 ? 1 : 0
  if (p >= 1) return k === n ? 1 : 0
  const logProbability = logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p)
  return Math.exp(logProbability)
}

export function poissonPMF(lambda: number, k: number): number {
  if (!Number.isInteger(k) || k < 0 || lambda < 0) return 0
  if (lambda === 0) return k === 0 ? 1 : 0
  return Math.exp(-lambda + k * Math.log(lambda) - logFactorial(k))
}

function kahanSum(values: number[]): number {
  let sum = 0
  let compensation = 0
  for (const value of values) {
    const adjusted = value - compensation
    const next = sum + adjusted
    compensation = next - sum - adjusted
    sum = next
  }
  return sum
}

export function binomialCDF(n: number, p: number, k: number): number {
  if (k < 0) return 0
  const upper = Math.min(n, Math.floor(k))
  if (upper >= n) return 1
  return kahanSum(Array.from({ length: upper + 1 }, (_, i) => binomialPMF(n, p, i)))
}

export function poissonCDF(lambda: number, k: number): number {
  if (k < 0) return 0
  const upper = Math.floor(k)
  return kahanSum(Array.from({ length: upper + 1 }, (_, i) => poissonPMF(lambda, i)))
}

export function binomialValues(n: number, p: number): number[] {
  return Array.from({ length: n + 1 }, (_, i) => binomialPMF(n, p, i))
}

export function poissonUpperIndex(lambda: number): number {
  if (lambda <= 0) return 12
  return Math.min(160, Math.max(12, Math.ceil(lambda + 7 * Math.sqrt(lambda + 1) + 8)))
}

export function poissonValues(lambda: number): number[] {
  const upper = poissonUpperIndex(lambda)
  return Array.from({ length: upper + 1 }, (_, i) => poissonPMF(lambda, i))
}

export function binomialMean(n: number, p: number): number {
  return n * p
}

export function binomialVariance(n: number, p: number): number {
  return n * p * (1 - p)
}

export function binomialMode(n: number, p: number): number {
  return Math.min(n, Math.floor((n + 1) * p))
}

export function poissonMode(lambda: number): number {
  return Math.floor(lambda)
}

export function convolution(a: number[], b: number[]): number[] {
  const result = new Array<number>(a.length + b.length - 1).fill(0)
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      result[i + j] += a[i] * b[j]
    }
  }
  return result
}

export interface ApproximationMetrics {
  maxDifference: number
  totalVariation: number
  range: [number, number]
  binomial: number[]
  poisson: number[]
}

export function approximationMetrics(n: number, p: number, padding = 6): ApproximationMetrics {
  const lambda = n * p
  const sd = Math.max(
    Math.sqrt(Math.max(n * p * (1 - p), 0)),
    Math.sqrt(Math.max(lambda, 0)),
    1,
  )
  const low = Math.max(0, Math.floor(lambda - padding * sd))
  const high = Math.ceil(lambda + padding * sd)
  const end = Math.max(high, Math.min(n, high + 5))
  const binomial: number[] = []
  const poisson: number[] = []
  let maxDifference = 0
  let totalVariation = 0

  for (let k = low; k <= end; k += 1) {
    const b = binomialPMF(n, p, k)
    const q = poissonPMF(lambda, k)
    binomial.push(b)
    poisson.push(q)
    maxDifference = Math.max(maxDifference, Math.abs(b - q))
    totalVariation += Math.abs(b - q)
  }

  return {
    maxDifference,
    totalVariation: totalVariation / 2,
    range: [low, end],
    binomial,
    poisson,
  }
}
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const magnitude = 10 ** exponent
  const normalized = value / magnitude
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  const step = steps.find((candidate) => normalized <= candidate + 1e-9) ?? 10
  return step * magnitude
}

export function probabilityArraySum(values: number[]): number {
  return kahanSum(values)
}



