import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { docsDb } from '../data/db'
import type { Document } from '../types'
import { formatDate } from '../lib/utils'
import {
  getWdUrl,
  setWdUrl,
  WD_DEFAULT,
  getWdItems,
  addWdItem,
  removeWdItem,
  type WdItem,
} from '../lib/wd'

export default function Documents() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [tab, setTab] = useState<'public' | 'prive'>('public')
  const [wdUrl, setWdUrlState] = useState(getWdUrl())
  const [editWd, setEditWd] = useState(false)
  // Catalogue WD
  const [items, setItems] = useState<WdItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [f, setF] = useState({ nom: '', dossier: '', lien: '', description: '' })

  useEffect(() => setItems(getWdItems()), [])

  const isAdmin = user?.role === 'admin'
  function saveItem() {
    if (!f.nom.trim() || !f.lien.trim()) return
    addWdItem({ nom: f.nom.trim(), lien: f.lien.trim(), dossier: f.dossier.trim(), description: f.description.trim() })
    setItems(getWdItems())
    setF({ nom: '', dossier: '', lien: '', description: '' })
    setShowAdd(false)
  }
  function delItem(id: string) {
    removeWdItem(id)
    setItems(getWdItems())
  }

  useEffect(() => {
    if (!user) return
    // Visibilité : un document privé n'est visible que par son audience (ou tous), ou par l'admin.
    const visible = docsDb.all().filter((d) => {
      if (user.role === 'admin') return true
      if (d.visibility === 'public') return true
      return d.audience === 'tous' || d.audience === user.role
    })
    setDocs(visible)
  }, [user])

  const filtered = docs.filter((d) => d.visibility === tab)

  function download(d: Document) {
    if (d.fileData) {
      const a = document.createElement('a')
      a.href = d.fileData
      a.download = d.fileName || d.name
      a.click()
    } else {
      alert('Démo : aucun fichier joint à ce document.')
    }
  }

  const isEmploye = user?.role === 'admin' || user?.role === 'ouvrier'

  return (
    <Layout title="Documents">
      {/* Accès au serveur de fichiers de l'entreprise (WD My Cloud) */}
      {isEmploye && (
        <div className="card">
          <div className="card-title">📁 Fichiers de l'entreprise (WD My Cloud)</div>
          <div className="card-sub" style={{ marginBottom: 10 }}>
            Ouvre ton serveur WD pour accéder à tous les fichiers de l'entreprise.
          </div>
          {editWd ? (
            <>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>Adresse d'accès à ton WD</label>
                <input
                  value={wdUrl}
                  onChange={(e) => setWdUrlState(e.target.value)}
                  placeholder={WD_DEFAULT}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="card-sub" style={{ marginBottom: 8 }}>
                Par défaut : <code>{WD_DEFAULT}</code> (portail WD My Cloud OS5). Tu peux aussi mettre
                le lien de partage d'un dossier, ou l'adresse locale de ton WD.
              </div>
              <div className="btn-row">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setWdUrlState(getWdUrl())
                    setEditWd(false)
                  }}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setWdUrl(wdUrl)
                    setEditWd(false)
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </>
          ) : (
            <div className="btn-row">
              <button
                className="btn btn-primary"
                onClick={() => window.open(getWdUrl(), '_blank', 'noopener')}
              >
                🔓 Ouvrir le serveur WD
              </button>
              <button
                className="btn btn-outline btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => setEditWd(true)}
              >
                Lien
              </button>
            </div>
          )}
        </div>
      )}

      {/* Catalogue WD : fichiers référencés, interrogeables par l'IA */}
      {isEmploye && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">🗂️ Catalogue WD (recherchable par l'IA)</div>
            {isAdmin && (
              <button className="link" onClick={() => setShowAdd((v) => !v)}>
                {showAdd ? 'Fermer' : '＋ Ajouter'}
              </button>
            )}
          </div>
          <div className="card-sub" style={{ marginBottom: items.length || showAdd ? 10 : 0 }}>
            Range ici tes fichiers WD (nom + lien de partage). L'assistant IA pourra les retrouver et
            les ouvrir.
          </div>

          {showAdd && isAdmin && (
            <div style={{ marginBottom: 10 }}>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>Nom du fichier / dossier</label>
                <input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Contrat Villa Cologny" />
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>Dossier (optionnel)</label>
                <input value={f.dossier} onChange={(e) => setF({ ...f, dossier: e.target.value })} placeholder="Contrats" />
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>Lien de partage WD</label>
                <input value={f.lien} onChange={(e) => setF({ ...f, lien: e.target.value })} placeholder="https://…" autoCapitalize="none" />
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>Description (aide l'IA à répondre)</label>
                <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Contrat signé 2024, 12 000 CHF" />
              </div>
              <button className="btn btn-primary btn-sm" onClick={saveItem} disabled={!f.nom || !f.lien}>
                Ajouter au catalogue
              </button>
            </div>
          )}

          {items.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>Catalogue vide.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="list-row" style={{ marginBottom: 6 }}>
                <span className="row-bar" />
                <div className="row-main" onClick={() => window.open(it.lien, '_blank', 'noopener')}>
                  <div className="row-title">{it.nom}</div>
                  <div className="row-sub">
                    {it.dossier ? `${it.dossier} · ` : ''}
                    {it.description || 'Fichier WD'}
                  </div>
                </div>
                {isAdmin && (
                  <button className="icon-btn" style={{ color: 'var(--sp-red)' }} onClick={() => delItem(it.id)} aria-label="Supprimer">
                    🗑️
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="tabs">
        <button className={tab === 'public' ? 'active' : ''} onClick={() => setTab('public')}>
          📂 Publics
        </button>
        <button className={tab === 'prive' ? 'active' : ''} onClick={() => setTab('prive')}>
          🔒 Privés
        </button>
      </div>

      {tab === 'prive' && (
        <div className="info-msg">
          Les documents privés sont réservés à votre profil. Vous ne pouvez pas les gérer
          vous-même — voir le manuel d'utilisation.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">📄</span>
          Aucun document {tab === 'prive' ? 'privé' : 'public'}.
        </div>
      ) : (
        filtered.map((d) => (
          <div key={d.id} className="list-row" onClick={() => download(d)}>
            <span className="row-bar" />
            <div className="row-main">
              <div className="row-title">{d.name}</div>
              <div className="row-sub">
                {d.documentType || 'Document'} · {formatDate(d.createdAt)}
              </div>
            </div>
            <span className="row-chevron">⬇️</span>
          </div>
        ))
      )}
    </Layout>
  )
}
