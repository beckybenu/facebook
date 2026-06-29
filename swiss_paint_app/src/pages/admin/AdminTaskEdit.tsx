import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import { tasksDb, usersDb, uid } from '../../data/db'
import type { Task, TaskStatus, TaskPriority, User } from '../../types'
import { getCurrentPosition } from '../../lib/utils'

export default function AdminTaskEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [existing, setExisting] = useState<Task | null>(null)
  const [ouvriers, setOuvriers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [geoMsg, setGeoMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'a_faire' as TaskStatus,
    priority: 'normale' as TaskPriority,
    contact: '',
    projet: '',
    sousType: '',
    assignedUserId: '',
    adresse: '',
    lat: '' as string,
    lng: '' as string,
  })

  useEffect(() => {
    setOuvriers(usersDb.all().filter((u) => u.role === 'ouvrier' || u.role === 'admin'))
    if (!isNew && id) {
      const t = tasksDb.byId(id)
      if (t) {
        setExisting(t)
        setForm({
          name: t.name,
          description: t.description,
          status: t.status,
          priority: t.priority,
          contact: t.contact || '',
          projet: t.projet || '',
          sousType: t.sousType || '',
          assignedUserId: t.assignedUserId || '',
          adresse: t.adresse || '',
          lat: t.lat != null ? String(t.lat) : '',
          lng: t.lng != null ? String(t.lng) : '',
        })
      }
    }
  }, [id, isNew])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function useMyPosition() {
    setGeoMsg('Localisation…')
    try {
      const pos = await getCurrentPosition()
      setForm((f) => ({ ...f, lat: pos.lat.toFixed(6), lng: pos.lng.toFixed(6) }))
      setGeoMsg('Position récupérée ✓')
    } catch (e) {
      setGeoMsg((e as Error).message)
    }
  }

  function save() {
    setError('')
    if (!form.name.trim()) {
      setError('Le nom de la tâche est obligatoire.')
      return
    }
    const base: Task = {
      id: existing?.id ?? uid('tsk'),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      contact: form.contact || undefined,
      projet: form.projet || undefined,
      sousType: form.sousType || undefined,
      assignedUserId: form.assignedUserId || undefined,
      adresse: form.adresse || undefined,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
      imageAvant: existing?.imageAvant,
      imageApres: existing?.imageApres,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    if (isNew) tasksDb.create(base)
    else tasksDb.update(base)
    navigate('/admin/taches')
  }

  function remove() {
    if (existing && confirm('Supprimer cette tâche ?')) {
      tasksDb.remove(existing.id)
      navigate('/admin/taches')
    }
  }

  return (
    <Layout title={isNew ? 'Création tâche' : 'Modifier tâche'} back nav={false}>
      {error && <div className="error-msg">{error}</div>}
      <div className="card">
        <div className="field">
          <label>Nom de la tâche</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nom…" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Description de la tâche…"
          />
        </div>
        <div className="field">
          <label>Ouvrier assigné</label>
          <select value={form.assignedUserId} onChange={(e) => set('assignedUserId', e.target.value)}>
            <option value="">— Aucun —</option>
            {ouvriers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.prenom} {u.nom} ({u.titre || u.role})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Statut</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
        <div className="field">
          <label>Priorité</label>
          <select
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as TaskPriority)}
          >
            <option value="basse">Basse</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div className="field">
          <label>Projet / chantier</label>
          <input value={form.projet} onChange={(e) => set('projet', e.target.value)} />
        </div>
        <div className="field">
          <label>Projet sous-type</label>
          <input
            value={form.sousType}
            onChange={(e) => set('sousType', e.target.value)}
            placeholder="Intérieur, Extérieur…"
          />
        </div>
        <div className="field">
          <label>Contact</label>
          <input value={form.contact} onChange={(e) => set('contact', e.target.value)} />
        </div>
      </div>

      <div className="section-title">Localisation du chantier</div>
      <div className="card">
        <div className="field">
          <label>Adresse</label>
          <input value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
        </div>
        <div className="btn-row">
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Latitude</label>
            <input value={form.lat} onChange={(e) => set('lat', e.target.value)} inputMode="decimal" />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Longitude</label>
            <input value={form.lng} onChange={(e) => set('lng', e.target.value)} inputMode="decimal" />
          </div>
        </div>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={useMyPosition}>
          📍 Utiliser ma position actuelle
        </button>
        {geoMsg && <div className="muted" style={{ marginTop: 8 }}>{geoMsg}</div>}
      </div>

      <button className="btn btn-primary" onClick={save}>
        {isNew ? 'Créer la tâche' : 'Mettre à jour la tâche'}
      </button>
      {!isNew && (
        <button className="btn btn-outline" style={{ marginTop: 12, color: 'var(--sp-red)' }} onClick={remove}>
          🗑️ Supprimer la tâche
        </button>
      )}
    </Layout>
  )
}
