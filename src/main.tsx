import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { applyTheme, resolveTheme } from '@AiDigital-com/design-system'
import '@AiDigital-com/design-system/style.css'
import App from './App'
import { CoverPage } from './pages/CoverPage'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string
const isHelpPage = window.location.pathname === '/help'

applyTheme(resolveTheme())

// ── Root: shows cover page once per session, then the app ────────────────────
function Root() {
  const [showCover, setShowCover] = useState(
    () => !sessionStorage.getItem('id-cover-shown')
  )

  return (
    <>
      <ClerkProvider publishableKey={publishableKey}>
        <App />
      </ClerkProvider>
      {showCover && (
        <CoverPage
          onComplete={() => {
            sessionStorage.setItem('id-cover-shown', '1')
            setShowCover(false)
          }}
        />
      )}
    </>
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
