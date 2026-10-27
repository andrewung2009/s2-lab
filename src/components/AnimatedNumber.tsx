import { useAnimatedNumber } from '../lib/hooks'

interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  className?: string
  duration?: number
}

export function AnimatedNumber({
  value,
  format,
  className = '',
  duration = 420,
}: AnimatedNumberProps) {
  const display = useAnimatedNumber(value, duration)
  return (
    <span className={className}>
      {format(display)}
    </span>
  )
}

