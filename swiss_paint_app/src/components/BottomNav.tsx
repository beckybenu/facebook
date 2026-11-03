import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { caps } from '../lib/roles'
import { notifDb } from '../data/db'
import { useLang } from '../lib/i18n'

// Navigation du bas (mobile) adaptée au rôle.
export default function BottomNav() {
  const { user } = useAuth()
  const c = caps(user?.role)
  const { t } = useLang()
  const unread = user ? notifDb.unreadCount(user.id) : 0

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon">🏠</span>
        {t('nav.home')}
      </NavLink>

      {c.pointer && (
        <NavLink to="/pointage" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">⏱️</span>
          {t('nav.timesheet')}
        </NavLink>
      )}

      {c.chantiers && (
        <NavLink to="/chantiers" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">🏗️</span>
          {t('nav.sites')}
        </NavLink>
      )}

      {c.staff && (
        <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon nav-icon-badge">
            🔔{unread ? <span className="nav-badge">{unread > 9 ? '9+' : unread}</span> : null}
          </span>
          {t('nav.alerts')}
        </NavLink>
      )}

      {!c.staff && (
        <NavLink to="/documents" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">📄</span>
          {t('nav.documents')}
        </NavLink>
      )}

      {c.manageUsers && (
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">⚙️</span>
          {t('nav.admin')}
        </NavLink>
      )}

      <NavLink to="/profil" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon">👤</span>
        {t('nav.profile')}
      </NavLink>
    </nav>
  )
}
