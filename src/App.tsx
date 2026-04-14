import { useState } from 'react'
import { AppShell } from '@AiDigital-com/design-system'
import { createClient } from '@supabase/supabase-js'
import { SignIn, UserButton, useAuth } from '@clerk/react'
import { IncrementalDashboard } from './components/IncrementalDashboard'
import type { Campaign } from './components/IncrementalDashboard'
import { AppSidebar, REGION_GDS } from './components/AppSidebar/AppSidebar'
import './App.css'

// ── App Config ────────────────────────────────────────────────────────────────
const APP_TITLE = 'Incremental Dashboard'

const supabaseConfig = import.meta.env.VITE_SUPABASE_URL ? {
  url: import.meta.env.VITE_SUPABASE_URL as string,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  createClient: createClient as any,
} : undefined

// ── Placeholder campaign data (replaced by API when ready) ───────────────────
const PLACEHOLDER_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Q2 Paid Search — Brand',
    startDate: '2025-04-01',
    endDate: '2025-06-30',
    budget: 185000,
    kpiLabel: 'CTR',
    kpiValue: 4.0,
    kpiUnit: '%',
    performanceMultiplier: 1.25,
    incrementalAvailability: 72,
  },
  {
    id: '2',
    name: 'Spring Display Prospecting',
    startDate: '2025-03-15',
    endDate: '2025-05-31',
    budget: 240000,
    kpiLabel: 'ROAS',
    kpiValue: 3.8,
    kpiUnit: 'x',
    performanceMultiplier: 0.84,
    incrementalAvailability: 58,
  },
  {
    id: '3',
    name: 'Connected TV — Awareness',
    startDate: '2025-04-15',
    endDate: '2025-07-15',
    budget: 320000,
    kpiLabel: 'VCR',
    kpiValue: 78,
    kpiUnit: '%',
    performanceMultiplier: 1.20,
    incrementalAvailability: 84,
  },
  {
    id: '4',
    name: 'Paid Social — Retargeting',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    budget: 95000,
    kpiLabel: 'CPA',
    kpiValue: 12.40,
    kpiUnit: '$',
    performanceMultiplier: 1.21,
    incrementalAvailability: 61,
  },
  {
    id: '5',
    name: 'Programmatic — In-Market',
    startDate: '2025-04-01',
    endDate: '2025-09-30',
    budget: 175000,
    kpiLabel: 'CTR',
    kpiValue: 1.8,
    kpiUnit: '%',
    performanceMultiplier: 0.86,
    incrementalAvailability: 45,
  },
  {
    id: '6',
    name: 'YouTube Pre-Roll',
    startDate: '2025-02-01',
    endDate: '2025-05-31',
    budget: 130000,
    kpiLabel: 'VTR',
    kpiValue: 42,
    kpiUnit: '%',
    performanceMultiplier: 1.11,
    incrementalAvailability: 79,
  },
]

// ── GD → campaign ID mapping (placeholder; API will supply real assignments) ──
// Pattern rotates across GDs: each index maps to a campaign subset.
const GD_CAMPAIGN_PATTERNS: string[][] = [
  ['1', '3', '5'],
  ['2', '4', '6'],
  ['1', '2', '4'],
  ['3', '5', '6'],
  ['1', '2', '3', '4', '5', '6'],
]

const GD_CAMPAIGNS: Record<string, string[]> = {}
Object.values(REGION_GDS).flat().forEach((gd, i) => {
  GD_CAMPAIGNS[gd] = GD_CAMPAIGN_PATTERNS[i % GD_CAMPAIGN_PATTERNS.length]
})

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedGD, setSelectedGD] = useState('')

  // Filter campaigns by selected GD (when region+GD chosen); otherwise show all
  const visibleCampaigns = selectedGD
    ? PLACEHOLDER_CAMPAIGNS.filter(c => GD_CAMPAIGNS[selectedGD]?.includes(c.id))
    : PLACEHOLDER_CAMPAIGNS

  const planName = selectedGD
    ? `${selectedGD} — ${selectedRegion}`
    : selectedRegion
    ? `${selectedRegion} Region`
    : 'Campaign Overview'

  return (
    <AppShell
      appTitle={APP_TITLE}
      activityLabel="Plan"
      auth={{ SignIn, UserButton, useAuth }}
      supabaseConfig={supabaseConfig}
      helpUrl="/help"
      sidebar={
        <AppSidebar
          selectedRegion={selectedRegion}
          selectedGD={selectedGD}
          onRegionChange={setSelectedRegion}
          onGDChange={setSelectedGD}
        />
      }
    >
      {() => (
        <IncrementalDashboard
          sessionId="demo"
          planName={planName}
          campaigns={visibleCampaigns}
          onPlanNameChange={() => {}}
          onCampaignsChange={() => {}}
        />
      )}
    </AppShell>
  )
}
