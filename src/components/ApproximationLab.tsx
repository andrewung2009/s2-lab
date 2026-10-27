import { useEffect, useMemo, useRef, useState } from 'react'
import {
  approximationMetrics,
  binomialCDF,
  binomialPMF,
  clamp,
  poissonCDF,
  poissonPMF,
} from '../lib/distributions'
import { formatNumber, formatProbability } from '../lib/format'
import { normalApproxProbability, normalPDF } from '../lib/normal'
import { PHRASE_OPTIONS, resolvePhrase, type Phrase } from '../lib/phrases'
import { usePrefersReducedMotion } from '../lib/hooks'
import { AnimatedNumber } from './AnimatedNumber'
import { Formula } from './Formula'
import { ProbabilityChart } from './ProbabilityChart'
import { SectionHeader } from './SectionHeader'
import { SegmentedControl } from './SegmentedControl'
import { Slider } from './Slider'
import { SolutionSteps, type SolutionStep } from './SolutionSteps'
import { StatChip } from './StatChip'

type Mode = 'poissonBinomial' | 'normalBinomial' | 'normalPoisson'

const MODES: { value: Mode; label: string }[] = [
  { value: 'poissonBinomial', label: 'Po → Bin' },
  { value: 'normalBinomial', label: 'N → Bin' },
  { value: 'normalPoisson', label: 'N → Po' },
]

function zValue(value: number, mu: number, sigma: number): string {
  return ((value - mu) / sigma).toFixed(2)
}

function normalProbabilityExpression(
  phrase: Phrase,
  x: number,
  x2: number,
  mu: number,
  sigma: number,
  cc: boolean,
): string {
  const half = cc ? 0.5 : 0
  if (phrase === 'atMost') {
    return String.raw`P(X\le ${x})\approx\Phi\left(${zValue(x + half, mu, sigma)}\right)`
  }
  if (phrase === 'atLeast') {
    return String.raw`P(X\ge ${x})\approx1-\Phi\left(${zValue(x - half, mu, sigma)}\right)`
  }
  if (phrase === 'moreThan') {
    return String.raw`P(X>${x})\approx1-\Phi\left(${zValue(x + half, mu, sigma)}\right)`
  }
  if (phrase === 'between') {
    const low = Math.min(x, x2)
    const high = Math.max(x, x2)
    return String.raw`P(${low}\le X\le ${high})\approx\Phi\left(${zValue(high + half, mu, sigma)}\right)-\Phi\left(${zValue(low - half, mu, sigma)}\right)`
  }
  if (!cc) {
    return String.raw`P(X=${x})\approx ${normalPDF(x, mu, sigma).toFixed(4)}`
  }
  return String.raw`P(X=${x})\approx\Phi\left(${zValue(x + half, mu, sigma)}\right)-\Phi\left(${zValue(x - half, mu, sigma)}\right)`
}

function poissonProbabilityExpression(
  phrase: Phrase,
  x: number,
  x2: number,
  lambda: number,
): string {
  const low = Math.min(x, x2)
  const high = Math.max(x, x2)
  if (phrase === 'exactly') {
    return String.raw`P(X=${x})\approx\frac{e^{-${lambda.toFixed(2)}}(${lambda.toFixed(2)})^{${x}}}{${x}!}`
  }
  if (phrase === 'atMost') {
    return String.raw`P(X\le ${x})\approx\sum_{r=0}^{${x}}\frac{e^{-${lambda.toFixed(2)}}(${lambda.toFixed(2)})^r}{r!}=F(${x})`
  }
  if (phrase === 'atLeast') {
    return String.raw`P(X\ge ${x})\approx1-F(${x - 1})`
  }
  if (phrase === 'moreThan') {
    return String.raw`P(X>${x})\approx1-F(${x})`
  }
  return String.raw`P(${low}\le X\le ${high})\approx F(${high})-F(${low - 1})`
}

export function ApproximationLab() {
  const [mode, setMode] = useState<Mode>('poissonBinomial')
  const [n, setN] = useState(80)
  const [p, setP] = useState(0.05)
  const [poissonLambda, setPoissonLambda] = useState(12)
  const [x, setX] = useState(4)
  const [x2, setX2] = useState(7)
  const [phrase, setPhrase] = useState<Phrase>('atMost')
  const [cc, setCc] = useState(true)
  const [morphing, setMorphing] = useState(false)
  const frameRef = useRef(0)
  const reduced = usePrefersReducedMotion()

  const isPoissonMode = mode === 'poissonBinomial'
  const isNormalBinomial = mode === 'normalBinomial'
  const isNormalPoisson = mode === 'normalPoisson'
  const lambda = n * p
  const q = 1 - p
  const mu = isNormalPoisson ? poissonLambda : n * p
  const sigma = Math.max(
    1e-6,
    isNormalPoisson ? Math.sqrt(poissonLambda) : Math.sqrt(n * p * q),
  )

  const metrics = useMemo(
    () => (isPoissonMode ? approximationMetrics(n, p) : null),
    [isPoissonMode, n, p],
  )

  let displayLow = 0
  let displayHigh = 0
  let values: number[] = []
  let overlay: number[] = []
  let barLabel = 'Bin(n, p)'
  let overlayLabel = 'Po(np)'

  if (isPoissonMode && metrics) {
    ;[displayLow, displayHigh] = metrics.range
    values = metrics.binomial
    overlay = metrics.poisson
    overlayLabel = `Po(${lambda.toFixed(2)})`
  } else if (isNormalBinomial) {
    const spread = 5 * Math.max(sigma, 1)
    displayLow = Math.max(0, Math.floor(mu - spread))
    displayHigh = Math.min(n, Math.ceil(mu + spread))
    if (displayHigh - displayLow < 8) displayHigh = Math.min(n, displayLow + 8)
    values = Array.from(
      { length: displayHigh - displayLow + 1 },
      (_, index) => binomialPMF(n, p, displayLow + index),
    )
    overlay = Array.from(
      { length: displayHigh - displayLow + 1 },
      (_, index) => normalPDF(displayLow + index, mu, sigma),
    )
    overlayLabel = `N(${mu.toFixed(1)}, ${sigma.toFixed(1)}²)`
  } else {
    const spread = 5 * Math.max(sigma, 1)
    displayLow = Math.max(0, Math.floor(mu - spread))
    displayHigh = Math.ceil(mu + spread)
    values = Array.from(
      { length: displayHigh - displayLow + 1 },
      (_, index) => poissonPMF(poissonLambda, displayLow + index),
    )
    overlay = Array.from(
      { length: displayHigh - displayLow + 1 },
      (_, index) => normalPDF(displayLow + index, mu, sigma),
    )
    barLabel = 'Po(λ)'
    overlayLabel = `N(${poissonLambda.toFixed(1)}, ${poissonLambda.toFixed(1)})`
  }

  const selectedX = clamp(Math.round(x), displayLow, displayHigh)
  const selectedX2 = clamp(Math.round(x2), displayLow, displayHigh)
  const sourcePmf = isNormalPoisson
    ? (value: number) => poissonPMF(poissonLambda, value)
    : (value: number) => binomialPMF(n, p, value)
  const sourceCdf = isNormalPoisson
    ? (value: number) => poissonCDF(poissonLambda, value)
    : (value: number) => binomialCDF(n, p, value)
  const exact = resolvePhrase(
    phrase,
    selectedX,
    selectedX2,
    displayHigh,
    sourcePmf,
    sourceCdf,
  )

  const approximate = isPoissonMode
    ? resolvePhrase(
        phrase,
        selectedX,
        selectedX2,
        displayHigh,
        (value) => poissonPMF(lambda, value),
        (value) => poissonCDF(lambda, value),
      ).probability
    : normalApproxProbability(phrase, selectedX, selectedX2, mu, sigma, cc)

  const gap = Math.abs(exact.probability - approximate)
  const nLarge = n >= 50
  const pSmall = p <= 0.1
  const meanSmall = lambda <= 10
  const normalBinOk = nLarge && Math.abs(p - 0.5) <= 0.2 && n * p > 5 && n * q > 5
  const normalBinCalc = n * p > 10
  const normalPoissonOk = poissonLambda > 10

  const primary = isPoissonMode
    ? nLarge && pSmall
    : isNormalBinomial
      ? normalBinOk
      : normalPoissonOk
  const comfortable = isPoissonMode
    ? primary && meanSmall
    : isNormalBinomial
      ? primary && normalBinCalc
      : primary
  const verdict = comfortable
    ? 'Conditions met'
    : primary
      ? isNormalBinomial
        ? 'Check np > 10'
        : 'Check the calculation condition'
      : 'Conditions not met'

  const conditionNote = isPoissonMode
    ? 'n large and p small. For calculation use np ≤ 10 and p ≤ 0.1. Do not apply a continuity correction.'
    : isNormalBinomial
      ? 'n large, p ≈ 0.5, np > 5 and nq > 5. For calculation use np > 10. Apply a continuity correction.'
      : 'λ is large; for calculation use λ > 10. Apply a continuity correction.'

  const conditionChips = isPoissonMode
    ? [
        { label: 'n large', ok: nLarge },
        { label: 'p ≤ 0.1', ok: pSmall },
        { label: 'np ≤ 10', ok: meanSmall },
      ]
    : isNormalBinomial
      ? [
          { label: 'n large', ok: nLarge },
          { label: 'p ≈ 0.5', ok: Math.abs(p - 0.5) <= 0.2 },
          { label: 'np > 5', ok: n * p > 5 },
          { label: 'nq > 5', ok: n * q > 5 },
          { label: 'np > 10', ok: normalBinCalc },
        ]
      : [{ label: 'λ > 10', ok: normalPoissonOk }]

  const displayVariance = isPoissonMode ? lambda : sigma * sigma
  const displaySd = isPoissonMode ? Math.sqrt(lambda) : sigma

  let approximationExpression = ''
  if (isPoissonMode) {
    approximationExpression = poissonProbabilityExpression(
      phrase,
      selectedX,
      selectedX2,
      lambda,
    )
  } else {
    approximationExpression = normalProbabilityExpression(
      phrase,
      selectedX,
      selectedX2,
      mu,
      sigma,
      cc,
    )
  }

  const steps: SolutionStep[] = [
    {
      label: 'Set the approximating distribution',
      latex: isPoissonMode
        ? String.raw`\lambda=np=${n}\times${p.toFixed(3)}=${lambda.toFixed(2)},\quad X\approx\mathrm{Po}(${lambda.toFixed(2)})`
        : isNormalBinomial
          ? String.raw`\mu=np=${mu.toFixed(2)},\quad \sigma^2=npq=${(sigma * sigma).toFixed(2)},\quad X\approx N(${mu.toFixed(2)},${(sigma * sigma).toFixed(2)})`
          : String.raw`\mu=\lambda=${mu.toFixed(2)},\quad \sigma^2=\lambda=${(sigma * sigma).toFixed(2)},\quad X\approx N(${mu.toFixed(2)},${(sigma * sigma).toFixed(2)})`,
    },
    {
      label: isPoissonMode ? 'Approximate the probability' : 'Apply the continuity correction',
      latex: approximationExpression,
      note: isPoissonMode
        ? 'No continuity correction for this approximation.'
        : cc
          ? 'The ±0.5 boundaries are the continuity correction.'
          : 'Continuity correction is switched off.',
    },
    {
      label: 'Evaluate',
      latex: `\\text{Approximation}=\\mathbf{${formatProbability(approximate)}}`,
    },
    {
      label: 'Compare with the exact value',
      latex: `\\text{Exact}=\\mathbf{${formatProbability(exact.probability)}},\\quad |\\text{gap}|=${formatProbability(gap)}`,
    },
  ]

  const changeMode = (next: Mode) => {
    setMode(next)
    setCc(true)
    if (next === 'poissonBinomial') {
      setN(80)
      setP(0.05)
      setX(4)
      setX2(7)
    } else if (next === 'normalBinomial') {
      setN(100)
      setP(0.5)
      setX(50)
      setX2(55)
    } else {
      setPoissonLambda(12)
      setX(12)
      setX2(15)
    }
  }

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
        eyebrow="Notes 1.3 · Approximations"
        title="The approximation labs"
        description="The notes give three routes. Set the conditions, apply the continuity correction where required, and compare the approximation with the exact value."
        chips={['n large', 'p small', 'λ > 10', 'continuity correction']}
        accent="amber"
      />

      <div className="lab-grid">
        <aside className="control-panel panel">
          <div className="panel-heading">
            <span>Approximation route</span>
            <span className="panel-live"><i /> live</span>
          </div>

          <SegmentedControl
            options={MODES}
            value={mode}
            onChange={changeMode}
            label="Choose an approximation"
            accent="amber"
          />

          {isNormalPoisson ? (
            <Slider
              id="approx-poisson-lambda"
              label="Poisson mean, λ"
              value={poissonLambda}
              min={1}
              max={40}
              step={0.5}
              onChange={setPoissonLambda}
              formatValue={(value) => formatNumber(value, 1)}
              accent="amber"
            />
          ) : (
            <>
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
                max={0.8}
                step={0.005}
                onChange={setP}
                formatValue={(value) => value.toFixed(3)}
                accent="amber"
              />
            </>
          )}

          <div className="lambda-callout is-amber">
            <span>{isPoissonMode ? 'Poisson mean' : 'Normal parameters'}</span>
            <Formula>
              {isPoissonMode
                ? String.raw`\lambda=np=${lambda.toFixed(2)}`
                : String.raw`\mu=${mu.toFixed(2)},\quad \sigma^2=${(sigma * sigma).toFixed(2)}`}
            </Formula>
          </div>

          <Slider
            id="approx-x"
            label="Selected outcome, x"
            value={selectedX}
            min={displayLow}
            max={displayHigh}
            step={1}
            onChange={setX}
            formatValue={(value) => `${value}`}
            accent="amber"
          />

          <div className="control-block">
            <div className="control-label-row">
              <span>Probability phrase</span>
              {!isPoissonMode ? (
                <button
                  type="button"
                  className={`toggle ${cc ? 'is-on' : ''}`}
                  aria-pressed={cc}
                  onClick={() => setCc((current) => !current)}
                >
                  continuity correction
                </button>
              ) : null}
            </div>
            <SegmentedControl
              options={PHRASE_OPTIONS}
              value={phrase}
              onChange={setPhrase}
              label="Choose a probability phrase"
              accent="amber"
              compact
            />
            {phrase === 'between' ? (
              <Slider
                id="approx-x2"
                label="Second outcome"
                value={selectedX2}
                min={displayLow}
                max={displayHigh}
                step={1}
                onChange={setX2}
                formatValue={(value) => `${value}`}
                accent="amber"
              />
            ) : null}
          </div>

          {isPoissonMode ? (
            <button
              type="button"
              className="button button-primary morph-button"
              onClick={morph}
              disabled={morphing}
            >
              {morphing ? 'Animating…' : 'Animate the limit'}
              <span aria-hidden="true">↗</span>
            </button>
          ) : null}

          <div className={`validity ${comfortable ? 'is-good' : primary ? 'is-mid' : 'is-bad'}`}>
            <div className="validity-head">
              <span>Condition check</span>
              <strong>{verdict}</strong>
            </div>
            <div className="validity-chips">
              {conditionChips.map((chip) => (
                <span key={chip.label} className={chip.ok ? 'is-ok' : 'is-warn'}>
                  <i /> {chip.label}
                </span>
              ))}
            </div>
            <p>{conditionNote}</p>
          </div>

          <div className="approx-comparison">
            <div>
              <span>Exact</span>
              <strong>{formatProbability(exact.probability)}</strong>
            </div>
            <div>
              <span>Approximation</span>
              <strong>
                <AnimatedNumber
                  value={approximate}
                  format={(value) => formatProbability(value)}
                />
              </strong>
            </div>
            <div>
              <span>Gap</span>
              <strong>{formatProbability(gap)}</strong>
            </div>
          </div>

          <div className="stat-grid">
            <StatChip label="Mean" value={formatNumber(mu, 2)} accent="amber" />
            <StatChip label="Variance" value={formatNumber(displayVariance, 2)} accent="amber" />
            <StatChip label="Std dev" value={formatNumber(displaySd, 2)} accent="neutral" />
            <StatChip label="CC" value={isPoissonMode ? 'none' : cc ? 'on' : 'off'} accent="neutral" />
          </div>
        </aside>

        <div className="chart-panel panel">
          <div className="panel-heading">
            <span>{isPoissonMode ? 'Binomial → Poisson' : isNormalBinomial ? 'Binomial → Normal' : 'Poisson → Normal'}</span>
            <span className="mono-tag">{barLabel} ≈ {overlayLabel}</span>
          </div>
          <ProbabilityChart
            key={mode}
            values={values}
            startIndex={displayLow}
            overlay={overlay}
            accent={isPoissonMode ? 'cyan' : 'amber'}
            selected={selectedX}
            onSelect={setX}
            shade={exact.shade}
            mean={mu}
            barLabel={barLabel}
            overlayLabel={overlayLabel}
            height={350}
            ariaLabel={`${barLabel} distribution with an approximating ${overlayLabel} curve. Selected outcome ${selectedX}. Exact probability ${exact.probability.toFixed(4)} and approximate probability ${approximate.toFixed(4)}.`}
            interactive
          />
          <div className="chart-actions">
            <span className="chart-actions-note">
              {isPoissonMode
                ? 'The Poisson bars are the same height as the binomial as n grows and p shrinks.'
                : cc
                  ? 'The curve is evaluated at the ±0.5 continuity-corrected boundaries.'
                  : 'Continuity correction is off. Switch it on to match the notes.'}
            </span>
            <span className="mono-tag">{isNormalPoisson ? `λ = ${poissonLambda}` : `np = ${lambda.toFixed(2)}`}</span>
          </div>
          <div className="chart-note">
            <span>Click a bar or use the arrow keys to choose x.</span>
            <span>
              {isPoissonMode ? (
                <Formula>{String.raw`\lambda=np=${lambda.toFixed(2)}`}</Formula>
              ) : (
                <Formula>{String.raw`\Phi(z)=\text{standard normal CDF}`}</Formula>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="lab-lower">
        <div className="notes-panel panel">
          <div className="panel-heading">
            <span>Notes · 1.3</span>
            <span className="panel-live"><i /> Approximation</span>
          </div>
          <p className="notes-lead">
            {isPoissonMode
              ? 'Poisson distribution as an approximation to the binomial.'
              : isNormalBinomial
                ? 'Normal distribution as an approximation to the binomial.'
                : 'Normal distribution as an approximation to the Poisson.'}
          </p>
          <div className="notes-conditions">
            {isPoissonMode ? (
              <>
                <span><b>n</b> is large and p is small.</span>
                <span><b>Calculation</b> np ≤ 10 and p ≤ 0.1.</span>
                <span><b>Use</b> λ = np.</span>
                <span><b>No</b> continuity correction.</span>
              </>
            ) : isNormalBinomial ? (
              <>
                <span><b>n</b> is large and p ≈ 0.5.</span>
                <span><b>Conditions</b> np &gt; 5 and nq &gt; 5.</span>
                <span><b>Calculation</b> np &gt; 10.</span>
                <span><b>Use</b> μ = np, σ² = npq, with continuity correction.</span>
              </>
            ) : (
              <>
                <span><b>λ</b> is large.</span>
                <span><b>Calculation</b> λ &gt; 10.</span>
                <span><b>Use</b> μ = λ, σ² = λ.</span>
                <span><b>Always</b> apply a continuity correction.</span>
              </>
            )}
          </div>
          <div className="notes-formulas">
            <div>
              <span>The working rule</span>
              <Formula block>
                {isPoissonMode
                  ? String.raw`\mathrm{Bin}(n,p)\approx\mathrm{Po}(np)`
                  : isNormalBinomial
                    ? String.raw`\mathrm{Bin}(n,p)\approx N(np,npq)`
                    : String.raw`\mathrm{Po}(\lambda)\approx N(\lambda,\lambda)`}
              </Formula>
            </div>
            <div className="notes-formula-split">
              <div>
                <span>Mean</span>
                <Formula block>
                  {isPoissonMode
                    ? String.raw`\lambda=np`
                    : isNormalBinomial
                      ? String.raw`\mu=np`
                      : String.raw`\mu=\lambda`}
                </Formula>
              </div>
              <div>
                <span>Variance</span>
                <Formula block>
                  {isPoissonMode
                    ? String.raw`\lambda`
                    : isNormalBinomial
                      ? String.raw`\sigma^2=npq`
                      : String.raw`\sigma^2=\lambda`}
                </Formula>
              </div>
            </div>
          </div>
          <p className="notes-foot">
            {isPoissonMode
              ? 'No continuity correction is used for this approximation.'
              : 'The notes require a continuity correction for these normal approximations.'}
          </p>
        </div>

        <SolutionSteps
          model={
            isPoissonMode
              ? String.raw`X\sim\mathrm{Bin}(${n},${p.toFixed(3)})\approx\mathrm{Po}(${lambda.toFixed(2)})`
              : isNormalBinomial
                ? String.raw`X\sim\mathrm{Bin}(${n},${p.toFixed(3)})\approx N(${mu.toFixed(2)},${(sigma * sigma).toFixed(2)})`
                : String.raw`X\sim\mathrm{Po}(${poissonLambda})\approx N(${mu.toFixed(2)},${(sigma * sigma).toFixed(2)})`
          }
          steps={steps}
          accent="amber"
          revision={`${mode}-${n}-${p}-${poissonLambda}-${selectedX}-${selectedX2}-${phrase}-${cc}`}
          footer="The exact value is shown beside the approximation so you can see the size of the error."
        />
      </div>
    </section>
  )
}
