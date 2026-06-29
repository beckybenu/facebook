import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { tasksDb, usersDb } from '../data/db'
import type { Task, TaskStatus } from '../types'
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  formatDate,
  mapsLink,
  fileToDataURL,
} from '../lib/utils'

export default function TaskDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (id) setTask(tasksDb.byId(id) ?? null)
  }, [id])

  if (!task) {
    return (
      <Layout title="Chantier" back>
        <div className="empty">Chantier introuvable.</div>
      </Layout>
    )
  }

  const assignee = task.assignedUserId ? usersDb.byId(task.assignedUserId) : undefined

  function updateStatus(status: TaskStatus) {
    if (!task) return
    const updated = { ...task, status }
    tasksDb.update(updated)
    setTask(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function uploadPhoto(which: 'imageAvant' | 'imageApres', file?: File) {
    if (!task || !file) return
    const dataURL = await fileToDataURL(file)
    const updated = { ...task, [which]: dataURL }
    tasksDb.update(updated)
    setTask(updated)
  }

  return (
    <Layout title="Description tâche" back>
      {saved && <div className="success-msg">Statut mis à jour ✓</div>}

      <div className="card">
        <h2 className="card-title" style={{ fontSize: 18 }}>
          {task.name}
        </h2>
        <div className="row-meta" style={{ marginBottom: 10 }}>
          <span className="badge badge-green">{STATUS_LABELS[task.status]}</span>
          <span className="badge badge-amber">{PRIORITY_LABELS[task.priority]}</span>
        </div>
        <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{task.description}</p>
      </div>

      <div className="card">
        <div className="kv">
          <span className="k">Projet</span>
          <span className="v">{task.projet || '—'}</span>
        </div>
        <div className="kv">
          <span className="k">Sous-type</span>
          <span className="v">{task.sousType || '—'}</span>
        </div>
        <div className="kv">
          <span className="k">Contact</span>
          <span className="v">{task.contact || '—'}</span>
        </div>
        <div className="kv">
          <span className="k">Ouvrier assigné</span>
          <span className="v">{assignee ? `${assignee.prenom} ${assignee.nom}` : '—'}</span>
        </div>
        <div className="kv">
          <span className="k">Créé le</span>
          <span className="v">{formatDate(task.createdAt)}</span>
        </div>
      </div>

      {/* Géolocalisation du chantier */}
      {task.lat != null && task.lng != null && (
        <div className="card">
          <div className="card-title" style={{ fontSize: 15 }}>
            📍 Localisation
          </div>
          <div className="card-sub" style={{ marginBottom: 10 }}>
            {task.adresse}
          </div>
          <a
            className="btn btn-outline"
            href={mapsLink(task.lat, task.lng)}
            target="_blank"
            rel="noreferrer"
          >
            🗺️ Ouvrir dans Maps
          </a>
        </div>
      )}

      {/* Photos avant / après travaux */}
      <div className="section-title">Photos</div>
      <div className="card">
        <PhotoSlot
          label="Avant travaux"
          src={task.imageAvant}
          onPick={(f) => uploadPhoto('imageAvant', f)}
        />
        <div style={{ height: 14 }} />
        <PhotoSlot
          label="Après travaux"
          src={task.imageApres}
          onPick={(f) => uploadPhoto('imageApres', f)}
        />
      </div>

      {/* Mise à jour du statut (ouvrier ou admin) */}
      <div className="section-title">Mettre à jour le statut</div>
      <div className="btn-row">
        <button className="btn btn-outline btn-sm" onClick={() => updateStatus('a_faire')}>
          À faire
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => updateStatus('en_cours')}>
          En cours
        </button>
        <button className="btn btn-success btn-sm" onClick={() => updateStatus('termine')}>
          Terminé
        </button>
      </div>

      {isAdmin && (
        <a className="btn btn-dark" style={{ marginTop: 16 }} href={`/admin/taches/${task.id}`}>
          ✏️ Modifier (admin)
        </a>
      )}
    </Layout>
  )
}

function PhotoSlot({
  label,
  src,
  onPick,
}: {
  label: string
  src?: string
  onPick: (file?: File) => void
}) {
  return (
    <div>
      <label className="field" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {src ? (
        <img src={src} alt={label} className="detail-img" />
      ) : (
        <div className="img-slot" style={{ marginBottom: 0 }}>
          Aucune photo
        </div>
      )}
      <label className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
        📷 {src ? 'Remplacer' : 'Ajouter une photo'}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
    </div>
  )
}
