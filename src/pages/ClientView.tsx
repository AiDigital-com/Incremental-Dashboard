import { useState, useEffect, useMemo, useRef } from 'react'
import { GlobeBackground } from '../components/GlobeBackground'
import { Max3D } from '../components/Max3D'
import { CAMPAIGNS } from '../data/campaigns'
import type { Campaign } from '../components/IncrementalDashboard'

// ── Client context ────────────────────────────────────────────────────────────
// This view represents one specific advertiser.
const CLIENT_NAME = 'Bradley MediaWorks'

// ── Max Chat types & static data ─────────────────────────────────────────────

type MaxStep =
  | 'root'
  | 'what_options'
  | 'avail_incr'
  | 'new_budget_ask'
  | 'new_budget_tactics'
  | 'new_creative'
  | 'new_creative_budget'
  | 'new_creative_result'
  | 'expand_audience'
  | 'other'

interface MaxMsg { from: 'max' | 'user'; text: string }

const ALL_TACTIC_TYPES = ['CTV', 'CTV/OTT', 'Display', 'Meta', 'Search', 'Video', 'YouTube', 'Audio', 'DOOH']

const NEW_BUDGET_TACTICS = ['CTV', 'OLV', 'Display', 'Native', 'Social', 'Search']

const CREATIVE_TYPES = ['Display', 'Native', 'Video', 'Social']
const CREATIVE_WEIGHTS: Record<string, number> = { Display: 25, Native: 15, Video: 40, Social: 20 }

const TACTIC_DESCRIPTIONS: Record<string, string> = {
  CTV:        'Streaming TV ads on connected devices — high completion rates and premium inventory.',
  'CTV/OTT':  'Over-the-top streaming across all OTT platforms — massive scale with demo targeting.',
  Display:    'Programmatic banners & rich media across the open web — wide reach at efficient CPMs.',
  Meta:       'Facebook & Instagram — feed, stories, and reels with unmatched social targeting.',
  Search:     'Paid search at the moment of intent — the highest purchase-ready audience in digital.',
  Video:      'Pre/mid-roll video on premium publishers — drives strong awareness and recall.',
  YouTube:    "Google's video network with TrueView, bumpers, and intent-layered targeting.",
  Audio:      "Streaming audio on Spotify, Pandora & podcasts — reaches where visuals can't.",
  DOOH:       'Digital out-of-home at high-traffic locations — geo-targeted premium placements.',
}

const MOCKUP_AUDIENCES = [
  { label: 'Digital Deal Seekers',     ages: '28–44', reach: '2.4M', relevance: 87 },
  { label: 'Millennial Tech Adopters', ages: '25–38', reach: '1.8M', relevance: 81 },
  { label: 'High-Income Cord-Cutters', ages: '35–54', reach: '890K', relevance: 79 },
  { label: 'Suburban Homeowners',      ages: '32–52', reach: '3.1M', relevance: 74 },
  { label: 'Gen-Z Brand Explorers',    ages: '18–26', reach: '1.2M', relevance: 68 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBudget(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) {
    const k = n / 1_000
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`
  }
  return `$${n}`
}

function parseRawAmt(s: string): number {
  if (!s) return 0
  const cleaned = s.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  if (/k$/i.test(cleaned)) return num * 1_000
  if (/m$/i.test(cleaned)) return num * 1_000_000
  return num
}

function fmtKpi(val: number, unit: string): string {
  if (unit === '%') return `${val.toFixed(1)}%`
  if (unit === '$') return `$${val.toFixed(2)}`
  return `${val.toFixed(2)}x`
}

function gmailCompose(subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// ── Audience suggestion data ──────────────────────────────────────────────────

type AudienceTag = 'Lookalike' | '3PS' | 'Contextual'

interface AudienceSuggestion { type: AudienceTag; label: string; desc: string }

const AUDIENCE_SUGGESTIONS: Record<string, AudienceSuggestion[]> = {
  CTV: [
    { type: 'Lookalike', label: 'High-VCR Viewer Lookalike', desc: '1P match on users mirroring your highest-completion CTV viewers.' },
    { type: '3PS',       label: 'Streaming Household 3PS',   desc: 'Cord-cutter & OTT-heavy households from Nielsen streaming data.' },
  ],
  'CTV/OTT': [
    { type: 'Lookalike', label: 'High-VCR Viewer Lookalike', desc: '1P match on users mirroring your highest-completion CTV/OTT viewers.' },
    { type: '3PS',       label: 'Streaming Household 3PS',   desc: 'Cord-cutter & OTT-heavy households sourced from Nielsen streaming data.' },
  ],
  Display: [
    { type: 'Lookalike', label: 'Click-Through Behavioral Lookalike', desc: 'Prospecting audiences mirroring your top-clicking Display visitors.' },
    { type: '3PS',       label: 'In-Market Intent 3PS',               desc: 'Active category researchers from Oracle/Experian data partnerships.' },
  ],
  Meta: [
    { type: 'Lookalike', label: 'Meta Customer List LAL',  desc: '2% Lookalike built from your highest-value converters in Meta Ads Manager.' },
    { type: '3PS',       label: 'Life Event Intent 3PS',   desc: 'Users exhibiting purchase-trigger life events relevant to your category.' },
  ],
  Search: [
    { type: 'Lookalike', label: 'RLSA Behavioral Lookalike',    desc: 'Similar-intent users outside your current keyword match radius.' },
    { type: '3PS',       label: 'Competitor Conquesting 3PS',   desc: 'In-market users actively researching competitor brands.' },
  ],
  Video: [
    { type: 'Lookalike', label: 'Video Completion Lookalike', desc: 'Prospects mirroring users completing 75%+ of your video creative.' },
    { type: 'Contextual', label: 'Content Category Contextual', desc: 'Inventory adjacent to content your top video viewers consume most.' },
  ],
  YouTube: [
    { type: 'Lookalike', label: 'YouTube Engaged Viewer Lookalike', desc: 'Similar-to-engaged audience from Google Customer Match data.' },
    { type: '3PS',       label: 'Video Intent 3PS',                 desc: 'Users with strong video engagement signals across Google properties.' },
  ],
  Audio: [
    { type: 'Lookalike', label: 'Podcast Listener Lookalike',     desc: '1P match from top-completion audio listeners for podcast inventory.' },
    { type: '3PS',       label: 'Music & Podcast Behavioral 3PS', desc: 'Heavy audio consumers indexed against your best listener profiles.' },
  ],
  DOOH: [
    { type: '3PS',        label: 'Foot Traffic 3PS',     desc: 'Location-based audiences who index high for your DOOH placement areas.' },
    { type: 'Contextual', label: 'Proximity Behavioral', desc: 'Mobile users within range of your best-performing DOOH screens.' },
  ],
}

const DEFAULT_SUGGESTIONS: AudienceSuggestion[] = [
  { type: 'Lookalike', label: 'Performance Behavioral Lookalike', desc: 'Prospect audiences mirroring your top-converting campaign segment.' },
  { type: '3PS',       label: 'Category Intent 3PS',              desc: 'In-market audiences from verified third-party data partnerships.' },
]

const TAG_COLORS: Record<AudienceTag, string> = {
  'Lookalike': '#8263FF',
  '3PS':       '#8EE7F1',
  'Contextual':'#AEF33E',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { onBack: () => void }
type ModalType = 'breakdown' | 'scenario' | null

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientView({ onBack }: Props) {
  const [zoomContinent,       setZoomContinent]       = useState<number | null>(null)
  const [modal,                setModal]               = useState<ModalType>(null)
  const [showAudienceAnalysis, setShowAudienceAnalysis] = useState(false)
  const [selectedCampaign,     setSelectedCampaign]    = useState<Campaign | null>(null)
  const [showMediaPlans,       setShowMediaPlans]      = useState(false)
  const [scenarioView,         setScenarioView]        = useState<'menu' | 'a' | 'b' | 'c'>('menu')
  const [allocations,          setAllocations]         = useState<Record<string, number>>({})
  const [userPlanNote,         setUserPlanNote]        = useState('')
  const [showMaxChat,    setShowMaxChat]    = useState(false)
  const [maxStep,        setMaxStep]        = useState<MaxStep>('root')
  const [maxMsgs,        setMaxMsgs]        = useState<MaxMsg[]>([])
  const [maxBudgetDraft, setMaxBudgetDraft] = useState('')
  const [maxBudgetAmount,setMaxBudgetAmount]= useState(0)
  const [selectedTactics,     setSelectedTactics]     = useState<Set<string>>(new Set())
  const [tacticAmounts,       setTacticAmounts]       = useState<Record<string, number>>({})
  const [breakdownDetail, setBreakdownDetail] = useState<string | null>(null)
  const [newBudgetSelected,   setNewBudgetSelected]   = useState<Set<string>>(new Set())
  const [newBudgetTacticAmts, setNewBudgetTacticAmts] = useState<Record<string, string>>({})
  const [selectedCreatives,   setSelectedCreatives]   = useState<Set<string>>(new Set())
  const [creativeBudgetDraft, setCreativeBudgetDraft] = useState('')
  const [creativeBudgetAmt,   setCreativeBudgetAmt]   = useState(0)
  const maxBodyRef = useRef<HTMLDivElement>(null)
  const sliderRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const amtSpanRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const [creativeAllocEdits, setCreativeAllocEdits] = useState<Record<string, string>>({})
  const [selectedAudiences,  setSelectedAudiences]  = useState<Set<string>>(new Set())
  const [audienceAmounts,    setAudienceAmounts]     = useState<Record<string, string>>({})

  useEffect(() => {
    const t = setTimeout(() => setZoomContinent(0), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!modal) {
      setShowAudienceAnalysis(false)
      setSelectedCampaign(null)
      setShowMediaPlans(false)
      setScenarioView('menu')
      setAllocations({})
      setUserPlanNote('')
      setSelectedTactics(new Set())
      setTacticAmounts({})
      setBreakdownDetail(null)
    }
  }, [modal])

  useEffect(() => {
    if (!modal) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal])

  useEffect(() => {
    if (!showMaxChat) {
      setMaxStep('root')
      setMaxMsgs([])
      setMaxBudgetDraft('')
      setMaxBudgetAmount(0)
      setSelectedTactics(new Set())
      setTacticAmounts({})
      setNewBudgetSelected(new Set())
      setNewBudgetTacticAmts({})
      setSelectedCreatives(new Set())
      setCreativeBudgetDraft('')
      setCreativeBudgetAmt(0)
      setCreativeAllocEdits({})
      setSelectedAudiences(new Set())
      setAudienceAmounts({})
    }
  }, [showMaxChat])

  useEffect(() => {
    if (maxBodyRef.current) maxBodyRef.current.scrollTop = maxBodyRef.current.scrollHeight
  }, [maxMsgs, maxStep])

  // ── Client-specific campaign data ─────────────────────────────────────────
  const clientCampaigns = useMemo(
    () => CAMPAIGNS.filter(c => c.clientName === CLIENT_NAME && c.performanceMultiplier >= 1.0),
    []
  )

  // ── All advertisers aggregated by client name (for Apply Incremental list) ─
  const advertiserBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of CAMPAIGNS) {
      if (c.performanceMultiplier >= 1.0)
        map.set(c.clientName, (map.get(c.clientName) ?? 0) + c.incrementalDollars)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  const activeCampaignCount  = clientCampaigns.length
  const activeBudget         = clientCampaigns.reduce((s, c) => s + c.budget, 0)
  const availableIncremental = clientCampaigns.reduce((s, c) => s + c.incrementalDollars, 0)

  // ── Audience performance data (for analysis view) ─────────────────────────
  const audiencePerformance = useMemo(() => {
    const byType = new Map<string, { totalPerf: number; count: number; kpiLabel: string; kpiUnit: string; kpiSum: number }>()
    for (const c of clientCampaigns) {
      const e = byType.get(c.name)
      if (e) { e.totalPerf += c.performanceMultiplier; e.count++; e.kpiSum += c.kpiValue }
      else   { byType.set(c.name, { totalPerf: c.performanceMultiplier, count: 1, kpiLabel: c.kpiLabel, kpiUnit: c.kpiUnit, kpiSum: c.kpiValue }) }
    }
    return [...byType.entries()]
      .map(([name, d]) => ({
        name,
        avgPerf: d.totalPerf / d.count,
        kpiLabel: d.kpiLabel,
        kpiUnit: d.kpiUnit,
        avgKpi: d.kpiSum / d.count,
        suggestions: AUDIENCE_SUGGESTIONS[name] ?? DEFAULT_SUGGESTIONS,
      }))
      .sort((a, b) => b.avgPerf - a.avgPerf)
  }, [clientCampaigns])

  const maxPerf = audiencePerformance[0]?.avgPerf ?? 1
  const minPerf = 1.0

  // ── AI-suggested allocation (top performers get budget first) ─────────────
  const aiAllocation = useMemo(() => {
    const sorted = [...clientCampaigns].sort((a, b) => b.performanceMultiplier - a.performanceMultiplier)
    let remaining = availableIncremental
    const result: Record<string, number> = Object.fromEntries(clientCampaigns.map(c => [c.id, 0]))
    for (const c of sorted) {
      if (remaining <= 0) break
      const give = Math.min(c.incrementalDollars, remaining)
      result[c.id] = give
      remaining -= give
    }
    return result
  }, [clientCampaigns, availableIncremental])

  const totalAllocated = clientCampaigns.reduce((s, c) => s + (allocations[c.id] ?? 0), 0)
  const totalAiAllocated = Object.values(aiAllocation).reduce((s, v) => s + v, 0)

  function setAlloc(id: string, val: number) {
    setAllocations(prev => ({ ...prev, [id]: val }))
  }

  // ── Max Chat helpers ──────────────────────────────────────────────────────

  const tacticBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of clientCampaigns) map.set(c.name, (map.get(c.name) ?? 0) + c.incrementalDollars)
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [clientCampaigns])

  const newTactics = useMemo(() => {
    const current = new Set(clientCampaigns.map(c => c.name))
    return ALL_TACTIC_TYPES.filter(t => !current.has(t))
  }, [clientCampaigns])

  function maxAction(userText: string, next: MaxStep, reply: string) {
    setMaxMsgs(prev => [...prev, { from: 'user', text: userText }, { from: 'max', text: reply }])
    setMaxStep(next)
  }

  function handleBudgetSubmit(raw: string | number) {
    let n = typeof raw === 'number' ? raw
      : parseFloat(raw.replace(/[^0-9.]/g, '')) * (raw.toLowerCase().includes('k') ? 1000 : 1)
    if (!n || n <= 0) return
    setMaxBudgetAmount(n)
    setMaxMsgs(prev => [
      ...prev,
      { from: 'user', text: `I have ${formatBudget(n)} for new tactics.` },
      { from: 'max', text: `${formatBudget(n)} to work with — nice. Now select the tactics you want to invest in and enter an amount for each:` },
    ])
    setMaxBudgetDraft('')
    setNewBudgetSelected(new Set())
    setNewBudgetTacticAmts({})
    setMaxStep('new_budget_tactics')
  }

  function handleAvailIncr() {
    const initial = Object.fromEntries(tacticBreakdown.map(([n, a]) => [n, a]))
    setTacticAmounts(initial)
    setSelectedTactics(new Set())
    maxAction(
      'Currently available incremental',
      'avail_incr',
      `Here's your available incremental by tactic — ${formatBudget(availableIncremental)} total. Check the ones you'd like to apply:`
    )
  }

  function openNewBudgetEmail() {
    const lines = NEW_BUDGET_TACTICS
      .filter(t => newBudgetSelected.has(t))
      .map(t => `  • ${t}: ${formatBudget(parseRawAmt(newBudgetTacticAmts[t] ?? ''))}`)
      .join('\n')
    const total = [...newBudgetSelected].reduce((s, t) => s + parseRawAmt(newBudgetTacticAmts[t] ?? ''), 0)
    window.open(gmailCompose(
      `New Tactic Budget — ${CLIENT_NAME}`,
      `Hi Team,\n\nI'd like to allocate ${formatBudget(maxBudgetAmount)} in new budget for ${CLIENT_NAME} across the following tactics:\n\n${lines}\n\nTotal Allocated: ${formatBudget(total)}\n\nPlease let me know my options!`
    ), '_blank')
  }

  function getCreativeAlloc(amount: number, creatives: Set<string>) {
    const selected = CREATIVE_TYPES.filter(t => creatives.has(t))
    const totalW = selected.reduce((s, t) => s + (CREATIVE_WEIGHTS[t] ?? 25), 0)
    const rows = selected.map((t, i) => {
      const share = (CREATIVE_WEIGHTS[t] ?? 25) / totalW
      return { name: t, amt: i < selected.length - 1 ? Math.round(amount * share) : 0 }
    })
    const allocated = rows.reduce((s, r) => s + r.amt, 0)
    if (rows.length) rows[rows.length - 1].amt = amount - allocated
    return rows
  }

  function handleCreativeBudgetSubmit(raw: string | number) {
    const n = typeof raw === 'number' ? raw : parseRawAmt(String(raw))
    if (!n || n <= 0) return
    const alloc = getCreativeAlloc(n, selectedCreatives)
    const initialEdits: Record<string, string> = {}
    alloc.forEach(({ name, amt }) => { initialEdits[name] = formatBudget(amt) })
    setCreativeAllocEdits(initialEdits)
    setCreativeBudgetAmt(n)
    setMaxMsgs(prev => [
      ...prev,
      { from: 'user', text: `I have ${formatBudget(n)} to put behind these creatives.` },
      { from: 'max', text: `Here's how I'd recommend allocating ${formatBudget(n)} across your creative types:` },
    ])
    setCreativeBudgetDraft('')
    setMaxStep('new_creative_result')
  }

  function openCreativeEmail() {
    const alloc = getCreativeAlloc(creativeBudgetAmt, selectedCreatives)
    const lines = alloc.map(({ name, amt }) => `  • ${name}: ${creativeAllocEdits[name] ?? formatBudget(amt)}`).join('\n')
    window.open(gmailCompose(
      `New Creative Budget — ${CLIENT_NAME}`,
      `Hi Team,\n\nI have new creative assets for ${CLIENT_NAME} and ${formatBudget(creativeBudgetAmt)} in budget to deploy.\n\nCreative types: ${[...selectedCreatives].join(', ')}\n\nRecommended allocation:\n${lines}\n\nPlease let me know my options!`
    ), '_blank')
  }

  function openAudienceEmail() {
    const lines = [...selectedAudiences]
      .map(label => `  • ${label}${audienceAmounts[label] ? ': ' + audienceAmounts[label] : ''}`)
      .join('\n')
    window.open(gmailCompose(
      `Audience Expansion — ${CLIENT_NAME}`,
      `Hi Team,\n\nI'd like to expand my audience for ${CLIENT_NAME} with the following Resonate segments:\n\n${lines}\n\nPlease let me know my options!`
    ), '_blank')
  }

  function openApplyEmail() {
    const lines = tacticBreakdown
      .filter(([name]) => selectedTactics.has(name))
      .map(([name, amt]) => `  • ${name}: ${formatBudget(tacticAmounts[name] ?? amt)}`)
      .join('\n')
    const total = tacticBreakdown
      .filter(([name]) => selectedTactics.has(name))
      .reduce((s, [name, amt]) => s + (tacticAmounts[name] ?? amt), 0)
    window.open(gmailCompose(
      `Apply Available Incremental — ${CLIENT_NAME}`,
      `Hi Team,\n\nI'd like to apply available incremental for ${CLIENT_NAME} to the following campaigns ASAP:\n\n${lines}\n\nTotal to Apply: ${formatBudget(total)}\n\nPlease proceed as soon as possible!`
    ), '_blank')
  }

  function openAdvertiserEmail(advertiser: string) {
    const campaigns = CAMPAIGNS.filter(c => c.clientName === advertiser && c.performanceMultiplier >= 1.0)
    const channelMap = new Map<string, number>()
    for (const c of campaigns) channelMap.set(c.name, (channelMap.get(c.name) ?? 0) + c.incrementalDollars)
    const channels = [...channelMap.entries()].sort((a, b) => b[1] - a[1])
    const total = channels.reduce((s, [, a]) => s + a, 0)
    const lines = channels.map(([name, amt]) => `    • ${name}: ${formatBudget(amt)} max available`).join('\n')
    window.open(gmailCompose(
      `Available Incremental — ${advertiser}`,
      `Hi Team,\n\n${advertiser} has ${formatBudget(total)} in available incremental ready to activate.\n\nBreakdown by channel:\n\n${lines}\n\nTotal Available: ${formatBudget(total)}\n\nLet's discuss the best path forward!\n`
    ), '_blank')
  }

  function openOtherEmail() {
    const subject = `Growth & CS Question — ${CLIENT_NAME}`
    const body = [
      `Hi Team,`,
      ``,
      `I have a question about my campaigns for ${CLIENT_NAME} that goes a bit beyond incremental.`,
      ``,
      `[Please replace this with your specific question]`,
      ``,
      `Thanks for pulling in the Big Dogs on this one!`,
    ].join('\n')
    window.open(gmailCompose(subject, body), '_blank')
  }

  // ── Email helpers ─────────────────────────────────────────────────────────
  function openGrowthEmail(c: Campaign) {
    window.open(gmailCompose(
      `Campaign Opportunities — ${c.clientName}: ${c.name}`,
      `Hi,\n\nI wanted to connect regarding incremental opportunities for the ${c.name} campaign under ${c.clientName}.\n\nWith ${formatBudget(c.incrementalDollars)} in available incremental, there's real momentum to capitalize on before this flight closes.\n\nWould love to explore options — let me know when you're available!\n`,
    ), '_blank')
  }

  function openRequestNow(c: Campaign) {
    window.open(gmailCompose(
      `Incremental Breakdown Request — ${c.clientName}`,
      `Hi,\n\nI'm reaching out to request an incremental breakdown for our ${c.name} campaign under ${c.clientName}.\n\nTotal Incremental Available: ${formatBudget(c.incrementalDollars)}\n\nI'd like to understand:\n  • Where additional budget would generate the most lift\n  • Recommended audiences and channels for expansion\n  • A projected performance analysis for each option\n\nLooking forward to your recommendations!\n`,
    ), '_blank')
  }

  function openChatWithMax(c: Campaign) {
    window.open(gmailCompose(
      `Incremental Options — ${c.clientName}`,
      `Hi Max,\n\nI'd love to explore my incremental options for the ${c.name} campaign under ${c.clientName}.\n\nWe currently have ${formatBudget(c.incrementalDollars)} available and I'm looking for your best recommendation on where to put it to work.\n\nThanks!\n`,
    ), '_blank')
  }

  function openRelayPlan(note?: string) {
    const allocLines = clientCampaigns
      .filter(c => (allocations[c.id] ?? 0) > 0)
      .sort((a, b) => (allocations[b.id] ?? 0) - (allocations[a.id] ?? 0))
      .map(c => `  • ${c.name}: ${formatBudget(allocations[c.id])}`)
      .join('\n')
    const body = [
      `Hi Team,`,
      ``,
      `I'd like to relay my incremental media plan for ${CLIENT_NAME}.`,
      ``,
      `Total Available Incremental: ${formatBudget(availableIncremental)}`,
      ...(allocLines ? [`Total Allocated: ${formatBudget(totalAllocated)}`, ``, `My Allocation:`, allocLines] : []),
      ...(note ? [``, `Additional Notes:`, note] : []),
      ``,
      `Please proceed with activating this plan at your earliest convenience!`,
    ].join('\n')
    window.open(gmailCompose(`Incremental Plan — ${CLIENT_NAME}`, body), '_blank')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="id-dashboard">

      <GlobeBackground zoomContinent={zoomContinent} />

      <div className="id-dashboard__header">
        <button className="id-back-btn" onClick={onBack}>← Back</button>
        <div className="id-dashboard__title-wrap">
          <h2 className="id-dashboard__title-text">Client View</h2>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="id-dashboard__kpis">
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Client Name</span>
          <span className="id-kpi-tile__value" style={{ fontSize: '0.85rem' }}>{CLIENT_NAME}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Active Campaign Count</span>
          <span className="id-kpi-tile__value">{activeCampaignCount}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Active Budget</span>
          <span className="id-kpi-tile__value">{formatBudget(activeBudget)}</span>
        </div>
        <div className="id-kpi-tile">
          <span className="id-kpi-tile__label">Available Incremental</span>
          <span className="id-kpi-tile__value">{formatBudget(availableIncremental)}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="id-client__cards">

        {/* Apply Incremental */}
        <button className="id-client__card id-client__card--attribution" onClick={() => setModal('breakdown')}>
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6"  y1="20" x2="6"  y2="14"/>
              <line x1="2"  y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Take Action</span>
          <span className="id-client__card-title">Apply Incremental</span>
          <span className="id-client__card-desc">
            Know exactly what you want? Select campaigns, review available incremental, and relay your plan directly to your Growth and CS team.
          </span>
          <span className="id-client__card-cta">Select Campaigns →</span>
        </button>

        {/* Scenario Explorer */}
        <button className="id-client__card id-client__card--audit" onClick={() => setModal('scenario')}>
          <div className="id-client__card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8"  x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/>
              <line x1="9" y1="8"  x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </div>
          <span className="id-client__card-kicker">Explore & Plan</span>
          <span className="id-client__card-title">Scenario Explorer</span>
          <span className="id-client__card-desc">
            Not sure where to start? Explore audience expansion opportunities, understand your channel options, and build allocation scenarios for your incremental budget.
          </span>
          <span className="id-client__card-cta">Explore Options →</span>
        </button>

      </div>

      {/* ── Max Chat Widget ───────────────────────────────────────────────── */}

      {showMaxChat && (
        <div className="id-max__panel">
          <div className="id-max__panel-inner">

            {/* Header */}
            <div className="id-max__panel-top">
              <div>
                <span className="id-max__panel-name">MAX</span>
                <span className="id-max__panel-tagline">Your Incremental AI Guide</span>
              </div>
              {maxStep !== 'root' && (
                <button
                  className="id-max__nav-btn"
                  onClick={() => {
                    if (maxStep === 'new_budget_tactics') {
                      setMaxStep('new_budget_ask')
                      setNewBudgetSelected(new Set()); setNewBudgetTacticAmts({})
                      setMaxBudgetAmount(0); setMaxBudgetDraft('')
                      setMaxMsgs(prev => prev.slice(0, -2))
                    } else if (maxStep === 'new_creative_result') {
                      setMaxStep('new_creative_budget')
                      setCreativeBudgetAmt(0); setCreativeBudgetDraft('')
                      setMaxMsgs(prev => prev.slice(0, -2))
                    } else if (maxStep === 'new_creative_budget') {
                      setMaxStep('new_creative')
                      setMaxMsgs(prev => prev.slice(0, -2))
                    } else if (maxStep === 'new_budget_ask' || maxStep === 'avail_incr') {
                      setMaxStep('what_options'); setSelectedTactics(new Set()); setTacticAmounts({})
                    } else if (maxStep === 'what_options') {
                      setMaxStep('root'); setMaxMsgs([])
                    } else {
                      setMaxStep('root'); setMaxMsgs([]); setMaxBudgetDraft(''); setMaxBudgetAmount(0)
                      setSelectedTactics(new Set()); setTacticAmounts({})
                      setNewBudgetSelected(new Set()); setNewBudgetTacticAmts({})
                      setSelectedCreatives(new Set()); setCreativeBudgetDraft(''); setCreativeBudgetAmt(0)
                      setCreativeAllocEdits({})
                      setSelectedAudiences(new Set()); setAudienceAmounts({})
                    }
                  }}
                >
                  ← Back
                </button>
              )}
              <button className="id-max__panel-close" onClick={() => setShowMaxChat(false)} aria-label="Close Max">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Chat body */}
            <div className="id-max__chat-body" ref={maxBodyRef}>

              {/* Greeting — always visible */}
              <div className="id-max__bubble id-max__bubble--max">
                <p>Hey {CLIENT_NAME.split(' ')[0]}! I'm Max — I'm here to help you get the most out of your incremental budget.</p>
                <p>You've got <strong style={{ color: '#AEF33E' }}>{formatBudget(availableIncremental)}</strong> currently available. What can I help you with?</p>
              </div>

              {/* Conversation history */}
              {maxMsgs.map((msg, i) => (
                <div key={i} className={`id-max__bubble${msg.from === 'max' ? ' id-max__bubble--max' : ' id-max__bubble--user'}`}>
                  <p>{msg.text}</p>
                </div>
              ))}

              {/* A1 — Available incremental by tactic */}
              {maxStep === 'avail_incr' && (
                <div className="id-max__rich">
                  {tacticBreakdown.map(([name, amt]) => {
                    const checked = selectedTactics.has(name)
                    const initialVal = tacticAmounts[name] ?? amt
                    return (
                      <div key={name} className="id-max__tactic-row id-max__tactic-row--check">
                        <input
                          type="checkbox"
                          id={`avail-${name}`}
                          className="id-max__check"
                          checked={checked}
                          onChange={e => {
                            const next = new Set(selectedTactics)
                            e.target.checked ? next.add(name) : next.delete(name)
                            setSelectedTactics(next)
                          }}
                        />
                        <label htmlFor={`avail-${name}`} className="id-max__tactic-name">{name}</label>
                        <input
                          ref={el => { sliderRefs.current[name] = el }}
                          type="range"
                          className="id-max__tactic-range"
                          min={0}
                          max={amt}
                          step={Math.max(500, Math.floor(amt / 20))}
                          defaultValue={initialVal}
                          onInput={e => {
                            const val = Number((e.target as HTMLInputElement).value)
                            const span = amtSpanRefs.current[name]
                            if (span) span.textContent = formatBudget(val)
                          }}
                          onMouseUp={e => setTacticAmounts(p => ({ ...p, [name]: Number((e.target as HTMLInputElement).value) }))}
                          onTouchEnd={e => setTacticAmounts(p => ({ ...p, [name]: Number((e.currentTarget as HTMLInputElement).value) }))}
                        />
                        <span
                          ref={el => { amtSpanRefs.current[name] = el }}
                          className="id-max__tactic-amt"
                          style={{ color: checked ? '#AEF33E' : undefined }}
                        >
                          {formatBudget(initialVal)}
                        </span>
                      </div>
                    )
                  })}
                  <div className="id-max__tactic-row id-max__tactic-total">
                    <span className="id-max__tactic-name">Total Available</span>
                    <span className="id-max__tactic-amt" style={{ color: '#AEF33E' }}>{formatBudget(availableIncremental)}</span>
                  </div>
                  {selectedTactics.size > 0 && (
                    <button className="id-max__apply-btn" onClick={openApplyEmail}>
                      Contact my campaign management team to have this applied ASAP
                    </button>
                  )}
                </div>
              )}

              {/* A2 — New budget ask: chips + custom input */}
              {maxStep === 'new_budget_ask' && (
                <div className="id-max__rich">
                  <div className="id-max__budget-chips">
                    {[10_000, 25_000, 50_000, 100_000].map(amt => (
                      <button key={amt} className="id-max__budget-chip" onClick={() => handleBudgetSubmit(amt)}>
                        {formatBudget(amt)}
                      </button>
                    ))}
                  </div>
                  <div className="id-max__budget-input-row">
                    <input
                      className="id-max__input"
                      type="text"
                      placeholder="Custom amount…"
                      value={maxBudgetDraft}
                      onChange={e => setMaxBudgetDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleBudgetSubmit(maxBudgetDraft) }}
                    />
                    <button
                      className="id-max__send-btn"
                      disabled={!maxBudgetDraft.trim()}
                      onClick={() => handleBudgetSubmit(maxBudgetDraft)}
                      aria-label="Submit budget"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* A2 result — tactic selector */}
              {maxStep === 'new_budget_tactics' && (() => {
                const totalNew = [...newBudgetSelected].reduce(
                  (s, t) => s + parseRawAmt(newBudgetTacticAmts[t] ?? ''), 0
                )
                return (
                  <div className="id-max__rich">
                    <div className="id-max__budget-tracker">
                      <span>Allocated</span>
                      <span style={{ color: totalNew > maxBudgetAmount ? '#FF7CF5' : totalNew > 0 ? '#AEF33E' : 'rgba(249,249,249,0.40)' }}>
                        {formatBudget(totalNew)}<span style={{ opacity: 0.40 }}> of {formatBudget(maxBudgetAmount)}</span>
                      </span>
                    </div>
                    {NEW_BUDGET_TACTICS.map(tactic => {
                      const sel = newBudgetSelected.has(tactic)
                      return (
                        <div key={tactic} className="id-max__tactic-row id-max__tactic-row--check">
                          <input
                            type="checkbox"
                            id={`nbt-${tactic}`}
                            className="id-max__check"
                            checked={sel}
                            onChange={e => {
                              const next = new Set(newBudgetSelected)
                              if (e.target.checked) { next.add(tactic) }
                              else {
                                next.delete(tactic)
                                setNewBudgetTacticAmts(p => { const n = { ...p }; delete n[tactic]; return n })
                              }
                              setNewBudgetSelected(next)
                            }}
                          />
                          <label htmlFor={`nbt-${tactic}`} className="id-max__tactic-name">{tactic}</label>
                          {sel && (
                            <input
                              type="text"
                              className="id-max__tactic-input"
                              placeholder="e.g. $5K"
                              value={newBudgetTacticAmts[tactic] ?? ''}
                              onChange={e => setNewBudgetTacticAmts(p => ({ ...p, [tactic]: e.target.value }))}
                            />
                          )}
                        </div>
                      )
                    })}
                    {newBudgetSelected.size > 0 && (
                      <button className="id-max__apply-btn" onClick={openNewBudgetEmail}>
                        Contact my team to activate this allocation
                      </button>
                    )}
                  </div>
                )
              })()}

              {/* B — New creatives: type selection */}
              {maxStep === 'new_creative' && (
                <div className="id-max__rich">
                  {CREATIVE_TYPES.map(t => (
                    <div key={t} className="id-max__tactic-row id-max__tactic-row--check">
                      <input
                        type="checkbox"
                        id={`crt-${t}`}
                        className="id-max__check"
                        checked={selectedCreatives.has(t)}
                        onChange={e => {
                          const next = new Set(selectedCreatives)
                          e.target.checked ? next.add(t) : next.delete(t)
                          setSelectedCreatives(next)
                        }}
                      />
                      <label htmlFor={`crt-${t}`} className="id-max__tactic-name">{t}</label>
                    </div>
                  ))}
                  {selectedCreatives.size > 0 && (
                    <button className="id-max__apply-btn" onClick={() => {
                      setMaxMsgs(prev => [
                        ...prev,
                        { from: 'user', text: `I have ${[...selectedCreatives].join(', ')} creatives.` },
                        { from: 'max',  text: `Got it. How much budget do you have to put behind ${selectedCreatives.size === 1 ? 'this' : 'these'}?` },
                      ])
                      setMaxStep('new_creative_budget')
                    }}>Next →</button>
                  )}
                </div>
              )}

              {/* B2 — New creatives: budget entry */}
              {maxStep === 'new_creative_budget' && (
                <div className="id-max__rich">
                  <div className="id-max__budget-chips">
                    {[5_000, 10_000, 25_000, 50_000].map(a => (
                      <button key={a} className="id-max__budget-chip" onClick={() => handleCreativeBudgetSubmit(a)}>
                        {formatBudget(a)}
                      </button>
                    ))}
                  </div>
                  <div className="id-max__budget-input-row">
                    <input
                      className="id-max__input"
                      type="text"
                      placeholder="Custom amount…"
                      value={creativeBudgetDraft}
                      onChange={e => setCreativeBudgetDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreativeBudgetSubmit(creativeBudgetDraft) }}
                    />
                    <button
                      className="id-max__send-btn"
                      disabled={!creativeBudgetDraft.trim()}
                      onClick={() => handleCreativeBudgetSubmit(creativeBudgetDraft)}
                      aria-label="Submit budget"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* B3 — New creatives: allocation result + email */}
              {maxStep === 'new_creative_result' && (
                <div className="id-max__rich">
                  {getCreativeAlloc(creativeBudgetAmt, selectedCreatives).map(({ name, amt }) => (
                    <div key={name} className="id-max__tactic-row id-max__tactic-row--check">
                      <span className="id-max__tactic-name">{name}</span>
                      <input
                        type="text"
                        className="id-max__tactic-input"
                        value={creativeAllocEdits[name] ?? formatBudget(amt)}
                        onChange={e => setCreativeAllocEdits(p => ({ ...p, [name]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <p className="id-max__rich-note">Recommended based on creative type performance. You or your team can adjust.</p>
                  <button className="id-max__email-cta" style={{ marginTop: 8 }} onClick={openCreativeEmail}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Email Campaign Management Team
                  </button>
                </div>
              )}

              {/* C — Expand audience (Resonate mockup) */}
              {maxStep === 'expand_audience' && (
                <div className="id-max__rich">
                  <p className="id-max__rich-note" style={{ marginTop: 0, marginBottom: 6 }}>
                    Powered by Resonate · Relevance for {CLIENT_NAME}
                  </p>
                  {MOCKUP_AUDIENCES.map(a => {
                    const sel = selectedAudiences.has(a.label)
                    return (
                      <div key={a.label} className="id-max__audience-row">
                        <input
                          type="checkbox"
                          id={`aud-${a.label}`}
                          className="id-max__check"
                          checked={sel}
                          onChange={e => {
                            const next = new Set(selectedAudiences)
                            if (e.target.checked) { next.add(a.label) }
                            else {
                              next.delete(a.label)
                              setAudienceAmounts(p => { const n = { ...p }; delete n[a.label]; return n })
                            }
                            setSelectedAudiences(next)
                          }}
                        />
                        <div className="id-max__audience-info">
                          <label htmlFor={`aud-${a.label}`} className="id-max__audience-label">{a.label}</label>
                          <span className="id-max__audience-meta">{a.ages} · {a.reach} reach</span>
                        </div>
                        <span
                          className="id-max__audience-score"
                          style={{ color: a.relevance >= 80 ? '#AEF33E' : a.relevance >= 70 ? '#8EE7F1' : '#FDE68A' }}
                        >
                          {a.relevance}%
                        </span>
                        {sel && (
                          <input
                            type="text"
                            className="id-max__tactic-input"
                            placeholder="$amt"
                            value={audienceAmounts[a.label] ?? ''}
                            onChange={e => setAudienceAmounts(p => ({ ...p, [a.label]: e.target.value }))}
                          />
                        )}
                      </div>
                    )
                  })}
                  {selectedAudiences.size > 0 && (
                    <button className="id-max__apply-btn" onClick={openAudienceEmail}>
                      Contact your campaign management team to apply!
                    </button>
                  )}
                </div>
              )}

              {/* D — Other: email CTA */}
              {maxStep === 'other' && (
                <div className="id-max__rich">
                  <button className="id-max__email-cta" onClick={openOtherEmail}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Email Growth &amp; CS Team
                  </button>
                </div>
              )}

            </div>{/* end chat-body */}

            {/* Quick replies — root: 4 main prompts */}
            {maxStep === 'root' && (
              <div className="id-max__quick-replies">
                <button className="id-max__quick-btn" onClick={() => maxAction(
                  'What are my options?', 'what_options',
                  "Great question! I can help you see what's available now or plan for new budget. Which fits?"
                )}>What are my options?</button>
                <button className="id-max__quick-btn" onClick={() => {
                  setSelectedCreatives(new Set())
                  maxAction(
                    'I have new creatives.',
                    'new_creative',
                    'What types of creatives do you have? Select all that apply:'
                  )
                }}>I have new creatives</button>
                <button className="id-max__quick-btn" onClick={() => {
                  setSelectedAudiences(new Set())
                  setAudienceAmounts({})
                  maxAction(
                    'I want to expand my audience.',
                    'expand_audience',
                    'I pulled Resonate audience data for you. Here are the top expansion segments for your brand profile:'
                  )
                }}>Expand my audience</button>
                <button className="id-max__quick-btn id-max__quick-btn--other" onClick={() => maxAction(
                  'Other',
                  'other',
                  "I'll do my best, but I'm really only 'Golden' at incremental. Let me pull in the Big Dogs for your question!"
                )}>Other</button>
              </div>
            )}

            {/* Quick replies — what_options sub-menu */}
            {maxStep === 'what_options' && (
              <div className="id-max__quick-replies">
                <button className="id-max__quick-btn" onClick={handleAvailIncr}>
                  Currently available incremental
                </button>
                <button className="id-max__quick-btn" onClick={() => maxAction(
                  'I have budget for new tactics',
                  'new_budget_ask',
                  'How much budget are you working with? Pick a common size or enter your own:'
                )}>I have budget for new tactics</button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Standalone Max character — click to open/close chat */}
      <div
        className={`id-max__character${showMaxChat ? ' id-max__character--active' : ''}`}
        onClick={() => setShowMaxChat(v => !v)}
        role="button"
        tabIndex={0}
        aria-label={showMaxChat ? 'Close Max chat' : 'Chat with Max'}
        onKeyDown={e => e.key === 'Enter' && setShowMaxChat(v => !v)}
      >
        <div className="id-max__character-canvas">
          <Max3D />
        </div>
      </div>

      {/* Chat button — separate fixed element so Max sits flush at bottom */}
      {!showMaxChat && (
        <button
          className="id-max__character-label"
          onClick={() => setShowMaxChat(true)}
        >
          Chat with Max
        </button>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="id-client__modal-overlay" onClick={() => setModal(null)}>
          <div className="id-client__modal" onClick={e => e.stopPropagation()}>

            <button className="id-client__modal-close" onClick={() => setModal(null)} aria-label="Close">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* ── Apply Incremental ─────────────────────────────────────── */}
            {modal === 'breakdown' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--attribution">
                  {breakdownDetail && (
                    <button className="id-client__analysis-back" onClick={() => setBreakdownDetail(null)}>
                      ← Back
                    </button>
                  )}
                  <span className="id-client__modal-kicker">Take Action — {CLIENT_NAME}</span>
                  <h3 className="id-client__modal-title">{breakdownDetail ?? 'Apply Incremental'}</h3>
                  {!breakdownDetail && (
                    <p className="id-client__modal-intro">Select an advertiser to review available incremental by channel, then email your Growth and CS team with one click.</p>
                  )}
                </div>

                {/* Advertiser list */}
                {!breakdownDetail && (
                  <>
                    <div className="id-scenario__avail-bar">
                      <span className="id-scenario__avail-label">Total Available Incremental</span>
                      <span className="id-scenario__avail-value">{formatBudget(availableIncremental)}</span>
                    </div>
                    <div className="id-client__breakdown-list">
                      {advertiserBreakdown.map(([advertiser, totalIncr]) => (
                        <button
                          key={advertiser}
                          className="id-client__breakdown-item id-client__breakdown-item--nav"
                          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          onClick={() => setBreakdownDetail(advertiser)}
                        >
                          <div className="id-client__breakdown-info">
                            <span className="id-client__breakdown-name">{advertiser}</span>
                            <span className="id-client__breakdown-meta">
                              <span style={{ color: '#AEF33E' }}>{formatBudget(totalIncr)} available</span>
                            </span>
                          </div>
                          <span style={{ color: 'rgba(249,249,249,0.35)', fontSize: '0.9rem', flexShrink: 0 }}>→</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Advertiser detail — channel breakdown + email CTA */}
                {breakdownDetail && (() => {
                  const detailCampaigns = CAMPAIGNS.filter(c => c.clientName === breakdownDetail && c.performanceMultiplier >= 1.0)
                  const channelMap = new Map<string, number>()
                  for (const c of detailCampaigns) channelMap.set(c.name, (channelMap.get(c.name) ?? 0) + c.incrementalDollars)
                  const channels = [...channelMap.entries()].sort((a, b) => b[1] - a[1])
                  const total = channels.reduce((s, [, a]) => s + a, 0)
                  return (
                    <>
                      <div className="id-scenario__avail-bar">
                        <span className="id-scenario__avail-label">Available Incremental</span>
                        <span className="id-scenario__avail-value" style={{ color: '#AEF33E' }}>{formatBudget(total)}</span>
                      </div>
                      <div className="id-client__breakdown-list">
                        {channels.map(([channel, amt]) => (
                          <div key={channel} className="id-client__breakdown-item">
                            <div className="id-client__breakdown-info" style={{ flex: 1 }}>
                              <span className="id-client__breakdown-name">{channel}</span>
                              <span className="id-client__breakdown-meta">
                                <span style={{ color: '#AEF33E' }}>{formatBudget(amt)} max available</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '8px 24px 16px' }}>
                        <button
                          className="id-max__apply-btn"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                          onClick={() => openAdvertiserEmail(breakdownDetail)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Email Growth Director &amp; CS AM — Send Incremental Breakdown
                        </button>
                      </div>
                    </>
                  )
                })()}

                <div className="id-client__modal-footer">
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}

            {/* ── Scenario Explorer ──────────────────────────────────────── */}
            {modal === 'scenario' && (
              <>
                <div className="id-client__modal-header id-client__modal-header--audit">
                  {scenarioView !== 'menu' && (
                    <button className="id-client__analysis-back" onClick={() => { setScenarioView('menu'); setShowAudienceAnalysis(false) }}>
                      ← Back
                    </button>
                  )}
                  <span className="id-client__modal-kicker">Explore & Plan — {CLIENT_NAME}</span>
                  <h3 className="id-client__modal-title">Scenario Explorer</h3>
                  {scenarioView === 'menu' && (
                    <p className="id-client__modal-intro">
                      You have <strong style={{ color: '#AEF33E' }}>{formatBudget(availableIncremental)}</strong> in available incremental. What would you like to explore?
                    </p>
                  )}
                </div>

                {/* ── Menu ── */}
                {scenarioView === 'menu' && (
                  <div className="id-scenario__menu">
                    <button className="id-scenario__option-card" onClick={() => setScenarioView('a')}>
                      <span className="id-scenario__option-label">A</span>
                      <div className="id-scenario__option-body">
                        <strong>I know exactly how I want to apply my incremental.</strong>
                        <span>Describe your allocation and relay it directly to your Growth and CS team.</span>
                      </div>
                      <span className="id-scenario__option-arrow">→</span>
                    </button>
                    <button className="id-scenario__option-card" onClick={() => setScenarioView('b')}>
                      <span className="id-scenario__option-label id-scenario__option-label--b">B</span>
                      <div className="id-scenario__option-body">
                        <strong>I need guidance on where best to apply my incremental.</strong>
                        <span>Use the interactive budget allocator and compare scenarios side by side.</span>
                      </div>
                      <span className="id-scenario__option-arrow">→</span>
                    </button>
                    <button className="id-scenario__option-card" onClick={() => setScenarioView('c')}>
                      <span className="id-scenario__option-label" style={{ background: 'rgba(130,99,255,0.15)', color: '#8263FF', borderColor: 'rgba(130,99,255,0.30)' }}>C</span>
                      <div className="id-scenario__option-body">
                        <strong>I want to explore audience expansion opportunities.</strong>
                        <span>Map net-new audience segments beyond your existing campaign reach.</span>
                      </div>
                      <span className="id-scenario__option-arrow">→</span>
                    </button>
                  </div>
                )}

                {/* ── Option A: I know exactly ── */}
                {scenarioView === 'a' && (
                  <div className="id-scenario__view-a">
                    <div className="id-scenario__avail-bar">
                      <span className="id-scenario__avail-label">Available Incremental</span>
                      <span className="id-scenario__avail-value">{formatBudget(availableIncremental)}</span>
                    </div>
                    <p className="id-scenario__a-hint">Describe how you'd like to allocate your incremental budget across campaigns and channels. Your Growth and CS team will receive your plan directly.</p>
                    <textarea
                      className="id-scenario__textarea"
                      placeholder={`e.g. "Apply $50K to CTV, $30K to Video, and $20K to Meta — prioritize top-performing placements first."`}
                      value={userPlanNote}
                      onChange={e => setUserPlanNote(e.target.value)}
                      rows={5}
                    />
                    <div className="id-client__action-btns" style={{ marginTop: 8 }}>
                      <button
                        className="id-client__action-btn id-client__action-btn--chat"
                        onClick={() => openRelayPlan(userPlanNote)}
                      >
                        Relay my plan to my Growth and CS team!
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Option B: Need guidance ── */}
                {scenarioView === 'b' && (
                  <div className="id-scenario__view-b">
                    <div className="id-scenario__avail-bar">
                      <span className="id-scenario__avail-label">Available Incremental</span>
                      <span className="id-scenario__avail-value">{formatBudget(availableIncremental)}</span>
                    </div>

                    {/* Sliders */}
                    <div className="id-scenario__sliders">
                      {clientCampaigns.map(c => {
                        const val = allocations[c.id] ?? 0
                        return (
                          <div key={c.id} className="id-scenario__slider-row">
                            <div className="id-scenario__slider-top">
                              <span className="id-scenario__slider-name">{c.name}</span>
                              <span className="id-scenario__slider-val">{formatBudget(val)}</span>
                            </div>
                            <input
                              type="range"
                              className="id-scenario__range"
                              min={0}
                              max={c.incrementalDollars}
                              step={Math.max(500, Math.floor(c.incrementalDollars / 100))}
                              value={val}
                              onChange={e => setAlloc(c.id, Number(e.target.value))}
                            />
                            <div className="id-scenario__slider-cap">
                              <span>$0</span>
                              <span>Max {formatBudget(c.incrementalDollars)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Totals summary */}
                    <div className="id-scenario__totals">
                      <div className="id-scenario__total-row">
                        <span>Your Total Allocated</span>
                        <span style={{ color: totalAllocated > availableIncremental ? '#FF7CF5' : '#AEF33E' }}>
                          {formatBudget(totalAllocated)}
                        </span>
                      </div>
                      <div className="id-scenario__total-row">
                        <span>Remaining</span>
                        <span>{formatBudget(Math.max(0, availableIncremental - totalAllocated))}</span>
                      </div>
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="id-scenario__comparison">
                      <h4 className="id-scenario__comparison-title">Side-by-Side Scenario Comparison</h4>
                      <div className="id-scenario__comparison-table">
                        <div className="id-scenario__cmp-header">
                          <span>Campaign</span>
                          <span>Your Allocation</span>
                          <span>AI Suggested</span>
                          <span>Difference</span>
                        </div>
                        {clientCampaigns.map(c => {
                          const userVal = allocations[c.id] ?? 0
                          const aiVal = aiAllocation[c.id] ?? 0
                          const diff = userVal - aiVal
                          return (
                            <div key={c.id} className="id-scenario__cmp-row">
                              <span className="id-scenario__cmp-name">{c.name}</span>
                              <span className="id-scenario__cmp-user">{formatBudget(userVal)}</span>
                              <span className="id-scenario__cmp-ai">{formatBudget(aiVal)}</span>
                              <span className={`id-scenario__cmp-diff${diff > 0 ? ' id-scenario__cmp-diff--pos' : diff < 0 ? ' id-scenario__cmp-diff--neg' : ''}`}>
                                {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${formatBudget(Math.abs(diff))}`}
                              </span>
                            </div>
                          )
                        })}
                        <div className="id-scenario__cmp-footer">
                          <span>Total</span>
                          <span style={{ color: '#AEF33E' }}>{formatBudget(totalAllocated)}</span>
                          <span style={{ color: '#8EE7F1' }}>{formatBudget(totalAiAllocated)}</span>
                          <span />
                        </div>
                      </div>
                    </div>

                    <div className="id-client__action-btns" style={{ marginTop: 4 }}>
                      <button
                        className="id-client__action-btn id-client__action-btn--chat"
                        onClick={() => openRelayPlan()}
                      >
                        Relay my plan to my Growth and CS team!
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Option C: Audience Expansion ── */}
                {scenarioView === 'c' && !showAudienceAnalysis && (
                  <>
                    <div className="id-client__modal-points">
                      <div className="id-client__modal-point">
                        <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                        <div>
                          <strong>Net-New Audience Mapping</strong>
                          <p>Identify untapped segments your current campaigns aren't reaching — and quantify the growth opportunity each represents.</p>
                        </div>
                      </div>
                      <div className="id-client__modal-point">
                        <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                        <div>
                          <strong>Budget Reallocation Modeling</strong>
                          <p>See how shifting even a portion of your active budget toward expansion channels can meaningfully widen your reach.</p>
                        </div>
                      </div>
                      <div className="id-client__modal-point">
                        <span className="id-client__modal-point-mark" style={{ color: '#8263FF' }}>◈</span>
                        <div>
                          <strong>Incremental Audience Lift</strong>
                          <p>Measure the audiences you're adding that would never have been reached through your existing campaign mix alone.</p>
                        </div>
                      </div>
                    </div>
                    <div className="id-client__modal-footer">
                      <button className="id-client__modal-cta id-client__modal-cta--reach" onClick={() => setShowAudienceAnalysis(true)}>
                        Analyze Current Audiences →
                      </button>
                    </div>
                  </>
                )}

                {scenarioView === 'c' && showAudienceAnalysis && (
                  <>
                    <div className="id-client__modal-header id-client__modal-header--reach" style={{ paddingTop: 0 }}>
                      <button className="id-client__analysis-back" onClick={() => setShowAudienceAnalysis(false)}>
                        ← Back
                      </button>
                      <span className="id-client__modal-kicker">Audience Analysis — {CLIENT_NAME}</span>
                      <h3 className="id-client__modal-title">Current Audience Performance</h3>
                      <p className="id-client__modal-intro">Based on your active campaign mix, here is how each audience type is performing — along with recommended expansion audiences ranked by projected incremental lift.</p>
                    </div>

                    <div className="id-client__analysis-table">
                      {audiencePerformance.map(a => {
                        const barW = maxPerf > minPerf ? ((a.avgPerf - minPerf) / (maxPerf - minPerf)) * 100 : 50
                        const barColor = a.avgPerf >= 1.3 ? '#AEF33E' : a.avgPerf >= 1.15 ? '#8EE7F1' : '#FDE68A'
                        return (
                          <div key={a.name} className="id-client__analysis-row">
                            <div className="id-client__analysis-row-top">
                              <span className="id-client__analysis-name">{a.name}</span>
                              <span className="id-client__analysis-kpi">{a.kpiLabel} {fmtKpi(a.avgKpi, a.kpiUnit)}</span>
                              <span className="id-client__analysis-perf" style={{ color: barColor }}>{a.avgPerf.toFixed(2)}x goal</span>
                            </div>
                            <div className="id-client__analysis-bar-track">
                              <div className="id-client__analysis-bar-fill" style={{ width: `${barW}%`, background: barColor }} />
                            </div>
                            <div className="id-client__analysis-suggestions">
                              {a.suggestions.map((s, i) => (
                                <div key={i} className="id-client__suggestion-item">
                                  <span className="id-client__suggestion-tag" style={{ background: TAG_COLORS[s.type] + '22', color: TAG_COLORS[s.type], borderColor: TAG_COLORS[s.type] + '44' }}>
                                    {s.type}
                                  </span>
                                  <div className="id-client__suggestion-text">
                                    <strong>{s.label}</strong>
                                    <span>{s.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="id-client__modal-footer">
                      <button className="id-client__modal-cta id-client__modal-cta--reach" onClick={() => { setShowAudienceAnalysis(false); setScenarioView('b'); setAllocations({}) }}>
                        Build a Scenario →
                      </button>
                    </div>
                  </>
                )}

                <div className="id-client__modal-footer" style={{ marginTop: 16 }}>
                  <button className="id-client__modal-dismiss" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
