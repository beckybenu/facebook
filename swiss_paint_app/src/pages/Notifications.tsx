import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { notifDb } from '../data/db'
import type { Notification, NotifType } from '../types'
import { formatDateTime } from '../lib/utils'

const ICON: Record<NotifType, string> = {
  chantier: '🏗️',
  annonce: '📌',
  absence: '🌴',
  frais: '💳',
  info: 'ℹ️',
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  const reload = () => setTick((t) => t + 1)

  const list = useMemo(() => (user ? notifDb.forUser(user.id) : []), [user])

  // Marque tout comme lu à l'ouverture de l'écran
  useEffect(() => {
    if (user) {
      notifDb.markAllRead(user.id)
      window.dispatchEvent(new Event('sp:refresh'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function open(n: Notification) {
    if (!n.lu) {
      notifDb.update({ ...n, lu: true })
    }
    if (n.lien) navigate(n.lien)
  }
  function removeOne(e: React.MouseEvent, n: Notification) {
    e.stopPropagation()
    notifDb.remove(n.id)
    reload()
  }

  return (
    <Layout title="Notifications" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints</div>
          <h2>Mes notifications</h2>
          <div className="rh-sub">Chantiers, annonces et informations vous concernant</div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🔔</span>
          Aucune notification.
        </div>
      ) : (
        list.map((n) => (
          <button
            key={n.id}
            className={`notif-row ${n.lu ? '' : 'unread'}`}
            onClick={() => open(n)}
          >
            <span className="notif-icon">{ICON[n.type]}</span>
            <div className="notif-main">
              <div className="notif-title">{n.titre}</div>
              {n.message && <div className="notif-msg">{n.message}</div>}
              <div className="notif-time">{formatDateTime(n.createdAt)}</div>
            </div>
            {n.lien && <span className="row-chevron">›</span>}
            <span className="notif-del" onClick={(e) => removeOne(e, n)} aria-label="Supprimer">✕</span>
          </button>
        ))
      )}
    </Layout>
  )
}
