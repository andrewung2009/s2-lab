import { useMemo, useState } from 'react'
import {
  binomialCDF,
  binomialMean,
  binomialMode,
  binomialPMF,
  binomialValues,
  binomialVariance,
} from '../lib/distributions'
import { formatNumber, formatProbability } from '../lib/format'
import { PHRASE_OPTIONS, resolvePhrase, type Phrase } from '../lib/phrases'
import { Formula } from './Formula'
import { GaltonBoard } from './GaltonBoard'
import { ProbabilityChart } from './ProbabilityChart'
import { ProbabilityReadout } from './ProbabilityReadout'
import { SectionHeader } from './SectionHeader'
import { SegmentedControl } from './SegmentedControl'
import { Slider } from './Slider'
import { StatChip } from './StatChip'

const PRESETS = [
  { label: 'Fair coin', n: 10, p: 0.5 },
  { label: 'Seed batch', n: 12, p: 0.85 },
  { label: 'Rare defects', n: 50, p: 0.02 },
  { label: 'Large n', n: 100, p: 0.5 },
]

function insightFor(n: number, p: number): string {
  if (Math.abs(p - 0.5) < 0.03) {
    return 'Symmetric. Success and failure are equally likely, so the distribution folds neatly around its centre.'
  }
  if (p < 0.5) {
    return `Right-skewed. Failures are common, but there is a long tail of unusually high success counts. As n grows, the bulk tightens around np = ${(n * p).toFixed(1)}.`
  }
  return `Left-skewed. Successes dominate, so the long tail sits on the low side. As n grows, the bulk tightens around np = ${(n * p).toFixed(1)}.`
}

export function BinomialLab() {
  const [n, setN] = useState(20)
  const [p, setP] = useState(0.4)
  const [x, setX] = useState(8)
  const [x2, setX2] = useState(12)
  const [phrase, setPhrase] = useState<Phrase>('atLeast')
  const [showCumulative, setShowCumulative] = useState(true)

  const values = useMemo(() => binomialValues(n, p), [n, p])
  const mean = binomialMean(n, p)
  const variance = binomialVariance(n, p)
  const mode = binomialMode(n, p)
  const pmf = (value: number) => binomialPMF(n, p, value)
  const cdf = (value: number) => binomialCDF(n, p, value)
  const resolved = resolvePhrase(phrase, x, x2, n, pmf, cdf)
  const selectedX = Math.min(x, n)

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setN(preset.n)
    setP(preset.p)
    setX(Math.round(preset.n * preset.p))
    setX2(Math.min(preset.n, Math.round(preset.n * preset.p) + 3))
  }

  const applyGalton = (rows: number, bias: number) => {
    setN(rows)
    setP(bias)
    setX(Math.round(rows * bias))
    setX2(Math.min(rows, Math.round(rows * bias) + 2))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('binomial')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const formulaLatex = String.raw`P(X = ${selectedX}) = \binom{${n}}{${selectedX}} (${p.toFixed(2)})^{${selectedX}} (${(1 - p).toFixed(2)})^{${n - selectedX}}`

  return (
    <section className="lab-section accent-cyan" id="binomial">
      <SectionHeader
        index="01"
        eyebrow="Discrete distribution lab"
        title="The Binomial Lab"
        description="Fixed trials. Two outcomes. A constant probability. Independent trials. Change n and p, then watch a single number become a whole distribution."
        chips={['fixed n', 'two outcomes', 'constant p', 'independent trials']}
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
            onChange={setN}
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
            onChange={setP}
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
            <span className="mono-tag">B({n}, {p.toFixed(2)})</span>
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
          <div className="chart-footer">
            <span className="insight-mark">↳</span>
            <p>{insightFor(n, p)}</p>
          </div>
          <div className="formula-strip">
            <span className="formula-strip-label">Substituted PMF</span>
            <Formula>{formulaLatex}</Formula>
            <span className="formula-result">= {formatProbability(pmf(selectedX))}</span>
          </div>
          <div className="chart-note">
            <span>Hover a bar for exact values. Use the arrow keys to move the selection.</span>
            <span><Formula>{String.raw`F(x)=P(X\le x)`}</Formula></span>
          </div>
        </div>
      </div>

      <div className="lab-lower">
        <GaltonBoard onApply={applyGalton} />
        <div className="formula-panel panel">
          <div className="panel-heading">
            <span>Model anatomy</span>
            <span className="panel-live"><i /> S2.1</span>
          </div>
          <div className="formula-hero">
            <span>PMF</span>
            <Formula block>{String.raw`P(X=x)=\binom{n}{x}p^x(1-p)^{n-x}`}</Formula>
          </div>
          <div className="formula-row">
            <div>
              <span>Mean</span>
              <Formula block>{String.raw`E(X)=np`}</Formula>
            </div>
            <div>
              <span>Variance</span>
              <Formula block>{String.raw`\mathrm{Var}(X)=np(1-p)`}</Formula>
            </div>
          </div>
          <div className="model-note">
            <span className="model-note-tag">Why it works</span>
            <p>
              The binomial counts the number of ways to arrange x successes among n trials.
              That count is <Formula>{String.raw`\binom{n}{x}`}</Formula>, and each arrangement has
              probability <Formula>{String.raw`p^x(1-p)^{n-x}`}</Formula>.
            </p>
          </div>
          <div className="variance-note">
            <span>Signature</span>
            <p>
              Binomial variance is always below its mean: <Formula>{String.raw`np(1-p) < np`}</Formula> when <Formula>{String.raw`0<p<1`}</Formula>.
            </p>
          </div>
          <div className="model-check">
            <span className="model-note-tag">Check the model</span>
            <ul>
              <li><b>Fixed n</b><span>the number of trials is known in advance</span></li>
              <li><b>Two outcomes</b><span>each trial is success or failure</span></li>
              <li><b>Constant p</b><span>the success probability never changes</span></li>
              <li><b>Independent</b><span>one trial does not affect another</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}



