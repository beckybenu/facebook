import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { tasksDb } from '../data/db'
import type { Task, TaskStatus } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS } from '../lib/utils'

const PRIORITY_BADGE: Record<string, string> = {
  basse: 'badge-gray',
  normale: 'badge-blue',
  haute: 'badge-amber',
  urgente: 'badge-red',
}

export default function Chantiers() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<'actifs' | 'termines'>('actifs')

  useEffect(() => {
    if (!user) return
    setTasks(isAdmin ? tasksDb.all() : tasksDb.forUser(user.id))
  }, [user, isAdmin])

  const filtered = tasks.filter((t) =>
    tab === 'termines' ? t.status === 'termine' : t.status !== 'termine',
  )

  return (
    <Layout title="Mes chantiers">
      <div className="tabs">
        <button className={tab === 'actifs' ? 'active' : ''} onClick={() => setTab('actifs')}>
          En cours
        </button>
        <button className={tab === 'termines' ? 'active' : ''} onClick={() => setTab('termines')}>
          Terminés
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🏗️</span>
          {tab === 'termines' ? 'Aucun chantier terminé.' : 'Aucun chantier en cours.'}
        </div>
      ) : (
        filtered.map((t) => (
          <button key={t.id} className="list-row" onClick={() => navigate(`/chantiers/${t.id}`)}>
            <span
              className="row-bar"
              style={{ background: t.status === 'termine' ? 'var(--sp-gray)' : 'var(--sp-red)' }}
            />
            <div className="row-main">
              <div className="row-title">{t.name}</div>
              <div className="row-sub">{t.projet || t.adresse}</div>
              <div className="row-meta">
                <span className={`badge ${statusBadge(t.status)}`}>{STATUS_LABELS[t.status]}</span>
                <span className={`badge ${PRIORITY_BADGE[t.priority]}`}>
                  {PRIORITY_LABELS[t.priority]}
                </span>
              </div>
            </div>
            <span className="row-chevron">›</span>
          </button>
        ))
      )}
    </Layout>
  )
}

function statusBadge(s: TaskStatus): string {
  if (s === 'termine') return 'badge-gray'
  if (s === 'en_cours') return 'badge-green'
  return 'badge-amber'
}
