import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Barre latérale affichée uniquement sur grand écran (PC / tablette large).
// Remplace la barre du bas et donne à l'app une vraie mise en page "bureau".
export default function Sidebar() {
  const { user, isAdmin, isOuvrier, isRh } = useAuth()
  const employee = isOuvrier || isAdmin || isRh

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrateur'
      : user?.role === 'rh'
        ? 'Ressources humaines'
        : user?.role === 'ouvrier'
          ? 'Employé'
          : 'Client'
  const fullName = user ? `${user.prenom} ${user.nom}`.trim() || user.username : ''

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img src="/facebook/swiss-paint/logo.jpg" alt="SwissPaints" />
        </div>
        <div className="sidebar-brand-text">
          <strong>SwissPaints</strong>
          <span>Group Sàrl</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <SideLink to="/home" icon="🏠" label="Accueil" />
        {employee && <SideLink to="/tableau-de-bord" icon="📊" label="Tableau de bord" />}
        {employee && <SideLink to="/pointage" icon="⏱️" label="Timbrage" />}
        {employee && <SideLink to="/absences" icon="🌴" label="Absences" />}
        {employee && <SideLink to="/planning" icon="📅" label="Planning" />}
        {employee && <SideLink to="/chantiers" icon="🏗️" label="Chantiers" />}
        {employee && <SideLink to="/notes-frais" icon="💳" label="Notes de frais" />}
        {employee && <SideLink to="/annonces" icon="📌" label="Tableau blanc" />}
        <SideLink to="/documents" icon="📄" label="Documents" />
        {employee && <SideLink to="/devis" icon="🧾" label="Devis" />}
        {employee && <SideLink to="/assistant" icon="✨" label="Assistant IA" />}
        {isAdmin && <SideLink to="/admin" icon="⚙️" label="Administration" />}
      </nav>

      <NavLink to="/profil" className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.image ? <img src={user.image} alt="" /> : <span>{(user?.prenom || user?.username || '?').charAt(0).toUpperCase()}</span>}
        </div>
        <div className="sidebar-user-text">
          <strong>{fullName}</strong>
          <span>{roleLabel}</span>
        </div>
      </NavLink>
    </aside>
  )
}

function SideLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
      <span className="sidebar-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}
