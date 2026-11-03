import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import { usersDb, uid } from '../../data/db'
import type { User, UserRole } from '../../types'

const EMPTY = {
  email: '',
  password: '',
  username: '',
  prenom: '',
  nom: '',
  titre: '',
  telephone: '',
  role: 'ouvrier' as UserRole,
  // Contrat RH (chaînes dans le formulaire, converties en nombre à l'enregistrement)
  heuresHebdo: '',
  tauxActivite: '',
  joursVacances: '',
}

// Convertit un champ texte en nombre, ou undefined si vide (→ valeur par défaut en code)
function numOrUndef(v: string): number | undefined {
  const t = v.trim().replace(',', '.')
  if (t === '') return undefined
  const n = parseFloat(t)
  return isNaN(n) ? undefined : n
}

export default function AdminUserEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState(EMPTY)
  const [existing, setExisting] = useState<User | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew && id) {
      const u = usersDb.byId(id)
      if (u) {
        setExisting(u)
        setForm({
          email: u.email,
          password: u.password,
          username: u.username,
          prenom: u.prenom,
          nom: u.nom,
          titre: u.titre || '',
          telephone: u.telephone || '',
          role: u.role,
          heuresHebdo: u.heuresHebdo != null ? String(u.heuresHebdo) : '',
          tauxActivite: u.tauxActivite != null ? String(u.tauxActivite) : '',
          joursVacances: u.joursVacances != null ? String(u.joursVacances) : '',
        })
      }
    }
  }, [id, isNew])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function save() {
    setError('')
    if (!form.email || !form.password || !form.prenom) {
      setError('Email, mot de passe et prénom sont obligatoires.')
      return
    }
    const dup = usersDb.byEmail(form.email)
    if (dup && dup.id !== existing?.id) {
      setError('Un autre compte utilise déjà cet email.')
      return
    }
    // Sépare les champs "contrat" (texte) pour les convertir en nombres
    const { heuresHebdo, tauxActivite, joursVacances, ...base } = form
    const contrat = {
      heuresHebdo: numOrUndef(heuresHebdo),
      tauxActivite: numOrUndef(tauxActivite),
      joursVacances: numOrUndef(joursVacances),
    }
    if (isNew) {
      usersDb.create({ id: uid('usr'), createdAt: new Date().toISOString(), ...base, ...contrat })
    } else if (existing) {
      usersDb.update({ ...existing, ...base, ...contrat })
    }
    navigate('/admin/users')
  }

  function remove() {
    if (existing && confirm('Supprimer ce compte ?')) {
      usersDb.remove(existing.id)
      navigate('/admin/users')
    }
  }

  return (
    <Layout title={isNew ? 'Nouvel utilisateur' : 'Modifier utilisateur'} back nav={false}>
      {error && <div className="error-msg">{error}</div>}
      <div className="card">
        <div className="field">
          <label>Email</label>
          <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <div className="field">
          <label>Nom d'utilisateur</label>
          <input value={form.username} onChange={(e) => set('username', e.target.value)} />
        </div>
        <div className="field">
          <label>Prénom</label>
          <input value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
        </div>
        <div className="field">
          <label>Nom</label>
          <input value={form.nom} onChange={(e) => set('nom', e.target.value)} />
        </div>
        <div className="field">
          <label>Titre / fonction</label>
          <input value={form.titre} onChange={(e) => set('titre', e.target.value)} />
        </div>
        <div className="field">
          <label>Téléphone</label>
          <input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
        </div>
        <div className="field">
          <label>Rôle / type de compte</label>
          <select value={form.role} onChange={(e) => set('role', e.target.value as UserRole)}>
            <option value="client">Client</option>
            <option value="ouvrier">Ouvrier</option>
            <option value="sous_traitant">Sous-traitant</option>
            <option value="comptable">Comptable</option>
            <option value="rh">RH</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {(form.role === 'ouvrier' || form.role === 'sous_traitant' || form.role === 'rh' || form.role === 'admin') && (
        <>
          <div className="section-title" style={{ marginTop: 18 }}>
            Contrat RH
          </div>
          <div className="card">
            <div className="field">
              <label>Taux d'activité (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.tauxActivite}
                onChange={(e) => set('tauxActivite', e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="field">
              <label>Heures hebdomadaires (base plein temps)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.heuresHebdo}
                onChange={(e) => set('heuresHebdo', e.target.value)}
                placeholder="42"
              />
            </div>
            <div className="field">
              <label>Jours de vacances par an</label>
              <input
                type="number"
                min="0"
                value={form.joursVacances}
                onChange={(e) => set('joursVacances', e.target.value)}
                placeholder="25"
              />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Laissez vide pour les valeurs par défaut (100 % · 42 h · 25 j). Le taux ajuste
              automatiquement les heures et les vacances au prorata.
            </div>
          </div>
        </>
      )}

      <button className="btn btn-primary" onClick={save}>
        {isNew ? 'Créer le compte' : 'Enregistrer'}
      </button>
      {!isNew && (
        <button className="btn btn-outline" style={{ marginTop: 12, color: 'var(--sp-red)' }} onClick={remove}>
          🗑️ Supprimer le compte
        </button>
      )}
    </Layout>
  )
}
