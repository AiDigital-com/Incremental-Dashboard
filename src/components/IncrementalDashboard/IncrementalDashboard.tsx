import { DownloadBar } from '@AiDigital-com/design-system'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  startDate: string               // 'YYYY-MM-DD'
  endDate: string                 // 'YYYY-MM-DD'
  budget: number                  // current budget in dollars
  kpiLabel: string                // e.g. 'CTR', 'ROAS', 'CPA'
  kpiValue: number                // current KPI value
  kpiUnit: string                 // '%', 'x', '$'
  performanceMultiplier: number   // ratio vs goal (1.25 = exceeding by 1.25x)
  incrementalAvailability: number // 0–100
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

function perfStatus(m: number): 'above' | 'near' | 'below' {
  if (m >= 1.0) return 'above'
  if (m >= 0.85) return 'near'
  return 'below'
}

// ── Component ────────────────────────────────────────────────────────────────

export function IncrementalDashboard({
  planName, campaigns, onCampaignsChange,
}: Props) {

  // ── Summary metrics ──────────────────────────────────────────────────────
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const onTrackCount = campaigns.filter(c => c.performanceMultiplier >= 1).length
  const avgIncremental = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + (c.incrementalAvailability || 0), 0) / campaigns.length)
    : 0

  // ── Markdown report for download ─────────────────────────────────────────
  const reportText = [
    `# ${planName}`,
    '',
    '| Campaign | Start | End | Budget | KPI | Performance | Incremental Avail. |',
    '|---|---|---|---|---|---|---|',
    ...campaigns.map(c =>
      `| ${c.name} | ${c.startDate} | ${c.endDate} | ${formatBudget(c.budget)} | ${c.kpiLabel}: ${formatKpi(c.kpiValue, c.kpiUnit)} | ${c.performanceMultiplier.toFixed(2)}x | ${c.incrementalAvailability}% |`
    ),
    '',
    `**Total Budget:** ${formatBudget(totalBudget)}`,
    `**On Track:** ${onTrackCount} / ${campaigns.length}`,
    `**Avg Incremental Available:** ${avgIncremental}%`,
  ].join('\n')

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="id-dashboard">

      {/* Header */}
      <div className="id-dashboard__header">
        <div className="id-dashboard__title-wrap">
          <h2 className="id-dashboard__title-text">{planName}</h2>
        </div>
        <div className="id-dashboard__header-actions">
          <DownloadBar
            reportText={reportText}
            title={planName}
            visualSelector=".id-dashboard"
          />
        </div>
      </div>

      {/* Summary tiles */}
      <div className="id-dashboard__kpis">
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Total Budget</span>
          <span className="id-kpi-tile__value">{formatBudget(totalBudget)}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">On Track</span>
          <span className="id-kpi-tile__value" style={onTrackCount === campaigns.length && campaigns.length > 0 ? { color: 'var(--success)' } : undefined}>
            {onTrackCount} / {campaigns.length}
          </span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Avg Incremental Availability</span>
          <span className="id-kpi-tile__value">{avgIncremental}%</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Total Campaigns</span>
          <span className="id-kpi-tile__value">{campaigns.length}</span>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="id-dashboard__table-wrap">
        <table className="id-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Current Budget</th>
              <th>KPI</th>
              <th>Performance vs. Goal</th>
              <th>Incremental Availability</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="id-table__empty">
                  No campaigns loaded.
                </td>
              </tr>
            )}
            {campaigns.map(c => {
              const status = perfStatus(c.performanceMultiplier)
              return (
                <tr key={c.id} className={`id-table__row id-table__row--${status}`}>

                  {/* Campaign Name */}
                  <td className="id-table__name">{c.name}</td>

                  {/* Start Date */}
                  <td className="id-table__date">{formatDate(c.startDate)}</td>

                  {/* End Date */}
                  <td className="id-table__date">{formatDate(c.endDate)}</td>

                  {/* Budget */}
                  <td className="id-table__budget">{formatBudget(c.budget)}</td>

                  {/* KPI */}
                  <td>
                    <span className="id-table__kpi-label">{c.kpiLabel}</span>
                    <span className="id-table__kpi-value">{formatKpi(c.kpiValue, c.kpiUnit)}</span>
                  </td>

                  {/* Performance vs Goal */}
                  <td>
                    <span className={`id-perf-badge id-perf-badge--${status}`}>
                      {c.performanceMultiplier.toFixed(2)}x
                      {status === 'above' && ' above goal'}
                      {status === 'near'  && ' near goal'}
                      {status === 'below' && ' below goal'}
                    </span>
                  </td>

                  {/* Incremental Availability */}
                  <td>
                    <div className="id-incr-bar-wrap">
                      <div
                        className="id-incr-bar"
                        style={{ width: `${c.incrementalAvailability}%` }}
                      />
                      <span className="id-incr-pct">{c.incrementalAvailability}%</span>
                    </div>
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
