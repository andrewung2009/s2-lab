import { describe, expect, it } from 'vitest'
import {
  approximationMetrics,
  binomialCDF,
  binomialPMF,
  binomialValues,
  convolution,
  logChoose,
  poissonCDF,
  poissonPMF,
  poissonValues,
} from './distributions'
import { resolvePhrase } from './phrases'

describe('binomial distribution', () => {
  it('computes binomial coefficients', () => {
    expect(logChoose(10, 5)).toBeCloseTo(Math.log(252), 10)
    expect(logChoose(1000, 1)).toBeCloseTo(Math.log(1000), 9)
  })

  it('matches a known PMF value', () => {
    expect(binomialPMF(10, 0.5, 5)).toBeCloseTo(0.24609375, 12)
  })

  it('sums to one over the support', () => {
    const values = binomialValues(60, 0.37)
    expect(values.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10)
  })

  it('matches a cumulative table value', () => {
    expect(binomialCDF(20, 0.3, 8)).toBeCloseTo(0.8867, 3)
    expect(binomialCDF(20, 0.3, 3)).toBeCloseTo(0.1071, 3)
  })

  it('handles degenerate probabilities', () => {
    expect(binomialPMF(12, 0, 0)).toBe(1)
    expect(binomialPMF(12, 0, 3)).toBe(0)
    expect(binomialPMF(12, 1, 12)).toBe(1)
    expect(binomialPMF(12, 1, 11)).toBe(0)
  })

  it('returns zero cumulative probability below the support', () => {
    expect(binomialCDF(20, 0.3, -1)).toBe(0)
    expect(poissonCDF(4, -1)).toBe(0)
  })

  it('remains finite for large n and tiny p', () => {
    const value = binomialPMF(1000, 0.005, 4)
    expect(Number.isFinite(value)).toBe(true)
    expect(value).toBeGreaterThan(0)
  })
})

describe('Poisson distribution', () => {
  it('matches a known PMF value', () => {
    expect(poissonPMF(3, 2)).toBeCloseTo(0.2240418077, 9)
  })

  it('sums to one over a generous support', () => {
    const values = poissonValues(12)
    expect(values.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 9)
  })

  it('matches a cumulative value', () => {
    expect(poissonCDF(7.5, 5)).toBeCloseTo(0.2414, 4)
  })

  it('has mean and variance both equal to lambda', () => {
    const lambda = 4.2
    const values = poissonValues(lambda)
    const mean = values.reduce((sum, value, k) => sum + k * value, 0)
    const variance = values.reduce((sum, value, k) => sum + (k - mean) ** 2 * value, 0)
    expect(mean).toBeCloseTo(lambda, 9)
    expect(variance).toBeCloseTo(lambda, 8)
  })

  it('handles lambda = 0', () => {
    expect(poissonPMF(0, 0)).toBe(1)
    expect(poissonPMF(0, 1)).toBe(0)
  })
})


describe('Poisson approximation', () => {
  it('is close when n is large and p is small', () => {
    const metrics = approximationMetrics(1000, 0.005)
    expect(metrics.maxDifference).toBeLessThan(0.01)
    expect(metrics.totalVariation).toBeLessThan(0.01)
    expect(metrics.binomial.every(Number.isFinite)).toBe(true)
    expect(metrics.poisson.every(Number.isFinite)).toBe(true)
  })

  it('gets worse when n is small and p is large', () => {
    const good = approximationMetrics(500, 0.01)
    const bad = approximationMetrics(10, 0.5)
    expect(bad.maxDifference).toBeGreaterThan(good.maxDifference)
  })
})

describe('additive property', () => {
  it('convolves two Poisson PMFs into a Poisson PMF', () => {
    const a = poissonValues(2)
    const b = poissonValues(3)
    const combined = convolution(a, b)
    const expected = poissonValues(5)
    for (let k = 0; k < 12; k += 1) {
      expect(combined[k]).toBeCloseTo(expected[k], 10)
    }
  })
})

describe('probability phrases', () => {
  const pmf = (k: number) => poissonPMF(4, k)
  const cdf = (k: number) => poissonCDF(4, k)

  it('translates at least correctly', () => {
    const result = resolvePhrase('atLeast', 4, 0, 25, pmf, cdf)
    expect(result.probability).toBeCloseTo(1 - poissonCDF(4, 3), 12)
    expect(result.shade).toEqual([4, 25])
  })

  it('translates more than correctly', () => {
    const result = resolvePhrase('moreThan', 4, 0, 25, pmf, cdf)
    expect(result.probability).toBeCloseTo(1 - poissonCDF(4, 4), 12)
  })

  it('translates a between phrase correctly', () => {
    const result = resolvePhrase('between', 3, 7, 25, pmf, cdf)
    expect(result.probability).toBeCloseTo(poissonCDF(4, 7) - poissonCDF(4, 2), 12)
    expect(result.shade).toEqual([3, 7])
  })

  it('handles the lower edge of cumulative phrases', () => {
    expect(resolvePhrase('atLeast', 0, 0, 25, pmf, cdf).probability).toBe(1)
    expect(resolvePhrase('between', 0, 5, 25, pmf, cdf).probability).toBeCloseTo(
      poissonCDF(4, 5),
      12,
    )
  })
})
