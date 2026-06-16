import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore'
import { TabBar } from './components/TabBar'
import TodayView from './views/TodayView'
import PlansView from './views/PlansView'
import ImportPlanView from './views/ImportPlanView'
import EditPlanView from './views/EditPlanView'
import ProgressView from './views/ProgressView'
import SettingsView from './views/SettingsView'

export default function App() {
  const theme = useStore((s) => s.settings.theme)

  // Viewport-Höhe robust setzen: iOS-Standalone misst 100dvh beim (Neu-)Öffnen zu
  // kurz – die Tab-Leiste hing dann oben, bis ein Scroll einen Reflow auslöste.
  // window.innerHeight ist verlässlich; bei Wiederöffnen (pageshow/visibilitychange)
  // neu messen, weil der Wert beim Foregrounding zunächst stale sein kann (rAF + Delay).
  useEffect(() => {
    const root = document.documentElement
    const setH = () => root.style.setProperty('--app-h', window.innerHeight + 'px')
    const recompute = () => {
      setH()
      requestAnimationFrame(setH)
      setTimeout(setH, 300)
    }
    recompute()
    const onVisible = () => {
      if (!document.hidden) recompute()
    }
    window.addEventListener('resize', setH)
    window.addEventListener('orientationchange', recompute)
    window.addEventListener('pageshow', recompute)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('resize', setH)
      window.removeEventListener('orientationchange', recompute)
      window.removeEventListener('pageshow', recompute)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Theme auf <html> anwenden (System folgt prefers-color-scheme).
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.setAttribute('data-theme', dark ? 'dark' : 'light')
    }
    apply()
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  return (
    <div className="app">
      {/* SVG-Filter für die Liquid-Glass-Refraktion (Brechung der Hintergrundkanten). */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="lg-refraction" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.009" numOctaves="2" seed="11" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <main className="content">
        <Routes>
          <Route path="/" element={<TodayView />} />
          <Route path="/plans" element={<PlansView />} />
          <Route path="/plans/new" element={<EditPlanView />} />
          <Route path="/plans/edit/:id" element={<EditPlanView />} />
          <Route path="/plans/import" element={<ImportPlanView />} />
          <Route path="/progress" element={<ProgressView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}
