import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { LOGO } from '../lib/utils'
import { caps } from '../lib/roles'
import { notifDb } from '../data/db'
import { useLang } from '../lib/i18n'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const c = caps(user?.role)
  const { t } = useLang()
  const unread = user ? notifDb.unreadCount(user.id) : 0

  const services = [
    { icon: '🌐', label: 'Site Web', action: () => window.open('https://www.swisspaints.ch', '_blank') },
    { icon: '📞', label: 'Téléphone', action: () => (window.location.href = 'tel:+41225581219') },
    { icon: '📝', label: 'Devis en ligne', action: () => window.open('https://www.swisspaints.ch', '_blank') },
    { icon: '📅', label: 'Agenda', action: () => alert('Agenda — à venir') },
    {
      icon: '📍',
      label: 'Itinéraire',
      action: () =>
        window.open('https://www.google.com/maps/search/?api=1&query=Rue+de+la+Prulay+19B,+1217+Meyrin', '_blank'),
    },
    { icon: '✉️', label: 'Email', action: () => (window.location.href = 'mailto:contact@swisspaints.ch') },
  ]

  // Tuiles RH filtrées par capacités du rôle
  const rhTiles = [
    c.tableauBord && { icon: '📊', label: t('nav.dashboard'), to: '/tableau-de-bord' },
    c.pointer && { icon: '⏱️', label: t('nav.timesheet'), to: '/pointage' },
    c.chantiers && { icon: '🏗️', label: t('nav.sites'), to: '/chantiers' },
    c.absences && { icon: '🌴', label: t('nav.absences'), to: '/absences' },
    c.planning && { icon: '📅', label: t('nav.planning'), to: '/planning' },
    c.vehicules && { icon: '🚚', label: t('nav.vehicles'), to: '/vehicules' },
    c.frais && { icon: '💳', label: t('nav.expenses'), to: '/notes-frais' },
    c.devis && { icon: '🧾', label: t('nav.quotes'), to: '/devis' },
    c.annonces && { icon: '📌', label: t('nav.board'), to: '/annonces' },
    c.rappels && { icon: '⏰', label: t('nav.reminders'), to: '/rappels' },
    c.assistant && { icon: '✨', label: t('nav.assistant'), to: '/assistant' },
    { icon: '📄', label: t('nav.documents'), to: '/documents' },
  ].filter(Boolean) as { icon: string; label: string; to: string }[]

  return (
    <Layout title={t('nav.home')}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={LOGO} alt="" style={{ height: 40, width: 'auto' }} />
        <div style={{ flex: 1 }}>
          <div className="card-title">{t('home.hello')} {user?.prenom} 👋</div>
          <div className="card-sub">{user?.titre || t('home.welcome')}</div>
        </div>
        {c.staff && (
          <button
            className="home-bell"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
          >
            🔔{unread ? <span className="home-bell-badge">{unread > 9 ? '9+' : unread}</span> : null}
          </button>
        )}
      </div>

      {c.staff && (
        <>
          <div className="section-title">{t('home.workspace')}</div>
          <div className="home-grid">
            {rhTiles.map((t) => (
              <button key={t.to} className="home-tile" onClick={() => navigate(t.to)}>
                <span className="tile-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="section-title">{t('home.services')}</div>
      <div className="home-grid">
        {services.map((s) => (
          <button key={s.label} className="home-tile" onClick={s.action}>
            <span className="tile-icon">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {c.manageUsers && (
        <>
          <div className="section-title">{t('home.admin')}</div>
          <button className="btn btn-dark" onClick={() => navigate('/admin')}>
            ⚙️ {t('home.adminSpace')}
          </button>
        </>
      )}
    </Layout>
  )
}
