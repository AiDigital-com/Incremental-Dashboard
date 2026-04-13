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
import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react'
import { AppShell, ChatPanel, Sidebar, useJobStatus, useSessionPersistence } from '@AiDigital-com/design-system'
import type { SupabaseClient, SidebarItem } from '@AiDigital-com/design-system'
import { createClient } from '@supabase/supabase-js'
import { SignIn, UserButton, useAuth } from '@clerk/react'
import './App.css'

// ── App Config ────────────────────────────────────────────────────────────────
const APP_NAME = 'incremental-dashboard'  // tool ID for access control + logging
const APP_TITLE = 'Incremental Dashboard' // shown in header
const SESSION_TABLE = 'id_sessions'       // Supabase table name
const TITLE_FIELD = 'brand_name'          // column used for sidebar item labels
const ACTIVITY_LABEL = 'Session'          // "Audit" | "Session" | "Scan" | "Review"

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
  const { userId, getToken } = useAuth()

  // Sidebar state lifted here so sidebar + content can share it
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
          getToken={getToken}
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
  getToken: () => Promise<string | null>
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
  authFetch, supabase, userId, getToken,
  activeSessionId, setActiveSessionId, setLoadingId, setRefreshKey,
  handlersRef, setSidebarSupabase,
}: AppContentProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Expose supabase to sidebar
  useEffect(() => { setSidebarSupabase(supabase); }, [supabase, setSidebarSupabase])

  // Session persistence — MUST pass all 4 args: (supabase, authFetch, userId, config)
  const session = useSessionPersistence(supabase, authFetch, userId, {
    table: SESSION_TABLE,
    app: APP_NAME,
    titleField: TITLE_FIELD,
    mergeConfig: { objectFields: ['intake_summary'] },
    defaultFields: { status: 'chatting' },
    mergeEndpoint: '/.netlify/functions/save-session',
    sessionsEndpoint: '/.netlify/functions/get-sessions',
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
        if (data.messages) setMessages(data.messages)
      },
      onNew: () => {
        session.newSession()
        setMessages([])
        setActiveSessionId(null)
        setError(null)
      },
      onDelete: async (id: string) => {
        session.deleteSession(id)
        setRefreshKey(k => k + 1)
      },
    }
  }, [supabase, session, setActiveSessionId, setLoadingId, setRefreshKey])

  // TODO: Replace with SSE orchestrator hook (see useOrchestrator in NM/PE/LRR)
  async function handleSend(text: string) {
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text }
    setMessages(prev => [...prev, userMsg])
    session.addMessage(userMsg)
    setStreaming(true)

    // TODO: Wire up SSE streaming to /.netlify/functions/orchestrator
    setTimeout(() => {
      const reply = { id: crypto.randomUUID(), role: 'assistant' as const, content: 'Placeholder — wire your orchestrator.' }
      setMessages(prev => [...prev, reply])
      session.addMessage(reply)
      setStreaming(false)
    }, 1000)
  }

  return (
    <>
      <ChatPanel
        messages={messages}
        streaming={streaming}
        error={error}
        onSend={handleSend}
        welcomeTitle="Incremental Dashboard"
        welcomeDescription="Your workspace. Start a session to begin."
        placeholder="Type a message..."
      />
    </>
  )
}
