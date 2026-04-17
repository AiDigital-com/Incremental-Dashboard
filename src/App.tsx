import { useState } from 'react'
import { AppShell } from '@AiDigital-com/design-system'
import { createClient } from '@supabase/supabase-js'
import { SignIn, UserButton, useAuth } from '@clerk/react'
import { IncrementalDashboard } from './components/IncrementalDashboard'
import type { Campaign } from './components/IncrementalDashboard'
import { HomePage } from './pages/HomePage'
import { ExecutiveView } from './pages/ExecutiveView'
import { ClientView } from './pages/ClientView'
import './App.css'

// ── App Config ────────────────────────────────────────────────────────────────

const APP_TITLE = 'Incremental Dashboard'

const supabaseConfig = import.meta.env.VITE_SUPABASE_URL ? {
  url: import.meta.env.VITE_SUPABASE_URL as string,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  createClient: createClient as any,
} : undefined

// ── View type ─────────────────────────────────────────────────────────────────

export type AppView = 'home' | 'executive' | 'gd' | 'client'

// ── Placeholder campaign data (replaced by API when ready) ───────────────────

const PLACEHOLDER_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    seller: 'Danielle Whiting',
    clientName: 'Apex Retail Group',
    name: 'Q2 Paid Search — Brand',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    budget: 185000,
    kpiLabel: 'CTR',
    kpiValue: 4.0,
    kpiUnit: '%',
    performanceMultiplier: 1.25,
    incrementalDollars: 142000,
  },
  {
    id: '2',
    seller: 'Danielle Whiting',
    clientName: 'Meridian Auto',
    name: 'Spring Display Prospecting',
    startDate: '2026-03-15',
    endDate: '2026-05-31',
    budget: 240000,
    kpiLabel: 'ROAS',
    kpiValue: 3.8,
    kpiUnit: 'x',
    performanceMultiplier: 1.12,
    incrementalDollars: 88000,
  },
  {
    id: '3',
    seller: 'Steven Miller',
    clientName: 'Vantage Health',
    name: 'Connected TV — Awareness',
    startDate: '2026-04-15',
    endDate: '2026-07-15',
    budget: 320000,
    kpiLabel: 'VCR',
    kpiValue: 78,
    kpiUnit: '%',
    performanceMultiplier: 1.20,
    incrementalDollars: 215000,
  },
  {
    id: '4',
    seller: 'Grayson Vickers',
    clientName: 'Clearwave Financial',
    name: 'Paid Social — Retargeting',
    startDate: '2026-01-01',
    endDate: '2026-09-30',
    budget: 95000,
    kpiLabel: 'CPA',
    kpiValue: 12.40,
    kpiUnit: '$',
    performanceMultiplier: 1.21,
    incrementalDollars: 76000,
  },
  {
    id: '5',
    seller: 'Scott Welton',
    clientName: 'Northshore Foods',
    name: 'Programmatic — In-Market',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
    budget: 175000,
    kpiLabel: 'CTR',
    kpiValue: 1.8,
    kpiUnit: '%',
    performanceMultiplier: 1.08,
    incrementalDollars: 54000,
  },
  {
    id: '6',
    seller: 'Scott Welton',
    clientName: 'Luminary Studios',
    name: 'YouTube Pre-Roll',
    startDate: '2026-02-01',
    endDate: '2026-07-31',
    budget: 130000,
    kpiLabel: 'VTR',
    kpiValue: 42,
    kpiUnit: '%',
    performanceMultiplier: 1.11,
    incrementalDollars: 98000,
  },
  {
    id: '7',
    seller: 'Larry Tucker',
    clientName: 'Horizon Media',
    name: 'National Brand Awareness — CTV',
    startDate: '2026-02-01',
    endDate: '2026-07-31',
    budget: 210000,
    kpiLabel: 'VCR',
    kpiValue: 82,
    kpiUnit: '%',
    performanceMultiplier: 1.15,
    incrementalDollars: 98000,
  },
  {
    id: '8',
    seller: 'Sophie Denault',
    clientName: 'Pinnacle Sports',
    name: 'Summer Retargeting Push',
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    budget: 88000,
    kpiLabel: 'ROAS',
    kpiValue: 2.9,
    kpiUnit: 'x',
    performanceMultiplier: 1.04,
    incrementalDollars: 31000,
  },
  {
    id: '9',
    seller: 'Sophie Denault',
    clientName: 'Westfield Group',
    name: 'Geo-Fenced Display',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    budget: 145000,
    kpiLabel: 'CTR',
    kpiValue: 2.4,
    kpiUnit: '%',
    performanceMultiplier: 1.08,
    incrementalDollars: 61000,
  },
  {
    id: '10',
    seller: 'Jill Puerto',
    clientName: 'Beacon Financial',
    name: 'Search Brand Defense',
    startDate: '2026-01-15',
    endDate: '2026-09-15',
    budget: 195000,
    kpiLabel: 'CPA',
    kpiValue: 8.90,
    kpiUnit: '$',
    performanceMultiplier: 1.33,
    incrementalDollars: 87000,
  },
  {
    id: '11',
    seller: 'Stephanie Jurney',
    clientName: 'Crescent Energy',
    name: 'Video Pre-Roll Blitz',
    startDate: '2026-04-01',
    endDate: '2026-08-31',
    budget: 265000,
    kpiLabel: 'VTR',
    kpiValue: 48,
    kpiUnit: '%',
    performanceMultiplier: 1.05,
    incrementalDollars: 110000,
  },
  {
    id: '12',
    seller: 'Stephanie Jurney',
    clientName: 'TerraVerde Foods',
    name: 'In-Market Programmatic',
    startDate: '2026-03-15',
    endDate: '2026-06-15',
    budget: 112000,
    kpiLabel: 'CTR',
    kpiValue: 1.2,
    kpiUnit: '%',
    performanceMultiplier: 1.03,
    incrementalDollars: 28000,
  },
  {
    id: '13',
    seller: 'Ross Peters',
    clientName: 'Prism Health',
    name: 'Connected TV Reach',
    startDate: '2026-02-15',
    endDate: '2026-08-15',
    budget: 380000,
    kpiLabel: 'VCR',
    kpiValue: 91,
    kpiUnit: '%',
    performanceMultiplier: 1.18,
    incrementalDollars: 144000,
  },
  {
    id: '14',
    seller: 'Tessa Walsh',
    clientName: 'Olympus Retail',
    name: 'Paid Search Non-Brand',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
    budget: 155000,
    kpiLabel: 'ROAS',
    kpiValue: 4.1,
    kpiUnit: 'x',
    performanceMultiplier: 1.02,
    incrementalDollars: 73000,
  },
  {
    id: '15',
    seller: 'Tessa Walsh',
    clientName: 'Caliber Auto',
    name: 'Social Conquest Campaign',
    startDate: '2026-03-01',
    endDate: '2026-07-31',
    budget: 225000,
    kpiLabel: 'CPA',
    kpiValue: 14.20,
    kpiUnit: '$',
    performanceMultiplier: 1.27,
    incrementalDollars: 129000,
  },
  {
    id: '16',
    seller: 'Josh Darden',
    clientName: 'Nexus Financial',
    name: 'Display Prospecting',
    startDate: '2026-05-01',
    endDate: '2026-10-31',
    budget: 178000,
    kpiLabel: 'CTR',
    kpiValue: 3.1,
    kpiUnit: '%',
    performanceMultiplier: 1.09,
    incrementalDollars: 95000,
  },
  {
    id: '17',
    seller: 'Michael Bell',
    clientName: 'Sterling Hotels',
    name: 'Travel Awareness Video',
    startDate: '2026-04-15',
    endDate: '2026-07-15',
    budget: 135000,
    kpiLabel: 'VTR',
    kpiValue: 38,
    kpiUnit: '%',
    performanceMultiplier: 1.06,
    incrementalDollars: 42000,
  },
  {
    id: '18',
    seller: 'Thomas Buell',
    clientName: 'Voyager Insurance',
    name: 'Search Remarketing',
    startDate: '2026-02-01',
    endDate: '2026-08-31',
    budget: 118000,
    kpiLabel: 'CPA',
    kpiValue: 22.50,
    kpiUnit: '$',
    performanceMultiplier: 1.14,
    incrementalDollars: 68000,
  },
  {
    id: '19',
    seller: 'Andy Kemp',
    clientName: 'Summit Healthcare',
    name: 'OTT Awareness Campaign',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    budget: 440000,
    kpiLabel: 'VCR',
    kpiValue: 88,
    kpiUnit: '%',
    performanceMultiplier: 1.22,
    incrementalDollars: 156000,
  },
  {
    id: '20',
    seller: 'Andy Kemp',
    clientName: 'Redwood Realty',
    name: 'Native Advertising Push',
    startDate: '2026-04-01',
    endDate: '2026-07-31',
    budget: 92000,
    kpiLabel: 'CTR',
    kpiValue: 2.8,
    kpiUnit: '%',
    performanceMultiplier: 1.06,
    incrementalDollars: 82000,
  },
]

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [homeCardIdx, setHomeCardIdx] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedGD, setSelectedGD] = useState('')

  // Filter campaigns by selected GD's seller field; otherwise show all
  const visibleCampaigns = selectedGD
    ? PLACEHOLDER_CAMPAIGNS.filter(c => c.seller === selectedGD)
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
    >
      {() => {
        switch (currentView) {
          case 'home':
            return (
              <HomePage
                onViewSelect={setCurrentView}
                activeIdx={homeCardIdx}
                onIdxChange={setHomeCardIdx}
              />
            )
          case 'executive':
            return <ExecutiveView onBack={() => setCurrentView('home')} />
          case 'gd':
            return (
              <IncrementalDashboard
                sessionId="demo"
                planName={planName}
                campaigns={visibleCampaigns}
                onPlanNameChange={() => {}}
                onCampaignsChange={() => {}}
                onBack={() => setCurrentView('home')}
                selectedRegion={selectedRegion}
                selectedGD={selectedGD}
                onRegionChange={setSelectedRegion}
                onGDChange={setSelectedGD}
              />
            )
          case 'client':
            return <ClientView onBack={() => setCurrentView('home')} />
        }
      }}
    </AppShell>
  )
}
