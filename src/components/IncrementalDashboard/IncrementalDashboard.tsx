import { useState, useEffect } from 'react'
import { KpiTile, DownloadBar } from '@AiDigital-com/design-system'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  channel: string
  budget: number
  currentKpi: number
  kpiGoal: number
  kpiLabel: string       // e.g. "ROAS", "CPA", "Revenue Lift"
  incrementalPct: number // % incremental available (0–100)
}

interface Props {
  sessionId: string
  planName: string
  campaigns: Campaign[]
  onPlanNameChange: (name: string) => void
  onCampaignsChange: (campaigns: Campaign[]) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusOf(c: Campaign): 'on_track' | 'at_risk' | 'behind' {
  if (!c.kpiGoal) return 'behind'
  if (c.currentKpi >= c.kpiGoal) return 'on_track'
  if (c.currentKpi >= c.kpiGoal * 0.8) return 'at_risk'
  return 'behind'
}

function formatBudget(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

const STATUS_LABELS = { on_track: 'On Track', at_risk: 'At Risk', behind: 'Behind' }

// ── Component ────────────────────────────────────────────────────────────────

export function IncrementalDashboard({
  sessionId, planName, campaigns, onPlanNameChange, onCampaignsChange,
}: Props) {
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(planName)

  // Sync name input when plan switches
  useEffect(() => { setNameInput(planName) }, [planName])

  // ── Summary metrics ──────────────────────────────────────────────────────
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const onTrackCount = campaigns.filter(c => statusOf(c) === 'on_track').length
  const avgIncremental = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + (c.incrementalPct || 0), 0) / campaigns.length)
    : 0

  // ── Plan name editing ────────────────────────────────────────────────────
  function commitName() {
    setEditingName(false)
    const trimmed = nameInput.trim() || 'New Plan'
    setNameInput(trimmed)
    onPlanNameChange(trimmed)
  }

  // ── Campaign CRUD ────────────────────────────────────────────────────────
  function addCampaign() {
    onCampaignsChange([
      ...campaigns,
      {
        id: crypto.randomUUID(),
        name: 'New Campaign',
        channel: 'Paid Search',
        budget: 0,
        currentKpi: 0,
        kpiGoal: 0,
        kpiLabel: 'ROAS',
        incrementalPct: 0,
      },
    ])
  }

  function updateCampaign(id: string, field: keyof Campaign, raw: string) {
    const numFields: (keyof Campaign)[] = ['budget', 'currentKpi', 'kpiGoal', 'incrementalPct']
    const value = numFields.includes(field) ? parseFloat(raw) || 0 : raw
    onCampaignsChange(campaigns.map(c => (c.id === id ? { ...c, [field]: value } : c)))
  }

  function deleteCampaign(id: string) {
    onCampaignsChange(campaigns.filter(c => c.id !== id))
  }

  // ── Markdown report for download ─────────────────────────────────────────
  const kpiHeader = campaigns[0]?.kpiLabel ?? 'KPI'
  const reportText = [
    `# ${planName}`,
    '',
    `| Campaign | Channel | Budget | ${kpiHeader} | Goal | Status | Incremental Avail. |`,
    '|---|---|---|---|---|---|---|',
    ...campaigns.map(c =>
      `| ${c.name} | ${c.channel} | ${formatBudget(c.budget)} | ${c.currentKpi.toFixed(2)}x | ${c.kpiGoal.toFixed(2)}x | ${STATUS_LABELS[statusOf(c)]} | ${c.incrementalPct}% |`
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
          {editingName ? (
            <input
              className="id-dashboard__title-input"
              value={nameInput}
              autoFocus
              onChange={e => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitName() }}
            />
          ) : (
            <button
              className="id-dashboard__title-btn"
              onClick={() => { setNameInput(planName); setEditingName(true) }}
              title="Click to rename"
            >
              <h2 className="id-dashboard__title-text">{planName}</h2>
              <span className="id-dashboard__title-edit" aria-hidden>✎</span>
            </button>
          )}
        </div>

        <div className="id-dashboard__header-actions">
          <DownloadBar
            reportText={reportText}
            title={planName}
            visualSelector=".id-dashboard"
          />
        </div>
      </div>

      {/* KPI Summary Tiles */}
      <div className="id-dashboard__kpis">
        <KpiTile label="Total Budget" value={formatBudget(totalBudget)} />
        <KpiTile
          label="On Track"
          value={`${onTrackCount} / ${campaigns.length}`}
          color={onTrackCount > 0 && onTrackCount === campaigns.length ? 'var(--success)' : undefined}
        />
        <KpiTile label="Avg Incremental Available" value={avgIncremental} suffix="%" />
        <KpiTile label="Total Campaigns" value={campaigns.length} />
      </div>

      {/* Campaign Table */}
      <div className="id-dashboard__table-wrap">
        <table className="id-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Channel</th>
              <th>Budget ($)</th>
              <th>KPI Label</th>
              <th>Current KPI</th>
              <th>Goal</th>
              <th>Incremental %</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={9} className="id-table__empty">
                  No campaigns yet — click "+ Add Campaign" below to get started.
                </td>
              </tr>
            )}
            {campaigns.map(c => {
              const status = statusOf(c)
              return (
                <tr key={c.id} className={`id-table__row id-table__row--${status}`}>
                  <td>
                    <input
                      className="id-table__cell-input"
                      value={c.name}
                      onChange={e => updateCampaign(c.id, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="id-table__cell-input"
                      value={c.channel}
                      onChange={e => updateCampaign(c.id, 'channel', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="id-table__cell-input id-table__cell-input--num"
                      type="number"
                      min={0}
                      value={c.budget}
                      onChange={e => updateCampaign(c.id, 'budget', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="id-table__cell-input id-table__cell-input--kpi-label"
                      value={c.kpiLabel}
                      onChange={e => updateCampaign(c.id, 'kpiLabel', e.target.value)}
                    />
                  </td>
                  <td>
                    <div className="id-table__num-cell">
                      <input
                        className="id-table__cell-input id-table__cell-input--num"
                        type="number"
                        step="0.01"
                        min={0}
                        value={c.currentKpi}
                        onChange={e => updateCampaign(c.id, 'currentKpi', e.target.value)}
                      />
                      <span className="id-table__suffix">x</span>
                    </div>
                  </td>
                  <td>
                    <div className="id-table__num-cell">
                      <input
                        className="id-table__cell-input id-table__cell-input--num"
                        type="number"
                        step="0.01"
                        min={0}
                        value={c.kpiGoal}
                        onChange={e => updateCampaign(c.id, 'kpiGoal', e.target.value)}
                      />
                      <span className="id-table__suffix">x</span>
                    </div>
                  </td>
                  <td>
                    <div className="id-table__num-cell">
                      <input
                        className="id-table__cell-input id-table__cell-input--num"
                        type="number"
                        min={0}
                        max={100}
                        value={c.incrementalPct}
                        onChange={e => updateCampaign(c.id, 'incrementalPct', e.target.value)}
                      />
                      <span className="id-table__suffix">%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`id-status-badge id-status-badge--${status}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td>
                    <button
                      className="id-table__delete"
                      onClick={() => deleteCampaign(c.id)}
                      title="Remove campaign"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="id-dashboard__footer">
        <button className="id-btn-add" onClick={addCampaign}>
          + Add Campaign
        </button>
      </div>

    </div>
  )
}
