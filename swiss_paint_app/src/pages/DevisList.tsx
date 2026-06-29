import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { devisDb } from '../data/db'
import type { Devis } from '../types'
import { formatCHF, formatDateLong, devisTotals, DEVIS_STATUS_LABELS } from '../lib/utils'

const STATUS_BADGE: Record<string, string> = {
  brouillon: 'badge-gray',
  envoye: 'badge-blue',
  accepte: 'badge-green',
  refuse: 'badge-red',
}

export default function DevisList() {
  const navigate = useNavigate()
  const [devis, setDevis] = useState<Devis[]>([])

  useEffect(() => {
    setDevis(devisDb.all())
  }, [])

  return (
    <Layout
      title="Devis"
      right={
        <button className="icon-btn" onClick={() => navigate('/devis/new')} aria-label="Nouveau devis">
          ＋
        </button>
      }
    >
      {devis.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🧾</span>
          Aucun devis. Crée ton premier devis avec le bouton ＋.
        </div>
      ) : (
        devis.map((d) => {
          const { totalTTC } = devisTotals(d)
          return (
            <button key={d.id} className="list-row" onClick={() => navigate(`/devis/${d.id}`)}>
              <span className="row-bar" />
              <div className="row-main">
                <div className="row-title">{d.numero}</div>
                <div className="row-sub">
                  {d.titre} · {formatDateLong(d.date)}
                </div>
                <div className="row-meta">
                  <span className={`badge ${STATUS_BADGE[d.status]}`}>
                    {DEVIS_STATUS_LABELS[d.status]}
                  </span>
                  <span className="badge badge-gray">{formatCHF(totalTTC)} TTC</span>
                </div>
              </div>
              <span className="row-chevron">›</span>
            </button>
          )
        })
      )}

      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/devis/new')}>
        ＋ Nouveau devis
      </button>
    </Layout>
  )
}
