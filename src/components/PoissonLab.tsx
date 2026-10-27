import { useMemo, useState } from 'react'
import {
  poissonCDF,
  poissonMode,
  poissonPMF,
  poissonValues,
} from '../lib/distributions'
import { formatNumber, formatProbability } from '../lib/format'
import { PHRASE_OPTIONS, resolvePhrase, type Phrase } from '../lib/phrases'
import { AdditiveLab } from './AdditiveLab'
import { Formula } from './Formula'
import { PoissonArrivals } from './PoissonArrivals'
import { ProbabilityChart } from './ProbabilityChart'
import { ProbabilityReadout } from './ProbabilityReadout'
import { SectionHeader } from './SectionHeader'
import { SegmentedControl } from './SegmentedControl'
import { Slider } from './Slider'
import { StatChip } from './StatChip'

function insightFor(lambda: number): string {
  if (lambda < 1) {
    return 'Mass piles up at zero. With a mean below one, the most likely count is no events at all.'
  }
  if (lambda < 5) {
    return 'Right-skewed. Small counts dominate, but the upper tail stretches out. This is the classic rare-event shape.'
  }
  if (lambda < 12) {
    return 'The skew is fading. As λ grows, the distribution becomes rounder and more symmetric.'
  }
  return 'Nearly symmetric. For large λ, the Poisson shape approaches a normal curve with mean and variance λ.'
}

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
  const variance = lambda
  const mode = poissonMode(lambda)

  const formulaLatex = String.raw`P(X = ${selectedX}) = \frac{e^{-${lambda.toFixed(2)}} (${lambda.toFixed(2)})^{${selectedX}}}{${selectedX}!}`

  return (
    <section className="lab-section accent-magenta" id="poisson">
      <SectionHeader
        index="02"
        eyebrow="Random arrivals lab"
        title="The Poisson Lab"
        description="No fixed number of trials. No natural upper limit. Just a constant average rate and events that arrive independently. Change λ and watch the distribution breathe."
        chips={['events occur singly', 'independently', 'at random', 'constant average rate']}
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
            <StatChip label="Variance" value={formatNumber(variance, 2)} accent="magenta" />
            <StatChip label="Std dev" value={formatNumber(Math.sqrt(variance), 2)} accent="magenta" />
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
          <div className="chart-footer">
            <span className="insight-mark">↳</span>
            <p>{insightFor(lambda)}</p>
          </div>
          <div className="formula-strip">
            <span className="formula-strip-label">Substituted PMF</span>
            <Formula>{formulaLatex}</Formula>
            <span className="formula-result">= {formatProbability(pmf(selectedX))}</span>
          </div>
          <div className="chart-note">
            <span>Mean and variance are both λ. That is the Poisson signature.</span>
            <span><Formula>{String.raw`F(x)=P(X\le x)`}</Formula></span>
          </div>
        </div>
      </div>

      <PoissonArrivals rate={rate} interval={interval} lambda={lambda} />

      <div className="poisson-lower">
        <AdditiveLab />
        <div className="formula-panel panel">
          <div className="panel-heading">
            <span>Model anatomy</span>
            <span className="panel-live"><i /> S2.1</span>
          </div>
          <div className="formula-hero">
            <span>PMF</span>
            <Formula block>{String.raw`P(X=x)=\frac{e^{-\lambda}\lambda^x}{x!}`}</Formula>
          </div>
          <div className="formula-row">
            <div>
              <span>Mean</span>
              <Formula block>{String.raw`E(X)=\lambda`}</Formula>
            </div>
            <div>
              <span>Variance</span>
              <Formula block>{String.raw`\mathrm{Var}(X)=\lambda`}</Formula>
            </div>
          </div>
          <div className="model-note">
            <span className="model-note-tag">Scale it</span>
            <p>
              If events occur at rate μ per unit, then over an interval of length t the mean is
              <Formula>{String.raw`\lambda=\mu t`}</Formula>. This rescaling is the single most
              common source of lost marks.
            </p>
          </div>
          <div className="variance-note">
            <span>Signature</span>
            <p>
              For a Poisson model, mean = variance = λ. If the sample variance sits far from the
              mean, question the model.
            </p>
          </div>
          <div className="model-note">
            <span className="model-note-tag">Add them</span>
            <p>
              Independent Poisson variables add:
              <Formula>{String.raw`\mathrm{Po}(a)+\mathrm{Po}(b)=\mathrm{Po}(a+b)`}</Formula>.
            </p>
          </div>
          <div className="model-check">
            <span className="model-note-tag">Check the model</span>
            <ul>
              <li><b>Singly</b><span>events never occur at the same instant</span></li>
              <li><b>Independently</b><span>one event does not affect the next</span></li>
              <li><b>At random</b><span>no predictable pattern in time or space</span></li>
              <li><b>Constant rate</b><span>the average rate stays steady</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}




