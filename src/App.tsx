import { useState } from 'react'
import { AppShell } from '@AiDigital-com/design-system-client'
import { createClient } from '@supabase/supabase-js'
import { SignIn, UserButton, useAuth } from '@clerk/react'
import { IncrementalDashboard } from './components/IncrementalDashboard'
import { CAMPAIGNS } from './data/campaigns'
import { REGION_GDS } from './components/AppSidebar/AppSidebar'
import type { Region } from './components/AppSidebar/AppSidebar'
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

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [homeCardIdx, setHomeCardIdx] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedGD, setSelectedGD] = useState('')
  const [selectedClient, setSelectedClient] = useState('')

  const visibleCampaigns = selectedGD
    ? CAMPAIGNS.filter(c => c.seller === selectedGD)
    : selectedRegion
    ? CAMPAIGNS.filter(c => (REGION_GDS[selectedRegion as Region] ?? []).includes(c.seller ?? ''))
    : CAMPAIGNS

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
                onRegionChange={r => { setSelectedRegion(r); setSelectedGD(''); setSelectedClient('') }}
                onGDChange={gd => { setSelectedGD(gd); setSelectedClient('') }}
                selectedClient={selectedClient}
                onClientChange={setSelectedClient}
              />
            )
          case 'client':
            return <ClientView onBack={() => setCurrentView('home')} />
        }
      }}
    </AppShell>
  )
}
