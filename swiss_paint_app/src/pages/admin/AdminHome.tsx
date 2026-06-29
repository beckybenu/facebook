import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { usersDb, tasksDb, docsDb, timeDb } from '../../data/db'

export default function AdminHome() {
  const navigate = useNavigate()
  const stats = {
    users: usersDb.all().length,
    ouvriers: usersDb.all().filter((u) => u.role === 'ouvrier').length,
    tasks: tasksDb.all().length,
    docs: docsDb.all().length,
    active: timeDb.all().filter((e) => !e.clockOut).length,
  }

  return (
    <Layout title="Administration">
      <div className="home-grid" style={{ marginBottom: 8 }}>
        <div className="card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.users}</div>
          <div className="card-sub">Comptes</div>
        </div>
        <div className="card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.ouvriers}</div>
          <div className="card-sub">Ouvriers</div>
        </div>
        <div className="card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.tasks}</div>
          <div className="card-sub">Tâches</div>
        </div>
        <div className="card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--sp-success)' }}>
            {stats.active}
          </div>
          <div className="card-sub">En pointage</div>
        </div>
      </div>

      <div className="section-title">Gestion</div>
      <button className="list-row" onClick={() => navigate('/admin/users')}>
        <span className="row-bar" />
        <div className="row-main">
          <div className="row-title">👥 Comptes utilisateurs</div>
          <div className="row-sub">Créer, modifier, changer les rôles</div>
        </div>
        <span className="row-chevron">›</span>
      </button>
      <button className="list-row" onClick={() => navigate('/admin/taches')}>
        <span className="row-bar" />
        <div className="row-main">
          <div className="row-title">🏗️ Tâches & chantiers</div>
          <div className="row-sub">Créer et affecter les chantiers</div>
        </div>
        <span className="row-chevron">›</span>
      </button>
      <button className="list-row" onClick={() => navigate('/admin/documents')}>
        <span className="row-bar" />
        <div className="row-main">
          <div className="row-title">📄 Documents</div>
          <div className="row-sub">Documents publics et privés</div>
        </div>
        <span className="row-chevron">›</span>
      </button>
    </Layout>
  )
}
