import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { LOGO } from '../lib/utils'

export default function Home() {
  const { user, isOuvrier, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Tuiles "services" reprises de l'écran Accueil Adalo
  // Coordonnées réelles : SwissPaints Group Sàrl, Ch. du Grand-Puits 66, 1217 Meyrin
  const tiles = [
    { icon: '🌐', label: 'Site Web', action: () => window.open('https://www.swisspaints.ch', '_blank') },
    { icon: '📞', label: 'Téléphone', action: () => (window.location.href = 'tel:+41225581219') },
    {
      icon: '📝',
      label: 'Devis en ligne',
      action: () => window.open('https://www.swisspaints.ch', '_blank'),
    },
    { icon: '📅', label: 'Agenda', action: () => alert('Agenda — à venir') },
    {
      icon: '📍',
      label: 'Itinéraire',
      action: () =>
        window.open(
          'https://www.google.com/maps/search/?api=1&query=Rue+de+la+Prulay+19B,+1217+Meyrin',
          '_blank',
        ),
    },
    {
      icon: '✉️',
      label: 'Email',
      action: () => (window.location.href = 'mailto:contact@swisspaints.ch'),
    },
  ]

  return (
    <Layout title="Accueil">
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={LOGO} alt="" style={{ height: 40, width: 'auto' }} />
        <div>
          <div className="card-title">Bonjour {user?.prenom} 👋</div>
          <div className="card-sub">{user?.titre || 'Bienvenue sur SwissPaints'}</div>
        </div>
      </div>

      {/* Raccourcis métier pour les employés */}
      {(isOuvrier || isAdmin) && (
        <>
          <div className="section-title">Mon travail</div>
          <div className="home-grid">
            <button className="home-tile" onClick={() => navigate('/pointage')}>
              <span className="tile-icon">⏱️</span>
              Pointer
            </button>
            <button className="home-tile" onClick={() => navigate('/chantiers')}>
              <span className="tile-icon">🏗️</span>
              Mes chantiers
            </button>
            <button className="home-tile" onClick={() => navigate('/devis')}>
              <span className="tile-icon">🧾</span>
              Devis
            </button>
          </div>
        </>
      )}

      <div className="section-title">Services</div>
      <div className="home-grid">
        {tiles.map((t) => (
          <button key={t.label} className="home-tile" onClick={t.action}>
            <span className="tile-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {isAdmin && (
        <>
          <div className="section-title">Administration</div>
          <button className="btn btn-dark" onClick={() => navigate('/admin')}>
            ⚙️ Espace administrateur
          </button>
        </>
      )}
    </Layout>
  )
}
