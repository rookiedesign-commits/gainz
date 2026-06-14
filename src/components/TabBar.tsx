import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/', icon: '🏋️', label: 'Heute' },
  { to: '/plans', icon: '📋', label: 'Pläne' },
  { to: '/progress', icon: '📈', label: 'Progress' },
  { to: '/settings', icon: '⚙️', label: 'Mehr' },
]

export function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        // "Pläne" bleibt auch auf der Import-Unterseite aktiv.
        const active =
          t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)
        return (
          <NavLink key={t.to} to={t.to} className={`tab ${active ? 'active' : ''}`}>
            <span className="icon">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
