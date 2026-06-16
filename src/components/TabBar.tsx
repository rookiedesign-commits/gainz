import { NavLink, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const tabs: { to: string; icon: IconName; label: string }[] = [
  { to: '/', icon: 'dumbbell', label: 'Heute' },
  { to: '/plans', icon: 'list', label: 'Pläne' },
  { to: '/progress', icon: 'chart', label: 'Progression' },
  { to: '/settings', icon: 'sliders', label: 'Mehr' },
]

export function TabBar() {
  const { pathname } = useLocation()
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)))
  )

  // Position via CSS: fixed in Safari (läuft mit der dynamischen Toolbar mit),
  // absolut am .app-Boden im Standalone-PWA (siehe @media display-mode: standalone in index.css).
  return (
    <nav className="tabbar">
      <div className="tab-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {tabs.map((t, i) => (
        <NavLink key={t.to} to={t.to} className={`tab ${i === activeIndex ? 'active' : ''}`} aria-label={t.label}>
          <Icon name={t.icon} size={25} className="tab-ico" filled={i === activeIndex} />
        </NavLink>
      ))}
    </nav>
  )
}
