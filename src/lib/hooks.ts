import { useEffect, useRef, useState } from 'react'

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function useAnimatedNumber(value: number, duration = 420): number {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef(0)
  const frameRef = useRef(0)

  useEffect(() => {
    if (reduced || !Number.isFinite(value)) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    cancelAnimationFrame(frameRef.current)
    fromRef.current = display
    startRef.current = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startRef.current) / duration)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(fromRef.current + (value - fromRef.current) * eased)
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduced])

  return display
}

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize((current) =>
        Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1
          ? current
          : { width, height },
      )
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}

export function useInView<T extends HTMLElement>(rootMargin = '160px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold: 0.01 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, inView }
}
