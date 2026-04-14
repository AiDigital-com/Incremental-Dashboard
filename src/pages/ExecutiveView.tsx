import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

// ── Geo data ──────────────────────────────────────────────────────────────────

const GEO_URL = '/states-10m.json'

// ── Region definitions ────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  Northeast: '#0009DC',
  Southeast: '#AEF33E',
  Midwest:   '#FF7CF5',
  Central:   '#38b6ff',
  West:      '#8263FF',
}

// Geographic centroids for region name labels [longitude, latitude]
const REGION_CENTROIDS: Record<string, [number, number]> = {
  Northeast: [-74,   44.5],
  Southeast: [-83,   31.5],
  Midwest:   [-89.5, 44.5],
  Central:   [-100,  35  ],
  West:      [-119,  45  ],
}

// All 50 states assigned to a region (House excluded from visual per spec)
const STATE_REGIONS: Record<string, string> = {
  // Northeast (11)
  Connecticut: 'Northeast', Delaware: 'Northeast', Maine: 'Northeast',
  Maryland: 'Northeast', Massachusetts: 'Northeast', 'New Hampshire': 'Northeast',
  'New Jersey': 'Northeast', 'New York': 'Northeast', Pennsylvania: 'Northeast',
  'Rhode Island': 'Northeast', Vermont: 'Northeast',

  // Southeast (12)
  Alabama: 'Southeast', Arkansas: 'Southeast', Florida: 'Southeast',
  Georgia: 'Southeast', Kentucky: 'Southeast', Louisiana: 'Southeast',
  Mississippi: 'Southeast', 'North Carolina': 'Southeast', 'South Carolina': 'Southeast',
  Tennessee: 'Southeast', Virginia: 'Southeast', 'West Virginia': 'Southeast',

  // Midwest (12)
  Illinois: 'Midwest', Indiana: 'Midwest', Iowa: 'Midwest',
  Kansas: 'Midwest', Michigan: 'Midwest', Minnesota: 'Midwest',
  Missouri: 'Midwest', Nebraska: 'Midwest', 'North Dakota': 'Midwest',
  Ohio: 'Midwest', 'South Dakota': 'Midwest', Wisconsin: 'Midwest',

  // Central (4)
  Colorado: 'Central', 'New Mexico': 'Central', Oklahoma: 'Central', Texas: 'Central',

  // West (11)
  Alaska: 'West', Arizona: 'West', California: 'West', Hawaii: 'West',
  Idaho: 'West', Montana: 'West', Nevada: 'West', Oregon: 'West',
  Utah: 'West', Washington: 'West', Wyoming: 'West',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExecutiveView({ onBack }: Props) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  return (
    <div className="id-exec">

      {/* Header */}
      <div className="id-exec__header">
        <button className="id-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h2 className="id-exec__title">Executive View</h2>
          <p className="id-exec__subtitle">Regional incremental performance — United States</p>
        </div>
      </div>

      {/* Map */}
      <div className="id-exec__map-wrap">
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const stateName: string = geo.properties?.name ?? ''
                const region = STATE_REGIONS[stateName]
                const color = region ? REGION_COLORS[region] : '#2a2a3a'
                const isRegionHovered = !!region && hoveredRegion === region

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => region && setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    style={{
                      // Both default and hover use the same style —
                      // regional highlight is driven by React state, not CSS :hover
                      default: {
                        fill: isRegionHovered ? `${color}70` : `${color}38`,
                        stroke: isRegionHovered ? color : `${color}99`,
                        strokeWidth: isRegionHovered ? 1 : 0.5,
                        filter: isRegionHovered
                          ? `drop-shadow(0 0 12px ${color}cc)`
                          : `drop-shadow(0 0 4px ${color}66)`,
                        outline: 'none',
                        transition: 'fill 0.15s, stroke 0.15s, filter 0.15s',
                      },
                      hover: {
                        fill: isRegionHovered ? `${color}70` : `${color}38`,
                        stroke: isRegionHovered ? color : `${color}99`,
                        strokeWidth: isRegionHovered ? 1 : 0.5,
                        filter: isRegionHovered
                          ? `drop-shadow(0 0 12px ${color}cc)`
                          : `drop-shadow(0 0 4px ${color}66)`,
                        outline: 'none',
                        cursor: 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {/* Region name labels — always visible */}
          {Object.entries(REGION_CENTROIDS).map(([region, coords]) => {
            const color = REGION_COLORS[region]
            const isHovered = hoveredRegion === region
            return (
              <Marker key={region} coordinates={coords}>
                <text
                  textAnchor="middle"
                  dy="-4"
                  style={{
                    fontFamily: "'Barlow Semi Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: isHovered ? '11px' : '9px',
                    fill: isHovered ? color : `${color}cc`,
                    letterSpacing: '0.14em',
                    filter: isHovered ? `drop-shadow(0 0 6px ${color})` : 'none',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'font-size 0.15s, fill 0.15s',
                  }}
                >
                  {region.toUpperCase()}
                </text>
              </Marker>
            )
          })}
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="id-exec__legend">
        {Object.entries(REGION_COLORS).map(([region, color]) => (
          <div
            key={region}
            className={`id-exec__legend-item${hoveredRegion === region ? ' id-exec__legend-item--hovered' : ''}`}
            onMouseEnter={() => setHoveredRegion(region)}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <span
              className="id-exec__legend-dot"
              style={{
                background: color,
                boxShadow: hoveredRegion === region
                  ? `0 0 10px ${color}, 0 0 4px ${color}`
                  : `0 0 6px ${color}`,
              }}
            />
            <span className="id-exec__legend-label" style={{ color: hoveredRegion === region ? color : undefined }}>
              {region}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
