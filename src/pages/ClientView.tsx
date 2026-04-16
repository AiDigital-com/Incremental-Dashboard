import { useState, useEffect } from 'react'
import { GlobeBackground } from '../components/GlobeBackground'

// ── Client View (placeholder) ─────────────────────────────────────────────────

interface Props {
  onBack: () => void
}

export function ClientView({ onBack }: Props) {
  const [zoomContinent, setZoomContinent] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setZoomContinent(0), 80)
    return () => clearTimeout(t)
  }, [])

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

      {/* Table placeholder */}
      <div className="id-dashboard__table-wrap">
        <table className="id-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Active Campaigns</th>
              <th>Total Budget</th>
              <th>Total Incremental Availability</th>
              <th>Avg Performance vs. Goal</th>
              <th>Avg Days Left</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="id-table__empty">
                Client view coming soon. Data will appear here once integrated.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  )
}
