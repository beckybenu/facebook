import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { docsDb } from '../data/db'
import type { Document } from '../types'
import { formatDate } from '../lib/utils'

export default function Documents() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [tab, setTab] = useState<'public' | 'prive'>('public')

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

  return (
    <Layout title="Documents">
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
