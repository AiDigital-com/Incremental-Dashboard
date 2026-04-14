import { useState, useCallback, useEffect } from 'react'
import type { AppView } from '../App'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onViewSelect: (view: Exclude<AppView, 'home'>) => void
}

// ── View definitions ──────────────────────────────────────────────────────────

const VIEWS: {
  id: Exclude<AppView, 'home'>
  label: string
  sub: string
  color: string
  glow: string
  glowSubtle: string
}[] = [
  {
    id: 'executive',
    label: 'Executive View',
    sub: 'Incremental available by region.',
    color: '#0009DC',
    glow: 'rgba(0, 9, 220, 0.65)',
    glowSubtle: 'rgba(0, 9, 220, 0.28)',
  },
  {
    id: 'gd',
    label: 'Growth Director View',
    sub: 'Incremental availability for growth director use.',
    color: '#AEF33E',
    glow: 'rgba(174, 243, 62, 0.65)',
    glowSubtle: 'rgba(174, 243, 62, 0.28)',
  },
  {
    id: 'client',
    label: 'Client View',
    sub: 'Incremental availability for client use.',
    color: '#FF7CF5',
    glow: 'rgba(255, 124, 245, 0.65)',
    glowSubtle: 'rgba(255, 124, 245, 0.28)',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPos(idx: number, active: number, total: number): 'center' | 'left' | 'right' {
  const diff = (idx - active + total) % total
  if (diff === 0) return 'center'
  if (diff === 1) return 'right'
  return 'left'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HomePage({ onViewSelect }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  const prev = useCallback(() => setActiveIdx(i => (i - 1 + VIEWS.length) % VIEWS.length), [])
  const next = useCallback(() => setActiveIdx(i => (i + 1) % VIEWS.length), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  return (
    <div className="id-home">
      <div className="id-home__header">
        <h1 className="id-home__title">Incremental Suite</h1>
        <p className="id-home__subtitle">Select a view to get started</p>
      </div>

      <div className="id-home__carousel">
        <button
          className="id-home__nav id-home__nav--prev"
          onClick={prev}
          aria-label="Previous view"
        >
          &#8249;
        </button>

        <div className="id-home__cards">
          {VIEWS.map((v, i) => {
            const pos = getPos(i, activeIdx, VIEWS.length)
            return (
              <button
                key={v.id}
                className={`id-home__card id-home__card--${pos}`}
                style={{
                  '--card-color': v.color,
                  '--card-glow': v.glow,
                  '--card-glow-subtle': v.glowSubtle,
                } as React.CSSProperties}
                onClick={() => {
                  if (pos === 'center') {
                    onViewSelect(v.id)
                  } else {
                    setActiveIdx(i)
                  }
                }}
                tabIndex={pos === 'center' ? 0 : -1}
                aria-label={pos === 'center' ? `Open ${v.label}` : `Go to ${v.label}`}
              >
                <span className="id-home__card-label">{v.label}</span>
                <span className="id-home__card-desc">{v.sub}</span>
              </button>
            )
          })}
        </div>

        <button
          className="id-home__nav id-home__nav--next"
          onClick={next}
          aria-label="Next view"
        >
          &#8250;
        </button>
      </div>
    </div>
  )
}
