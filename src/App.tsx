/**
 * App Template — matches the production pattern used by NM, PE, SFG, WA, etc.
 *
 * CRITICAL RULES (learned from LRR deployment):
 * 1. Do NOT pass auth as props from main.tsx. Import Clerk directly here.
 * 2. useSessionPersistence takes 4 args: (supabase, authFetch, userId, config)
 * 3. Use DS Sidebar component (aidl-sidebar CSS) — not custom sidebar.
 * 4. AppContent renders inside AppShell's children render-prop as Fragment <>.
 * 5. main.tsx: <App /> with NO props. ClerkProvider wraps App.
 */
import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { AppShell, Sidebar, useSessionPersistence } from '@AiDigital-com/design-system'
import type { SupabaseClient, SidebarItem } from '@AiDigital-com/design-system'
import { createClient } from '@supabase/supabase-js'
import { SignIn, UserButton, useAuth } from '@clerk/react'
import { IncrementalDashboard } from './components/IncrementalDashboard'
import type { Campaign } from './components/IncrementalDashboard'
import './App.css'

// ── App Config ────────────────────────────────────────────────────────────────
const APP_NAME = 'incremental-dashboard'
const APP_TITLE = 'Incremental Dashboard'
const SESSION_TABLE = 'id_sessions'
const TITLE_FIELD = 'brand_name'
const ACTIVITY_LABEL = 'Plan'

const supabaseConfig = import.meta.env.VITE_SUPABASE_URL ? {
  url: import.meta.env.VITE_SUPABASE_URL as string,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  createClient: createClient as any,
} : undefined

// ── Sidebar item type ────────────────────────────────────────────────────────
interface AppSession extends SidebarItem {
  title: string;
}

export default function App() {
  const { userId } = useAuth()

  const [sidebarItems, setSidebarItems] = useState<AppSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [sidebarSupabase, setSidebarSupabase] = useState<SupabaseClient | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load sidebar sessions
  useEffect(() => {
    if (!sidebarSupabase) return
    sidebarSupabase.from(SESSION_TABLE)
      .select(`id, ${TITLE_FIELD}, status, created_at`)
      .eq('deleted_by_user', false)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setSidebarItems((data ?? []).map((r: any) => ({
          id: r.id,
          title: r[TITLE_FIELD] || 'Untitled',
          status: r.status,
          createdAt: r.created_at,
        })))
      })
  }, [refreshKey, sidebarSupabase])

  // Handlers bridged to AppContent via ref
  const handlersRef = useRef<{
    onSelect: (id: string) => void
    onNew: () => void
    onDelete: (id: string) => void
  }>({ onSelect: () => {}, onNew: () => {}, onDelete: () => {} })

  return (
    <AppShell
      appTitle={APP_TITLE}
      activityLabel={ACTIVITY_LABEL}
      auth={{ SignIn, UserButton, useAuth }}
      supabaseConfig={supabaseConfig}
      helpUrl="/help"
      sidebar={
        <Sidebar
          items={sidebarItems}
          activeId={activeSessionId}
          loadingId={loadingId}
          onSelect={(id) => handlersRef.current.onSelect(id)}
          onNew={() => handlersRef.current.onNew()}
          onDelete={(id) => handlersRef.current.onDelete(id)}
          renderItem={(item) => <span>{(item as AppSession).title}</span>}
          newLabel={`+ New ${ACTIVITY_LABEL}`}
          emptyMessage={`No ${ACTIVITY_LABEL.toLowerCase()}s yet.`}
        />
      }
    >
      {({ authFetch, supabase }) => (
        <AppContent
          authFetch={authFetch}
          supabase={supabase}
          userId={userId}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          setLoadingId={setLoadingId}
          setRefreshKey={setRefreshKey}
          handlersRef={handlersRef}
          setSidebarSupabase={setSidebarSupabase}
        />
      )}
    </AppShell>
  )
}

/* ── Domain-specific content ────────────────────────────────────────────── */

interface AppContentProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  supabase: SupabaseClient | null
  userId: string | null | undefined
  activeSessionId: string | null
  setActiveSessionId: Dispatch<SetStateAction<string | null>>
  setLoadingId: Dispatch<SetStateAction<string | null>>
  setRefreshKey: Dispatch<SetStateAction<number>>
  handlersRef: React.MutableRefObject<{
    onSelect: (id: string) => void
    onNew: () => void
    onDelete: (id: string) => void
  }>
  setSidebarSupabase: Dispatch<SetStateAction<SupabaseClient | null>>
}

function AppContent({
  authFetch, supabase, userId,
  activeSessionId, setActiveSessionId, setLoadingId, setRefreshKey,
  handlersRef, setSidebarSupabase,
}: AppContentProps) {
  const [planName, setPlanName] = useState('New Plan')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  // Expose supabase to sidebar
  useEffect(() => { setSidebarSupabase(supabase) }, [supabase, setSidebarSupabase])

  // Session persistence — MUST pass all 4 args: (supabase, authFetch, userId, config)
  const session = useSessionPersistence(supabase, authFetch, userId, {
    table: SESSION_TABLE,
    app: APP_NAME,
    titleField: TITLE_FIELD,
    mergeConfig: { objectFields: ['intake_summary'] },
    defaultFields: { status: 'active' },
    mergeEndpoint: '/.netlify/functions/save-session',
  })

  // Wire sidebar handlers
  useEffect(() => {
    handlersRef.current = {
      onSelect: async (id: string) => {
        if (!supabase) return
        setLoadingId(id)
        const { data } = await supabase.from(SESSION_TABLE).select('*').eq('id', id).maybeSingle()
        setLoadingId(null)
        if (!data) return
        session.loadSession(id)
        setActiveSessionId(id)
        const summary = data.intake_summary as { campaigns?: Campaign[] } | null
        setCampaigns(summary?.campaigns ?? [])
        setPlanName((data[TITLE_FIELD] as string) || 'New Plan')
      },
      onNew: () => {
        const newId = session.newSession()
        setActiveSessionId(newId)
        setCampaigns([])
        setPlanName('New Plan')
        session.setField(TITLE_FIELD, 'New Plan')
        // Defer sidebar refresh to allow DB insert to complete
        setTimeout(() => setRefreshKey(k => k + 1), 1000)
      },
      onDelete: async (id: string) => {
        await session.deleteSession(id)
        if (activeSessionId === id) {
          setActiveSessionId(null)
          setCampaigns([])
          setPlanName('New Plan')
        }
        setRefreshKey(k => k + 1)
      },
    }
  }, [supabase, session, activeSessionId, setActiveSessionId, setLoadingId, setRefreshKey])

  function handleCampaignsChange(updated: Campaign[]) {
    setCampaigns(updated)
    session.mergeFields({ intake_summary: { campaigns: updated } })
  }

  function handlePlanNameChange(name: string) {
    setPlanName(name)
    session.setField(TITLE_FIELD, name)
    setRefreshKey(k => k + 1)
  }

  if (!activeSessionId) {
    return (
      <div className="id-empty">
        <div className="id-empty__content">
          <h2>Incremental Dashboard</h2>
          <p>Track campaign KPIs, incremental lift, and goal performance across your media plan.</p>
          <button className="id-empty__btn" onClick={() => handlersRef.current.onNew()}>
            + New Plan
          </button>
        </div>
      </div>
    )
  }

  return (
    <IncrementalDashboard
      sessionId={activeSessionId}
      planName={planName}
      campaigns={campaigns}
      onPlanNameChange={handlePlanNameChange}
      onCampaignsChange={handleCampaignsChange}
    />
  )
}
