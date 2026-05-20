import { useCallback, useEffect } from 'react'
import type { AppView } from '../App'
import { GlobeBackground } from '../components/GlobeBackground'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onViewSelect: (view: Exclude<AppView, 'home'>) => void
  activeIdx: number
  onIdxChange: (idx: number) => void
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
    color: '#A9BEF8',
    glow: 'rgba(255, 255, 255, 0.50)',
    glowSubtle: 'rgba(255, 255, 255, 0.18)',
  },
  {
    id: 'gd',
    label: 'Growth Director View',
    sub: 'Incremental availability for growth director use.',
    color: '#8EE7F1',
    glow: 'rgba(255, 255, 255, 0.50)',
    glowSubtle: 'rgba(255, 255, 255, 0.18)',
  },
  {
    id: 'client',
    label: 'Client View',
    sub: 'Incremental availability for client use.',
    color: '#8263FF',
    glow: 'rgba(255, 255, 255, 0.50)',
    glowSubtle: 'rgba(255, 255, 255, 0.18)',
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

export function HomePage({ onViewSelect, activeIdx, onIdxChange }: Props) {
  const prev = useCallback(
    () => onIdxChange((activeIdx - 1 + VIEWS.length) % VIEWS.length),
    [activeIdx, onIdxChange],
  )
  const next = useCallback(
    () => onIdxChange((activeIdx + 1) % VIEWS.length),
    [activeIdx, onIdxChange],
  )

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

      {/* ── Globe background ─────────────────────────────────────────────── */}
      <GlobeBackground />

      <div className="id-home__header">
        <h1 className="id-home__title">IncreMax</h1>
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
                    onIdxChange(i)
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
