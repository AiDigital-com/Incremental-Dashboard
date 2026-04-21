import { useState, useEffect, useMemo } from 'react'
import { GlobeBackground } from '../components/GlobeBackground'
import { CAMPAIGNS } from '../data/campaigns'
import type { Campaign } from '../components/IncrementalDashboard'

// ── Client context ────────────────────────────────────────────────────────────
// This view represents one specific advertiser.
const CLIENT_NAME = 'Bradley MediaWorks'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBudget(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtKpi(val: number, unit: string): string {
  if (unit === '%') return `${val.toFixed(1)}%`
  if (unit === '$') return `$${val.toFixed(2)}`
  return `${val.toFixed(2)}x`
}

function gmailCompose(subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// ── Audience suggestion data ──────────────────────────────────────────────────

type AudienceTag = 'Lookalike' | '3PS' | 'Contextual'

interface AudienceSuggestion { type: AudienceTag; label: string; desc: string }

const AUDIENCE_SUGGESTIONS: Record<string, AudienceSuggestion[]> = {
  CTV: [
    { type: 'Lookalike', label: 'High-VCR Viewer Lookalike', desc: '1P match on users mirroring your highest-completion CTV viewers.' },
    { type: '3PS',       label: 'Streaming Household 3PS',   desc: 'Cord-cutter & OTT-heavy households from Nielsen streaming data.' },
  ],
  'CTV/OTT': [
    { type: 'Lookalike', label: 'High-VCR Viewer Lookalike', desc: '1P match on users mirroring your highest-completion CTV/OTT viewers.' },
    { type: '3PS',       label: 'Streaming Household 3PS',   desc: 'Cord-cutter & OTT-heavy households sourced from Nielsen streaming data.' },
  ],
  Display: [
    { type: 'Lookalike', label: 'Click-Through Behavioral Lookalike', desc: 'Prospecting audiences mirroring your top-clicking Display visitors.' },
    { type: '3PS',       label: 'In-Market Intent 3PS',               desc: 'Active category researchers from Oracle/Experian data partnerships.' },
  ],
  Meta: [
    { type: 'Lookalike', label: 'Meta Customer List LAL',  desc: '2% Lookalike built from your highest-value converters in Meta Ads Manager.' },
    { type: '3PS',       label: 'Life Event Intent 3PS',   desc: 'Users exhibiting purchase-trigger life events relevant to your category.' },
  ],
  Search: [
    { type: 'Lookalike', label: 'RLSA Behavioral Lookalike',    desc: 'Similar-intent users outside your current keyword match radius.' },
    { type: '3PS',       label: 'Competitor Conquesting 3PS',   desc: 'In-market users actively researching competitor brands.' },
  ],
  Video: [
    { type: 'Lookalike', label: 'Video Completion Lookalike', desc: 'Prospects mirroring users completing 75%+ of your video creative.' },
    { type: 'Contextual', label: 'Content Category Contextual', desc: 'Inventory adjacent to content your top video viewers consume most.' },
  ],
  YouTube: [
    { type: 'Lookalike', label: 'YouTube Engaged Viewer Lookalike', desc: 'Similar-to-engaged audience from Google Customer Match data.' },
    { type: '3PS',       label: 'Video Intent 3PS',                 desc: 'Users with strong video engagement signals across Google properties.' },
  ],
  Audio: [
    { type: 'Lookalike', label: 'Podcast Listener Lookalike',     desc: '1P match from top-completion audio listeners for podcast inventory.' },
    { type: '3PS',       label: 'Music & Podcast Behavioral 3PS', desc: 'Heavy audio consumers indexed against your best listener profiles.' },
  ],
  DOOH: [
    { type: '3PS',        label: 'Foot Traffic 3PS',     desc: 'Location-based audiences who index high for your DOOH placement areas.' },
    { type: 'Contextual', label: 'Proximity Behavioral', desc: 'Mobile users within range of your best-performing DOOH screens.' },
  ],
}

const DEFAULT_SUGGESTIONS: AudienceSuggestion[] = [
  { type: 'Lookalike', label: 'Performance Behavioral Lookalike', desc: 'Prospect audiences mirroring your top-converting campaign segment.' },
  { type: '3PS',       label: 'Category Intent 3PS',              desc: 'In-market audiences from verified third-party data partnerships.' },
]

const TAG_COLORS: Record<AudienceTag, string> = {
  'Lookalike': '#8263FF',
  '3PS':       '#8EE7F1',
  'Contextual':'#AEF33E',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { onBack: () => void }
type ModalType = 'audience' | 'breakdown' | 'scenario' | null

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientView({ onBack }: Props) {
  const [zoomContinent,       setZoomContinent]       = useState<number | null>(null)
  const [modal,                setModal]               = useState<ModalType>(null)
  const [showAudienceAnalysis, setShowAudienceAnalysis] = useState(false)
  const [selectedCampaign,     setSelectedCampaign]    = useState<Campaign | null>(null)
  const [showMediaPlans,       setShowMediaPlans]      = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setZoomContinent(0), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!modal) {
      setShowAudienceAnalysis(false)
      setSelectedCampaign(null)
      setShowMediaPlans(false)
    }
  }, [modal])

  useEffect(() => {
    if (!modal) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal])

  // ── Client-specific campaign data ─────────────────────────────────────────
  const clientCampaigns = useMemo(
    () => CAMPAIGNS.filter(c => c.clientName === CLIENT_NAME && c.performanceMultiplier >= 1.0),
    []
  )

  const activeCampaignCount  = clientCampaigns.length
  const activeBudget         = clientCampaigns.reduce((s, c) => s + c.budget, 0)
  const availableIncremental = clientCampaigns.reduce((s, c) => s + c.incrementalDollars, 0)

  // ── Audience performance data (for analysis view) ─────────────────────────
  const audiencePerformance = useMemo(() => {
    const byType = new Map<string, { totalPerf: number; count: number; kpiLabel: string; kpiUnit: string; kpiSum: number }>()
    for (const c of clientCampaigns) {
      const e = byType.get(c.name)
      if (e) { e.totalPerf += c.performanceMultiplier; e.count++; e.kpiSum += c.kpiValue }
      else   { byType.set(c.name, { totalPerf: c.performanceMultiplier, count: 1, kpiLabel: c.kpiLabel, kpiUnit: c.kpiUnit, kpiSum: c.kpiValue }) }
    }
    return [...byType.entries()]
      .map(([name, d]) => ({
        name,
        avgPerf: d.totalPerf / d.count,
        kpiLabel: d.kpiLabel,
        kpiUnit: d.kpiUnit,
        avgKpi: d.kpiSum / d.count,
        suggestions: AUDIENCE_SUGGESTIONS[name] ?? DEFAULT_SUGGESTIONS,
      }))
      .sort((a, b) => b.avgPerf - a.avgPerf)
  }, [clientCampaigns])

  const maxPerf = audiencePerformance[0]?.avgPerf ?? 1
  const minPerf = 1.0

  // ── Email helpers ─────────────────────────────────────────────────────────
  function openGrowthEmail(c: Campaign) {
    window.open(gmailCompose(
      `Campaign Opportunities — ${c.clientName}: ${c.name}`,
      `Hi,\n\nI wanted to connect regarding incremental opportunities for the ${c.name} campaign under ${c.clientName}.\n\nWith ${formatBudget(c.incrementalDollars)} in available incremental, there's real momentum to capitalize on before this flight closes.\n\nWould love to explore options — let me know when you're available!\n`,
    ), '_blank')
  }

  function openRequestNow(c: Campaign) {
    window.open(gmailCompose(
      `Incremental Breakdown Request — ${c.clientName}`,
      `Hi,\n\nI'm reaching out to request an incremental breakdown for our ${c.name} campaign under ${c.clientName}.\n\nTotal Incremental Available: ${formatBudget(c.incrementalDollars)}\n\nI'd like to understand:\n  • Where additional budget would generate the most lift\n  • Recommended audiences and channels for expansion\n  • A projected performance analysis for each option\n\nLooking forward to your recommendations!\n`,
    ), '_blank')
  }

  function openChatWithMax(c: Campaign) {
    window.open(gmailCompose(
      `Incremental Options — ${c.clientName}`,
      `Hi Max,\n\nI'd love to explore my incremental options for the ${c.name} campaign under ${c.clientName}.\n\nWe currently have ${formatBudget(c.incrementalDollars)} available and I'm looking for your best recommendation on where to put it to work.\n\nThanks!\n`,
    ), '_blank')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="id-dashboard">

      <GlobeBackground zoomContinent={zoomContinent} />

      <div className="id-dashboard__header">
        <button className="id-back-btn" onClick={onBack}>← Back</button>
        <div className="id-dashboard__title-wrap">
          <h2 className="id-dashboard__title-text">Client View</h2>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="id-dashboard__kpis">
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Client Name</span>
          <span className="id-kpi-tile__value" style={{ fontSize: '0.85rem' }}>{CLIENT_NAME}</span>
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

      {/* Cards */}
      <div className="id-client__cards">

        {/* Audience Expander */}
        <button className="id-client__card id-client__card--reach" onClick={() => setModal('audience')}>
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

        {/* Incremental Breakdown */}
        <button className="id-client__card id-client__card--attribution" onClick={() => setModal('breakdown')}>
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6"  y1="20" x2="6"  y2="14"/>
              <line x1="2"  y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Performance</span>
          <span className="id-client__card-title">Incremental Breakdown</span>
          <span className="id-client__card-desc">
            Understand exactly where your budget is generating real incremental lift — ranked by your best-performing campaigns and channels.
          </span>
          <span className="id-client__card-cta">View Breakdown →</span>
        </button>

        {/* Scenario Explorer */}
        <button className="id-client__card id-client__card--audit" onClick={() => setModal('scenario')}>
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8"  x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/>
              <line x1="9" y1="8"  x2="15" y2="8"/>
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

            <button className="id-client__modal-close" onClick={() => setModal(null)} aria-label="Close">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* ── Audience Expander ──────────────────────────────────────── */}
            {modal === 'audience' && !showAudienceAnalysis && (
              <>
                <div className="id-client__modal-header id-client__modal-header--reach">
                  <span className="id-client__modal-kicker">Budget Reach</span>
                  <h3 className="id-client__modal-title">Audience Expander</h3>
                  <p className="id-client__modal-intro">
                    Your current budget is already working — but it may only be reaching audiences you already know. Audience Expander maps how that same budget, repositioned, can generate net-new reach beyond your existing footprint.
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
                  <button className="id-client__modal-cta id-client__modal-cta--reach" onClick={() => setShowAudienceAnalysis(true)}>
                    Analyze Current Audiences →
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}

            {/* ── Audience Analysis (drill-down) ─────────────────────────── */}
            {modal === 'audience' && showAudienceAnalysis && (
              <>
                <div className="id-client__modal-header id-client__modal-header--reach">
                  <button className="id-client__analysis-back" onClick={() => setShowAudienceAnalysis(false)}>
                    ← Back
                  </button>
                  <span className="id-client__modal-kicker">Audience Analysis — {CLIENT_NAME}</span>
                  <h3 className="id-client__modal-title">Current Audience Performance</h3>
                  <p className="id-client__modal-intro">Based on your active campaign mix, here is how each audience type is performing — along with recommended expansion audiences ranked by projected incremental lift.</p>
                </div>

                <div className="id-client__analysis-table">
                  {audiencePerformance.map(a => {
                    const barW = maxPerf > minPerf ? ((a.avgPerf - minPerf) / (maxPerf - minPerf)) * 100 : 50
                    const barColor = a.avgPerf >= 1.3 ? '#AEF33E' : a.avgPerf >= 1.15 ? '#8EE7F1' : '#FDE68A'
                    return (
                      <div key={a.name} className="id-client__analysis-row">
                        <div className="id-client__analysis-row-top">
                          <span className="id-client__analysis-name">{a.name}</span>
                          <span className="id-client__analysis-kpi">{a.kpiLabel} {fmtKpi(a.avgKpi, a.kpiUnit)}</span>
                          <span className="id-client__analysis-perf" style={{ color: barColor }}>{a.avgPerf.toFixed(2)}x goal</span>
                        </div>
                        <div className="id-client__analysis-bar-track">
                          <div className="id-client__analysis-bar-fill" style={{ width: `${barW}%`, background: barColor }} />
                        </div>
                        <div className="id-client__analysis-suggestions">
                          {a.suggestions.map((s, i) => (
                            <div key={i} className="id-client__suggestion-item">
                              <span className="id-client__suggestion-tag" style={{ background: TAG_COLORS[s.type] + '22', color: TAG_COLORS[s.type], borderColor: TAG_COLORS[s.type] + '44' }}>
                                {s.type}
                              </span>
                              <div className="id-client__suggestion-text">
                                <strong>{s.label}</strong>
                                <span>{s.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="id-client__modal-footer">
                  <button className="id-client__modal-cta id-client__modal-cta--reach" onClick={() => setModal('scenario')}>
                    Build a Scenario →
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}

            {/* ── Incremental Breakdown — campaign list ─────────────────── */}
            {modal === 'breakdown' && !selectedCampaign && (
              <>
                <div className="id-client__modal-header id-client__modal-header--attribution">
                  <span className="id-client__modal-kicker">Performance — {CLIENT_NAME}</span>
                  <h3 className="id-client__modal-title">Incremental Breakdown</h3>
                  <p className="id-client__modal-intro">Active campaigns ranked by available incremental. Click any campaign to view details and next-step options.</p>
                </div>

                <div className="id-client__breakdown-list">
                  {clientCampaigns
                    .slice()
                    .sort((a, b) => b.incrementalDollars - a.incrementalDollars)
                    .map(c => (
                      <div key={c.id} className="id-client__breakdown-item">
                        <div className="id-client__breakdown-info" onClick={() => { setSelectedCampaign(c); setShowMediaPlans(false) }}>
                          <span className="id-client__breakdown-name">{c.name}</span>
                          <span className="id-client__breakdown-meta">
                            Budget {formatBudget(c.budget)} &nbsp;·&nbsp;
                            <span style={{ color: '#AEF33E' }}>{formatBudget(c.incrementalDollars)} available</span>
                          </span>
                        </div>
                        <div className="id-client__breakdown-icons">
                          {/* Email icon — chat with growth/CS */}
                          <button
                            className="id-client__breakdown-icon-btn"
                            title="Chat with Growth team"
                            onClick={e => { e.stopPropagation(); openGrowthEmail(c) }}
                            aria-label="Email growth team"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                              <polyline points="22,6 12,13 2,6"/>
                            </svg>
                          </button>
                          {/* Plus icon — advertiser can take more budget */}
                          <button
                            className="id-client__breakdown-icon-btn id-client__breakdown-icon-btn--plus"
                            title="Expand budget for this campaign"
                            onClick={e => { e.stopPropagation(); setSelectedCampaign(c); setShowMediaPlans(false) }}
                            aria-label="Expand budget"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="id-client__modal-footer">
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}

            {/* ── Incremental Breakdown — campaign detail ───────────────── */}
            {modal === 'breakdown' && selectedCampaign && (
              <>
                <div className="id-client__modal-header id-client__modal-header--attribution">
                  <button className="id-client__analysis-back" onClick={() => { setSelectedCampaign(null); setShowMediaPlans(false) }}>
                    ← All Campaigns
                  </button>
                  <span className="id-client__modal-kicker">{CLIENT_NAME}</span>
                  <h3 className="id-client__modal-title">{selectedCampaign.name}</h3>
                </div>

                {/* Total Incremental Available */}
                <div className="id-client__breakdown-total">
                  <span className="id-client__breakdown-total-label">Total Incremental Available</span>
                  <span className="id-client__breakdown-total-value">{formatBudget(selectedCampaign.incrementalDollars)}</span>
                </div>

                {/* View Active Media Plans */}
                <button
                  className={`id-client__breakdown-plans-toggle${showMediaPlans ? ' is-open' : ''}`}
                  onClick={() => setShowMediaPlans(v => !v)}
                >
                  <span>View Active Media Plans</span>
                  <span className="id-client__breakdown-plans-chevron">{showMediaPlans ? '▴' : '▾'}</span>
                </button>
                {showMediaPlans && (
                  <div className="id-client__breakdown-plans">
                    {clientCampaigns
                      .slice()
                      .sort((a, b) => b.incrementalDollars - a.incrementalDollars)
                      .map(c => (
                        <div key={c.id} className={`id-client__breakdown-plan-row${c.id === selectedCampaign.id ? ' is-selected' : ''}`}>
                          <span className="id-client__breakdown-plan-name">{c.name}</span>
                          <span className="id-client__breakdown-plan-meta">{formatBudget(c.budget)} budget</span>
                          <span className="id-client__breakdown-plan-inc">{formatBudget(c.incrementalDollars)}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="id-client__action-btns">
                  <button className="id-client__action-btn id-client__action-btn--request" onClick={() => openRequestNow(selectedCampaign)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Want to see a plan? Request Now
                  </button>
                  <button className="id-client__action-btn id-client__action-btn--chat" onClick={() => openChatWithMax(selectedCampaign)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Want to see your incremental options? Chat with Max!
                  </button>
                </div>

                <div className="id-client__modal-footer" style={{ marginTop: 12 }}>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}

            {/* ── Scenario Explorer ──────────────────────────────────────── */}
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
                  <button className="id-client__modal-cta id-client__modal-cta--audit" onClick={() => setModal(null)}>
                    Coming Soon
                  </button>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
