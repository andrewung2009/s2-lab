import { useEffect, useMemo, useRef, useState } from 'react'
import {
  binomialCDF,
  binomialMean,
  binomialMode,
  binomialPMF,
  binomialValues,
  binomialVariance,
} from '../lib/distributions'
import { formatNumber, formatProbability } from '../lib/format'
import { useInView, usePrefersReducedMotion } from '../lib/hooks'
import { PHRASE_OPTIONS, resolvePhrase, type Phrase } from '../lib/phrases'
import { Formula } from './Formula'
import { ProbabilityChart } from './ProbabilityChart'
import { ProbabilityReadout } from './ProbabilityReadout'
import { SectionHeader } from './SectionHeader'
import { SegmentedControl } from './SegmentedControl'
import { Slider } from './Slider'
import { SolutionSteps, type SolutionStep } from './SolutionSteps'
import { StatChip } from './StatChip'

const PRESETS = [
  { label: 'Fair coin', n: 10, p: 0.5 },
  { label: 'Seed batch', n: 12, p: 0.85 },
  { label: 'Rare defects', n: 50, p: 0.02 },
  { label: 'Large n', n: 100, p: 0.5 },
]

export function BinomialLab() {
  const [n, setN] = useState(20)
  const [p, setP] = useState(0.4)
  const [x, setX] = useState(8)
  const [x2, setX2] = useState(12)
  const [phrase, setPhrase] = useState<Phrase>('atLeast')
  const [showCumulative, setShowCumulative] = useState(true)
  const [animating, setAnimating] = useState(false)
  const autoPlayedRef = useRef(false)
  const timerRef = useRef<number | undefined>(undefined)
  const reduced = usePrefersReducedMotion()
  const { ref: sectionRef, inView } = useInView<HTMLElement>('-18%')

  const values = useMemo(() => binomialValues(n, p), [n, p])
  const q = 1 - p
  const mean = binomialMean(n, p)
  const variance = binomialVariance(n, p)
  const mode = binomialMode(n, p)
  const pmf = (value: number) => binomialPMF(n, p, value)
  const cdf = (value: number) => binomialCDF(n, p, value)
  const resolved = resolvePhrase(phrase, x, x2, n, pmf, cdf)
  const selectedX = Math.min(x, n)

  const stopAnimation = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = undefined
    setAnimating(false)
  }

  const startAnimation = () => {
    if (reduced) {
      setPhrase('exactly')
      setX(Math.round(n * p))
      return
    }
    if (animating) {
      stopAnimation()
      return
    }

    setPhrase('exactly')
    setAnimating(true)
    const stride = Math.max(1, Math.ceil((n + 1) / 14))
    const sequence: number[] = []
    for (let r = 0; r <= n; r += stride) sequence.push(r)
    if (sequence[sequence.length - 1] !== n) sequence.push(n)

    let index = 0
    const tick = () => {
      setX(sequence[index])
      index += 1
      if (index < sequence.length) {
        timerRef.current = window.setTimeout(tick, 540)
      } else {
        timerRef.current = undefined
        setAnimating(false)
      }
    }
    tick()
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!inView || autoPlayedRef.current || reduced) return
    autoPlayedRef.current = true
    const timer = window.setTimeout(() => startAnimation(), 900)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced])

  const changeN = (value: number) => {
    stopAnimation()
    setN(value)
    setX((current) => Math.min(current, value))
    setX2((current) => Math.min(current, value))
  }

  const changeP = (value: number) => {
    stopAnimation()
    setP(value)
  }

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    stopAnimation()
    setN(preset.n)
    setP(preset.p)
    setX(Math.round(preset.n * preset.p))
    setX2(Math.min(preset.n, Math.round(preset.n * preset.p) + 3))
  }

  const low = Math.min(selectedX, Math.min(x2, n))
  const high = Math.max(selectedX, Math.min(x2, n))
  let expression = ''
  if (phrase === 'exactly') {
    expression = String.raw`P(X=${selectedX})=\binom{${n}}{${selectedX}}(${p.toFixed(2)})^{${selectedX}}(${q.toFixed(2)})^{${n - selectedX}}`
  } else if (phrase === 'atMost') {
    expression = String.raw`P(X\le ${selectedX})=\sum_{r=0}^{${selectedX}}\binom{${n}}{r}p^rq^{\,${n}-r}=F(${selectedX})`
  } else if (phrase === 'atLeast') {
    expression =
      selectedX === 0
        ? String.raw`P(X\ge 0)=1`
        : String.raw`P(X\ge ${selectedX})=1-P(X\le ${selectedX - 1})=1-F(${selectedX - 1})`
  } else if (phrase === 'moreThan') {
    expression =
      selectedX === n
        ? String.raw`P(X>${n})=0`
        : String.raw`P(X>${selectedX})=1-F(${selectedX})`
  } else {
    expression =
      low === 0
        ? String.raw`P(0\le X\le ${high})=F(${high})`
        : String.raw`P(${low}\le X\le ${high})=F(${high})-F(${low - 1})`
  }

  const steps: SolutionStep[] = [
    {
      label: 'Write the required probability',
      latex: expression,
      note: 'F is the cumulative distribution function from the notes.',
    },
    {
      label: 'Evaluate',
      latex: `${resolved.latex}=\\mathbf{${formatProbability(resolved.probability)}}`,
    },
    {
      label: 'Mean and variance',
      latex: String.raw`E(X)=np=${formatNumber(mean, 2)},\quad \mathrm{Var}(X)=npq=${formatNumber(variance, 2)}`,
    },
  ]

  return (
    <section className="lab-section accent-cyan" id="binomial" ref={sectionRef}>
      <SectionHeader
        index="01"
        eyebrow="Notes 1.1 · Binomial distribution"
        title="The Binomial Lab"
        description="X is the number of successes in n independent trials. Change the parameters, watch the distribution build itself, and solve any probability directly from the notes."
        chips={['fixed n', 'independent trials', 'two outcomes', 'constant p']}
        accent="cyan"
      />

      <div className="lab-grid">
        <aside className="control-panel panel">
          <div className="panel-heading">
            <span>Parameters</span>
            <span className="panel-live"><i /> live</span>
          </div>

          <Slider
            id="binomial-n"
            label="Number of trials, n"
            value={n}
            min={1}
            max={100}
            step={1}
            onChange={changeN}
            formatValue={(value) => `${value}`}
            hint="The distribution has n + 1 possible outcomes, from 0 to n."
            accent="cyan"
          />
          <Slider
            id="binomial-p"
            label="Probability of success, p"
            value={p}
            min={0.01}
            max={0.99}
            step={0.01}
            onChange={changeP}
            formatValue={(value) => value.toFixed(2)}
            accent="cyan"
          />
          <Slider
            id="binomial-x"
            label="Selected outcome, x"
            value={selectedX}
            min={0}
            max={n}
            step={1}
            onChange={setX}
            formatValue={(value) => `${value}`}
            accent="cyan"
          />

          <div className="preset-row" aria-label="Binomial presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="control-block">
            <div className="control-label-row">
              <span>Probability phrase</span>
              <button
                type="button"
                className={`toggle ${showCumulative ? 'is-on' : ''}`}
                aria-pressed={showCumulative}
                onClick={() => setShowCumulative((current) => !current)}
              >
                shade area
              </button>
            </div>
            <SegmentedControl
              options={PHRASE_OPTIONS}
              value={phrase}
              onChange={setPhrase}
              label="Choose a probability phrase"
              accent="cyan"
              compact
            />
            {phrase === 'between' ? (
              <Slider
                id="binomial-x2"
                label="Second outcome"
                value={Math.min(x2, n)}
                min={0}
                max={n}
                step={1}
                onChange={setX2}
                formatValue={(value) => `${value}`}
                accent="cyan"
              />
            ) : null}
          </div>

          <ProbabilityReadout
            label={resolved.plain}
            probability={resolved.probability}
            latex={resolved.latex}
            detail={resolved.detail}
            accent="cyan"
            footnote="shaded region"
          />

          <div className="stat-grid">
            <StatChip label="Mean" value={formatNumber(mean, 2)} accent="cyan" />
            <StatChip label="Variance" value={formatNumber(variance, 2)} accent="cyan" />
            <StatChip label="Std dev" value={formatNumber(Math.sqrt(variance), 2)} accent="cyan" />
            <StatChip label="Mode" value={`${mode}`} accent="neutral" />
          </div>
        </aside>

        <div className="chart-panel panel">
          <div className="panel-heading">
            <span>Probability mass function</span>
            <span className="mono-tag">Bin({n}, {p.toFixed(2)})</span>
          </div>
          <ProbabilityChart
            values={values}
            accent="cyan"
            selected={selectedX}
            onSelect={setX}
            shade={showCumulative ? resolved.shade : null}
            mean={mean}
            ariaLabel={`Binomial distribution with ${n} trials and success probability ${p.toFixed(2)}. Selected outcome ${selectedX}. Probability of ${resolved.probability.toFixed(4)}.`}
            interactive
          />
          <div className="chart-actions">
            <button
              type="button"
              className={`button button-small ${animating ? 'button-ghost' : 'button-primary'}`}
              onClick={startAnimation}
              aria-pressed={animating}
            >
              {animating ? 'Stop animation' : 'Play the PMF'}
            </button>
            <span className="chart-actions-note">
              {animating ? 'Building the distribution…' : `r = ${selectedX} of ${n}`}
            </span>
          </div>
          <div className="chart-note">
            <span>Hover a bar for exact values. Use the arrow keys to move the selection.</span>
            <span><Formula>{String.raw`q=1-p=${q.toFixed(2)}`}</Formula></span>
          </div>
        </div>
      </div>

      <div className="lab-lower">
        <div className="notes-panel panel">
          <div className="panel-heading">
            <span>Notes · 1.1</span>
            <span className="panel-live"><i /> Binomial</span>
          </div>
          <p className="notes-lead">X is the number of successes out of n independent trials.</p>
          <div className="notes-conditions">
            <span><b>1</b> Fixed number n of trials.</span>
            <span><b>2</b> Trials are independent.</span>
            <span><b>3</b> Each trial has two outcomes, success or failure.</span>
            <span><b>4</b> The probability of success p is constant.</span>
          </div>
          <div className="notes-formulas">
            <div>
              <span>PMF</span>
              <Formula block>{String.raw`P(X=r)=\binom{n}{r}p^rq^{\,n-r},\quad r=0,1,\dots,n`}</Formula>
              <p><Formula>{String.raw`q=1-p`}</Formula></p>
            </div>
            <div className="notes-formula-split">
              <div>
                <span>Mean</span>
                <Formula block>{String.raw`E(X)=np`}</Formula>
              </div>
              <div>
                <span>Variance</span>
                <Formula block>{String.raw`\mathrm{Var}(X)=npq`}</Formula>
              </div>
            </div>
          </div>
          <p className="notes-foot">These are the PMF, mean and variance stated in the notes.</p>
        </div>

        <SolutionSteps
          model={String.raw`X\sim\mathrm{Bin}(${n},${p.toFixed(2)}),\quad q=1-p=${q.toFixed(2)}`}
          steps={steps}
          accent="cyan"
          revision={`${n}-${p}-${selectedX}-${x2}-${phrase}-${showCumulative}`}
          footer="Change n, p, x or the phrase, and the worked solution updates live."
        />
      </div>
    </section>
  )
}


