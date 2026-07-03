import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { timeDb, tasksDb, usersDb } from '../../data/db'
import type { TimeEntry, User } from '../../types'
import {
  entryWorkedHours,
  isOnBreak,
  hoursToHM,
  msToHM,
  entryWorkedMs,
  formatTime,
  startOfWeek,
  startOfMonth,
} from '../../lib/utils'

export default function AdminPointages() {
  const navigate = useNavigate()
  const [, setTick] = useState(0)

  // Rafraîchit toutes les 5 s pour un suivi « en direct »
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(i)
  }, [])

  const ouvriers = useMemo(
    () => usersDb.all().filter((u) => u.role === 'ouvrier' || u.role === 'admin'),
    [],
  )
  const allEntries = timeDb.all()
  const taskName = (id?: string) => tasksDb.byId(id || '')?.name || 'Sans chantier'

  const openEntries = allEntries.filter((e) => !e.clockOut)
  const userById = (id: string) => ouvriers.find((u) => u.id === id)

  const weekFrom = startOfWeek(new Date())
  const monthFrom = startOfMonth(new Date())

  function totals(u: User) {
    const es = allEntries.filter((e) => e.userId === u.id)
    const week = es
      .filter((e) => new Date(e.clockIn).getTime() >= weekFrom)
      .reduce((s, e) => s + entryWorkedHours(e), 0)
    const month = es
      .filter((e) => new Date(e.clockIn).getTime() >= monthFrom)
      .reduce((s, e) => s + entryWorkedHours(e), 0)
    const openE = es.find((e) => !e.clockOut)
    return { week, month, openE }
  }

  return (
    <Layout title="Suivi des heures" back>
      {/* En ce moment */}
      <div className="section-title" style={{ marginTop: 4 }}>
        En ce moment ({openEntries.length})
      </div>
      {openEntries.length === 0 ? (
        <div className="card muted" style={{ textAlign: 'center' }}>
          Aucun ouvrier en train de pointer.
        </div>
      ) : (
        openEntries.map((e: TimeEntry) => {
          const u = userById(e.userId)
          const onBreak = isOnBreak(e)
          return (
            <div key={e.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="card-title" style={{ fontSize: 15 }}>
                    {u ? `${u.prenom} ${u.nom}` : 'Ouvrier'}
                  </div>
                  <div className="card-sub">
                    {taskName(e.taskId)} · depuis {formatTime(e.clockIn)}
                  </div>
                </div>
                <span className={`badge ${onBreak ? 'badge-amber' : 'badge-green'}`}>
                  {onBreak ? '⏸️ Pause' : msToHM(entryWorkedMs(e))}
                </span>
              </div>
              {e.onSite != null && (
                <div className="row-meta">
                  <span className={`badge ${e.onSite ? 'badge-green' : 'badge-red'}`}>
                    {e.onSite ? '📍 Sur le chantier' : '⚠️ Hors zone'}
                    {e.distanceM != null && ` (${e.distanceM} m)`}
                  </span>
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Par ouvrier */}
      <div className="section-title">Par ouvrier</div>
      {ouvriers.map((u) => {
        const t = totals(u)
        return (
          <button
            key={u.id}
            className="list-row"
            onClick={() => navigate(`/admin/pointages/${u.id}`)}
          >
            <div className="avatar">{`${u.prenom[0] ?? ''}${u.nom[0] ?? ''}`.toUpperCase()}</div>
            <div className="row-main">
              <div className="row-title">
                {u.prenom} {u.nom}
              </div>
              <div className="row-sub">
                Semaine {hoursToHM(t.week)} · Mois {hoursToHM(t.month)}
              </div>
            </div>
            {t.openE ? (
              <span className="badge badge-green">En cours</span>
            ) : (
              <span className="row-chevron">›</span>
            )}
          </button>
        )
      })}

      <div className="muted" style={{ fontSize: 12, marginTop: 14, textAlign: 'center' }}>
        Mise à jour automatique toutes les 5 s.
      </div>
    </Layout>
  )
}
