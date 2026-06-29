import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import { docsDb, uid } from '../../data/db'
import type { Document, DocVisibility, UserRole } from '../../types'
import { fileToDataURL } from '../../lib/utils'

type Audience = UserRole | 'tous'

export default function AdminDocEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [existing, setExisting] = useState<Document | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    titre: '',
    documentType: '',
    visibility: 'public' as DocVisibility,
    audience: 'tous' as Audience,
    fileName: '',
    fileData: '',
  })

  useEffect(() => {
    if (!isNew && id) {
      const d = docsDb.byId(id)
      if (d) {
        setExisting(d)
        setForm({
          name: d.name,
          titre: d.titre || '',
          documentType: d.documentType || '',
          visibility: d.visibility,
          audience: d.audience,
          fileName: d.fileName || '',
          fileData: d.fileData || '',
        })
      }
    }
  }, [id, isNew])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function pickFile(file?: File) {
    if (!file) return
    const data = await fileToDataURL(file)
    setForm((f) => ({ ...f, fileData: data, fileName: file.name }))
  }

  function save() {
    setError('')
    if (!form.name.trim()) {
      setError('Le nom du document est obligatoire.')
      return
    }
    const base: Document = {
      id: existing?.id ?? uid('doc'),
      name: form.name.trim(),
      titre: form.titre || undefined,
      documentType: form.documentType || undefined,
      visibility: form.visibility,
      audience: form.audience,
      fileName: form.fileName || undefined,
      fileData: form.fileData || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    if (isNew) docsDb.create(base)
    else docsDb.update(base)
    navigate('/admin/documents')
  }

  function remove() {
    if (existing && confirm('Supprimer ce document ?')) {
      docsDb.remove(existing.id)
      navigate('/admin/documents')
    }
  }

  return (
    <Layout title={isNew ? 'Nouveau document' : 'Modifier document'} back nav={false}>
      {error && <div className="error-msg">{error}</div>}
      <div className="card">
        <div className="field">
          <label>Nom</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nom…" />
        </div>
        <div className="field">
          <label>Titre</label>
          <input value={form.titre} onChange={(e) => set('titre', e.target.value)} />
        </div>
        <div className="field">
          <label>Type de document</label>
          <input
            value={form.documentType}
            onChange={(e) => set('documentType', e.target.value)}
            placeholder="Devis, Facture, Plan…"
          />
        </div>
        <div className="field">
          <label>Visibilité</label>
          <select
            value={form.visibility}
            onChange={(e) => set('visibility', e.target.value as DocVisibility)}
          >
            <option value="public">Public</option>
            <option value="prive">Privé</option>
          </select>
        </div>
        <div className="field">
          <label>Audience (type d'utilisateur)</label>
          <select value={form.audience} onChange={(e) => set('audience', e.target.value as Audience)}>
            <option value="tous">Tous</option>
            <option value="client">Clients</option>
            <option value="ouvrier">Ouvriers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div className="field">
          <label>Fichier joint</label>
          <label className="img-slot" style={{ display: 'block' }}>
            {form.fileName ? `📎 ${form.fileName}` : '📎 Choisir un fichier'}
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <button className="btn btn-primary" onClick={save}>
        {isNew ? 'Créer le document' : 'Mettre à jour'}
      </button>
      {!isNew && (
        <button className="btn btn-outline" style={{ marginTop: 12, color: 'var(--sp-red)' }} onClick={remove}>
          🗑️ Supprimer le document
        </button>
      )}
    </Layout>
  )
}
