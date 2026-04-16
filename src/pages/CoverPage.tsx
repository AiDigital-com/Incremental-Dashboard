import { useState, useEffect, useCallback } from 'react'

// ── Letter grid definition ────────────────────────────────────────────────────
//
// Grid: 10 cols × 11 rows (CSS grid, 1-based)
//
//      col:  1    2    3    4    5    6    7    8    9   10
// row  1:                        A   [I]       L    A    B    S   ← AI LABS  (I shared)
// row  2:                            N
// row  3:                            C
// row  4:                            R
// row  5:    S    U    I    T   [E]                               ← SUITE    (E shared)
// row  6:                            M
// row  7:                            E
// row  8:                            N
// row  9:                            T
// row 10:                            A
// row 11:                            L
//
// Shared letters appear once, highlighted in accent color.

interface LetterDef {
  char: string
  col: number
  row: number
  delay: number
  type: 'ailabs' | 'incremental' | 'suite' | 'shared-i' | 'shared-e'
}

const LETTERS: LetterDef[] = [
  // ── AI LABS — reveal left to right at row 1 ──────────────────────────────
  { char: 'A', col: 4,  row: 1,  delay: 0,    type: 'ailabs' },
  { char: 'I', col: 5,  row: 1,  delay: 130,  type: 'shared-i' },  // ← shared with INCREMENTAL
  // col 6 = space — intentionally empty
  { char: 'L', col: 7,  row: 1,  delay: 320,  type: 'ailabs' },
  { char: 'A', col: 8,  row: 1,  delay: 450,  type: 'ailabs' },
  { char: 'B', col: 9,  row: 1,  delay: 580,  type: 'ailabs' },
  { char: 'S', col: 10, row: 1,  delay: 710,  type: 'ailabs' },

  // ── INCREMENTAL — reveal top to bottom, skip shared I at row 1 ───────────
  { char: 'N', col: 5,  row: 2,  delay: 930,  type: 'incremental' },
  { char: 'C', col: 5,  row: 3,  delay: 1040, type: 'incremental' },
  { char: 'R', col: 5,  row: 4,  delay: 1150, type: 'incremental' },
  { char: 'E', col: 5,  row: 5,  delay: 1260, type: 'shared-e' },          // ← shared with SUITE
  { char: 'M', col: 5,  row: 6,  delay: 1370, type: 'incremental' },
  { char: 'E', col: 5,  row: 7,  delay: 1480, type: 'incremental' },
  { char: 'N', col: 5,  row: 8,  delay: 1590, type: 'incremental' },
  { char: 'T', col: 5,  row: 9,  delay: 1700, type: 'incremental' },
  { char: 'A', col: 5,  row: 10, delay: 1810, type: 'incremental' },
  { char: 'L', col: 5,  row: 11, delay: 1920, type: 'incremental' },

  // ── SUITE — reveal left to right, skip shared E at col 5 ─────────────────
  { char: 'S', col: 1,  row: 5,  delay: 2080, type: 'suite' },
  { char: 'U', col: 2,  row: 5,  delay: 2200, type: 'suite' },
  { char: 'I', col: 3,  row: 5,  delay: 2320, type: 'suite' },
  { char: 'T', col: 4,  row: 5,  delay: 2440, type: 'suite' },
  // E at (col 5, row 5) already placed above
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void
}

export function CoverPage({ onComplete }: Props) {
  const [phase, setPhase] = useState<'animating' | 'complete' | 'exiting'>('animating')

  // Mark animation complete after all letters have appeared
  useEffect(() => {
    const t = setTimeout(() => setPhase('complete'), 3100)
    return () => clearTimeout(t)
  }, [])

  const exit = useCallback(() => {
    setPhase(prev => {
      if (prev === 'exiting') return prev
      setTimeout(onComplete, 850)
      return 'exiting'
    })
  }, [onComplete])

  // Auto-advance 2.8 s after animation completes
  useEffect(() => {
    if (phase !== 'complete') return
    const t = setTimeout(exit, 2800)
    return () => clearTimeout(t)
  }, [phase, exit])

  // Any key press skips
  useEffect(() => {
    window.addEventListener('keydown', exit)
    return () => window.removeEventListener('keydown', exit)
  }, [exit])

  return (
    <div
      className={`id-cover id-cover--${phase}`}
      onClick={exit}
      aria-hidden="true"
    >
      {/* Word mark grid */}
      <div className="id-cover__grid">
        {LETTERS.map((l, i) => (
          <span
            key={i}
            className={`id-cover__letter id-cover__letter--${l.type}`}
            style={{
              gridColumn: l.col,
              gridRow: l.row,
              animationDelay: `${l.delay}ms`,
            }}
          >
            {l.char}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div className={`id-cover__footer ${phase === 'complete' ? 'id-cover__footer--visible' : ''}`}>
        <div className="id-cover__line" />
      </div>
    </div>
  )
}
