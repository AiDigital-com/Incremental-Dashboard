import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { feature as topoFeature } from 'topojson-client'

// ── Geo data ──────────────────────────────────────────────────────────────────

const GEO_URL = '/states-10m.json'

// ── Region definitions ────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  Northeast:          '#8EE7F1',  // Bright Aqua
  Southeast:          '#DDA7EF',  // Digital Lilac
  Midwest:            '#A9BEF8',  // Skywave
  Central:            '#38b6ff',  // Neon Azure
  West:               '#8263FF',  // Violet Pulse
  Political:          '#FF7CF5',  // Hot Pink
  'Regional Majors':  '#F6AD55',  // Amber
  'Retail Solutions': '#AEF33E',  // Neon Lime
}

// Geographic centroids for region name labels [longitude, latitude]
const REGION_CENTROIDS: Record<string, [number, number]> = {
  Northeast: [-73,   41.5],
  Southeast: [-87,   32.5],
  Midwest:   [-95,   43  ],
  Central:   [-99,   30.7],
  West:      [-115,  40.6],
}

// Total incremental available across all regions
const TOTAL_INCREMENTAL = '$32.8M'

// Incremental available by region (real data)
const REGION_INCREMENTAL: Record<string, string> = {
  Northeast:          '$2.0M',
  Southeast:          '$7.5M',
  Midwest:            '$7.7M',
  Central:            '$8.3M',
  West:               '$5.6M',
  Political:          '$478K',
  'Regional Majors':  '$462K',
  'Retail Solutions': '$768K',
}

// Top clients per region (real GD names; client details updated when API ready)
const REGION_TOP_CLIENTS: Record<string, { gd: string; client: string; incremental: string }[]> = {
  Northeast: [
    { gd: 'Steven Miller',    client: 'Vantage Health',     incremental: '$215K' },
    { gd: 'Danielle Whiting', client: 'Apex Retail Group',  incremental: '$142K' },
    { gd: 'Grayson Vickers',  client: 'Clearwave Financial', incremental: '$76K' },
  ],
  Southeast: [
    { gd: 'Scott Welton',  client: 'Luminary Studios',   incremental: '$98K'  },
    { gd: 'Scott Welton',  client: 'Northshore Foods',   incremental: '$54K'  },
    { gd: 'Larry Tucker',  client: 'Horizon Media',      incremental: '$98K'  },
  ],
  Midwest: [
    { gd: 'Jill Puerto',     client: 'Beacon Financial',  incremental: '$87K' },
    { gd: 'Sophie Denault',  client: 'Westfield Group',   incremental: '$61K' },
    { gd: 'Sophie Denault',  client: 'Pinnacle Sports',   incremental: '$31K' },
  ],
  Central: [
    { gd: 'Stephanie Jurney', client: 'Crescent Energy',   incremental: '$110K' },
    { gd: 'Ross Peters',      client: 'Prism Health',       incremental: '$144K' },
    { gd: 'Stephanie Jurney', client: 'TerraVerde Foods',   incremental: '$28K'  },
  ],
  West: [
    { gd: 'Tessa Walsh',  client: 'Caliber Auto',    incremental: '$129K' },
    { gd: 'Josh Darden',  client: 'Nexus Financial', incremental: '$95K'  },
    { gd: 'Tessa Walsh',  client: 'Olympus Retail',  incremental: '$73K'  },
  ],
  Political: [
    { gd: 'Michael Bell',      client: 'Sterling Hotels', incremental: '$42K' },
    { gd: 'Nicole Meade',      client: 'Summit Advocacy', incremental: '$38K' },
    { gd: 'Jonathan Phelps',   client: 'Beacon PAC',      incremental: '$35K' },
  ],
  'Regional Majors': [
    { gd: 'Thomas Buell',  client: 'Voyager Insurance',  incremental: '$68K' },
    { gd: 'Greg Kupfner',  client: 'Regional Network',   incremental: '$52K' },
    { gd: 'Andrew Davis',  client: 'Meridian Auto',      incremental: '$45K' },
  ],
  'Retail Solutions': [
    { gd: 'Andy Kemp',      client: 'Summit Healthcare', incremental: '$156K' },
    { gd: 'Andy Kemp',      client: 'Redwood Realty',    incremental: '$82K'  },
    { gd: 'Daniel Friscia', client: 'Olympus Retail',    incremental: '$73K'  },
  ],
}

// CSS transform zoom params per region (geographic regions only)
const REGION_ZOOM_PARAMS: Record<string, { scale: number; origin: string }> = {
  Northeast: { scale: 3.2, origin: '85% 22%' },
  Southeast: { scale: 2.8, origin: '72% 64%' },
  Midwest:   { scale: 2.4, origin: '52% 28%' },
  Central:   { scale: 2.7, origin: '41% 62%' },
  West:      { scale: 2.4, origin: '13% 38%' },
}

// Monthly incremental data — Jan–Apr 2026 YTD ($K)
const REGION_MONTHLY_DATA: Record<string, number[]> = {
  Northeast:          [ 400,  450,  590,  560],
  Southeast:          [1650, 1750, 2100, 2000],
  Midwest:            [1700, 1800, 2200, 2000],
  Central:            [1900, 1950, 2250, 2200],
  West:               [1200, 1350, 1550, 1500],
  Political:          [ 105,  110,  130,  133],
  'Regional Majors':  [ 100,  112,  125,  125],
  'Retail Solutions': [ 165,  180,  210,  213],
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr']

// YTD incremental by seller ($K) — real seller names
const REGION_GD_YTD: Record<string, { name: string; ytdK: number }[]> = {
  Northeast: [
    { name: 'Danielle Whiting', ytdK: 425 },
    { name: 'Steven Miller',    ytdK: 390 },
    { name: 'Grayson Vickers',  ytdK: 415 },
    { name: 'Amy Murray',       ytdK: 380 },
    { name: 'Cailin Murphy',    ytdK: 390 },
  ],
  Southeast: [
    { name: 'Scott Welton',    ytdK: 1400 },
    { name: 'Larry Tucker',    ytdK: 1100 },
    { name: 'Jodie Dover',     ytdK: 1250 },
    { name: 'Shane Miller',    ytdK: 1200 },
    { name: 'Kelly Calderone', ytdK: 1300 },
    { name: 'Ramon Brayan',    ytdK: 1250 },
  ],
  Midwest: [
    { name: 'Sophie Denault',  ytdK: 1600 },
    { name: 'Jill Puerto',     ytdK: 1500 },
    { name: "Amy O'Hara",      ytdK: 1650 },
    { name: 'Grace Dominique', ytdK: 1500 },
    { name: 'Katie Johnson',   ytdK: 1450 },
  ],
  Central: [
    { name: 'Stephanie Jurney', ytdK: 1100 },
    { name: 'Ross Peters',      ytdK:  950 },
    { name: 'Jenny DeBono',     ytdK: 1050 },
    { name: 'Scott Wright',     ytdK: 1000 },
    { name: 'Matt Musgrave',    ytdK: 1100 },
    { name: 'Dayna Schram',     ytdK: 1050 },
    { name: 'Gargi Bhakta',     ytdK: 1000 },
    { name: 'Lane Johnson',     ytdK: 1050 },
  ],
  West: [
    { name: 'Tessa Walsh',      ytdK: 850 },
    { name: 'Josh Darden',      ytdK: 780 },
    { name: 'Joshua Gallo',     ytdK: 800 },
    { name: 'Jacob Kearney',    ytdK: 820 },
    { name: 'Jeff DePew',       ytdK: 790 },
    { name: 'Kyle McBride',     ytdK: 780 },
    { name: 'Adriana Richards', ytdK: 780 },
  ],
  Political: [
    { name: 'Michael Bell',    ytdK: 125 },
    { name: 'Nicole Meade',    ytdK: 115 },
    { name: 'Jonathan Phelps', ytdK: 125 },
    { name: 'Taylor Fritsch',  ytdK: 113 },
  ],
  'Regional Majors': [
    { name: 'Thomas Buell',  ytdK: 165 },
    { name: 'Greg Kupfner',  ytdK: 148 },
    { name: 'Andrew Davis',  ytdK: 149 },
  ],
  'Retail Solutions': [
    { name: 'Andy Kemp',      ytdK: 275 },
    { name: 'Daniel Friscia', ytdK: 248 },
    { name: 'Geoff Halsema',  ytdK: 245 },
  ],
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

  // West (9)
  Arizona: 'West', California: 'West',
  Idaho: 'West', Montana: 'West', Nevada: 'West', Oregon: 'West',
  Utah: 'West', Washington: 'West', Wyoming: 'West',
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
          <div className="id-exec__metrics-total-label">Total Incremental</div>
          <div className="id-exec__metrics-total-value">{TOTAL_INCREMENTAL}</div>
          <div className="id-exec__metrics-title">Regional Incremental</div>
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
            {(() => {
              const zp = openRegion ? REGION_ZOOM_PARAMS[openRegion] : null
              return (
            <div
              className="id-exec__zoom-wrapper"
              style={{
                transform: zp ? `scale(${zp.scale})` : 'scale(1)',
                transformOrigin: zp ? zp.origin : 'center center',
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
                        letterSpacing: '0.14em',
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
              )
            })()}{/* end zoom-wrapper */}

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
