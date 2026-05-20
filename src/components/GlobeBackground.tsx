import { useState, useEffect, memo } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.dataset.theme !== 'light'
  )
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.dataset.theme !== 'light')
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

const ZOOM_ORIGINS = [
  '14% 22%',  // 0 - North America
  '26% 64%',  // 1 - South America
  '50% 22%',  // 2 - Europe
  '53% 48%',  // 3 - Africa
  '72% 24%',  // 4 - Asia
  '83% 70%',  // 5 - Oceania
  '50% 94%',  // 6 - Antarctica
]

// Brand secondary colors — Brand Guidelines p.19
const BRAND_SECONDARY = [
  '#8EE7F1',  // Bright Aqua    → North America
  '#DDA7EF',  // Digital Lilac  → South America
  '#A9BEF8',  // Skywave        → Europe
  '#38b6ff',  // Neon Azure     → Africa
  '#8263FF',  // Violet Pulse   → Asia
  '#aef33e',  // Neon Lime      → Oceania
  '#d6eeff',  // Ice White-Blue → Antarctica
]

const CONTINENT_COUNT = BRAND_SECONDARY.length

// ISO 3166-1 numeric → continent index
const CC: Record<number, number> = {
  // North America (0)
  124:0, 840:0, 484:0, 304:0, 320:0, 340:0, 222:0, 558:0, 188:0, 591:0,
  192:0, 332:0, 214:0, 388:0, 780:0, 44:0, 52:0, 308:0, 659:0, 662:0,
  670:0, 28:0, 212:0, 84:0, 630:0, 850:0, 652:0, 531:0, 534:0, 535:0,
  // South America (1)
  76:1, 32:1, 152:1, 170:1, 604:1, 862:1, 218:1, 68:1, 600:1, 858:1,
  328:1, 740:1, 254:1, 238:1, 239:1,
  // Europe (2)
  276:2, 250:2, 826:2, 380:2, 724:2, 620:2, 528:2, 56:2, 756:2, 40:2,
  616:2, 203:2, 703:2, 348:2, 642:2, 100:2, 300:2, 191:2, 688:2, 705:2,
  246:2, 752:2, 578:2, 208:2, 233:2, 428:2, 440:2, 112:2, 804:2, 498:2,
  643:2, 372:2, 352:2, 442:2, 470:2, 196:2, 807:2, 70:2, 499:2, 8:2,
  492:2, 336:2, 674:2, 438:2, 20:2,
  // Africa (3)
  12:3, 24:3, 204:3, 72:3, 854:3, 108:3, 120:3, 132:3, 140:3, 148:3,
  174:3, 178:3, 180:3, 262:3, 818:3, 226:3, 232:3, 231:3, 266:3, 288:3,
  324:3, 624:3, 384:3, 404:3, 426:3, 430:3, 434:3, 450:3, 454:3, 466:3,
  478:3, 504:3, 508:3, 516:3, 562:3, 566:3, 646:3, 678:3, 686:3, 694:3,
  706:3, 710:3, 716:3, 728:3, 729:3, 748:3, 768:3, 788:3, 800:3, 834:3,
  894:3, 270:3, 638:3, 654:3, 175:3, 480:3,
  // Asia (4)
  4:4, 50:4, 64:4, 96:4, 116:4, 156:4, 356:4, 360:4, 364:4, 368:4,
  376:4, 392:4, 400:4, 398:4, 408:4, 410:4, 414:4, 417:4, 418:4, 422:4,
  458:4, 462:4, 496:4, 104:4, 524:4, 512:4, 586:4, 275:4, 608:4, 634:4,
  682:4, 702:4, 144:4, 760:4, 762:4, 764:4, 626:4, 792:4, 795:4, 784:4,
  860:4, 704:4, 887:4, 268:4, 31:4, 51:4, 158:4, 446:4,
  // Oceania (5)
  36:5, 554:5, 598:5, 242:5, 882:5, 776:5, 548:5, 584:5, 583:5, 520:5,
  585:5, 90:5, 798:5, 296:5, 184:5, 316:5, 574:5, 334:5,
  // Antarctica (6)
  10:6,
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface GlobeBackgroundProps {
  onActiveChange?: (idx: number) => void
  zoomContinent?: number | null
}

export const GlobeBackground = memo(function GlobeBackground({
  onActiveChange,
  zoomContinent,
}: GlobeBackgroundProps) {
  const isDark = useIsDark()
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => {
        let next: number
        do { next = Math.floor(Math.random() * CONTINENT_COUNT) }
        while (next === prev)
        return next
      })
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    onActiveChange?.(activeIdx)
  }, [activeIdx, onActiveChange])

  const zoomStyle = zoomContinent !== null && zoomContinent !== undefined
    ? {
        transform: 'scale(3.8)',
        transformOrigin: ZOOM_ORIGINS[zoomContinent],
        transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : {
        transform: 'scale(1)',
        transformOrigin: '50% 50%',
        transition: 'transform 1.0s cubic-bezier(0.4, 0, 0.2, 1)',
      }

  return (
    <div className="globe-bg" style={zoomStyle}>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 185, center: [10, 0] }}
        width={1000}
        height={520}
        style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="globe-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="1000" height="520" fill={isDark ? '#030810' : '#f0f4ff'} />

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const contIdx = CC[+geo.id] ?? -1
              const isActive = contIdx === activeIdx
              const color = contIdx >= 0 ? BRAND_SECONDARY[contIdx] : (isDark ? '#0d1b30' : 'rgba(0,7,219,0.06)')

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: isActive ? color : (isDark ? '#0d1b30' : 'rgba(0,7,219,0.06)'),
                      fillOpacity: isActive ? (isDark ? 0.38 : 0.60) : (isDark ? 0.25 : 1),
                      stroke: isActive ? color : (isDark ? 'rgba(80,120,200,0.2)' : 'rgba(0,7,219,0.18)'),
                      strokeWidth: 0.4,
                      transition: 'fill 1.4s ease, fill-opacity 1.4s ease, stroke 1.4s ease',
                      outline: 'none',
                    },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      <div className="globe-bg__vignette" />
    </div>
  )
})
