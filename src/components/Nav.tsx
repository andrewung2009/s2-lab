import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#binomial', label: '1.1 Binomial', id: 'binomial' },
  { href: '#poisson', label: '1.2 Poisson', id: 'poisson' },
  { href: '#approximation', label: '1.3 Approx', id: 'approximation' },
]

export function Nav() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(
      (section): section is HTMLElement => Boolean(section),
    )
    if (!sections.length) return

    let frame = 0
    const update = () => {
      frame = 0
      const probe = window.scrollY + window.innerHeight * 0.34
      let next = ''
      for (const section of sections) {
        if (section.offsetTop <= probe) next = section.id
      }
      setActive(next)
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <header className="site-nav">
      <div className="nav-inner">
        <a className="brand" href="#top" aria-label="Back to top">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-text">
            S2<span>//</span>LAB
          </span>
        </a>

        <nav className="nav-links" aria-label="Lab sections">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={active === link.id ? 'is-active' : ''}
              aria-current={active === link.id ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav-meta">
          <span className="nav-spec">WST02</span>
          <a className="nav-cta" href="#binomial">
            Enter the lab
            <span aria-hidden="true">↘</span>
          </a>
        </div>
      </div>
    </header>
  )
}
