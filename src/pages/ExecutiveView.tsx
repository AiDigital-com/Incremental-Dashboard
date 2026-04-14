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
  House:     '#FF6A00',
}

// Geographic centroids for region name labels [longitude, latitude]
const REGION_CENTROIDS: Record<string, [number, number]> = {
  Northeast: [-73,   41.5],   // shifted down ~0.4"
  Southeast: [-87,   32.5],   // shifted left ~0.5"
  Midwest:   [-95,   43  ],   // shifted left ~0.5"
  Central:   [-99,   30.7],   // shifted down ~1"
  West:      [-115,  40.6],   // shifted down ~0.5"
  House:     [-151.6, 62  ],  // shifted left ~0.1"
}

// Placeholder incremental available by region
const REGION_INCREMENTAL: Record<string, string> = {
  Northeast: '$1.24M',
  Southeast: '$980K',
  Midwest:   '$1.51M',
  Central:   '$762K',
  West:      '$2.08M',
  House:     '$341K',
}

// All 50 states assigned to a region
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

  // West (9 — Alaska & Hawaii moved to House)
  Arizona: 'West', California: 'West',
  Idaho: 'West', Montana: 'West', Nevada: 'West', Oregon: 'West',
  Utah: 'West', Washington: 'West', Wyoming: 'West',

  // House (2)
  Alaska: 'House', Hawaii: 'House',
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

      {/* Body: metrics sidebar + map/legend */}
      <div className="id-exec__body">

        {/* Regional metrics sidebar */}
        <div className="id-exec__metrics">
          <div className="id-exec__metrics-title">Available Incremental</div>
          {Object.entries(REGION_COLORS).map(([region, color]) => {
            const isHovered = hoveredRegion === region
            return (
              <div
                key={region}
                className={`id-exec__metric-row${isHovered ? ' id-exec__metric-row--hovered' : ''}`}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <span
                  className="id-exec__metric-dot"
                  style={{
                    background: color,
                    boxShadow: isHovered
                      ? `0 0 8px ${color}, 0 0 3px ${color}`
                      : `0 0 5px ${color}`,
                  }}
                />
                <div className="id-exec__metric-info">
                  <span
                    className="id-exec__metric-region"
                    style={{ color: isHovered ? color : undefined }}
                  >
                    {region}
                  </span>
                  <span className="id-exec__metric-value">
                    {REGION_INCREMENTAL[region]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Map + legend column */}
        <div className="id-exec__content">
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
                        fontSize: isHovered ? '33px' : '27px',
                        fill: isHovered ? color : `${color}cc`,
                        stroke: 'rgba(255, 255, 255, 0.90)',
                        strokeWidth: '4',
                        paintOrder: 'stroke fill',
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

      </div>

    </div>
  )
}
