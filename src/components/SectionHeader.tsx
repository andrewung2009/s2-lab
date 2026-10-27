interface SectionHeaderProps {
  index: string
  eyebrow: string
  title: string
  description: string
  chips: string[]
  accent: 'cyan' | 'magenta' | 'amber'
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  chips,
  accent,
}: SectionHeaderProps) {
  return (
    <header className={`section-header accent-${accent}`}>
      <div className="section-index" aria-hidden="true">
        {index}
      </div>
      <div className="section-heading">
        <p className="section-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-description">{description}</p>
        <div className="condition-chips">
          {chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>
    </header>
  )
}
