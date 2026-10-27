import { describe, expect, it } from 'vitest'
import { normalApproxProbability, normalCDF, normalPDF } from './normal'

describe('normal distribution helpers', () => {
  it('computes the standard normal CDF at key values', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 7)
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 3)
    expect(normalCDF(-1.96)).toBeCloseTo(0.025, 3)
  })

  it('computes the normal density', () => {
    expect(normalPDF(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 10)
    expect(normalPDF(10, 10, 2)).toBeCloseTo(1 / (2 * Math.sqrt(2 * Math.PI)), 10)
  })

  it('applies continuity correction to cumulative probabilities', () => {
    expect(normalApproxProbability('atMost', 10, 0, 10, 2, true)).toBeCloseTo(
      normalCDF(0.25),
      10,
    )
    expect(normalApproxProbability('atMost', 10, 0, 10, 2, false)).toBeCloseTo(0.5, 8)
    expect(normalApproxProbability('atLeast', 10, 0, 10, 2, true)).toBeCloseTo(
      1 - normalCDF(-0.25),
      10,
    )
    expect(normalApproxProbability('moreThan', 10, 0, 10, 2, true)).toBeCloseTo(
      1 - normalCDF(0.25),
      10,
    )
  })

  it('applies continuity correction to an interval', () => {
    expect(normalApproxProbability('between', 8, 12, 10, 2, true)).toBeCloseTo(
      normalCDF(1.25) - normalCDF(-1.25),
      10,
    )
    expect(normalApproxProbability('between', 8, 12, 10, 2, false)).toBeCloseTo(
      normalCDF(1) - normalCDF(-1),
      10,
    )
  })

  it('returns a point density when continuity correction is off', () => {
    expect(normalApproxProbability('exactly', 10, 0, 10, 2, false)).toBeCloseTo(
      normalPDF(10, 10, 2),
      10,
    )
  })
})

