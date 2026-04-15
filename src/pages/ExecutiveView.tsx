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

// CSS transform zoom params per region (scale + transform-origin on the map SVG)
const REGION_ZOOM_PARAMS: Record<string, { scale: number; origin: string }> = {
  Northeast: { scale: 3.2, origin: '85% 22%' },
  Southeast: { scale: 2.8, origin: '72% 64%' },
  Midwest:   { scale: 2.4, origin: '52% 28%' },
  Central:   { scale: 2.7, origin: '41% 62%' },
  West:      { scale: 2.4, origin: '13% 38%' },
  House:     { scale: 3.8, origin: '13% 82%' },
}

// Monthly incremental data — Jan–Apr 2026 YTD ($K) — sums match REGION_INCREMENTAL
const REGION_MONTHLY_DATA: Record<string, number[]> = {
  Northeast: [285, 312, 398, 245],
  Southeast: [195, 218, 261, 306],
  Midwest:   [322, 289, 415, 485],
  Central:   [158, 192, 224, 188],
  West:      [410, 468, 523, 679],
  House:     [ 72,  85,  91,  93],
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr']

// YTD incremental by seller ($K)
const REGION_GD_YTD: Record<string, { name: string; ytdK: number }[]> = {
  Northeast: [
    { name: 'James Okafor',   ytdK:  479 },
    { name: 'Sarah Mitchell', ytdK:  761 },
  ],
  Southeast: [{ name: 'Marcus Webb',    ytdK:  980 }],
  Midwest:   [{ name: 'Priya Sharma',   ytdK: 1511 }],
  Central:   [{ name: 'Tyler Brooks',   ytdK:  762 }],
  West:      [{ name: 'Elena Vasquez',  ytdK: 2080 }],
  House:     [{ name: 'Jordan Chen',    ytdK:  341 }],
}

// ── Inline bar chart component ────────────────────────────────────────────────

function IncrementalBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const H = 175
  const barW = 90
  const gap = 25
  const totalW = (barW + gap) * data.length - gap

  return (
    <svg
      width={totalW}
      height={H + 36}
      viewBox={`0 0 ${totalW} ${H + 36}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {data.map((val, i) => {
        const barH = Math.max(4, Math.round((val / max) * H))
        const x = i * (barW + gap)
        const y = H - barH
        const isPeak = val === max
        return (
          <g key={i}>
            <rect x={x} y={0} width={barW} height={H} rx={5}
              fill="rgba(255,255,255,0.05)" />
            <rect x={x} y={y} width={barW} height={barH} rx={5}
              fill={isPeak ? color : `${color}88`} />
            <text x={x + barW / 2} y={y - 7} textAnchor="middle"
              style={{
                fontSize: '11px',
                fill: isPeak ? color : 'rgba(255,255,255,0.72)',
                fontFamily: "'Barlow Semi Condensed',sans-serif",
                fontWeight: 700,
              }}>
              ${val}K
            </text>
            <text x={x + barW / 2} y={H + 20} textAnchor="middle"
              style={{
                fontSize: '11px',
                fill: 'rgba(255,255,255,0.68)',
                fontFamily: "'Barlow Semi Condensed',sans-serif",
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
              {MONTHS[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
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
                      <span className="id-exec__metric-client-name">{item.client}</span>
                      <div className="id-exec__metric-client-bottom">
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
                        <span className="id-exec__metric-client-amount" style={{ color }}>{item.incremental}</span>
                      </div>
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
            {/* Zoom wrapper — CSS transform animates scale on region click */}
            <div
              className="id-exec__zoom-wrapper"
              style={{
                transform: openRegion
                  ? `scale(${REGION_ZOOM_PARAMS[openRegion].scale})`
                  : 'scale(1)',
                transformOrigin: openRegion
                  ? REGION_ZOOM_PARAMS[openRegion].origin
                  : 'center center',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%',
                height: '100%',
              }}
            >
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
            </div>{/* end zoom-wrapper */}

            {/* Region info panel — slides up when a region is selected */}
            {openRegion && (
              <div className="id-exec__region-panel">
                <div className="id-exec__panel-header">
                  <span
                    className="id-exec__panel-title"
                    style={{ color: REGION_COLORS[openRegion] }}
                  >
                    {openRegion}
                  </span>
                  <span className="id-exec__panel-subtitle">YTD Incremental</span>
                  <button
                    className="id-exec__panel-close"
                    onClick={() => setOpenRegion(null)}
                    aria-label="Close region panel"
                  >
                    ← Back
                  </button>
                </div>
                <div className="id-exec__panel-body">
                  {/* Monthly bar chart — full width */}
                  <div className="id-exec__panel-chart">
                    <div className="id-exec__panel-section-label">Monthly Won</div>
                    <IncrementalBarChart
                      data={REGION_MONTHLY_DATA[openRegion]}
                      color={REGION_COLORS[openRegion]}
                    />
                  </div>

                  <div className="id-exec__panel-hdivider" />

                  {/* Bottom row: Seller YTD + Client YTD */}
                  <div className="id-exec__panel-bottom-row">

                    {/* Seller YTD progress bars */}
                    <div className="id-exec__panel-sellers">
                      <div className="id-exec__panel-section-label">Seller YTD</div>
                      {REGION_GD_YTD[openRegion].map(seller => {
                        const maxYtd = Math.max(...REGION_GD_YTD[openRegion].map(s => s.ytdK))
                        return (
                          <div key={seller.name} className="id-exec__panel-seller-row">
                            <span className="id-exec__panel-seller-name">{seller.name}</span>
                            <div className="id-exec__panel-seller-track">
                              <div
                                className="id-exec__panel-seller-fill"
                                style={{
                                  width: `${Math.round((seller.ytdK / maxYtd) * 100)}%`,
                                  background: REGION_COLORS[openRegion],
                                }}
                              />
                            </div>
                            <span
                              className="id-exec__panel-seller-amount"
                              style={{ color: REGION_COLORS[openRegion] }}
                            >
                              {seller.ytdK >= 1000
                                ? `$${(seller.ytdK / 1000).toFixed(2)}M`
                                : `$${seller.ytdK}K`}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="id-exec__panel-divider" />

                    {/* Client YTD progress bars */}
                    <div className="id-exec__panel-clients">
                      <div className="id-exec__panel-section-label">Client YTD</div>
                      {(() => {
                        const clients = REGION_TOP_CLIENTS[openRegion] ?? []
                        const maxVal = Math.max(...clients.map(c => {
                          const n = parseFloat(c.incremental.replace(/[$KM]/g, ''))
                          return c.incremental.includes('M') ? n * 1000 : n
                        }))
                        return clients.map(c => {
                          const raw = parseFloat(c.incremental.replace(/[$KM]/g, ''))
                          const valK = c.incremental.includes('M') ? raw * 1000 : raw
                          return (
                            <div key={c.client} className="id-exec__panel-seller-row">
                              <span className="id-exec__panel-seller-name">{c.client}</span>
                              <div className="id-exec__panel-seller-track">
                                <div
                                  className="id-exec__panel-seller-fill"
                                  style={{
                                    width: `${Math.round((valK / maxVal) * 100)}%`,
                                    background: REGION_COLORS[openRegion],
                                  }}
                                />
                              </div>
                              <span
                                className="id-exec__panel-seller-amount"
                                style={{ color: REGION_COLORS[openRegion] }}
                              >
                                {c.incremental}
                              </span>
                            </div>
                          )
                        })
                      })()}
                    </div>

                  </div>
                </div>
              </div>
            )}
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
