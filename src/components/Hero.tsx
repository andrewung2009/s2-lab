import { Formula } from './Formula'
import { HeroVisual } from './HeroVisual'

export function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="hero-grid-lines" aria-hidden="true" />
      <div className="hero-content">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="eyebrow-line" />
            Edexcel IAL · S2 · LS2 Chapter 1
          </div>
          <h1>
            Probability,
            <br />
            made <em>visible.</em>
          </h1>
          <p className="hero-subtitle">
            A hands-on distribution lab for the Binomial and Poisson models, built from the
            LS2 Chapter 1 notes. Change the parameters, watch the shape move, and build the
            intuition that S2 rewards.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#binomial">
              Open the Binomial Lab
              <span aria-hidden="true">→</span>
            </a>
            <a className="button button-ghost" href="#poisson">
              Jump to Poisson
            </a>
          </div>

          <div className="hero-formulas">
            <span className="hero-formula-pill">
              <Formula>{String.raw`X \sim \mathrm{Bin}(n,p)`}</Formula>
              <i>fixed trials</i>
            </span>
            <span className="hero-formula-pill is-magenta">
              <Formula>{String.raw`X \sim \mathrm{Po}(\lambda)`}</Formula>
              <i>random arrivals</i>
            </span>
          </div>
        </div>

        <HeroVisual />
      </div>

      <div className="hero-footer">
        <div className="hero-stats">
          <div>
            <strong>1.1–1.3</strong>
            <span>notes covered</span>
          </div>
          <div>
            <strong>02</strong>
            <span>models</span>
          </div>
          <div>
            <strong>∞</strong>
            <span>simulations</span>
          </div>
        </div>
        <a className="scroll-cue" href="#binomial">
          <span>Scroll to explore</span>
          <i aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
