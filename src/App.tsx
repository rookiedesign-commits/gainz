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
      <TabBar />
    </div>
  )
}
