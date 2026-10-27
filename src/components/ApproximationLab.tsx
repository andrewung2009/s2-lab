import { useEffect, useMemo, useRef, useState } from 'react'
import { approximationMetrics, clamp } from '../lib/distributions'
import { formatNumber, formatProbability } from '../lib/format'
import { usePrefersReducedMotion } from '../lib/hooks'
import { AnimatedNumber } from './AnimatedNumber'
import { Formula } from './Formula'
import { ProbabilityChart } from './ProbabilityChart'
import { SectionHeader } from './SectionHeader'
import { Slider } from './Slider'
import { StatChip } from './StatChip'

const PRESETS = [
  { label: 'Rare', n: 200, p: 0.01 },
  { label: 'Classic', n: 100, p: 0.05 },
  { label: 'Borderline', n: 30, p: 0.2 },
  { label: 'Poor fit', n: 12, p: 0.4 },
]

export function ApproximationLab() {
  const [n, setN] = useState(80)
  const [p, setP] = useState(0.05)
  const [morphing, setMorphing] = useState(false)
  const reduced = usePrefersReducedMotion()
  const frameRef = useRef(0)

  const lambda = n * p
  const metrics = useMemo(() => approximationMetrics(n, p), [n, p])
  const [startIndex] = metrics.range
  const difference = metrics.binomial.map((value, index) =>
    Math.abs(value - (metrics.poisson[index] ?? 0)),
  )
  const nLarge = n >= 50
  const pSmall = p <= 0.1
  const meanSmall = lambda <= 10
  const primaryConditions = nLarge && pSmall
  const comfortable = primaryConditions && meanSmall
  const verdict = comfortable
    ? 'Conditions met'
    : primaryConditions
      ? 'Check np ≤ 10'
      : 'Conditions not met'

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  const morph = () => {
    if (reduced) {
      const targetN = clamp(Math.round(lambda / 0.005 / 10) * 10, 50, 1000)
      setN(targetN)
      setP(lambda / targetN)
      return
    }

    cancelAnimationFrame(frameRef.current)
    setMorphing(true)
    const startN = n
    const startP = p
    const targetN = clamp(Math.round(lambda / 0.005 / 10) * 10, 50, 1000)
    const targetP = lambda / targetN
    const started = performance.now()
    const duration = 1250

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      const eased = 1 - (1 - progress) ** 3
      setN(Math.round(startN + (targetN - startN) * eased))
      setP(startP + (targetP - startP) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setMorphing(false)
      }
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  return (
    <section className="lab-section accent-amber" id="approximation">
      <SectionHeader
        index="03"
        eyebrow="Limit lab"
        title="Binomial → Poisson"
        description="When n is large and p is small, the binomial's rare-event tail becomes almost indistinguishable from a Poisson with the same mean. The notes also give normal approximations for the other regimes."
        chips={['n large', 'p small', 'np ≤ 10', 'no continuity correction']}
        accent="amber"
      />

      <div className="lab-grid">
        <aside className="control-panel panel">
          <div className="panel-heading">
            <span>Parameters</span>
            <span className="panel-live"><i /> live</span>
          </div>

          <Slider
            id="approx-n"
            label="Number of trials, n"
            value={n}
            min={10}
            max={1000}
            step={10}
            onChange={setN}
            formatValue={(value) => `${value}`}
            accent="amber"
          />
          <Slider
            id="approx-p"
            label="Probability of success, p"
            value={p}
            min={0.005}
            max={0.5}
            step={0.005}
            onChange={setP}
            formatValue={(value) => value.toFixed(3)}
            accent="amber"
          />

          <div className="lambda-callout is-amber">
            <span>Poisson mean</span>
            <Formula>{String.raw`\lambda=np=${n}\times${p.toFixed(3)}=${lambda.toFixed(2)}`}</Formula>
          </div>

          <div className="preset-row" aria-label="Approximation presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset"
                onClick={() => {
                  setN(preset.n)
                  setP(preset.p)
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={`validity ${comfortable ? 'is-good' : primaryConditions ? 'is-mid' : 'is-bad'}`}>
            <div className="validity-head">
              <span>Approximation check</span>
              <strong>{verdict}</strong>
            </div>
            <div className="validity-chips">
              <span className={nLarge ? 'is-ok' : 'is-warn'}>
                <i /> n large
              </span>
              <span className={pSmall ? 'is-ok' : 'is-warn'}>
                <i /> p ≤ 0.1
              </span>
              <span className={meanSmall ? 'is-ok' : 'is-warn'}>
                <i /> np ≤ 10
              </span>
            </div>
            <p>
              Notes rule: n is large and p is small. For calculation use np ≤ 10 and p ≤ 0.1.
              Do not apply a continuity correction.
            </p>
          </div>

          <button
            type="button"
            className="button button-primary morph-button"
            onClick={morph}
            disabled={morphing}
          >
            {morphing ? 'Morphing…' : 'Morph to Poisson'}
            <span aria-hidden="true">↗</span>
          </button>

          <div className="error-panel">
            <div className="error-head">
              <span>Maximum gap</span>
              <strong>
                <AnimatedNumber
                  value={metrics.maxDifference}
                  format={(value) => `${(value * 100).toFixed(2)} pp`}
                />
              </strong>
            </div>
            <div className="error-head">
              <span>Total variation</span>
              <strong>
                <AnimatedNumber
                  value={metrics.totalVariation}
                  format={(value) => formatProbability(value)}
                />
              </strong>
            </div>
            <div className="error-head">
              <span>Similarity</span>
              <strong>
                <AnimatedNumber
                  value={(1 - metrics.totalVariation) * 100}
                  format={(value) => `${value.toFixed(2)}%`}
                />
              </strong>
            </div>
          </div>

          <div className="stat-grid">
            <StatChip label="Binomial mean" value={formatNumber(n * p, 2)} accent="cyan" />
            <StatChip label="Poisson mean" value={formatNumber(lambda, 2)} accent="magenta" />
            <StatChip label="Binomial var" value={formatNumber(n * p * (1 - p), 2)} accent="cyan" />
            <StatChip label="Poisson var" value={formatNumber(lambda, 2)} accent="magenta" />
          </div>
        </aside>

        <div className="chart-panel panel">
          <div className="panel-heading">
            <span>Overlay</span>
            <span className="mono-tag">Bin({n}, {p.toFixed(3)}) ≈ Po({lambda.toFixed(2)})</span>
          </div>


          <ProbabilityChart
            values={metrics.binomial}
            startIndex={startIndex}
            overlay={metrics.poisson}
            accent="cyan"
            barLabel="Bin(n, p)"
            overlayLabel={`Po(${lambda.toFixed(2)})`}
            height={340}
            ariaLabel={`Binomial distribution with n ${n} and p ${p.toFixed(3)} overlaid with a Poisson distribution with mean ${lambda.toFixed(2)}. Maximum gap ${(metrics.maxDifference * 100).toFixed(2)} percentage points.`}
          />

          <div className="difference-block">
            <div className="mini-panel-head">
              <div>
                <span className="panel-kicker">Residual</span>
                <h4>|Binomial − Poisson|</h4>
              </div>
              <span className="mono-tag">max {formatProbability(metrics.maxDifference)}</span>
            </div>
            <ProbabilityChart
              values={difference}
              startIndex={startIndex}
              accent="amber"
              difference
              height={200}
              compact
              barLabel="difference"
              ariaLabel={`Absolute difference between the binomial and Poisson probabilities over the displayed range. Maximum difference ${metrics.maxDifference.toFixed(4)}.`}
            />
          </div>

          <div className="formula-strip is-amber">
            <span className="formula-strip-label">The move</span>
            <Formula>{String.raw`\mathrm{Bin}(n,p)\;\approx\;\mathrm{Po}(np)`}</Formula>
            <span className="formula-result">λ = {lambda.toFixed(2)}</span>
          </div>
          <div className="chart-note">
            <span>The closer λ is to the bulk of the binomial, the tighter the fit.</span>
            <span><Formula>{String.raw`p=\frac{\lambda}{n}\to 0`}</Formula></span>
          </div>
        </div>
      </div>

      <div className="approx-bottom panel">
        <div>
          <span className="panel-kicker">Why the approximation works</span>
          <h3>A rare event, repeated many times</h3>
          <p>
            Split the n trials into tiny windows. The chance of a success in any one window is
            small, but there are many windows. The count of successes inherits the Poisson
            signature: mean = variance = λ.
          </p>
        </div>
        <div className="approx-bottom-formulas">
          <div>
            <span>Binomial</span>
            <Formula block>{String.raw`\mathrm{E}(X)=np,\quad \mathrm{Var}(X)=npq`}</Formula>
            <p className="formula-definition"><Formula>{String.raw`q=1-p`}</Formula></p>
          </div>
          <div>
            <span>Poisson limit</span>
            <Formula block>{String.raw`\mathrm{E}(X)=\lambda,\quad \mathrm{Var}(X)=\lambda`}</Formula>
          </div>
        </div>
      </div>

      <div className="approx-ladder panel">
        <div className="approx-ladder-head">
          <div>
            <span className="panel-kicker">Notes coverage · 1.3</span>
            <h3>The approximation ladder</h3>
            <p>
              The notes give three routes. The Poisson limit is the lab above; the normal
              routes take over once the mean is large.
            </p>
          </div>
          <span className="mono-tag">LS2 · Chapter 1</span>
        </div>

        <div className="ladder-grid">
          <article className="ladder-card is-poisson">
            <div className="ladder-top">
              <span>01</span>
              <b>no continuity correction</b>
            </div>
            <h4>Poisson → Binomial</h4>
            <Formula block>{String.raw`\mathrm{Bin}(n,p)\to\mathrm{Po}(np)`}</Formula>
            <ul>
              <li>n is large and p is small</li>
              <li>
                for calculation: <Formula>{String.raw`np\le 10`}</Formula> and{' '}
                <Formula>{String.raw`p\le 0.1`}</Formula>
              </li>
              <li><Formula>{String.raw`\lambda=np`}</Formula></li>
            </ul>
            <p className="ladder-note">Do not apply a continuity correction.</p>
          </article>

          <article className="ladder-card is-normal">
            <div className="ladder-top">
              <span>02</span>
              <b>apply continuity correction</b>
            </div>
            <h4>Normal → Binomial</h4>
            <Formula block>{String.raw`\mathrm{Bin}(n,p)\to N(np,npq)`}</Formula>
            <ul>
              <li>n is large and <Formula>{String.raw`p\approx 0.5`}</Formula></li>
              <li>
                <Formula>{String.raw`np>5`}</Formula> and <Formula>{String.raw`nq>5`}</Formula>;
                for calculation <Formula>{String.raw`np>10`}</Formula>
              </li>
              <li>
                <Formula>{String.raw`\mu=np`}</Formula>,{' '}
                <Formula>{String.raw`\sigma^2=npq`}</Formula>
              </li>
            </ul>
            <p className="ladder-note">Apply a continuity correction.</p>
          </article>

          <article className="ladder-card is-normal">
            <div className="ladder-top">
              <span>03</span>
              <b>apply continuity correction</b>
            </div>
            <h4>Normal → Poisson</h4>
            <Formula block>{String.raw`\mathrm{Po}(\lambda)\to N(\lambda,\lambda)`}</Formula>
            <ul>
              <li><Formula>{String.raw`\lambda`}</Formula> is large</li>
              <li>for calculation: <Formula>{String.raw`\lambda>10`}</Formula></li>
              <li>
                <Formula>{String.raw`\mu=\lambda`}</Formula>,{' '}
                <Formula>{String.raw`\sigma^2=\lambda`}</Formula>
              </li>
            </ul>
            <p className="ladder-note">Apply a continuity correction.</p>
          </article>
        </div>
      </div>
    </section>
  )
}

