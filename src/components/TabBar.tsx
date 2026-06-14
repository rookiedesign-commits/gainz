import { NavLink, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const tabs: { to: string; icon: IconName; label: string }[] = [
  { to: '/', icon: 'dumbbell', label: 'Heute' },
  { to: '/plans', icon: 'list', label: 'Pläne' },
  { to: '/progress', icon: 'chart', label: 'Progress' },
  { to: '/settings', icon: 'sliders', label: 'Mehr' },
]

export function TabBar() {
  const { pathname } = useLocation()
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)))
  )

  return (
    <nav className="tabbar">
      {/* Gleitende Hinterlegung */}
      <div className="tab-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {tabs.map((t, i) => (
        <NavLink key={t.to} to={t.to} className={`tab ${i === activeIndex ? 'active' : ''}`}>
          <Icon name={t.icon} size={22} className="tab-ico" />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
