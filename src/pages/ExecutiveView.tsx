import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { feature as topoFeature } from 'topojson-client'
import { GlobeBackground } from '../components/GlobeBackground'
import { CAMPAIGNS } from '../data/campaigns'
import { REGION_GDS } from '../components/AppSidebar/AppSidebar'

// ── Geo data ──────────────────────────────────────────────────────────────────

const GEO_URL = '/states-10m.json'

// ── Region definitions ────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  Northeast:          '#8EE7F1',  // Bright Aqua
  Southeast:          '#DDA7EF',  // Digital Lilac
  Midwest:            '#A9BEF8',  // Skywave
  Central:            '#38b6ff',  // Neon Azure
  West:               '#8263FF',  // Violet Pulse
  Political:          '#AEF33E',  // Neon Lime
  'Regional Majors':  '#FDE68A',  // Light Honey
  'Retail Solutions': '#FF7CF5',  // Hot Pink
  House:              '#FF9F43',  // Warm Orange
}

// Geographic centroids for region name labels [longitude, latitude]
const REGION_CENTROIDS: Record<string, [number, number]> = {
  Northeast:          [-67.5, 45.5],
  Southeast:          [-87,   32.5],
  Midwest:            [-95,   43  ],
  Central:            [-99,   30.7],
  West:               [-115,  40.6],
  House:              [-81.5, 27.5],
  Political:          [-77.5, 37.8],
  'Retail Solutions': [-120.5, 47.5],
}

// Special inset/small-area markers: [longitude, latitude, label, color-key]
const INSET_MARKERS: { coords: [number, number]; label: string; region: string }[] = [
  { coords: [-159, 19.2], label: 'REGIONAL MAJORS', region: 'Regional Majors' },
]

// Total incremental — computed from real campaign data
const TOTAL_INCREMENTAL_NUM = CAMPAIGNS.reduce((sum, c) => sum + c.incrementalDollars, 0)
const TOTAL_INCREMENTAL = TOTAL_INCREMENTAL_NUM >= 1_000_000
  ? `$${(TOTAL_INCREMENTAL_NUM / 1_000_000).toFixed(1)}M`
  : `$${Math.round(TOTAL_INCREMENTAL_NUM / 1000)}K`

// Incremental available by region — computed from real campaign data
function buildRegionIncrementalTotals(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [region, sellers] of Object.entries(REGION_GDS)) {
    const total = CAMPAIGNS
      .filter(c => sellers.includes(c.seller ?? ''))
      .reduce((sum, c) => sum + c.incrementalDollars, 0)
    result[region] = total >= 1_000_000
      ? `$${(total / 1_000_000).toFixed(1)}M`
      : `$${Math.round(total / 1000)}K`
  }
  return result
}
const REGION_INCREMENTAL = buildRegionIncrementalTotals()

// Top clients per region — derived from real campaign data
function buildRegionTopClients(): Record<string, { gd: string; client: string; incremental: string }[]> {
  const result: Record<string, { gd: string; client: string; incremental: string }[]> = {}
  for (const [region, sellers] of Object.entries(REGION_GDS)) {
    const regionCampaigns = CAMPAIGNS.filter(c => sellers.includes(c.seller ?? ''))
    const clientMap = new Map<string, { total: number; sellerTotals: Map<string, number> }>()
    for (const c of regionCampaigns) {
      const entry = clientMap.get(c.clientName)
      if (entry) {
        entry.total += c.incrementalDollars
        entry.sellerTotals.set(c.seller ?? '', (entry.sellerTotals.get(c.seller ?? '') ?? 0) + c.incrementalDollars)
      } else {
        const sellerTotals = new Map<string, number>()
        sellerTotals.set(c.seller ?? '', c.incrementalDollars)
        clientMap.set(c.clientName, { total: c.incrementalDollars, sellerTotals })
      }
    }
    const top5 = [...clientMap.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
    result[region] = top5.map(([client, data]) => {
      const topSeller = [...data.sellerTotals.entries()].sort((a, b) => b[1] - a[1])[0][0]
      const amt = data.total
      const formatted = amt >= 1_000_000
        ? `$${(amt / 1_000_000).toFixed(1)}M`
        : `$${Math.round(amt / 1000)}K`
      return { gd: topSeller, client, incremental: formatted }
    })
  }
  return result
}

const REGION_TOP_CLIENTS = buildRegionTopClients()

// CSS transform zoom params per region (geographic regions only)
const REGION_ZOOM_PARAMS: Record<string, { scale: number; origin: string }> = {
  Northeast:          { scale: 3.2, origin: '85% 22%' },
  Southeast:          { scale: 2.8, origin: '72% 64%' },
  Midwest:            { scale: 2.4, origin: '52% 28%' },
  Central:            { scale: 2.7, origin: '41% 62%' },
  West:               { scale: 2.4, origin: '13% 38%' },
  House:              { scale: 5.0, origin: '74% 77%' },
  Political:          { scale: 5.5, origin: '82% 42%' },
  'Regional Majors':  { scale: 5.0, origin: '24% 86%' },
  'Retail Solutions': { scale: 5.0, origin: '8%  12%' },
}

// Monthly incremental data — full year 2026 ($K); May–Dec not yet occurred
const REGION_MONTHLY_DATA: Record<string, number[]> = {
  Northeast:          [ 400,  450,  590,  560, 0, 0, 0, 0, 0, 0, 0, 0],
  Southeast:          [1650, 1750, 2100, 2000, 0, 0, 0, 0, 0, 0, 0, 0],
  Midwest:            [1700, 1800, 2200, 2000, 0, 0, 0, 0, 0, 0, 0, 0],
  Central:            [1900, 1950, 2250, 2200, 0, 0, 0, 0, 0, 0, 0, 0],
  West:               [1200, 1350, 1550, 1500, 0, 0, 0, 0, 0, 0, 0, 0],
  Political:          [ 105,  110,  130,  133, 0, 0, 0, 0, 0, 0, 0, 0],
  'Regional Majors':  [ 100,  112,  125,  125, 0, 0, 0, 0, 0, 0, 0, 0],
  'Retail Solutions': [ 165,  180,  210,  213, 0, 0, 0, 0, 0, 0, 0, 0],
  House:              [3200, 3600, 4100, 4400, 0, 0, 0, 0, 0, 0, 0, 0],
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// YTD incremental by seller — computed from real campaign data
function buildRegionGdYtd(): Record<string, { name: string; ytdK: number }[]> {
  const result: Record<string, { name: string; ytdK: number }[]> = {}
  for (const [region, sellers] of Object.entries(REGION_GDS)) {
    const sellerTotals = new Map<string, number>()
    for (const c of CAMPAIGNS) {
      if (sellers.includes(c.seller ?? '')) {
        sellerTotals.set(c.seller!, (sellerTotals.get(c.seller!) ?? 0) + c.incrementalDollars)
      }
    }
    result[region] = [...sellerTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => ({ name, ytdK: Math.round(total / 1000) }))
  }
  return result
}
const REGION_GD_YTD = buildRegionGdYtd()

// Monthly incremental by seller — proportional share of region monthly totals
function buildSellerMonthlyData(): Record<string, Record<string, number[]>> {
  const result: Record<string, Record<string, number[]>> = {}
  for (const [region, sellers] of Object.entries(REGION_GDS)) {
    result[region] = {}
    const regionMonthly = REGION_MONTHLY_DATA[region]
    if (!regionMonthly) continue
    const regionSellers = REGION_GD_YTD[region] ?? []
    const totalYtd = regionSellers.reduce((sum, s) => sum + s.ytdK, 0)
    for (const seller of regionSellers) {
      const share = totalYtd > 0 ? seller.ytdK / totalYtd : 0
      result[region][seller.name] = regionMonthly.map(m => Math.round(m * share))
    }
    // include any sellers from REGION_GDS not in regionSellers
    for (const seller of sellers) {
      if (!result[region][seller]) result[region][seller] = regionMonthly.map(() => 0)
    }
  }
  return result
}
const SELLER_MONTHLY_DATA = buildSellerMonthlyData()

// Top clients per seller — derived from real campaign data
function buildSellerTopClients(): Record<string, Record<string, { client: string; incremental: string }[]>> {
  const result: Record<string, Record<string, { client: string; incremental: string }[]>> = {}
  for (const [region, sellers] of Object.entries(REGION_GDS)) {
    result[region] = {}
    for (const seller of sellers) {
      const clientMap = new Map<string, number>()
      for (const c of CAMPAIGNS) {
        if (c.seller === seller) {
          clientMap.set(c.clientName, (clientMap.get(c.clientName) ?? 0) + c.incrementalDollars)
        }
      }
      const top5 = [...clientMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      result[region][seller] = top5.map(([client, amt]) => ({
        client,
        incremental: amt >= 1_000_000
          ? `$${(amt / 1_000_000).toFixed(1)}M`
          : `$${Math.round(amt / 1000)}K`,
      }))
    }
  }
  return result
}
const SELLER_TOP_CLIENTS = buildSellerTopClients()

// ── Inline bar chart component ────────────────────────────────────────────────

function IncrementalBarChart({ data, color, useK }: { data: number[]; color: string; useK?: boolean }) {
  const max = Math.max(...data, 1)
  const H = 175
  const barW = 46
  const gap = 10
  const totalW = (barW + gap) * data.length - gap

  return (
    <svg
      width={totalW}
      height={H + 36}
      viewBox={`0 0 ${totalW} ${H + 36}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {data.map((val, i) => {
        const barH = val > 0 ? Math.max(4, Math.round((val / max) * H)) : 0
        const x = i * (barW + gap)
        const y = H - barH
        const isPeak = val > 0 && val === max
        return (
          <g key={i}>
            <rect x={x} y={0} width={barW} height={H} rx={4}
              fill="rgba(255,255,255,0.05)" />
            {val > 0 && (
              <rect x={x} y={y} width={barW} height={barH} rx={4}
                fill={isPeak ? color : `${color}88`} />
            )}
            {val > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle"
                style={{
                  fontSize: '10px',
                  fill: isPeak ? color : 'rgba(255,255,255,0.72)',
                  fontFamily: "'Barlow Semi Condensed',sans-serif",
                  fontWeight: 700,
                }}>
                {useK
                  ? val >= 1000 ? `$${(val / 1000).toFixed(2)}M` : `$${val}K`
                  : `$${(val / 1000).toFixed(1)}M`}
              </text>
            )}
            <text x={x + barW / 2} y={H + 20} textAnchor="middle"
              style={{
                fontSize: '10px',
                fill: val > 0 ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.28)',
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
  // Northeast (11) — New York restored
  Connecticut: 'Northeast', Delaware: 'Northeast', Maine: 'Northeast',
  Massachusetts: 'Northeast', 'New Hampshire': 'Northeast',
  'New Jersey': 'Northeast', 'New York': 'Northeast', Pennsylvania: 'Northeast',
  'Rhode Island': 'Northeast', Vermont: 'Northeast',

  // House (1) — Florida
  Florida: 'House',

  // Political — D.C. + Virginia + Maryland
  'District of Columbia': 'Political',
  Maryland: 'Political',
  Virginia: 'Political',

  // Regional Majors — Hawaii + Alaska
  Hawaii: 'Regional Majors',
  Alaska: 'Regional Majors',

  // Retail Solutions — Washington state
  Washington: 'Retail Solutions',

  // Southeast (10) — Virginia & Florida moved out
  Alabama: 'Southeast', Arkansas: 'Southeast',
  Georgia: 'Southeast', Kentucky: 'Southeast', Louisiana: 'Southeast',
  Mississippi: 'Southeast', 'North Carolina': 'Southeast', 'South Carolina': 'Southeast',
  Tennessee: 'Southeast', 'West Virginia': 'Southeast',

  // Midwest (12)
  Illinois: 'Midwest', Indiana: 'Midwest', Iowa: 'Midwest',
  Kansas: 'Midwest', Michigan: 'Midwest', Minnesota: 'Midwest',
  Missouri: 'Midwest', Nebraska: 'Midwest', 'North Dakota': 'Midwest',
  Ohio: 'Midwest', 'South Dakota': 'Midwest', Wisconsin: 'Midwest',

  // Central (4)
  Colorado: 'Central', 'New Mexico': 'Central', Oklahoma: 'Central', Texas: 'Central',

  // West (8) — Washington moved to Retail Solutions
  Arizona: 'West', California: 'West',
  Idaho: 'West', Montana: 'West', Nevada: 'West', Oregon: 'West',
  Utah: 'West', Wyoming: 'West',
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
  const [zoomContinent,    setZoomContinent]    = useState<number | null>(null)
  const [hoveredRegion,  setHoveredRegion]  = useState<string | null>(null)
  const [openRegion,     setOpenRegion]     = useState<string | null>(null)
  const [selectedSeller,   setSelectedSeller]   = useState<string | null>(null)
  const [hoveredSellerRow, setHoveredSellerRow] = useState<string | null>(null)
  const [campaignPage,     setCampaignPage]     = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nationFeature,  setNationFeature]  = useState<any>(null)

  useEffect(() => {
    const t = setTimeout(() => setZoomContinent(0), 80)
    return () => clearTimeout(t)
  }, [])

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

  // Reset seller drill-down and campaign page whenever the region or seller changes
  useEffect(() => { setSelectedSeller(null) }, [openRegion])
  useEffect(() => { setCampaignPage(0) }, [selectedSeller])

  const handleRegionClick = (region: string) => {
    setOpenRegion(prev => prev === region ? null : region)
  }

  return (
    <div className="id-exec">

      <GlobeBackground zoomContinent={zoomContinent} />

      {/* Header */}
      <div className="id-exec__header">
        <button className="id-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h2 className="id-exec__title">Executive View</h2>
          <p className="id-exec__subtitle">Regional Incremental Performance</p>
        </div>
      </div>

      {/* Body: metrics sidebar + map/legend */}
      <div className="id-exec__body">

        {/* Regional metrics sidebar */}
        <div className="id-exec__metrics">
          <div className="id-exec__metrics-total-label">Available Incremental</div>
          <div className="id-exec__metrics-total-value">{TOTAL_INCREMENTAL}</div>
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
                      boxShadow: isHovered ? `0 0 6px ${color}` : 'none',
                      opacity: isHovered ? 1 : 0.7,
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

              {/* Inset / small-area region markers (Hawaii, Alaska) */}
              {INSET_MARKERS.map(({ coords, label, region }) => {
                const color = REGION_COLORS[region]
                return (
                  <Marker
                    key={region}
                    coordinates={coords}
                    onClick={() => handleRegionClick(region)}
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
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
                      {label}
                    </text>
                  </Marker>
                )
              })}
            </ComposableMap>
            </div>
              )
            })()}{/* end zoom-wrapper */}

            {/* Region info panel — slides up when a region is selected */}
            {openRegion && (() => {
              const color = REGION_COLORS[openRegion]
              // Resolve data sources based on drill-down state
              const chartData = selectedSeller
                ? (SELLER_MONTHLY_DATA[openRegion]?.[selectedSeller] ?? REGION_MONTHLY_DATA[openRegion])
                : REGION_MONTHLY_DATA[openRegion]

              const allSellers = REGION_GD_YTD[openRegion] ?? []
              const visibleSellers = selectedSeller
                ? allSellers.filter(s => s.name === selectedSeller)
                : allSellers
              const maxYtd = Math.max(...allSellers.map(s => s.ytdK), 1)

              const rawClients = selectedSeller
                ? (SELLER_TOP_CLIENTS[openRegion]?.[selectedSeller] ?? []).map(c => ({ ...c, gd: selectedSeller }))
                : (REGION_TOP_CLIENTS[openRegion] ?? [])
              const maxClientVal = Math.max(...rawClients.map(c => {
                const n = parseFloat(c.incremental.replace(/[$KM]/g, ''))
                return c.incremental.includes('M') ? n * 1000 : n
              }), 1)

              return (
              <div className="id-exec__region-panel">
                <div className="id-exec__panel-header">
                  <span className="id-exec__panel-title" style={{ color }}>
                    {openRegion}
                  </span>
                  <span className="id-exec__panel-subtitle">
                    {selectedSeller ? selectedSeller : 'YTD Incremental'}
                  </span>
                  <button
                    className="id-exec__panel-close"
                    onClick={() => selectedSeller ? setSelectedSeller(null) : setOpenRegion(null)}
                    aria-label={selectedSeller ? 'Back to region' : 'Close region panel'}
                  >
                    ← Back
                  </button>
                </div>
                <div className="id-exec__panel-body">
                  {/* Monthly bar chart */}
                  <div className="id-exec__panel-chart">
                    <div className="id-exec__panel-section-label">Incremental Won by Month</div>
                    <div style={{ marginTop: 30 }}>
                      <IncrementalBarChart data={chartData} color={color} useK={!!selectedSeller} />
                    </div>
                  </div>

                  <div className="id-exec__panel-hdivider" />

                  {/* Bottom row */}
                  <div className="id-exec__panel-bottom-row">

                    {/* Left box: Seller YTD (region) → Available Client Incremental (seller drill-down) */}
                    <div className="id-exec__panel-sellers">
                      {selectedSeller ? (
                        <>
                          <div className="id-exec__panel-section-label">Available Client Incremental</div>
                          {rawClients.map(c => {
                            const raw = parseFloat(c.incremental.replace(/[$KM]/g, ''))
                            const valK = c.incremental.includes('M') ? raw * 1000 : raw
                            return (
                              <div key={c.client} className="id-exec__panel-seller-row">
                                <span className="id-exec__panel-seller-name">{c.client}</span>
                                <div className="id-exec__panel-seller-track">
                                  <div
                                    className="id-exec__panel-seller-fill"
                                    style={{
                                      width: `${Math.round((valK / maxClientVal) * 100)}%`,
                                      background: color,
                                    }}
                                  />
                                </div>
                                <span className="id-exec__panel-seller-amount" style={{ color }}>
                                  {c.incremental}
                                </span>
                              </div>
                            )
                          })}
                        </>
                      ) : (
                        <>
                          <div className="id-exec__panel-section-label">Seller YTD</div>
                          {visibleSellers.map(seller => (
                            <div
                              key={seller.name}
                              className="id-exec__panel-seller-row"
                              style={{
                                cursor: 'pointer',
                                background: hoveredSellerRow === seller.name
                                  ? `${color}18`
                                  : 'transparent',
                                borderRadius: 6,
                                transition: 'background 0.15s',
                              }}
                              onClick={() => setSelectedSeller(seller.name)}
                              onMouseEnter={() => setHoveredSellerRow(seller.name)}
                              onMouseLeave={() => setHoveredSellerRow(null)}
                            >
                              <span className="id-exec__panel-seller-name">{seller.name}</span>
                              <div className="id-exec__panel-seller-track">
                                <div
                                  className="id-exec__panel-seller-fill"
                                  style={{
                                    width: `${Math.round((seller.ytdK / maxYtd) * 100)}%`,
                                    background: color,
                                  }}
                                />
                              </div>
                              <span className="id-exec__panel-seller-amount" style={{ color }}>
                                {seller.ytdK >= 1000
                                  ? `$${(seller.ytdK / 1000).toFixed(2)}M`
                                  : `$${seller.ytdK}K`}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <div className="id-exec__panel-divider" />

                    {/* Right box: Client YTD (region) → Campaign Incremental (seller drill-down) */}
                    <div className="id-exec__panel-clients">
                      {selectedSeller ? (() => {
                        const PAGE_SIZE = 5
                        const sellerCampaigns = CAMPAIGNS
                          .filter(c => c.seller === selectedSeller && c.incrementalDollars > 0)
                          .sort((a, b) => b.incrementalDollars - a.incrementalDollars)
                        const totalPages = Math.ceil(sellerCampaigns.length / PAGE_SIZE)
                        const page = Math.min(campaignPage, totalPages - 1)
                        const pageCampaigns = sellerCampaigns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
                        const maxInc = Math.max(...sellerCampaigns.map(c => c.incrementalDollars), 1)
                        return (
                          <>
                            <div className="id-exec__panel-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>Available Campaign Incremental</span>
                              {totalPages > 1 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <button
                                    onClick={() => setCampaignPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    style={{
                                      background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer',
                                      color: page === 0 ? 'rgba(255,255,255,0.2)' : color,
                                      fontSize: 14, padding: '0 4px', lineHeight: 1,
                                    }}
                                    aria-label="Previous campaigns"
                                  >←</button>
                                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', minWidth: 32, textAlign: 'center' }}>
                                    {page + 1} / {totalPages}
                                  </span>
                                  <button
                                    onClick={() => setCampaignPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page === totalPages - 1}
                                    style={{
                                      background: 'none', border: 'none', cursor: page === totalPages - 1 ? 'default' : 'pointer',
                                      color: page === totalPages - 1 ? 'rgba(255,255,255,0.2)' : color,
                                      fontSize: 14, padding: '0 4px', lineHeight: 1,
                                    }}
                                    aria-label="Next campaigns"
                                  >→</button>
                                </span>
                              )}
                            </div>
                            {pageCampaigns.map((c, i) => {
                              const label = c.incrementalDollars >= 1_000_000
                                ? `$${(c.incrementalDollars / 1_000_000).toFixed(1)}M`
                                : `$${Math.round(c.incrementalDollars / 1000)}K`
                              return (
                                <div key={page * PAGE_SIZE + i} className="id-exec__panel-seller-row">
                                  <span className="id-exec__panel-seller-name" style={{ fontSize: '11px' }}>
                                    {c.clientName}
                                    <span style={{ opacity: 0.55, marginLeft: 4 }}>· {c.name}</span>
                                  </span>
                                  <div className="id-exec__panel-seller-track">
                                    <div
                                      className="id-exec__panel-seller-fill"
                                      style={{
                                        width: `${Math.round((c.incrementalDollars / maxInc) * 100)}%`,
                                        background: color,
                                      }}
                                    />
                                  </div>
                                  <span className="id-exec__panel-seller-amount" style={{ color }}>
                                    {label}
                                  </span>
                                </div>
                              )
                            })}
                          </>
                        )
                      })() : (
                        <>
                          <div className="id-exec__panel-section-label">Client YTD</div>
                          {rawClients.map(c => {
                            const raw = parseFloat(c.incremental.replace(/[$KM]/g, ''))
                            const valK = c.incremental.includes('M') ? raw * 1000 : raw
                            return (
                              <div key={c.client} className="id-exec__panel-seller-row">
                                <span className="id-exec__panel-seller-name">{c.client}</span>
                                <div className="id-exec__panel-seller-track">
                                  <div
                                    className="id-exec__panel-seller-fill"
                                    style={{
                                      width: `${Math.round((valK / maxClientVal) * 100)}%`,
                                      background: color,
                                    }}
                                  />
                                </div>
                                <span className="id-exec__panel-seller-amount" style={{ color }}>
                                  {c.incremental}
                                </span>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>

                  </div>
                </div>
              </div>
              )
            })()}
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
                    boxShadow: hoveredRegion === region ? `0 0 6px ${color}` : 'none',
                    opacity: hoveredRegion === region ? 1 : 0.7,
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
