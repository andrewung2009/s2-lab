import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { poissonPMF } from '../lib/distributions'
import { formatNumber, formatProbability } from '../lib/format'
import { useElementSize, useInView, usePrefersReducedMotion } from '../lib/hooks'
import {
  generatePoissonTimeline,
  simulateIntervals,
  type PoissonTimeline,
} from '../lib/random'
import { Formula } from './Formula'
import { ProbabilityChart } from './ProbabilityChart'
import { SegmentedControl } from './SegmentedControl'
import { StatChip } from './StatChip'

const INTERVALS = 8
const TIMELINE_HEIGHT = 164

function makeTimeline(rate: number, interval: number): PoissonTimeline {
  return generatePoissonTimeline(rate, interval, INTERVALS, Math.random)
}

export function PoissonArrivals({ rate, interval, lambda }: { rate: number; interval: number; lambda: number }) {
  const reduced = usePrefersReducedMotion()
  const [timeline, setTimeline] = useState(() => makeTimeline(rate, interval))
  const [playhead, setPlayhead] = useState(0)
  const [playing, setPlaying] = useState(!reduced)
  const [speed, setSpeed] = useState('1')
  const [storedCounts, setStoredCounts] = useState<number[]>(() =>
    simulateIntervals(rate, interval, 200),
  )
  const { ref: viewRef, inView } = useInView<HTMLDivElement>('120px')
  const { ref: sizeRef, size } = useElementSize<HTMLDivElement>()
  const playheadRef = useRef(0)

  useEffect(() => {
    const next = makeTimeline(rate, interval)
    setTimeline(next)
    setStoredCounts(simulateIntervals(rate, interval, 200))
    playheadRef.current = 0
    setPlayhead(0)
    setPlaying(!reduced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, interval])

  useEffect(() => {
    if (reduced) setPlaying(false)
  }, [reduced])

  useEffect(() => {
    if (!playing || !inView) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const next = Math.min(timeline.duration, playheadRef.current + dt * Number(speed))
      playheadRef.current = next
      setPlayhead(next)
      if (next >= timeline.duration) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, inView, speed, timeline.duration])

  const completed = Math.min(INTERVALS, Math.floor(playhead / interval + 0.00001))
  const currentInterval = Math.min(INTERVALS - 1, Math.floor(playhead / interval))
  const currentCount = timeline.events.filter(
    (event) => event.interval === currentInterval && event.time <= playhead,
  ).length
  const allCounts = useMemo(
    () => [...storedCounts, ...timeline.counts.slice(0, completed)],
    [storedCounts, timeline.counts, completed],
  )
  const totalIntervals = allCounts.length
  const maxCount = Math.max(
    8,
    ...allCounts,
    Math.ceil(lambda + 4 * Math.sqrt(lambda + 1)),
  )
  const frequencies = new Array<number>(maxCount + 1).fill(0)
  for (const count of allCounts) {
    if (count <= maxCount) frequencies[count] += 1
  }
  const histogram = frequencies.map((value) =>
    totalIntervals > 0 ? value / totalIntervals : 0,
  )
  const theoretical = Array.from({ length: maxCount + 1 }, (_, k) => poissonPMF(lambda, k))
  const simulatedMean =
    totalIntervals > 0 ? allCounts.reduce((sum, value) => sum + value, 0) / totalIntervals : 0
  const simulatedVariance =
    totalIntervals > 0
      ? allCounts.reduce((sum, value) => sum + (value - simulatedMean) ** 2, 0) / totalIntervals
      : 0

  const width = Math.max(300, size.width)
  const margin = { top: 25, right: 20, bottom: 30, left: 20 }
  const plotWidth = Math.max(10, width - margin.left - margin.right)
  const plotHeight = 86
  const intervalWidth = plotWidth / INTERVALS
  const toX = (time: number) => margin.left + (time / timeline.duration) * plotWidth

  const handlePlay = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (playhead >= timeline.duration - 0.001) {
      setStoredCounts((current) => [...current, ...timeline.counts])
      const next = makeTimeline(rate, interval)
      setTimeline(next)
      playheadRef.current = 0
      setPlayhead(0)
      setPlaying(true)
      return
    }
    setPlaying(true)
  }

  const handleRunMany = () => {
    const extra = simulateIntervals(rate, interval, 200)
    setStoredCounts((current) => [...current, ...extra])
    playheadRef.current = timeline.duration
    setPlayhead(timeline.duration)
    setPlaying(false)
  }

  const handleReset = () => {
    const next = makeTimeline(rate, interval)
    setTimeline(next)
    setStoredCounts(simulateIntervals(rate, interval, 200))
    playheadRef.current = 0
    setPlayhead(0)
    setPlaying(!reduced)
  }

  const seek = (event: PointerEvent<SVGSVGElement>) => {
    if (!size.width) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = Math.min(
      timeline.duration,
      Math.max(0, ((x - margin.left) / plotWidth) * timeline.duration),
    )
    playheadRef.current = time
    setPlayhead(time)
    setPlaying(false)
  }

  return (
    <div className="arrivals panel" ref={viewRef}>
      <div className="sim-heading">
        <div>
          <span className="panel-kicker">Live process</span>
          <h3>Poisson arrivals</h3>
          <p>
            Events arrive at rate μ = {formatNumber(rate, 1)} per unit. Count them in intervals of
            length {formatNumber(interval, 1)}.
          </p>
        </div>
        <div className="sim-readout" aria-live="polite">
          <span>count this interval</span>
          <strong>{currentCount}</strong>
        </div>
      </div>

      <div className="arrivals-timeline" ref={sizeRef}>
        {size.width > 0 ? (
          <svg
            width={width}
            height={TIMELINE_HEIGHT}
            viewBox={`0 0 ${width} ${TIMELINE_HEIGHT}`}
            onPointerDown={seek}
            role="img"
            aria-label={`Poisson arrival timeline. ${totalIntervals} intervals simulated, current count ${currentCount}.`}
          >
            {Array.from({ length: INTERVALS }, (_, index) => {
              const x = margin.left + index * intervalWidth
              const isCurrent = index === currentInterval && playhead < timeline.duration - 0.001
              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={margin.top}
                    width={intervalWidth}
                    height={plotHeight}
                    fill={isCurrent ? 'rgba(232,121,249,.08)' : 'transparent'}
                    stroke="rgba(148,163,184,.12)"
                    strokeWidth="1"
                  />
                  <text
                    className="arrival-interval-label"
                    x={x + intervalWidth / 2}
                    y={margin.top + plotHeight + 18}
                    textAnchor="middle"
                  >
                    {index + 1}
                  </text>
                  {index < completed ? (
                    <text
                      className="arrival-count-label"
                      x={x + intervalWidth / 2}
                      y={margin.top + 14}
                      textAnchor="middle"
                    >
                      {timeline.counts[index]}
                    </text>
                  ) : null}
                </g>
              )
            })}

            <line
              className="arrival-baseline"
              x1={margin.left}
              x2={margin.left + plotWidth}
              y1={margin.top + plotHeight}
              y2={margin.top + plotHeight}
            />

            {timeline.events.map((event, index) => {
              const visible = event.time <= playhead
              const x = toX(event.time)
              const y =
                margin.top +
                plotHeight -
                16 -
                (index % 3) * 11
              return (
                <g key={`${event.time}-${index}`} className={visible ? 'arrival-event is-visible' : 'arrival-event'}>
                  {visible ? <circle cx={x} cy={y} r="7" className="arrival-pulse" /> : null}
                  <circle cx={x} cy={y} r="3" />
                </g>
              )
            })}

            <line
              className="arrival-playhead"
              x1={toX(playhead)}
              x2={toX(playhead)}
              y1={margin.top - 2}
              y2={margin.top + plotHeight + 2}
            />
            <circle
              className="arrival-playhead-dot"
              cx={toX(playhead)}
              cy={margin.top - 2}
              r="3.5"
            />
          </svg>
        ) : null}
      </div>

      <div className="arrivals-controls">
        <button
          type="button"
          className="button button-small button-primary"
          onClick={handlePlay}
          aria-label={playing ? 'Pause Poisson arrivals' : 'Play Poisson arrivals'}
        >
          {playing ? 'Pause' : playhead >= timeline.duration - 0.001 ? 'Replay' : 'Play'}
        </button>
        <SegmentedControl
          options={[
            { value: '0.5', label: '0.5×' },
            { value: '1', label: '1×' },
            { value: '2', label: '2×' },
          ]}
          value={speed}
          onChange={setSpeed}
          label="Simulation speed"
          accent="magenta"
          compact
        />
        <button type="button" className="button button-small button-ghost" onClick={handleRunMany}>
          Run 200 more
        </button>
        <button type="button" className="button button-small button-quiet" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="arrivals-histogram">
        <div className="mini-panel-head">
          <div>
            <span className="panel-kicker">Convergence</span>
            <h4>Counts per interval</h4>
          </div>
          <span className="mono-tag">{totalIntervals} intervals</span>
        </div>
        <ProbabilityChart
          values={histogram}
          overlay={theoretical}
          accent="magenta"
          barLabel="simulated"
          overlayLabel={`Po(${formatNumber(lambda, 2)})`}
          height={250}
          compact
          ariaLabel={`Histogram of ${totalIntervals} simulated Poisson interval counts compared with the Poisson distribution with mean ${lambda.toFixed(2)}.`}
        />
        <div className="sim-stats">
          <StatChip label="simulated mean" value={totalIntervals ? formatNumber(simulatedMean, 2) : '—'} accent="magenta" />
          <StatChip label="simulated variance" value={totalIntervals ? formatNumber(simulatedVariance, 2) : '—'} accent="magenta" />
          <StatChip label="theoretical λ" value={formatNumber(lambda, 2)} accent="neutral" />
          <StatChip label={`sim P(X = ${Math.round(lambda)})`} value={totalIntervals ? formatProbability(histogram[Math.min(histogram.length - 1, Math.round(lambda))] ?? 0) : '—'} accent="neutral" />
        </div>
        <div className="arrival-note">
          <Formula>{String.raw`\mathrm{E}(X)=\lambda,\quad \mathrm{Var}(X)=\lambda`}</Formula>
          <span>Run more intervals until the histogram locks onto the magenta curve.</span>
        </div>
      </div>
    </div>
  )
}


