import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Navigation du bas adaptée au rôle.
// L'ouvrier a accès au pointage et aux chantiers ; le client a un accès limité.
export default function BottomNav() {
  const { isAdmin, isOuvrier } = useAuth()

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon">🏠</span>
        Accueil
      </NavLink>

      {(isOuvrier || isAdmin) && (
        <NavLink to="/pointage" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">⏱️</span>
          Pointage
        </NavLink>
      )}

      {(isOuvrier || isAdmin) && (
        <NavLink to="/chantiers" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">🏗️</span>
          Chantiers
        </NavLink>
      )}

      <NavLink to="/documents" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon">📄</span>
        Documents
      </NavLink>

      {isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">⚙️</span>
          Admin
        </NavLink>
      )}

      <NavLink to="/profil" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon">👤</span>
        Profil
      </NavLink>
    </nav>
  )
}
