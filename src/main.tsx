import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/react'
import { applyTheme, resolveTheme } from '@AiDigital-com/design-system'
import '@AiDigital-com/design-system/style.css'
import App from './App'
import { CoverPage } from './pages/CoverPage'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string
const isHelpPage = window.location.pathname === '/help'

applyTheme(resolveTheme())

// Holds the CoverPage until both its animation is done AND Clerk has loaded,
// so the "AI Labs — Incremental Dashboard" loading screen is never visible.
function CoverGate() {
  const { isLoaded } = useAuth()
  const [animDone, setAnimDone] = useState(false)
  const [show, setShow] = useState(
    () => !sessionStorage.getItem('id-cover-shown')
  )

  const tryDismiss = useCallback((clerkReady: boolean, done: boolean) => {
    if (clerkReady && done) {
      sessionStorage.setItem('id-cover-shown', '1')
      setShow(false)
    }
  }, [])

  useEffect(() => { tryDismiss(isLoaded, animDone) }, [isLoaded, animDone, tryDismiss])

  if (!show) return null

  return (
    <CoverPage onComplete={() => {
      setAnimDone(true)
      tryDismiss(isLoaded, true)
    }} />
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
function Root() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <App />
      <CoverGate />
    </ClerkProvider>
  )
}

if (isHelpPage) {
  import('./pages/HelpPage').then(({ default: Help }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode><Help /></React.StrictMode>
    )
  })
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  )
}
