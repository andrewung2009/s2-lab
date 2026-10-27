import { binomialValues, poissonValues } from '../lib/distributions'
import { formatProbability } from '../lib/format'

function MiniBars({
  values,
  accent,
  offset = 0,
  count = 20,
}: {
  values: number[]
  accent: 'cyan' | 'magenta'
  offset?: number
  count?: number
}) {
  const visible = values.slice(offset, offset + count)
  const max = Math.max(...visible, 0.001)

  return (
    <div className={`mini-bars accent-${accent}`} aria-hidden="true">
      {visible.map((value, index) => (
        <span
          key={index}
          style={{
            height: `${Math.max(3, (value / max) * 100)}%`,
            animationDelay: `${index * 22}ms`,
          }}
        />
      ))}
    </div>
  )
}

export function HeroVisual() {
  const binomial = binomialValues(18, 0.35)
  const poisson = poissonValues(4.2)

  return (
    <div className="hero-visual" aria-label="Live Binomial and Poisson distribution previews">
      <div className="hero-visual-glow" aria-hidden="true" />
      <div className="hero-lab-card">
        <div className="hero-card-top">
          <div>
            <span className="live-dot" />
            Live model
          </div>
          <span className="mono-tag">B(18, 0.35)</span>
        </div>
        <div className="hero-card-body">
          <div className="hero-card-label">
            <span>Binomial</span>
            <strong>P(X = 6) = {formatProbability(binomial[6])}</strong>
          </div>
          <MiniBars values={binomial} accent="cyan" />
          <div className="hero-axis">
            <span>0</span>
            <span>successes</span>
            <span>18</span>
          </div>
        </div>
        <div className="hero-card-formula">X ~ B(n, p)</div>
      </div>

      <div className="hero-lab-card is-poisson">
        <div className="hero-card-top">
          <div>
            <span className="live-dot" />
            Random arrivals
          </div>
          <span className="mono-tag">Po(4.2)</span>
        </div>
        <div className="hero-card-body">
          <div className="hero-card-label">
            <span>Poisson</span>
            <strong>P(X = 4) = {formatProbability(poisson[4])}</strong>
          </div>
          <MiniBars values={poisson} accent="magenta" offset={1} count={18} />
          <div className="hero-axis">
            <span>0</span>
            <span>events</span>
            <span>18+</span>
          </div>
        </div>
        <div className="hero-card-formula">X ~ Po(λ)</div>
      </div>

      <div className="hero-float hero-float-a" aria-hidden="true">
        <span>E(X)</span>
        <strong>np</strong>
      </div>
      <div className="hero-float hero-float-b" aria-hidden="true">
        <span>Var(X)</span>
        <strong>λ</strong>
      </div>
    </div>
  )
}
