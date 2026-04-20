import { useState, useEffect, useMemo } from 'react'
import { GlobeBackground } from '../components/GlobeBackground'
import { CAMPAIGNS } from '../data/campaigns'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBudget(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// ── Client View ───────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void
}

type ModalType = 'audience' | 'breakdown' | 'scenario' | null

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

  // KPI tile values — computed from active (at/above goal) campaigns
  const activeCampaigns = useMemo(
    () => CAMPAIGNS.filter(c => c.performanceMultiplier >= 1.0),
    []
  )
  const activeCampaignCount = activeCampaigns.length
  const activeBudget        = activeCampaigns.reduce((s, c) => s + c.budget, 0)
  const availableIncremental = activeCampaigns.reduce((s, c) => s + c.incrementalDollars, 0)

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

      {/* Summary tiles */}
      <div className="id-dashboard__kpis">
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Client Name</span>
          <span className="id-kpi-tile__value">—</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Active Campaign Count</span>
          <span className="id-kpi-tile__value">{activeCampaignCount}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Active Budget</span>
          <span className="id-kpi-tile__value">{formatBudget(activeBudget)}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Available Incremental</span>
          <span className="id-kpi-tile__value">{formatBudget(availableIncremental)}</span>
        </div>
      </div>

      {/* ── Action cards ──────────────────────────────────────────────────── */}
      <div className="id-client__cards">

        {/* 1 — Audience Expander */}
        <button
          className="id-client__card id-client__card--reach"
          onClick={() => setModal('audience')}
        >
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Budget Reach</span>
          <span className="id-client__card-title">Audience Expander</span>
          <span className="id-client__card-desc">
            See how your current budget can be stretched to reach entirely new audiences — beyond the segments your campaigns already touch.
          </span>
          <span className="id-client__card-cta">Explore Reach →</span>
        </button>

        {/* 2 — Incremental Breakdown */}
        <button
          className="id-client__card id-client__card--attribution"
          onClick={() => setModal('breakdown')}
        >
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
              <line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Performance</span>
          <span className="id-client__card-title">Incremental Breakdown</span>
          <span className="id-client__card-desc">
            Understand exactly where your budget is generating real incremental lift — ranked by your best-performing campaigns and channels.
          </span>
          <span className="id-client__card-cta">View Breakdown →</span>
        </button>

        {/* 3 — Scenario Explorer */}
        <button
          className="id-client__card id-client__card--audit"
          onClick={() => setModal('scenario')}
        >
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/>
              <line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Budget Planning</span>
          <span className="id-client__card-title">Scenario Explorer</span>
          <span className="id-client__card-desc">
            Have incremental budget available? Play around with different allocation scenarios to see which mix drives the highest projected lift.
          </span>
          <span className="id-client__card-cta">Run Scenarios →</span>
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

            {/* Audience Expander */}
            {modal === 'audience' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--reach">
                  <span className="id-client__modal-kicker">Budget Reach</span>
                  <h3 className="id-client__modal-title">Audience Expander</h3>
                  <p className="id-client__modal-intro">
                    Your current budget is already working — but it may only be reaching audiences you already know. Audience Expander maps out how that same budget, repositioned, can generate net-new reach beyond your existing customer footprint.
                  </p>
                </div>
                <div className="id-client__modal-points">
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                    <div>
                      <strong>Net-New Audience Mapping</strong>
                      <p>Identify untapped segments your current campaigns aren't reaching — and quantify the growth opportunity each represents.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                    <div>
                      <strong>Budget Reallocation Modeling</strong>
                      <p>See how shifting even a portion of your active budget toward expansion channels can meaningfully widen your reach.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                    <div>
                      <strong>Incremental Audience Lift</strong>
                      <p>Measure the audiences you're adding that would never have been reached through your existing campaign mix alone.</p>
                    </div>
                  </div>
                </div>
                <div className="id-client__modal-footer">
                  <button
                    className="id-client__modal-cta id-client__modal-cta--reach"
                    onClick={() => setModal('scenario')}
                  >
                    Try Scenario Explorer →
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Incremental Breakdown */}
            {modal === 'breakdown' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--attribution">
                  <span className="id-client__modal-kicker">Performance</span>
                  <h3 className="id-client__modal-title">Incremental Breakdown</h3>
                  <p className="id-client__modal-intro">
                    Not every campaign dollar produces the same result. Incremental Breakdown shows you exactly which campaigns are generating real lift — ranked by performance so you know where your budget is truly working hardest.
                  </p>
                </div>
                <div className="id-client__modal-points">
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8EE7F1' }}>◈</span>
                    <div>
                      <strong>Campaign-Level Ranking</strong>
                      <p>See your campaigns sorted by actual incremental output — identify your top performers and your underperformers at a glance.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8EE7F1' }}>◈</span>
                    <div>
                      <strong>Channel Contribution Analysis</strong>
                      <p>Understand which channels (CTV, Display, Search, Social) are driving the most incremental value relative to their spend.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#8EE7F1' }}>◈</span>
                    <div>
                      <strong>Where to Apply Additional Budget</strong>
                      <p>Based on current performance, see the highest-confidence destinations for any incremental budget you have available.</p>
                    </div>
                  </div>
                </div>
                <div className="id-client__modal-footer">
                  <button
                    className="id-client__modal-cta id-client__modal-cta--attribution"
                    onClick={() => setModal('scenario')}
                  >
                    Try Scenario Explorer →
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Scenario Explorer */}
            {modal === 'scenario' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--audit">
                  <span className="id-client__modal-kicker">Budget Planning</span>
                  <h3 className="id-client__modal-title">Scenario Explorer</h3>
                  <p className="id-client__modal-intro">
                    Have incremental budget to deploy? Scenario Explorer lets you model different allocation strategies — across campaigns, channels, and timelines — to see which scenario is projected to generate the highest lift before you commit a dollar.
                  </p>
                </div>
                <div className="id-client__modal-points">
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#AEF33E' }}>◈</span>
                    <div>
                      <strong>Drag-and-Drop Budget Allocation</strong>
                      <p>Assign budget across your active campaigns and channels interactively — see projected incremental outcomes update in real time.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#AEF33E' }}>◈</span>
                    <div>
                      <strong>Side-by-Side Scenario Comparison</strong>
                      <p>Run multiple budget scenarios simultaneously and compare their projected incremental lift, reach, and efficiency side by side.</p>
                    </div>
                  </div>
                  <div className="id-client__modal-point">
                    <span className="id-client__modal-point-mark" style={{ color: '#AEF33E' }}>◈</span>
                    <div>
                      <strong>Commit With Confidence</strong>
                      <p>Choose the scenario that aligns with your goals, then hand it directly to your Growth Director to activate — no guesswork required.</p>
                    </div>
                  </div>
                </div>
                <div className="id-client__modal-footer">
                  <button
                    className="id-client__modal-cta id-client__modal-cta--audit"
                    onClick={() => setModal(null)}
                  >
                    Coming Soon
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>
                    Close
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
