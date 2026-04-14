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
}[] = [
  {
    id: 'executive',
    label: 'Executive View',
    sub: 'Regional performance heat map',
    color: '#0009DC',
    glow: 'rgba(0, 9, 220, 0.55)',
  },
  {
    id: 'gd',
    label: 'Growth Director View',
    sub: 'Campaign performance by director',
    color: '#AEF33E',
    glow: 'rgba(174, 243, 62, 0.55)',
  },
  {
    id: 'client',
    label: 'Client View',
    sub: 'Campaign overview by client',
    color: '#FF7CF5',
    glow: 'rgba(255, 124, 245, 0.55)',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function HomePage({ onViewSelect }: Props) {
  return (
    <div className="id-home">
      <div className="id-home__header">
        <h1 className="id-home__title">Incremental Suite</h1>
        <p className="id-home__subtitle">Select a view to get started</p>
      </div>

      <div className="id-home__cards">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className="id-home__card"
            style={{ '--card-color': v.color, '--card-glow': v.glow } as React.CSSProperties}
            onClick={() => onViewSelect(v.id)}
          >
            <span className="id-home__card-label">{v.label}</span>
            <span className="id-home__card-desc">{v.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
