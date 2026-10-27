export type Phrase = 'exactly' | 'atMost' | 'atLeast' | 'moreThan' | 'between'

export const PHRASE_OPTIONS: { value: Phrase; label: string }[] = [
  { value: 'exactly', label: 'Exactly' },
  { value: 'atMost', label: 'At most' },
  { value: 'atLeast', label: 'At least' },
  { value: 'moreThan', label: 'More than' },
  { value: 'between', label: 'Between' },
]

export interface PhraseResult {
  probability: number
  latex: string
  detail: string
  shade: [number, number] | null
  plain: string
}

export function resolvePhrase(
  phrase: Phrase,
  x: number,
  x2: number,
  max: number,
  pmf: (value: number) => number,
  cdf: (value: number) => number,
): PhraseResult {
  const safeX = Math.max(0, Math.min(max, Math.round(x)))
  const safeX2 = Math.max(0, Math.min(max, Math.round(x2)))

  if (phrase === 'exactly') {
    return {
      probability: pmf(safeX),
      latex: `P(X = ${safeX})`,
      detail: safeX === 0 ? `F(${safeX})` : `F(${safeX}) − F(${safeX - 1})`,
      shade: [safeX, safeX],
      plain: `exactly ${safeX}`,
    }
  }

  if (phrase === 'atMost') {
    return {
      probability: cdf(safeX),
      latex: `P(X \\le ${safeX})`,
      detail: `F(${safeX})`,
      shade: [0, safeX],
      plain: `at most ${safeX}`,
    }
  }

  if (phrase === 'atLeast') {
    return {
      probability: 1 - cdf(safeX - 1),
      latex: `P(X \\ge ${safeX})`,
      detail: safeX === 0 ? '1' : `1 − F(${safeX - 1})`,
      shade: [safeX, max],
      plain: `at least ${safeX}`,
    }
  }

  if (phrase === 'moreThan') {
    const probability = 1 - cdf(safeX)
    return {
      probability,
      latex: `P(X > ${safeX})`,
      detail: `1 − F(${safeX})`,
      shade: probability > 0 ? [safeX + 1, max] : null,
      plain: `more than ${safeX}`,
    }
  }

  const low = Math.min(safeX, safeX2)
  const high = Math.max(safeX, safeX2)
  return {
    probability: cdf(high) - cdf(low - 1),
    latex: `P(${low} \\le X \\le ${high})`,
    detail: low === 0 ? `F(${high})` : `F(${high}) − F(${low - 1})`,
    shade: [low, high],
    plain: `between ${low} and ${high}`,
  }
}
