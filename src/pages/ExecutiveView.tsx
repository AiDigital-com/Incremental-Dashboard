import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

// ── Geo data ──────────────────────────────────────────────────────────────────

const GEO_URL = '/states-10m.json'

// ── Region definitions ────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  Northeast: '#0009DC',  // Yves Klein Blue
  Southeast: '#AEF33E',  // Lime
  Midwest:   '#FF7CF5',  // Pink
  Central:   '#38b6ff',  // Neon Azure
  West:      '#8263FF',  // Violet Pulse
}

const REGION_LABELS: Record<string, string> = {
  Northeast: 'Northeast',
  Southeast: 'Southeast',
  Midwest:   'Midwest',
  Central:   'Central',
  West:      'West',
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

// ── Component ─────────────────────────────────────────────────────────────────

export function ExecutiveView() {
  return (
    <div className="id-exec">

      <div className="id-exec__header">
        <h2 className="id-exec__title">Executive View</h2>
        <p className="id-exec__subtitle">Regional incremental performance — United States</p>
      </div>

      <div className="id-exec__map-wrap">
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            {Object.entries(REGION_COLORS).map(([region, color]) => (
              <filter key={region} id={`glow-${region}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feColorMatrix in="blur" type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                  result="glow"
                />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
                {/* Reference color to avoid lint warning */}
                <feFlood floodColor={color} floodOpacity="0" result="colorRef" />
              </filter>
            ))}
          </defs>

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const stateName: string = geo.properties?.name ?? ''
                const region = STATE_REGIONS[stateName]
                const color = region ? REGION_COLORS[region] : '#444'

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: region ? `${color}38` : '#1a1a1a',
                        stroke: region ? `${color}bb` : '#333',
                        strokeWidth: 0.6,
                        filter: region ? `drop-shadow(0 0 5px ${color}99)` : 'none',
                        outline: 'none',
                        transition: 'fill 0.15s, filter 0.15s',
                      },
                      hover: {
                        fill: region ? `${color}66` : '#222',
                        stroke: region ? color : '#555',
                        strokeWidth: 1,
                        filter: region ? `drop-shadow(0 0 10px ${color}cc)` : 'none',
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
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="id-exec__legend">
        {Object.entries(REGION_LABELS).map(([region, label]) => (
          <div key={region} className="id-exec__legend-item">
            <span
              className="id-exec__legend-dot"
              style={{
                background: REGION_COLORS[region],
                boxShadow: `0 0 8px ${REGION_COLORS[region]}`,
              }}
            />
            <span className="id-exec__legend-label">{label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
