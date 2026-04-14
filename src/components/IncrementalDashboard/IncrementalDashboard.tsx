// ── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  clientName: string
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
}

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

function downloadCSV(campaigns: Campaign[], filename: string) {
  const headers = [
    'Client Name', 'Campaign Name', 'Start Date', 'End Date', 'Current Budget',
    'KPI', 'KPI Value', 'Performance vs. Goal (x)', 'Incremental Revenue ($)', 'Days Left in Flight',
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

export function IncrementalDashboard({ planName, campaigns }: Props) {

  // Only show campaigns at or above goal
  const activeCampaigns = campaigns.filter(c => c.performanceMultiplier >= 1.0)

  // ── Summary metrics ──────────────────────────────────────────────────────
  const totalBudget = activeCampaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const totalIncremental = activeCampaigns.reduce((s, c) => s + (c.incrementalDollars || 0), 0)
  const avgDaysLeft = activeCampaigns.length
    ? Math.round(activeCampaigns.reduce((s, c) => s + daysLeft(c.endDate), 0) / activeCampaigns.length)
    : 0

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="id-dashboard">

      {/* Header */}
      <div className="id-dashboard__header">
        <div className="id-dashboard__title-wrap">
          <h2 className="id-dashboard__title-text">{planName}</h2>
        </div>
        <div className="id-dashboard__header-actions">
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
          <span className="id-kpi-tile__label">Total Budget</span>
          <span className="id-kpi-tile__value">{formatBudget(totalBudget)}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Campaigns On Track</span>
          <span className="id-kpi-tile__value">{activeCampaigns.length}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Total Incremental Revenue</span>
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
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Campaign Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Current Budget</th>
              <th>KPI</th>
              <th>Performance vs. Goal</th>
              <th>Incremental Revenue</th>
              <th>Days Left in Flight</th>
            </tr>
          </thead>
          <tbody>
            {activeCampaigns.length === 0 && (
              <tr>
                <td colSpan={9} className="id-table__empty">
                  No qualifying campaigns match the selected filters.
                </td>
              </tr>
            )}
            {activeCampaigns.map(c => {
              const remaining = daysLeft(c.endDate)
              return (
                <tr key={c.id} className="id-table__row">

                  <td className="id-table__client">{c.clientName}</td>

                  <td className="id-table__name">{c.name}</td>

                  <td className="id-table__date">{formatDate(c.startDate)}</td>

                  <td className="id-table__date">{formatDate(c.endDate)}</td>

                  <td className="id-table__budget">{formatBudget(c.budget)}</td>

                  <td>
                    <span className="id-table__kpi-label">{c.kpiLabel}</span>
                    <span className="id-table__kpi-value">{formatKpi(c.kpiValue, c.kpiUnit)}</span>
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

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
