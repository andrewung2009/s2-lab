import { useMemo, useState } from 'react'
import {
  poissonCDF,
  poissonMode,
  poissonPMF,
  poissonValues,
} from '../lib/distributions'
import { formatNumber, formatProbability } from '../lib/format'
import { PHRASE_OPTIONS, resolvePhrase, type Phrase } from '../lib/phrases'
import { Formula } from './Formula'
import { PoissonArrivals } from './PoissonArrivals'
import { ProbabilityChart } from './ProbabilityChart'
import { ProbabilityReadout } from './ProbabilityReadout'
import { SectionHeader } from './SectionHeader'
import { SegmentedControl } from './SegmentedControl'
import { Slider } from './Slider'
import { SolutionSteps, type SolutionStep } from './SolutionSteps'
import { StatChip } from './StatChip'

export function PoissonLab() {
  const [rate, setRate] = useState(4.2)
  const [interval, setInterval] = useState(1)
  const [x, setX] = useState(4)
  const [x2, setX2] = useState(7)
  const [phrase, setPhrase] = useState<Phrase>('exactly')
  const [showCumulative, setShowCumulative] = useState(true)

  const lambda = rate * interval
  const values = useMemo(() => poissonValues(lambda), [lambda])
  const maxIndex = values.length - 1
  const pmf = (value: number) => poissonPMF(lambda, value)
  const cdf = (value: number) => poissonCDF(lambda, value)
  const resolved = resolvePhrase(phrase, x, x2, maxIndex, pmf, cdf)
  const selectedX = Math.min(x, maxIndex)
  const mode = poissonMode(lambda)
  const low = Math.min(selectedX, Math.min(x2, maxIndex))
  const high = Math.max(selectedX, Math.min(x2, maxIndex))

  let expression = ''
  if (phrase === 'exactly') {
    expression = String.raw`P(X=${selectedX})=\frac{e^{-${lambda.toFixed(2)}}(${lambda.toFixed(2)})^{${selectedX}}}{${selectedX}!}`
  } else if (phrase === 'atMost') {
    expression = String.raw`P(X\le ${selectedX})=\sum_{r=0}^{${selectedX}}\frac{e^{-${lambda.toFixed(2)}}(${lambda.toFixed(2)})^r}{r!}=F(${selectedX})`
  } else if (phrase === 'atLeast') {
    expression =
      selectedX === 0
        ? String.raw`P(X\ge 0)=1`
        : String.raw`P(X\ge ${selectedX})=1-P(X\le ${selectedX - 1})=1-F(${selectedX - 1})`
  } else if (phrase === 'moreThan') {
    expression =
      selectedX === maxIndex
        ? String.raw`P(X>${maxIndex})=0`
        : String.raw`P(X>${selectedX})=1-F(${selectedX})`
  } else {
    expression =
      low === 0
        ? String.raw`P(0\le X\le ${high})=F(${high})`
        : String.raw`P(${low}\le X\le ${high})=F(${high})-F(${low - 1})`
  }

  const steps: SolutionStep[] = [
    {
      label: 'Set the mean for this interval',
      latex: String.raw`\lambda=\mu t=${rate.toFixed(1)}\times${interval.toFixed(1)}=${lambda.toFixed(2)}`,
    },
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
      latex: String.raw`E(X)=\lambda=${lambda.toFixed(2)},\quad \mathrm{Var}(X)=\lambda=${lambda.toFixed(2)}`,
    },
  ]

  return (
    <section className="lab-section accent-magenta" id="poisson">
      <SectionHeader
        index="02"
        eyebrow="Notes 1.2 · Poisson distribution"
        title="The Poisson Lab"
        description="X is the number of events in a given interval of time or space. Watch events arrive, build the count distribution, and solve the probability from the notes."
        chips={['random / constant rate', 'singly', 'independently', 'no upper limit']}
        accent="magenta"
      />

      <div className="lab-grid">
        <aside className="control-panel panel">
          <div className="panel-heading">
            <span>Parameters</span>
            <span className="panel-live"><i /> live</span>
          </div>

          <Slider
            id="poisson-rate"
            label="Average rate, μ"
            value={rate}
            min={0.2}
            max={8}
            step={0.1}
            onChange={setRate}
            formatValue={(value) => formatNumber(value, 1)}
            hint="Events per unit interval."
            accent="magenta"
          />
          <Slider
            id="poisson-interval"
            label="Interval length, t"
            value={interval}
            min={0.5}
            max={3}
            step={0.5}
            onChange={setInterval}
            formatValue={(value) => formatNumber(value, 1)}
            hint="Scale the interval and λ scales with it."
            accent="magenta"
          />

          <div className="lambda-callout">
            <span>Mean for this interval</span>
            <Formula>{String.raw`\lambda=\mu\times t=${rate.toFixed(1)}\times${interval.toFixed(1)}=${lambda.toFixed(2)}`}</Formula>
          </div>

          <Slider
            id="poisson-x"
            label="Selected outcome, x"
            value={selectedX}
            min={0}
            max={maxIndex}
            step={1}
            onChange={setX}
            formatValue={(value) => `${value}`}
            accent="magenta"
          />

          <div className="preset-row" aria-label="Poisson presets">
            {[
              { label: 'Rare', rate: 0.8, interval: 1 },
              { label: 'Classic', rate: 4, interval: 1 },
              { label: 'Busy', rate: 6, interval: 2 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset"
                onClick={() => {
                  setRate(preset.rate)
                  setInterval(preset.interval)
                  setX(Math.round(preset.rate * preset.interval))
                  setX2(Math.min(maxIndex, Math.round(preset.rate * preset.interval) + 3))
                }}
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
              accent="magenta"
              compact
            />
            {phrase === 'between' ? (
              <Slider
                id="poisson-x2"
                label="Second outcome"
                value={Math.min(x2, maxIndex)}
                min={0}
                max={maxIndex}
                step={1}
                onChange={setX2}
                formatValue={(value) => `${value}`}
                accent="magenta"
              />
            ) : null}
          </div>

          <ProbabilityReadout
            label={resolved.plain}
            probability={resolved.probability}
            latex={resolved.latex}
            detail={resolved.detail}
            accent="magenta"
            footnote="shaded region"
          />

          <div className="stat-grid">
            <StatChip label="Mean" value={formatNumber(lambda, 2)} accent="magenta" />
            <StatChip label="Variance" value={formatNumber(lambda, 2)} accent="magenta" />
            <StatChip label="Std dev" value={formatNumber(Math.sqrt(lambda), 2)} accent="magenta" />
            <StatChip label="Mode" value={`${mode}`} accent="neutral" />
          </div>
        </aside>

        <div className="chart-panel panel">
          <div className="panel-heading">
            <span>Probability mass function</span>
            <span className="mono-tag">Po({lambda.toFixed(2)})</span>
          </div>
          <ProbabilityChart
            values={values}
            accent="magenta"
            selected={selectedX}
            onSelect={setX}
            shade={showCumulative ? resolved.shade : null}
            mean={lambda}
            barLabel="Poisson"
            ariaLabel={`Poisson distribution with mean ${lambda.toFixed(2)}. Selected outcome ${selectedX}. Probability of ${resolved.probability.toFixed(4)}.`}
            interactive
          />
          <div className="chart-note">
            <span>Hover a bar for exact values. Use the arrow keys to move the selection.</span>
            <span><Formula>{String.raw`E(X)=\mathrm{Var}(X)=\lambda`}</Formula></span>
          </div>
        </div>
      </div>

      <PoissonArrivals rate={rate} interval={interval} lambda={lambda} />

      <div className="lab-lower">
        <div className="notes-panel panel">
          <div className="panel-heading">
            <span>Notes · 1.2</span>
            <span className="panel-live"><i /> Poisson</span>
          </div>
          <p className="notes-lead">X is the number of events in a given interval of time or space.</p>
          <div className="notes-conditions">
            <span><b>1</b> Events occur randomly or at a constant average rate.</span>
            <span><b>2</b> Events occur singly.</span>
            <span><b>3</b> Events occur independently.</span>
          </div>
          <div className="notes-formulas">
            <div>
              <span>PMF</span>
              <Formula block>{String.raw`P(X=r)=\frac{e^{-\lambda}\lambda^r}{r!},\quad r=0,1,2,\dots`}</Formula>
            </div>
            <div className="notes-formula-split">
              <div>
                <span>Mean</span>
                <Formula block>{String.raw`E(X)=\lambda`}</Formula>
              </div>
              <div>
                <span>Variance</span>
                <Formula block>{String.raw`\mathrm{Var}(X)=\lambda`}</Formula>
              </div>
            </div>
          </div>
          <p className="notes-foot">
            For a different interval at rate μ, use <Formula>{String.raw`\lambda=\mu t`}</Formula>.
          </p>
        </div>

        <SolutionSteps
          model={String.raw`X\sim\mathrm{Po}(${lambda.toFixed(2)})`}
          steps={steps}
          accent="magenta"
          revision={`${rate}-${interval}-${selectedX}-${x2}-${phrase}-${showCumulative}`}
          footer="The count per interval is animated above. Change λ, x or the phrase to update the solution."
        />
      </div>
    </section>
  )
}
