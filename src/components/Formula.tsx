import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface FormulaProps {
  children: string
  block?: boolean
  className?: string
}

export function Formula({ children, block = false, className = '' }: FormulaProps) {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        throwOnError: false,
        displayMode: block,
        strict: false,
        output: 'html',
      }),
    [children, block],
  )

  return (
    <span
      className={`formula ${block ? 'formula-block' : ''} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
