import { useState, useEffect } from 'react'
import { GlobeBackground } from '../components/GlobeBackground'

// ── Client View ───────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void
}

type ModalType = 'reach' | 'attribution' | 'audit' | null

function openGmailAudit() {
  const subject = 'Strategy Audit Request'
  const body = [
    `Hi,`,
    ``,
    `I'd like to schedule a Strategy Audit to review our incremental opportunities.`,
    ``,
    `Please share your available times — looking forward to connecting.`,
  ].join('\n')
  const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(url, '_blank')
}

export function ClientView({ onBack }: Props) {
  const [zoomContinent, setZoomContinent] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalType>(null)

  useEffect(() => {
    const t = setTimeout(() => setZoomContinent(0), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!modal) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal])

  return (
    <div className="id-dashboard">

      <GlobeBackground zoomContinent={zoomContinent} />

      <div className="id-dashboard__header">
        <button className="id-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="id-dashboard__title-wrap">
          <h2 className="id-dashboard__title-text">Client View</h2>
        </div>
      </div>

      {/* Summary tiles — placeholder */}
      <div className="id-dashboard__kpis">
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Active Clients</span>
          <span className="id-kpi-tile__value">—</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Total Campaigns</span>
          <span className="id-kpi-tile__value">—</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Total Budget</span>
          <span className="id-kpi-tile__value">—</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Avg Performance</span>
          <span className="id-kpi-tile__value">—</span>
        </div>
      </div>

      {/* ── Action cards ──────────────────────────────────────────────────── */}
      <div className="id-client__cards">

        {/* 1 — Unlock Hidden Reach */}
        <button
          className="id-client__card id-client__card--reach"
          onClick={() => setModal('reach')}
        >
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
              <line x1="12" y1="2" x2="12" y2="4.5"/>
              <line x1="12" y1="19.5" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="4.5" y2="12"/>
              <line x1="19.5" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Growth Opportunity</span>
          <span className="id-client__card-title">Unlock Hidden Reach</span>
          <span className="id-client__card-desc">
            Your strongest campaigns are building audiences beyond their last click. Discover where your media is quietly expanding — and where momentum is ready to scale.
          </span>
          <span className="id-client__card-cta">Explore Reach Potential →</span>
        </button>

        {/* 2 — Eliminate Attribution Blindspots */}
        <button
          className="id-client__card id-client__card--attribution"
          onClick={() => setModal('attribution')}
        >
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Truth in Data</span>
          <span className="id-client__card-title">Eliminate Attribution Blindspots</span>
          <span className="id-client__card-desc">
            Standard attribution models only capture part of the picture. Incrementality testing reveals the true causal impact of every dollar — so you know exactly what's working.
          </span>
          <span className="id-client__card-cta">Explore Measurement →</span>
        </button>

        {/* 3 — Schedule a Strategy Audit */}
        <button
          className="id-client__card id-client__card--audit"
          onClick={() => setModal('audit')}
        >
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none"/>
              <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">We're Here to Help</span>
          <span className="id-client__card-title">Book a Strategy Audit</span>
          <span className="id-client__card-desc">
            Reserve 30 minutes with your Growth Director. Leave with a clear incremental opportunity map and a prioritized plan — not a pitch deck.
          </span>
          <span className="id-client__card-cta">Schedule Your Session →</span>
        </button>

      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="id-client__modal-overlay" onClick={() => setModal(null)}>
          <div className="id-client__modal" onClick={e => e.stopPropagation()}>

            <button
              className="id-client__modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Unlock Hidden Reach */}
            {modal === 'reach' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--reach">
                  <span className="id-client__modal-kicker">Growth Opportunity</span>
                  <h3 className="id-client__modal-title">Unlock Hidden Reach</h3>
                  <p className="id-client__modal-intro">
                    The audiences your media builds don't always convert right away — but that doesn't make them any less real. Incrementality analysis reveals the true reach your campaigns generate beyond what attribution models ever credit.
                  </p>
                </div>
                <div className="id-client__modal-points">
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                    <div>
                      <strong>Beyond Last-Click</strong>
                      <p>See which campaigns are generating real awareness lift — not just the conversions they happen to get credited for.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                    <div>
                      <strong>Net-New Audience Discovery</strong>
                      <p>Identify the incremental audiences your media is reaching for the first time — the growth attribution never shows you.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                    <div>
                      <strong>Scale With Confidence</strong>
                      <p>Once true reach is measured, invest more in channels genuinely expanding your market — not just claiming credit for it.</p>
                    </div>
                  </div>
                </div>
                <div className="id-client__modal-footer">
                  <button
                    className="id-client__modal-cta id-client__modal-cta--reach"
                    onClick={() => setModal('audit')}
                  >
                    Book a Strategy Audit →
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Eliminate Attribution Blindspots */}
            {modal === 'attribution' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--attribution">
                  <span className="id-client__modal-kicker">Truth in Data</span>
                  <h3 className="id-client__modal-title">Eliminate Attribution Blindspots</h3>
                  <p className="id-client__modal-intro">
                    Every attribution model — from last-click to data-driven — tells a story. Incrementality testing reveals whether that story is true. Instead of crediting the loudest channel, we measure actual causation.
                  </p>
                </div>
                <div className="id-client__modal-points">
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8EE7F1' }}>◈</span>
                    <div>
                      <strong>Causation Over Correlation</strong>
                      <p>Incrementality testing isolates the true lift your media generates — not the lift it claims.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8EE7F1' }}>◈</span>
                    <div>
                      <strong>Channel-Level Truth</strong>
                      <p>Understand which channels are genuinely driving incremental outcomes versus riding the wave of organic demand.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8EE7F1' }}>◈</span>
                    <div>
                      <strong>Smarter Budget Allocation</strong>
                      <p>Re-allocate spend based on measured reality — and stop paying for conversions that would have happened anyway.</p>
                    </div>
                  </div>
                </div>
                <div className="id-client__modal-footer">
                  <button
                    className="id-client__modal-cta id-client__modal-cta--attribution"
                    onClick={() => setModal('audit')}
                  >
                    Book a Strategy Audit →
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Strategy Audit */}
            {modal === 'audit' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--audit">
                  <span className="id-client__modal-kicker">We're Here to Help</span>
                  <h3 className="id-client__modal-title">Book a Strategy Audit</h3>
                  <p className="id-client__modal-intro">
                    This isn't a sales call — it's a working session. You'll leave with a clear incremental opportunity map, an honest attribution assessment, and concrete next steps tailored to your business.
                  </p>
                </div>
                <div className="id-client__modal-points">
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#AEF33E' }}>◈</span>
                    <div>
                      <strong>30-Minute Deep Dive</strong>
                      <p>A focused session with your Growth Director — no fluff, no pitch deck. Just your data and a clear path forward.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#AEF33E' }}>◈</span>
                    <div>
                      <strong>Incremental Opportunity Map</strong>
                      <p>Walk away with a clear view of where your highest-confidence growth levers are right now.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#AEF33E' }}>◈</span>
                    <div>
                      <strong>Your Next Best Move</strong>
                      <p>A prioritized action plan you can act on immediately — not a deck you'll read three weeks from now.</p>
                    </div>
                  </div>
                </div>
                <div className="id-client__modal-footer">
                  <button
                    className="id-client__modal-cta id-client__modal-cta--audit"
                    onClick={() => { openGmailAudit(); setModal(null) }}
                  >
                    Schedule Your Session →
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>
                    Maybe Later
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
