interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  accent?: 'cyan' | 'magenta'
  compact?: boolean
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  accent = 'cyan',
  compact = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`segmented accent-${accent} ${compact ? 'segmented-compact' : ''}`}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'is-active' : ''}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
