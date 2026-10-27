import type { CSSProperties } from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  hint?: string
  accent?: 'cyan' | 'magenta' | 'amber'
  id: string
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (next) => String(next),
  hint,
  accent = 'cyan',
  id,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className={`slider accent-${accent}`}>
      <div className="slider-heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{formatValue(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--slider-fill': `${percent}%` } as CSSProperties}
      />
      {hint ? <p className="slider-hint">{hint}</p> : null}
      <div className="slider-bounds" aria-hidden="true">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}
