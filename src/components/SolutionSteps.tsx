import { Formula } from './Formula'

export interface SolutionStep {
  label: string
  latex: string
  note?: string
}

interface SolutionStepsProps {
  model: string
  steps: SolutionStep[]
  accent: 'cyan' | 'magenta' | 'amber'
  revision: string | number
  footer?: string
}

export function SolutionSteps({
  model,
  steps,
  accent,
  revision,
  footer,
}: SolutionStepsProps) {
  return (
    <div className={`solution-panel panel accent-${accent}`}>
      <div className="panel-heading">
        <span>Worked solution</span>
        <span className="panel-live">
          <i /> live
        </span>
      </div>

      <div className="solution-model">
        <span>Model</span>
        <Formula>{model}</Formula>
      </div>

      <ol className="solution-steps" key={revision}>
        {steps.map((step, index) => (
          <li key={step.label} style={{ animationDelay: `${index * 90}ms` }}>
            <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="step-body">
              <span className="step-label">{step.label}</span>
              <Formula block>{step.latex}</Formula>
              {step.note ? <p>{step.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      {footer ? <p className="solution-footer">{footer}</p> : null}
    </div>
  )
}
