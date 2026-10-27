export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface PoissonTimeline {
  counts: number[]
  events: { time: number; interval: number }[]
  duration: number
}

export function generatePoissonTimeline(
  rate: number,
  intervalLength: number,
  intervals: number,
  rng: Rng = Math.random,
): PoissonTimeline {
  const counts = new Array<number>(intervals).fill(0)
  const events: { time: number; interval: number }[] = []
  const duration = intervalLength * intervals
  if (rate <= 0) return { counts, events, duration }

  let time = 0
  let guard = 0
  while (time < duration && guard < 100000) {
    time += -Math.log(Math.max(rng(), 1e-12)) / rate
    if (time >= duration) break
    const interval = Math.min(intervals - 1, Math.floor(time / intervalLength))
    counts[interval] += 1
    events.push({ time, interval })
    guard += 1
  }

  return { counts, events, duration }
}

export function simulateIntervals(
  rate: number,
  intervalLength: number,
  intervals: number,
  rng: Rng = Math.random,
): number[] {
  return generatePoissonTimeline(rate, intervalLength, intervals, rng).counts
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}
