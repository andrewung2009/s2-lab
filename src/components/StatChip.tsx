interface StatChipProps {
  label: string
  value: string
  accent?: 'cyan' | 'magenta' | 'amber' | 'neutral'
}

export function StatChip({ label, value, accent = 'neutral' }: StatChipProps) {
  return (
    <div className={`stat-chip accent-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
