import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/index.css'

// Service Worker mit aggressivem Auto-Update: iOS-Standalone-PWAs halten den alten
// SW sonst zäh fest. Wir prüfen periodisch + bei Sichtbarkeit auf neue Versionen und
// laden bei einer neuen Version automatisch neu.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true) // skipWaiting + Reload
  },
  onRegisteredSW(_swUrl, reg) {
    if (!reg) return
    const check = () => reg.update().catch(() => {})
    setInterval(check, 60_000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
