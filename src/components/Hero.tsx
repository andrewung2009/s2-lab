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
            LS2 · Chapter 1 · Animated notes
          </div>
          <h1>
            The notes,
            <br />
            in <em>motion.</em>
          </h1>
          <p className="hero-subtitle">
            Animated explanations and question-solving labs for the Binomial and Poisson
            distributions. Built only from the LS2 Chapter 1 notes, with every probability
            worked out step by step.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#binomial">
              Start with the Binomial
              <span aria-hidden="true">→</span>
            </a>
            <a className="button button-ghost" href="#approximation">
              Jump to approximations
            </a>
          </div>

          <div className="hero-formulas">
            <span className="hero-formula-pill">
              <Formula>{String.raw`X \sim \mathrm{Bin}(n,p)`}</Formula>
              <i>notes 1.1</i>
            </span>
            <span className="hero-formula-pill is-magenta">
              <Formula>{String.raw`X \sim \mathrm{Po}(\lambda)`}</Formula>
              <i>notes 1.2</i>
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
            <strong>03</strong>
            <span>approximation routes</span>
          </div>
          <div>
            <strong>02</strong>
            <span>models</span>
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
