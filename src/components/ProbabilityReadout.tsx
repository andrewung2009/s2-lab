import { AnimatedNumber } from './AnimatedNumber'
import { Formula } from './Formula'
import { formatProbability } from '../lib/format'

interface ProbabilityReadoutProps {
  label: string
  probability: number
  latex: string
  detail: string
  accent: 'cyan' | 'magenta'
  footnote?: string
}

export function ProbabilityReadout({
  label,
  probability,
  latex,
  detail,
  accent,
  footnote,
}: ProbabilityReadoutProps) {
  return (
    <div className={`probability-readout accent-${accent}`}>
      <div className="readout-top">
        <span className="readout-label">{label}</span>
        <span className="readout-sf">4 d.p.</span>
      </div>
      <div className="readout-value">
        <AnimatedNumber value={probability} format={(value) => formatProbability(value)} />
      </div>
      <div className="readout-meta">
        <Formula>{latex}</Formula>
        <span>
          {detail}
          {footnote ? ` · ${footnote}` : ''}
        </span>
      </div>
      <div className="readout-bar" aria-hidden="true">
        <i style={{ width: `${Math.min(100, Math.max(0, probability * 100))}%` }} />
      </div>
    </div>
  )
}
