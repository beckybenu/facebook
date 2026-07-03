import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { usersDb } from '../data/db'
import { fileToDataURL, ROLE_LABELS } from '../lib/utils'

export default function Profile() {
  const { user, logout, refresh, isAdmin, cloud } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: user?.username || '',
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    titre: user?.titre || '',
    telephone: user?.telephone || '',
    image: user?.image || '',
  })
  const [saved, setSaved] = useState(false)

  if (!user) return null

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function pickImage(file?: File) {
    if (!file) return
    set('image', await fileToDataURL(file))
  }

  function save() {
    if (!user) return
    usersDb.update({ ...user, ...form })
    refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  const initials = `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase()

  return (
    <Layout title="Profil personnel">
      {saved && <div className="success-msg">Profil mis à jour ✓</div>}

      <div className="card" style={{ textAlign: 'center' }}>
        {form.image ? (
          <img className="avatar avatar-lg" src={form.image} alt="" style={{ margin: '0 auto' }} />
        ) : (
          <div className="avatar avatar-lg" style={{ margin: '0 auto' }}>
            {initials}
          </div>
        )}
        <div className="card-title" style={{ marginTop: 10 }}>
          {user.prenom} {user.nom}
        </div>
        <div className="card-sub">{user.email}</div>
        <span className="badge badge-red" style={{ marginTop: 8, display: 'inline-block' }}>
          {ROLE_LABELS[user.role]}
        </span>
        <label className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
          📷 Changer la photo
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="section-title">Mes informations</div>
      <div className="card">
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
          <label>Titre</label>
          <input
            value={form.titre}
            onChange={(e) => set('titre', e.target.value)}
            placeholder="Ex : Peintre, Chef de chantier…"
          />
        </div>
        <div className="field">
          <label>Téléphone</label>
          <input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save}>
          Mettre à jour le profil
        </button>
      </div>

      {isAdmin && (
        <button className="btn btn-dark" onClick={() => navigate('/admin')}>
          ⚙️ Espace administrateur
        </button>
      )}

      <button
        className="btn btn-outline"
        style={{ marginTop: 12 }}
        onClick={() => navigate('/parametres')}
      >
        {cloud ? '☁️ Serveur connecté' : '📱 Connexion serveur'}
      </button>

      <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={handleLogout}>
        🚪 Se déconnecter
      </button>
    </Layout>
  )
}
