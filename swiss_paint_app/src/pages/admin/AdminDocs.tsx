import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { docsDb } from '../../data/db'
import type { Document } from '../../types'
import { formatDate } from '../../lib/utils'

export default function AdminDocs() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])

  useEffect(() => {
    setDocs(docsDb.all())
  }, [])

  return (
    <Layout
      title="Documents"
      back
      right={
        <button className="icon-btn" onClick={() => navigate('/admin/documents/new')} aria-label="Ajouter">
          ＋
        </button>
      }
    >
      {docs.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">📄</span>
          Aucun document.
        </div>
      ) : (
        docs.map((d) => (
          <button key={d.id} className="list-row" onClick={() => navigate(`/admin/documents/${d.id}`)}>
            <span
              className="row-bar"
              style={{ background: d.visibility === 'prive' ? 'var(--sp-black)' : 'var(--sp-red)' }}
            />
            <div className="row-main">
              <div className="row-title">{d.name}</div>
              <div className="row-sub">
                {d.documentType || 'Document'} · {formatDate(d.createdAt)}
              </div>
            </div>
            <span className={`badge ${d.visibility === 'prive' ? 'badge-gray' : 'badge-green'}`}>
              {d.visibility === 'prive' ? '🔒 Privé' : 'Public'}
            </span>
          </button>
        ))
      )}

      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/admin/documents/new')}>
        ＋ Ajouter un document
      </button>
    </Layout>
  )
}
