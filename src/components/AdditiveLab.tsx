import { useMemo, useState } from 'react'
import { convolution, poissonValues } from '../lib/distributions'
import { formatNumber } from '../lib/format'
import { mulberry32 } from '../lib/random'
import { Formula } from './Formula'
import { ProbabilityChart } from './ProbabilityChart'
import { Slider } from './Slider'
import { StatChip } from './StatChip'

function eventsFor(lambda: number, seed: number): number[] {
  if (lambda <= 0) return []
  const rng = mulberry32(seed)
  const events: number[] = []
  let time = 0
  let guard = 0
  while (time < 1 && guard < 200) {
    time += -Math.log(Math.max(rng(), 1e-12)) / lambda
    if (time < 1) events.push(time)
    guard += 1
  }
  return events
}

function pad(values: number[], length: number): number[] {
  return Array.from({ length }, (_, index) => values[index] ?? 0)
}

function ProcessStrip({
  events,
  accent,
  label,
  lambda,
}: {
  events: number[]
  accent: 'cyan' | 'magenta' | 'neutral'
  label: string
  lambda: number
}) {
  return (
    <div className={`process-strip accent-${accent}`}>
      <div className="process-label">
        <span>{label}</span>
        <strong>{formatNumber(lambda, 1)}</strong>
      </div>
      <div className="process-track">
        {events.map((time, index) => (
          <i key={index} style={{ left: `${time * 100}%` }} />
        ))}
      </div>
      <span className="process-count">{events.length}</span>
    </div>
  )
}

export function AdditiveLab() {
  const [lambda1, setLambda1] = useState(2.4)
  const [lambda2, setLambda2] = useState(1.8)
  const sumLambda = lambda1 + lambda2

  const valuesA = useMemo(() => poissonValues(lambda1), [lambda1])
  const valuesB = useMemo(() => poissonValues(lambda2), [lambda2])
  const valuesSum = useMemo(() => poissonValues(sumLambda), [sumLambda])
  const merged = useMemo(() => convolution(valuesA, valuesB), [valuesA, valuesB])
  const length = Math.max(
    12,
    Math.min(merged.length, Math.ceil(sumLambda + 5 * Math.sqrt(sumLambda + 1) + 6)),
  )
  const bars = pad(merged, length)
  const line = pad(valuesSum, length)
  const eventsA = useMemo(() => eventsFor(lambda1, 1041), [lambda1])
  const eventsB = useMemo(() => eventsFor(lambda2, 2207), [lambda2])
  const eventsMerged = useMemo(
    () => [...eventsA, ...eventsB].sort((a, b) => a - b),
    [eventsA, eventsB],
  )

  return (
    <div className="additive panel">
      <div className="sim-heading">
        <div>
          <span className="panel-kicker">Additive property</span>
          <h3>Two streams become one</h3>
          <p>Independent Poisson processes add. The merged stream is exactly Po(λ₁ + λ₂).</p>
        </div>
        <div className="sim-readout">
          <span>merged λ</span>
          <strong>{formatNumber(sumLambda, 2)}</strong>
        </div>
      </div>

      <div className="additive-sliders">
        <Slider
          id="lambda-one"
          label="λ₁"
          value={lambda1}
          min={0.2}
          max={8}
          step={0.1}
          onChange={setLambda1}
          formatValue={(value) => formatNumber(value, 1)}
          accent="cyan"
        />
        <Slider
          id="lambda-two"
          label="λ₂"
          value={lambda2}
          min={0.2}
          max={8}
          step={0.1}
          onChange={setLambda2}
          formatValue={(value) => formatNumber(value, 1)}
          accent="magenta"
        />
      </div>

      <div className="process-strips">
        <ProcessStrip events={eventsA} accent="cyan" label="Process A" lambda={lambda1} />
        <ProcessStrip events={eventsB} accent="magenta" label="Process B" lambda={lambda2} />
        <ProcessStrip events={eventsMerged} accent="neutral" label="A + B" lambda={sumLambda} />
      </div>

      <div className="additive-formula">
        <Formula block>{String.raw`\mathrm{Po}(\lambda_1)+\mathrm{Po}(\lambda_2)=\mathrm{Po}(\lambda_1+\lambda_2)`}</Formula>
        <p>
          The bars are the combined probability mass. The magenta line is the single Poisson
          distribution with mean λ₁ + λ₂.
        </p>
      </div>

      <ProbabilityChart
        values={bars}
        overlay={line}
        accent="cyan"
        barLabel="combined PMFs"
        overlayLabel={`Po(${formatNumber(sumLambda, 2)})`}
        height={260}
        compact
        ariaLabel={`Combined Poisson probabilities for mean ${lambda1.toFixed(1)} and ${lambda2.toFixed(1)}, overlaid with a Poisson distribution of mean ${sumLambda.toFixed(1)}.`}
      />

      <div className="sim-stats">
        <StatChip label="E(A)" value={formatNumber(lambda1, 1)} accent="cyan" />
        <StatChip label="E(B)" value={formatNumber(lambda2, 1)} accent="magenta" />
        <StatChip label="E(A + B)" value={formatNumber(sumLambda, 2)} accent="neutral" />
        <StatChip label="Var(A + B)" value={formatNumber(sumLambda, 2)} accent="neutral" />
      </div>

      <div className="chart-note">
        <span>Both process strips show one unit interval. Dots are independent arrivals.</span>
        <span>
          <Formula>{String.raw`P(X=k)=e^{-\lambda}\frac{\lambda^k}{k!}`}</Formula>
        </span>
      </div>
    </div>
  )
}

