import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { tasksDb, usersDb } from '../../data/db'
import type { Task } from '../../types'
import { STATUS_LABELS } from '../../lib/utils'

export default function AdminTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(tasksDb.all())
  }, [])

  const assignee = (id?: string) => {
    const u = id ? usersDb.byId(id) : undefined
    return u ? `${u.prenom} ${u.nom}` : 'Non assigné'
  }

  return (
    <Layout
      title="Liste des tâches"
      back
      right={
        <button className="icon-btn" onClick={() => navigate('/admin/taches/new')} aria-label="Ajouter">
          ＋
        </button>
      }
    >
      {tasks.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🏗️</span>
          Aucune tâche.
        </div>
      ) : (
        tasks.map((t) => (
          <button key={t.id} className="list-row" onClick={() => navigate(`/admin/taches/${t.id}`)}>
            <span
              className="row-bar"
              style={{ background: t.status === 'termine' ? 'var(--sp-gray)' : 'var(--sp-red)' }}
            />
            <div className="row-main">
              <div className="row-title">{t.name}</div>
              <div className="row-sub">
                {assignee(t.assignedUserId)} · {STATUS_LABELS[t.status]}
              </div>
            </div>
            <span className="row-chevron">›</span>
          </button>
        ))
      )}

      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/admin/taches/new')}>
        ＋ Créer une tâche
      </button>
    </Layout>
  )
}
