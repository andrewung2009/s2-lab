import { useId, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { formatPercent, formatProbability } from '../lib/format'
import { niceMax } from '../lib/distributions'
import { useElementSize } from '../lib/hooks'

export type ChartAccent = 'cyan' | 'magenta' | 'amber'

interface ProbabilityChartProps {
  values: number[]
  startIndex?: number
  accent?: ChartAccent
  selected?: number | null
  onSelect?: (x: number) => void
  shade?: [number, number] | null
  mean?: number
  overlay?: number[]
  overlayLabel?: string
  barLabel?: string
  height?: number
  compact?: boolean
  difference?: boolean
  ariaLabel: string
  interactive?: boolean
}

const ACCENT_HEX: Record<ChartAccent, string> = {
  cyan: '#22d3ee',
  magenta: '#e879f9',
  amber: '#fbbf24',
}

export function ProbabilityChart({
  values,
  startIndex = 0,
  accent = 'cyan',
  selected = null,
  onSelect,
  shade = null,
  mean,
  overlay,
  overlayLabel = 'Poisson',
  barLabel = 'Binomial',
  height,
  compact = false,
  difference = false,
  ariaLabel,
  interactive = false,
}: ProbabilityChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const [hovered, setHovered] = useState<number | null>(null)
  const gradientId = useId().replace(/:/g, '')
  const chartAccent = difference ? 'amber' : accent
  const accentHex = ACCENT_HEX[chartAccent]

  const width = Math.max(size.width, 300)
  const chartHeight = height ?? (compact ? 250 : 350)
  const margin = compact
    ? { top: 20, right: 12, bottom: 30, left: 44 }
    : { top: 28, right: 18, bottom: 38, left: 54 }
  const plotWidth = Math.max(10, width - margin.left - margin.right)
  const plotHeight = Math.max(10, chartHeight - margin.top - margin.bottom)
  const count = values.length
  const step = plotWidth / Math.max(1, count)
  const barWidth = Math.max(1.2, Math.min(28, step * 0.68))
  const maxValue = niceMax(
    Math.max(1e-5, ...values, ...(overlay ?? [])) * (difference ? 1.15 : 1.08),
  )
  const percentMode = maxValue <= 1.05
  const baseline = margin.top + plotHeight
  const overlayValues = overlay ?? []

  const toY = (value: number) => baseline - (value / maxValue) * plotHeight
  const barTop = (value: number) => baseline - (value / maxValue) * plotHeight
  const centerX = (index: number) => margin.left + (index + 0.5) * step

  const selectedIndex =
    selected === null ? null : Math.min(count - 1, Math.max(0, selected - startIndex))
  const hoveredIndex = hovered === null ? null : Math.min(count - 1, Math.max(0, hovered))
  const hoveredValue = hoveredIndex === null ? null : values[hoveredIndex]

  const tickIndices = new Set<number>()
  const desiredTicks = width < 480 ? 5 : 9
  const tickStep = Math.max(1, Math.ceil(count / desiredTicks))
  for (let i = 0; i < count; i += tickStep) tickIndices.add(i)
  tickIndices.add(0)
  tickIndices.add(count - 1)
  if (selectedIndex !== null) tickIndices.add(selectedIndex)
  const rawTicks = [...tickIndices].filter((i) => i >= 0 && i < count).sort((a, b) => a - b)
  const ticks: number[] = []
  const minTickGap = width < 520 ? 40 : 32
  for (const tick of rawTicks) {
    if (ticks.length === 0) {
      ticks.push(tick)
      continue
    }
    const previous = ticks[ticks.length - 1]
    if (centerX(tick) - centerX(previous) >= minTickGap) {
      ticks.push(tick)
    } else if (tick === count - 1) {
      if (ticks.length > 1) ticks.pop()
      ticks.push(tick)
    }
  }

  const overlayPoints = overlayValues
    .map((value, index) => `${centerX(index)},${toY(value)}`)
    .join(' ')

  const meanX =
    mean === undefined
      ? null
      : margin.left + ((mean - startIndex + 0.5) * step)
  const showMean = meanX !== null && meanX >= margin.left && meanX <= margin.left + plotWidth
  const meanValue = mean ?? 0

  const selectIndex = (index: number) => {
    if (!interactive || !onSelect) return
    const clamped = Math.min(count - 1, Math.max(0, index))
    onSelect(startIndex + clamped)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return
    const current = selectedIndex ?? 0
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + 1
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - 1
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = count - 1
    if (next !== null) {
      event.preventDefault()
      selectIndex(next)
    }
  }

  const handleBarClick = (index: number, event: MouseEvent<SVGRectElement>) => {
    event.stopPropagation()
    selectIndex(index)
  }

  const tooltipX =
    hoveredIndex === null
      ? 0
      : Math.min(
          Math.max(centerX(hoveredIndex) - 88, margin.left),
          Math.max(margin.left, width - margin.right - 176),
        )
  const tooltipY =
    hoveredIndex === null || hoveredValue === null
      ? 0
      : Math.max(8, barTop(hoveredValue) - (overlayValues.length ? 84 : 62))
  const tooltipWidth = overlayValues.length ? 184 : 168
  const tooltipHeight = overlayValues.length ? 74 : 52
  const hoveredX = hoveredIndex === null ? 0 : startIndex + hoveredIndex
  const hoveredOverlay = hoveredIndex === null ? null : overlayValues[hoveredIndex]

  return (
    <div
      ref={ref}
      className={`probability-chart ${interactive ? 'is-interactive' : ''}`}
      style={{ height: chartHeight }}
      role={interactive ? 'group' : 'img'}
      aria-label={interactive ? `${ariaLabel} Use the left and right arrow keys to change the selected outcome.` : ariaLabel}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHovered(null)}
    >
      {(barLabel || (overlayValues.length > 0 && overlayLabel)) && (
        <div className="chart-legend" aria-hidden="true">
          <span>
            <i style={{ background: accentHex }} />
            {barLabel}
          </span>
          {overlayValues.length > 0 ? (
            <span>
              <i className="is-line" style={{ background: ACCENT_HEX.magenta }} />
              {overlayLabel}
            </span>
          ) : null}
        </div>
      )}

      {size.width > 0 ? (
        <svg
          className="chart-svg"
          width={width}
          height={chartHeight}
          viewBox={`0 0 ${width} ${chartHeight}`}
          role="presentation"
        >
          <defs>
            <linearGradient id={`bar-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentHex} stopOpacity="0.95" />
              <stop offset="100%" stopColor={accentHex} stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id={`bar-dim-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentHex} stopOpacity="0.3" />
              <stop offset="100%" stopColor={accentHex} stopOpacity="0.06" />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = maxValue * fraction
            const y = toY(value)
            return (
              <g key={fraction}>
                <line
                  className="chart-gridline"
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                />
                <text className="chart-axis-label chart-y-label" x={margin.left - 10} y={y + 4}>
                  {percentMode ? formatPercent(value, value < 0.01 ? 2 : 1) : value.toFixed(1)}
                </text>
              </g>
            )
          })}

          {shade ? (
            <rect
              className="chart-shade"
              x={margin.left + (Math.max(0, shade[0] - startIndex)) * step}
              y={margin.top}
              width={
                (Math.min(count - 1, shade[1] - startIndex) -
                  Math.max(0, shade[0] - startIndex) +
                  1) *
                step
              }
              height={plotHeight}
              fill={accentHex}
              opacity="0.06"
            />
          ) : null}

          {values.map((value, index) => {
            const x = startIndex + index
            const isShaded = !shade || (x >= shade[0] && x <= shade[1])
            const isSelected = selectedIndex === index
            const barHeight = Math.max(value > 0 ? 1.5 : 0, baseline - barTop(value))
            const cx = centerX(index)
            return (
              <g key={x}>
                <rect
                  className={`chart-bar ${isSelected ? 'is-selected' : ''}`}
                  x={cx - barWidth / 2}
                  y={baseline - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={Math.min(3, barWidth / 2)}
                  fill={isShaded ? `url(#bar-${gradientId})` : `url(#bar-dim-${gradientId})`}
                  filter={isSelected ? `url(#glow-${gradientId})` : undefined}
                  style={{ animationDelay: `${Math.min(index * 5, 360)}ms` }}
                />
                {interactive ? (
                  <rect
                    className="chart-hit"
                    x={margin.left + index * step}
                    y={margin.top}
                    width={Math.max(2, step)}
                    height={plotHeight}
                    onMouseEnter={() => setHovered(index)}
                    onClick={(event) => handleBarClick(index, event)}
                  />
                ) : null}
              </g>
            )
          })}

          {overlayValues.length > 0 ? (
            <g className="chart-overlay">
              <polyline
                points={overlayPoints}
                fill="none"
                stroke={ACCENT_HEX.magenta}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {count <= 60
                ? overlayValues.map((value, index) => (
                    <circle
                      key={index}
                      cx={centerX(index)}
                      cy={toY(value)}
                      r={count <= 30 ? 3 : 2}
                      fill={ACCENT_HEX.magenta}
                      stroke="#080a10"
                      strokeWidth="1"
                    />
                  ))
                : null}
            </g>
          ) : null}

          {showMean && meanX !== null ? (
            <g className="chart-mean">
              <line
                x1={meanX}
                x2={meanX}
                y1={margin.top}
                y2={baseline}
                stroke="rgba(255,255,255,.52)"
                strokeWidth="1"
                strokeDasharray="5 5"
              />
              <text
                x={meanX + (meanX > width - margin.right - 90 ? -8 : 8)}
                y={margin.top + 12}
                textAnchor={meanX > width - margin.right - 90 ? 'end' : 'start'}
              >
                E(X) = {meanValue.toFixed(2)}
              </text>
            </g>
          ) : null}

          <line
            className="chart-baseline"
            x1={margin.left}
            x2={width - margin.right}
            y1={baseline}
            y2={baseline}
          />

          {ticks.map((index) => {
            const x = startIndex + index
            const anchor = index === 0 ? 'start' : index === count - 1 ? 'end' : 'middle'
            return (
              <text
                key={index}
                className="chart-axis-label chart-x-label"
                x={centerX(index)}
                y={baseline + 20}
                textAnchor={anchor}
              >
                {x}
              </text>
            )
          })}

          {hoveredIndex !== null && hoveredValue !== null ? (
            <g className="chart-tooltip" pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="10"
                fill="#0b0f18"
                stroke="rgba(148,163,184,.3)"
              />
              <text x={tooltipX + 12} y={tooltipY + 20}>
                x = {hoveredX}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 38} className="tooltip-accent">
                {barLabel}: {formatProbability(hoveredValue)}
              </text>
              {hoveredOverlay !== null ? (
                <text x={tooltipX + 12} y={tooltipY + 56} className="tooltip-magenta">
                  {overlayLabel}: {formatProbability(hoveredOverlay)}
                </text>
              ) : null}
            </g>
          ) : null}
        </svg>
      ) : null}
    </div>
  )
}
