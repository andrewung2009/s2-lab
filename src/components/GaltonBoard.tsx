import { useEffect, useRef, useState } from 'react'
import { binomialPMF } from '../lib/distributions'
import { useElementSize, usePrefersReducedMotion } from '../lib/hooks'
import { Slider } from './Slider'

const CANVAS_HEIGHT = 330

interface Ball {
  row: number
  progress: number
  rights: number
  dir: 0 | 1
}

function drawGalton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: number,
  bias: number,
  counts: number[],
  balls: Ball[],
  total: number,
) {
  ctx.clearRect(0, 0, width, height)

  const top = 8
  const boardBottom = height - 74
  const rowHeight = (boardBottom - top) / rows
  const spacing = Math.min((width - 28) / (rows + 1), 34)
  const center = width / 2
  const baseline = height - 8
  const binHeight = 56

  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)'
  ctx.lineWidth = 1
  for (let i = 1; i < rows; i += 1) {
    const y = top + i * rowHeight
    ctx.beginPath()
    ctx.moveTo(center - ((rows + 1) / 2) * spacing, y)
    ctx.lineTo(center + ((rows + 1) / 2) * spacing, y)
    ctx.stroke()
  }
  ctx.restore()

  for (let row = 0; row < rows; row += 1) {
    const y = top + (row + 0.5) * rowHeight
    for (let peg = 0; peg <= row; peg += 1) {
      const x = center + (peg - row / 2) * spacing
      ctx.beginPath()
      ctx.fillStyle = 'rgba(148, 163, 184, 0.48)'
      ctx.arc(x, y, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const expectedTotal = Math.max(total, 24)
  const expected = Array.from({ length: rows + 1 }, (_, k) =>
    binomialPMF(rows, bias, k) * expectedTotal,
  )
  const maxCount = Math.max(1, ...counts, ...expected)

  for (let k = 0; k <= rows; k += 1) {
    const x = center + (k - rows / 2) * spacing
    const barWidth = spacing * 0.7
    const count = counts[k] ?? 0
    const heightPx = (count / maxCount) * binHeight
    ctx.fillStyle = 'rgba(34, 211, 238, 0.16)'
    ctx.fillRect(x - barWidth / 2, baseline - binHeight, barWidth, binHeight)
    if (heightPx > 0) {
      const gradient = ctx.createLinearGradient(0, baseline - heightPx, 0, baseline)
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0.95)')
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0.28)')
      ctx.fillStyle = gradient
      ctx.fillRect(x - barWidth / 2, baseline - heightPx, barWidth, heightPx)
    }
    if (barWidth > 13 && count > 0) {
      ctx.fillStyle = 'rgba(226, 232, 240, 0.72)'
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(String(count), x, baseline - heightPx - 4)
    }
  }

  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.6)'
  ctx.lineWidth = 1.3
  for (let k = 0; k <= rows; k += 1) {
    const x = center + (k - rows / 2) * spacing
    const y = baseline - (expected[k] / maxCount) * binHeight
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.restore()

  for (const ball of balls) {
    const x =
      center +
      (ball.rights - ball.row / 2 + (ball.dir - 0.5) * ball.progress) * spacing
    const y = top + (ball.row + ball.progress) * rowHeight
    ctx.save()
    ctx.shadowColor = 'rgba(34, 211, 238, 0.9)'
    ctx.shadowBlur = 9
    ctx.beginPath()
    ctx.fillStyle = '#67e8f9'
    ctx.arc(x, y, Math.max(2.3, spacing * 0.12), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.fillStyle = 'rgba(148, 163, 184, 0.42)'
  ctx.font = '9px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('0', center - (rows / 2) * spacing, height - 2)
  ctx.fillText(String(rows), center + (rows / 2) * spacing, height - 2)
}

export function GaltonBoard({ onApply }: { onApply?: (rows: number, bias: number) => void }) {
  const [rows, setRows] = useState(14)
  const [bias, setBias] = useState(0.5)
  const [counts, setCounts] = useState<number[]>(() => new Array(15).fill(0))
  const [total, setTotal] = useState(0)
  const reduced = usePrefersReducedMotion()
  const { ref: wrapperRef, size } = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballsRef = useRef<Ball[]>([])
  const pendingRef = useRef(0)
  const countsRef = useRef<number[]>(counts)
  const totalRef = useRef(0)
  const rowsRef = useRef(rows)
  const biasRef = useRef(bias)
  const frameRef = useRef(0)
  const lastRef = useRef(0)
  const spawnRef = useRef(0)

  rowsRef.current = rows
  biasRef.current = bias

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !size.width) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = size.width
    const height = CANVAS_HEIGHT
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.height = `${height}px`
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawGalton(
      ctx,
      width,
      height,
      rowsRef.current,
      biasRef.current,
      countsRef.current,
      ballsRef.current,
      totalRef.current,
    )
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.width) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(size.width * dpr)
    canvas.height = Math.round(CANVAS_HEIGHT * dpr)
    canvas.style.height = `${CANVAS_HEIGHT}px`
    drawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, rows, bias, counts])

  useEffect(() => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    ballsRef.current = []
    pendingRef.current = 0
    countsRef.current = new Array(rows + 1).fill(0)
    totalRef.current = 0
    setCounts([...countsRef.current])
    setTotal(0)
    drawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, bias])

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current)
    },
    [],
  )

  const startLoop = () => {
    if (frameRef.current) return
    lastRef.current = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000)
      lastRef.current = now
      spawnRef.current += dt

      if (pendingRef.current > 0 && spawnRef.current > 0.035) {
        pendingRef.current -= 1
        spawnRef.current = 0
        ballsRef.current.push({
          row: 0,
          progress: 0,
          rights: 0,
          dir: Math.random() < biasRef.current ? 1 : 0,
        })
      }

      let landed = false
      const remaining: Ball[] = []
      for (const ball of ballsRef.current) {
        ball.progress += dt * 3.2
        while (ball.progress >= 1) {
          ball.progress -= 1
          ball.rights += ball.dir
          ball.row += 1
          if (ball.row >= rowsRef.current) {
            countsRef.current[ball.rights] = (countsRef.current[ball.rights] ?? 0) + 1
            totalRef.current += 1
            landed = true
            break
          }
          ball.dir = Math.random() < biasRef.current ? 1 : 0
        }
        if (ball.row < rowsRef.current) remaining.push(ball)
      }
      ballsRef.current = remaining

      if (landed) {
        setCounts([...countsRef.current])
        setTotal(totalRef.current)
      }

      drawCanvas()

      if (ballsRef.current.length > 0 || pendingRef.current > 0) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = 0
      }
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  const drop = (amount: number) => {
    if (reduced) {
      const next = [...countsRef.current]
      for (let i = 0; i < amount; i += 1) {
        let rights = 0
        for (let row = 0; row < rows; row += 1) {
          if (Math.random() < bias) rights += 1
        }
        next[rights] += 1
      }
      countsRef.current = next
      totalRef.current += amount
      setCounts(next)
      setTotal(totalRef.current)
      drawCanvas()
      return
    }
    pendingRef.current += Math.min(amount, 420)
    startLoop()
  }

  const reset = () => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    ballsRef.current = []
    pendingRef.current = 0
    countsRef.current = new Array(rows + 1).fill(0)
    totalRef.current = 0
    setCounts([...countsRef.current])
    setTotal(0)
    drawCanvas()
  }

  return (
    <div className="galton">
      <div className="sim-heading">
        <div>
          <span className="panel-kicker">Interactive simulation</span>
          <h3>Galton board</h3>
          <p>Each ball makes {rows} independent left/right choices. The bins become Bin({rows}, {bias.toFixed(2)}).</p>
        </div>
        <div className="sim-readout">
          <span>balls</span>
          <strong>{total}</strong>
        </div>
      </div>

      <div className="galton-canvas-wrap" ref={wrapperRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Galton board simulation with ${rows} rows, bias ${bias.toFixed(2)}, and ${total} balls dropped`}
        />
        <div className="galton-legend" aria-hidden="true">
          <span><i className="is-bar" /> simulated bins</span>
          <span><i className="is-dash" /> Bin({rows}, {bias.toFixed(2)})</span>
        </div>
      </div>

      <div className="galton-controls">
        <Slider
          id="galton-rows"
          label="Rows"
          value={rows}
          min={6}
          max={20}
          step={1}
          onChange={setRows}
          formatValue={(value) => `${value}`}
          accent="cyan"
        />
        <Slider
          id="galton-bias"
          label="Right-step probability"
          value={bias}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={setBias}
          formatValue={(value) => value.toFixed(2)}
          accent="cyan"
        />
      </div>

      <div className="sim-actions">
        <button type="button" className="button button-small button-primary" onClick={() => drop(1)}>
          Drop 1
        </button>
        <button type="button" className="button button-small button-ghost" onClick={() => drop(100)}>
          Drop 100
        </button>
        <button type="button" className="button button-small button-quiet" onClick={reset}>
          Reset
        </button>
        {onApply ? (
          <button
            type="button"
            className="button button-small button-quiet"
            onClick={() => onApply(rows, bias)}
          >
            Use in lab ↑
          </button>
        ) : null}
      </div>
    </div>
  )
}



