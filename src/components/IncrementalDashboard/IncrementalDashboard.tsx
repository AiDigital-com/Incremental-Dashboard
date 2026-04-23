import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GlobeBackground } from '../GlobeBackground'
import { REGIONS, REGION_GDS } from '../AppSidebar/AppSidebar'
import type { Region } from '../AppSidebar/AppSidebar'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  clientName: string
  seller?: string                 // Growth Director / seller name
  startDate: string               // 'YYYY-MM-DD'
  endDate: string                 // 'YYYY-MM-DD'
  budget: number                  // current budget in dollars
  kpiLabel: string                // e.g. 'CTR', 'ROAS', 'CPA'
  kpiValue: number                // current KPI value
  kpiUnit: string                 // '%', 'x', '$'
  performanceMultiplier: number   // ratio vs goal (1.25 = exceeding by 1.25x)
  incrementalDollars: number      // estimated incremental revenue in dollars
}

interface Props {
  sessionId: string
  planName: string
  campaigns: Campaign[]
  onPlanNameChange: (name: string) => void
  onCampaignsChange: (campaigns: Campaign[]) => void
  onBack?: () => void
  selectedRegion?: string
  selectedGD?: string
  onRegionChange?: (r: string) => void
  onGDChange?: (gd: string) => void
  selectedClient?: string
  onClientChange?: (c: string) => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBudget(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatKpi(value: number, unit: string): string {
  if (unit === '$') return `$${value.toFixed(2)}`
  if (unit === '%') return `${value.toFixed(1)}%`
  return `${value.toFixed(2)}x`
}

function daysLeft(endDate: string): number {
  if (!endDate) return 0
  const [y, m, d] = endDate.split('-').map(Number)
  const end = new Date(y, m - 1, d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((end.getTime() - now.getTime()) / 86_400_000))
}

function openGmailCompose(c: Campaign) {
  const subject = `Incremental Opportunity — ${c.clientName}`
  const body = [
    `I wanted to reach out regarding an incremental media investment opportunity for ${c.clientName}.`,
    '',
    `Based on our latest campaign performance data, ${c.clientName}'s campaigns are currently exceeding performance benchmarks, and we have ${formatBudget(c.incrementalDollars)} in incremental availability.`,
    '',
    `This represents an opportunity to extend the strong performance we're seeing while momentum is on our side.`,
    '',
    `I'd love to connect to discuss how we can put this incremental to work before the flight window closes!`,
  ].join('\n')
  const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(url, '_blank')
}

// Download always exports ALL active campaigns regardless of current page
function downloadCSV(campaigns: Campaign[], filename: string) {
  const headers = [
    'Client Name', 'Campaign Name', 'Start Date', 'End Date', 'Current Budget',
    'KPI', 'KPI Value', 'Performance vs. Goal (x)', 'Incremental Availability ($)', 'Days Left in Flight',
  ]
  const rows = campaigns.map(c => [
    c.clientName,
    c.name,
    c.startDate,
    c.endDate,
    c.budget,
    c.kpiLabel,
    `${c.kpiValue}${c.kpiUnit}`,
    c.performanceMultiplier.toFixed(2),
    c.incrementalDollars,
    daysLeft(c.endDate),
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ────────────────────────────────────────────────────────────────

export function IncrementalDashboard({ planName, campaigns, onBack, selectedRegion = '', selectedGD = '', onRegionChange, onGDChange, selectedClient = '', onClientChange }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomContinent, setZoomContinent] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [campaignTypeFilters, setCampaignTypeFilters] = useState<string[]>([])
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [typeDropdownPos, setTypeDropdownPos] = useState({ top: 0, left: 0 })
  const typeDropdownRef = useRef<HTMLTableCellElement>(null)
  const typeDropdownBtnRef = useRef<HTMLButtonElement>(null)
  const typeDropdownPanelRef = useRef<HTMLDivElement>(null)
  const gds = selectedRegion ? REGION_GDS[selectedRegion as Region] ?? [] : []

  useEffect(() => {
    const t = setTimeout(() => setZoomContinent(0), 80)
    return () => clearTimeout(t)
  }, [])

  // All campaigns at or above goal (before client filter)
  const allActiveCampaigns = useMemo(
    () => campaigns.filter(c => c.performanceMultiplier >= 1.0),
    [campaigns]
  )

  // Unique client names for the client dropdown
  const uniqueClients = useMemo(
    () => [...new Set(allActiveCampaigns.map(c => c.clientName))].sort(),
    [allActiveCampaigns]
  )

  // Unique campaign types for the Campaign Name filter dropdown
  const campaignTypes = useMemo(
    () => [...new Set(allActiveCampaigns.map(c => c.name))].sort(),
    [allActiveCampaigns]
  )

  // Apply client filter
  const activeCampaigns = useMemo(
    () => selectedClient
      ? allActiveCampaigns.filter(c => c.clientName === selectedClient)
      : allActiveCampaigns,
    [allActiveCampaigns, selectedClient]
  )

  // Apply campaign type filter and sort
  const sortedCampaigns = useMemo(() => {
    let rows = campaignTypeFilters.length > 0
      ? activeCampaigns.filter(c => campaignTypeFilters.includes(c.name))
      : activeCampaigns

    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        let av: string | number
        let bv: string | number
        if (sortKey === 'clientName')        { av = a.clientName.toLowerCase();  bv = b.clientName.toLowerCase() }
        else if (sortKey === 'startDate')    { av = a.startDate;                 bv = b.startDate }
        else if (sortKey === 'endDate')      { av = a.endDate;                   bv = b.endDate }
        else if (sortKey === 'budget')       { av = a.budget;                    bv = b.budget }
        else if (sortKey === 'incremental')  { av = a.incrementalDollars;        bv = b.incrementalDollars }
        else if (sortKey === 'daysLeft')     { av = daysLeft(a.endDate);         bv = daysLeft(b.endDate) }
        else return 0
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return rows
  }, [activeCampaigns, sortKey, sortDir, campaignTypeFilters])

  // Close campaign type dropdown on outside click
  useEffect(() => {
    if (!showTypeDropdown) return
    function handler(e: MouseEvent) {
      const inBtn   = typeDropdownRef.current?.contains(e.target as Node)
      const inPanel = typeDropdownPanelRef.current?.contains(e.target as Node)
      if (!inBtn && !inPanel) setShowTypeDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTypeDropdown])

  // Reset to page 1 whenever the campaign set, filters, or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [campaigns, selectedClient, sortKey, sortDir, campaignTypeFilters])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function sortIcon(key: string) {
    if (sortKey !== key) return <span className="id-th-sort-icon">↕</span>
    return <span className="id-th-sort-icon id-th-sort-icon--active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / PAGE_SIZE))
  const pagedCampaigns = sortedCampaigns.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // ── Summary metrics (across ALL active campaigns, not just current page) ──
  const totalBudget      = activeCampaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const totalIncremental = activeCampaigns.reduce((s, c) => s + (c.incrementalDollars || 0), 0)
  const avgDaysLeft      = activeCampaigns.length
    ? Math.round(activeCampaigns.reduce((s, c) => s + daysLeft(c.endDate), 0) / activeCampaigns.length)
    : 0

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="id-dashboard">

      <GlobeBackground zoomContinent={zoomContinent} />

      {/* Header */}
      <div className="id-dashboard__header">
        {onBack && (
          <button className="id-back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="id-dashboard__title-wrap">
          <h2 className="id-dashboard__title-text">Campaign Overview</h2>
        </div>
        <div className="id-dashboard__header-actions">

          {/* Region filter */}
          <div className="id-header-filter-group">
            <label className="id-header-filter-label" htmlFor="region-select">Region</label>
            <div className="id-header-select-wrap">
              <select
                id="region-select"
                className="id-header-filter-select"
                value={selectedRegion}
                onChange={e => { onRegionChange?.(e.target.value); onGDChange?.(''); onClientChange?.('') }}
              >
                <option value="">All Regions</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="id-header-select-chevron" aria-hidden="true">▾</span>
            </div>
          </div>

          {/* Growth Director filter */}
          <div className="id-header-filter-group">
            <label className="id-header-filter-label" htmlFor="gd-select">Growth Director</label>
            <div className="id-header-select-wrap">
              <select
                id="gd-select"
                className="id-header-filter-select"
                value={selectedGD}
                onChange={e => { onGDChange?.(e.target.value); onClientChange?.('') }}
                disabled={!selectedRegion}
              >
                <option value="">{selectedRegion ? 'All Directors' : 'Select region first'}</option>
                {gds.map(gd => <option key={gd} value={gd}>{gd}</option>)}
              </select>
              <span className="id-header-select-chevron" aria-hidden="true">▾</span>
            </div>
          </div>

          {/* Client filter */}
          <div className="id-header-filter-group">
            <label className="id-header-filter-label" htmlFor="client-select">Client</label>
            <div className="id-header-select-wrap">
              <select
                id="client-select"
                className="id-header-filter-select"
                value={selectedClient}
                onChange={e => onClientChange?.(e.target.value)}
                disabled={!selectedRegion || !selectedGD}
              >
                <option value="">
                  {selectedRegion && selectedGD ? 'All Clients' : 'Select GD first'}
                </option>
                {uniqueClients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="id-header-select-chevron" aria-hidden="true">▾</span>
            </div>
          </div>

          <button
            className="id-download-btn"
            onClick={() => downloadCSV(activeCampaigns, planName)}
            disabled={activeCampaigns.length === 0}
          >
            ↓ Download
          </button>

        </div>
      </div>

      {/* Summary tiles */}
      <div className="id-dashboard__kpis">
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Total Active Budget</span>
          <span className="id-kpi-tile__value">{formatBudget(totalBudget)}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Campaigns On Track</span>
          <span className="id-kpi-tile__value">{activeCampaigns.length}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Total Incremental Availability</span>
          <span className="id-kpi-tile__value">{formatBudget(totalIncremental)}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Avg Days Left in Flight</span>
          <span className="id-kpi-tile__value">{avgDaysLeft}d</span>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="id-dashboard__table-wrap">
        <table className="id-table">
          {/* Fixed column widths — table-layout:fixed requires explicit sizing */}
          <colgroup>
            <col style={{ width: '11%' }} />{/* Client Name */}
            <col style={{ width: '16%' }} />{/* Campaign Name */}
            <col style={{ width: '8%'  }} />{/* Start Date */}
            <col style={{ width: '8%'  }} />{/* End Date */}
            <col style={{ width: '7%'  }} />{/* Budget */}
            <col style={{ width: '9%'  }} />{/* KPI */}
            <col style={{ width: '11%' }} />{/* Performance vs. Goal */}
            <col style={{ width: '10%' }} />{/* Incremental Availability */}
            <col style={{ width: '6%'  }} />{/* Days Left */}
            <col style={{ width: '10%' }} />{/* Initiate Outreach */}
          </colgroup>
          <thead>
            <tr>
              <th className="id-th--sortable" onClick={() => handleSort('clientName')}>
                Client Name{sortIcon('clientName')}
              </th>
              <th className="id-th--filter" ref={typeDropdownRef}>
                <button
                  ref={typeDropdownBtnRef}
                  className={`id-th-type-btn${campaignTypeFilters.length > 0 ? ' id-th-type-btn--active' : ''}`}
                  onClick={() => {
                    if (!showTypeDropdown && typeDropdownBtnRef.current) {
                      const r = typeDropdownBtnRef.current.getBoundingClientRect()
                      setTypeDropdownPos({ top: r.bottom + 4, left: r.left })
                    }
                    setShowTypeDropdown(v => !v)
                  }}
                  type="button"
                >
                  <span className="id-th-type-btn-label">
                    {campaignTypeFilters.length === 0
                      ? 'Campaign Name'
                      : campaignTypeFilters.length === 1
                      ? campaignTypeFilters[0]
                      : `Campaign (${campaignTypeFilters.length})`}
                  </span>
                  <span className="id-th-sort-icon">{showTypeDropdown ? '▴' : '▾'}</span>
                </button>
              </th>
              <th className="id-th--sortable" onClick={() => handleSort('startDate')}>
                Start Date{sortIcon('startDate')}
              </th>
              <th className="id-th--sortable" onClick={() => handleSort('endDate')}>
                End Date{sortIcon('endDate')}
              </th>
              <th className="id-th--sortable" onClick={() => handleSort('budget')}>
                Budget{sortIcon('budget')}
              </th>
              <th>KPI</th>
              <th>Performance vs. Goal</th>
              <th className="id-th--sortable" onClick={() => handleSort('incremental')}>
                Incremental Availability{sortIcon('incremental')}
              </th>
              <th className="id-th--sortable" onClick={() => handleSort('daysLeft')}>
                Days Left{sortIcon('daysLeft')}
              </th>
              <th>Initiate Outreach</th>
            </tr>
          </thead>
          <tbody>
            {sortedCampaigns.length === 0 && (
              <tr>
                <td colSpan={10} className="id-table__empty">
                  No qualifying campaigns match the selected filters.
                </td>
              </tr>
            )}
            {pagedCampaigns.map(c => {
              const remaining = daysLeft(c.endDate)
              return (
                <tr key={c.id} className="id-table__row">

                  <td className="id-table__client">{c.clientName}</td>

                  <td className="id-table__name">{c.name}</td>

                  <td className="id-table__date">{formatDate(c.startDate)}</td>

                  <td className="id-table__date">{formatDate(c.endDate)}</td>

                  <td className="id-table__budget">{formatBudget(c.budget)}</td>

                  <td className="id-table__kpi">
                    <span className="id-table__kpi-chip">{c.kpiLabel}</span>
                    <span className="id-table__kpi-num">{formatKpi(c.kpiValue, c.kpiUnit)}</span>
                  </td>

                  <td>
                    <span className="id-perf-badge id-perf-badge--above">
                      {c.performanceMultiplier.toFixed(2)}x above goal
                    </span>
                  </td>

                  <td className="id-table__incremental">
                    {formatBudget(c.incrementalDollars)}
                  </td>

                  <td className="id-table__days">
                    {remaining > 0 ? `${remaining}d` : 'Ended'}
                  </td>

                  <td className="id-table__outreach">
                    <button
                      className="id-send-email-btn"
                      onClick={() => openGmailCompose(c)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Send Email
                    </button>
                  </td>

                </tr>
              )
            })}
            {/* Ghost rows — pad to PAGE_SIZE so row height is identical on every page */}
            {Array.from({ length: Math.max(0, PAGE_SIZE - pagedCampaigns.length) }, (_, i) => (
              <tr key={`ghost-${i}`} className="id-table__row id-table__row--ghost">
                <td /><td /><td /><td /><td /><td /><td /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — bottom right */}
      {totalPages > 1 && (
        <div className="id-pagination">
          <span className="id-pagination__info">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedCampaigns.length)} of {sortedCampaigns.length}
          </span>
          <div className="id-pagination__controls">
            <button
              className="id-pagination__btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`id-pagination__btn${currentPage === page ? ' id-pagination__btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
            <button
              className="id-pagination__btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Campaign type dropdown portal — rendered to body to escape table overflow clipping */}
      {showTypeDropdown && createPortal(
        <div
          ref={typeDropdownPanelRef}
          className="id-th-type-dropdown id-th-type-dropdown--dark"
          style={{ position: 'fixed', top: typeDropdownPos.top, left: typeDropdownPos.left }}
        >
          {campaignTypes.map(t => (
            <label key={t} className="id-th-type-option">
              <input
                type="checkbox"
                checked={campaignTypeFilters.includes(t)}
                onChange={e => {
                  setCampaignTypeFilters(prev =>
                    e.target.checked ? [...prev, t] : prev.filter(x => x !== t)
                  )
                  setCurrentPage(1)
                }}
              />
              <span>{t}</span>
            </label>
          ))}
          {campaignTypeFilters.length > 0 && (
            <button
              className="id-th-type-clear"
              type="button"
              onClick={() => { setCampaignTypeFilters([]); setCurrentPage(1); setShowTypeDropdown(false) }}
            >
              Clear all
            </button>
          )}
        </div>,
        document.body
      )}

    </div>
  )
}
