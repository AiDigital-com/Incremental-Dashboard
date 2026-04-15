import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { feature as topoFeature } from 'topojson-client'

// ── Geo data ──────────────────────────────────────────────────────────────────

const GEO_URL = '/states-10m.json'

// ── Region definitions ────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  Northeast: '#0009DC',
  Southeast: '#4E9018',
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

// Top 3 clients per region (placeholder data)
const REGION_TOP_CLIENTS: Record<string, { gd: string; client: string; incremental: string }[]> = {
  Northeast: [
    { gd: 'James Okafor',   client: 'Prism Health',      incremental: '$144K' },
    { gd: 'Sarah Mitchell', client: 'Apex Retail Group',  incremental: '$142K' },
    { gd: 'Sarah Mitchell', client: 'Beacon Financial',   incremental: '$87K'  },
  ],
  Southeast: [
    { gd: 'Marcus Webb', client: 'Luminary Studios',  incremental: '$98K' },
    { gd: 'Marcus Webb', client: 'Westfield Group',   incremental: '$61K' },
    { gd: 'Marcus Webb', client: 'TerraVerde Foods',  incremental: '$28K' },
  ],
  Midwest: [
    { gd: 'Priya Sharma', client: 'Summit Healthcare', incremental: '$156K' },
    { gd: 'Priya Sharma', client: 'Crescent Energy',   incremental: '$110K' },
    { gd: 'Priya Sharma', client: 'Horizon Media',     incremental: '$98K'  },
  ],
  Central: [
    { gd: 'Tyler Brooks', client: 'Caliber Auto',      incremental: '$129K' },
    { gd: 'Tyler Brooks', client: 'Voyager Insurance',  incremental: '$68K'  },
    { gd: 'Tyler Brooks', client: 'Sterling Hotels',    incremental: '$42K'  },
  ],
  West: [
    { gd: 'Elena Vasquez', client: 'Vantage Health',   incremental: '$215K' },
    { gd: 'Elena Vasquez', client: 'Nexus Financial',  incremental: '$95K'  },
    { gd: 'Elena Vasquez', client: 'Olympus Retail',   incremental: '$73K'  },
  ],
  House: [
    { gd: 'Jordan Chen', client: 'Meridian Auto',    incremental: '$88K' },
    { gd: 'Jordan Chen', client: 'Redwood Realty',   incremental: '$82K' },
    { gd: 'Jordan Chen', client: 'Pinnacle Sports',  incremental: '$31K' },
  ],
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function openGmailCompose(client: string, incremental: string) {
  const subject = `Incremental Opportunity — ${client}`
  const body = [
    `I wanted to reach out regarding an incremental media investment opportunity for ${client}.`,
    '',
    `Based on our latest campaign performance data, ${client}'s campaigns are currently exceeding performance benchmarks, and we have ${incremental} in incremental availability.`,
    '',
    `This represents an opportunity to extend the strong performance we're seeing while momentum is on our side.`,
    '',
    `I'd love to connect to discuss how we can put this incremental to work before the flight window closes!`,
  ].join('\n')
  const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(url, '_blank')
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExecutiveView({ onBack }: Props) {
  const [hoveredRegion,  setHoveredRegion]  = useState<string | null>(null)
  const [openRegion,     setOpenRegion]     = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nationFeature,  setNationFeature]  = useState<any>(null)

  // Fetch topojson once and extract the nation (outer boundary) feature
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then((topo: any) => {
        if (topo.objects?.nation) {
          const f = topoFeature(topo, topo.objects.nation)
          // feature() returns FeatureCollection or Feature; unwrap if needed
          setNationFeature('features' in f ? (f as any).features[0] : f)
        }
      })
  }, [])

  const handleRegionClick = (region: string) => {
    setOpenRegion(prev => prev === region ? null : region)
  }

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
            const isOpen    = openRegion   === region
            return (
              <div key={region} className="id-exec__metric-group">
                {/* Row header */}
                <div
                  className={`id-exec__metric-row${isHovered ? ' id-exec__metric-row--hovered' : ''}`}
                  onClick={() => handleRegionClick(region)}
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
                  <span
                    className="id-exec__metric-chevron"
                    style={{ color: isHovered ? color : undefined, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▾
                  </span>
                </div>

                {/* Expanded client list */}
                <div className={`id-exec__metric-expansion${isOpen ? ' id-exec__metric-expansion--open' : ''}`}>
                  {REGION_TOP_CLIENTS[region]?.map((item, i) => (
                    <div key={i} className="id-exec__metric-client-row">
                      <div className="id-exec__metric-client-header">
                        <span className="id-exec__metric-client-name">{item.client}</span>
                        <span className="id-exec__metric-client-amount" style={{ color }}>{item.incremental}</span>
                      </div>
                      <button
                        className="id-send-email-btn id-send-email-btn--exec"
                        onClick={() => openGmailCompose(item.client, item.incremental)}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Send Email
                      </button>
                      <span className="id-exec__metric-client-gd">{item.gd}</span>
                    </div>
                  ))}
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
              {/* Nation outer boundary — white perimeter outline only (no interior state lines) */}
              {nationFeature && (
                <Geography
                  geography={nationFeature}
                  style={{
                    default: { fill: 'none', stroke: 'rgba(255,255,255,0.80)', strokeWidth: 1.5, outline: 'none' },
                    hover:   { fill: 'none', stroke: 'rgba(255,255,255,0.80)', strokeWidth: 1.5, outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              )}

              {/* State fills */}
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
                        onClick={() => region && handleRegionClick(region)}
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
                            cursor: region ? 'pointer' : 'default',
                          },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>

              {/* Region name labels — always at full hover brightness */}
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
                        fontSize: '33px',
                        fill: color,
                        stroke: 'rgba(255, 255, 255, 0.90)',
                        strokeWidth: '2',
                        paintOrder: 'stroke fill',
                        letterSpacing: '0.14em',
                        filter: isHovered
                          ? `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 6px rgba(255,255,255,0.70))`
                          : `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 4px rgba(255,255,255,0.55))`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        transition: 'filter 0.15s',
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
