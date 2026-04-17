import { useState } from 'react'

// ── Region / Growth Director data (replace with API response when ready) ──────

export const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Central', 'West', 'Political', 'Regional Majors', 'Retail Solutions'] as const
export type Region = typeof REGIONS[number]

export const REGION_GDS: Record<Region, string[]> = {
  Northeast:          ['Danielle Whiting', 'Steven Miller', 'Grayson Vickers', 'Amy Murray', 'Cailin Murphy'],
  Southeast:          ['Scott Welton', 'Larry Tucker', 'Jodie Dover', 'Shane Miller', 'Kelly Calderone', 'Ramon Brayan'],
  Midwest:            ['Sophie Denault', 'Jill Puerto', "Amy O'Hara", 'Grace Dominique', 'Katie Johnson'],
  Central:            ['Stephanie Jurney', 'Ross Peters', 'Jenny DeBono', 'Scott Wright', 'Matt Musgrave', 'Dayna Schram', 'Gargi Bhakta', 'Lane Johnson'],
  West:               ['Tessa Walsh', 'Josh Darden', 'Joshua Gallo', 'Jacob Kearney', 'Jeff DePew', 'Kyle McBride', 'Adriana Richards'],
  Political:          ['Michael Bell', 'Nicole Meade', 'Jonathan Phelps', 'Taylor Fritsch'],
  'Regional Majors':  ['Thomas Buell', 'Greg Kupfner', 'Andrew Davis'],
  'Retail Solutions': ['Andy Kemp', 'Daniel Friscia', 'Geoff Halsema'],
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  selectedRegion: string
  selectedGD: string
  onRegionChange: (region: string) => void
  onGDChange: (gd: string) => void
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AppSidebar({ selectedRegion, selectedGD, onRegionChange, onGDChange }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const gds = selectedRegion ? REGION_GDS[selectedRegion as Region] ?? [] : []

  return (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
        {!collapsed && <span className="sidebar__section-title">Filters</span>}
      </div>

      {!collapsed && (
        <div className="sidebar__filters">

          <div className="sidebar__filter-group">
            <label className="sidebar__filter-label" htmlFor="region-select">Region</label>
            <div className="sidebar__select-wrap">
              <select
                id="region-select"
                className="sidebar__filter-select"
                value={selectedRegion}
                onChange={e => { onRegionChange(e.target.value); onGDChange('') }}
              >
                <option value="">All Regions</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="sidebar__select-chevron" aria-hidden>▾</span>
            </div>
          </div>

          <div className="sidebar__filter-group">
            <label className="sidebar__filter-label" htmlFor="gd-select">Growth Director</label>
            <div className="sidebar__select-wrap">
              <select
                id="gd-select"
                className="sidebar__filter-select"
                value={selectedGD}
                onChange={e => onGDChange(e.target.value)}
                disabled={!selectedRegion}
              >
                <option value="">
                  {selectedRegion ? 'All Directors' : 'Select region first'}
                </option>
                {gds.map(gd => (
                  <option key={gd} value={gd}>{gd}</option>
                ))}
              </select>
              <span className="sidebar__select-chevron" aria-hidden>▾</span>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
