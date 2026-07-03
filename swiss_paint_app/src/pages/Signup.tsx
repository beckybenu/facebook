import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    nom: '',
    prenom: '',
    telephone: '',
    role: 'client' as UserRole,
  })
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await signup(form)
    setBusy(false)
    if (res.ok) navigate('/home')
    else setError(res.error || 'Inscription impossible.')
  }

  return (
    <div className="app-shell">
      <div className="auth-screen">
        <h2 className="auth-title" style={{ marginTop: 12 }}>
          Inscription
        </h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="Entrez votre adresse mail…"
              required
            />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Entrez votre mot de passe…"
              required
            />
          </div>
          <div className="field">
            <label>Nom d'utilisateur</label>
            <input
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              placeholder="Nom d'utilisateur…"
              required
            />
          </div>
          <div className="field">
            <label>Prénom</label>
            <input
              value={form.prenom}
              onChange={(e) => set('prenom', e.target.value)}
              placeholder="Votre prénom…"
              required
            />
          </div>
          <div className="field">
            <label>Nom</label>
            <input
              value={form.nom}
              onChange={(e) => set('nom', e.target.value)}
              placeholder="Votre nom…"
              required
            />
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input
              value={form.telephone}
              onChange={(e) => set('telephone', e.target.value)}
              placeholder="+41 …"
            />
          </div>
          <div className="field">
            <label>Type de compte</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value as UserRole)}>
              <option value="client">Client (utilisateur externe)</option>
              <option value="ouvrier">Ouvrier (employé)</option>
            </select>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Les comptes administrateur sont créés depuis l'espace Admin.
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-links" style={{ marginTop: 14 }}>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  )
}
