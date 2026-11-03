import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { caps } from '../lib/roles'
import { notifDb } from '../data/db'
import { useLang, LANGS } from '../lib/i18n'

// Barre latérale affichée uniquement sur grand écran (PC / tablette large).
// Remplace la barre du bas et donne à l'app une vraie mise en page "bureau".
export default function Sidebar() {
  const { user } = useAuth()
  const c = caps(user?.role)
  const { t, lang, setLang } = useLang()
  const unread = user ? notifDb.unreadCount(user.id) : 0

  const roleLabel = user ? t(`role.${user.role}`) : t('role.client')
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
        <SideLink to="/home" icon="🏠" label={t('nav.home')} />
        {c.staff && <SideLink to="/notifications" icon="🔔" label={t('nav.notifications')} badge={unread} />}
        {c.tableauBord && <SideLink to="/tableau-de-bord" icon="📊" label={t('nav.dashboard')} />}
        {c.pointer && <SideLink to="/pointage" icon="⏱️" label={t('nav.timesheet')} />}
        {c.absences && <SideLink to="/absences" icon="🌴" label={t('nav.absences')} />}
        {c.planning && <SideLink to="/planning" icon="📅" label={t('nav.planning')} />}
        {c.chantiers && <SideLink to="/chantiers" icon="🏗️" label={t('nav.sites')} />}
        {c.vehicules && <SideLink to="/vehicules" icon="🚚" label={t('nav.vehicles')} />}
        {c.frais && <SideLink to="/notes-frais" icon="💳" label={t('nav.expenses')} />}
        {c.devis && <SideLink to="/devis" icon="🧾" label={t('nav.quotes')} />}
        {c.annonces && <SideLink to="/annonces" icon="📌" label={t('nav.board')} />}
        <SideLink to="/documents" icon="📄" label={t('nav.documents')} />
        {c.assistant && <SideLink to="/assistant" icon="✨" label={t('nav.assistant')} />}
        {c.rappels && <SideLink to="/rappels" icon="⏰" label={t('nav.reminders')} />}
        {c.manageUsers && <SideLink to="/admin" icon="⚙️" label={t('nav.admin')} />}
      </nav>

      <div className="sidebar-lang">
        {LANGS.map((l) => (
          <button
            key={l.code}
            className={`sidebar-lang-btn ${lang === l.code ? 'on' : ''}`}
            onClick={() => setLang(l.code)}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>

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

function SideLink({ to, icon, label, badge }: { to: string; icon: string; label: string; badge?: number }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
      <span className="sidebar-icon">{icon}</span>
      <span>{label}</span>
      {badge ? <span className="sidebar-badge">{badge > 9 ? '9+' : badge}</span> : null}
    </NavLink>
  )
}
