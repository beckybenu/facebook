import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { usersDb, timeDb, absencesDb, tasksDb } from '../data/db'
import type { User } from '../types'
import { entryWorkedHours, hoursToHM, startOfWeek } from '../lib/utils'
import { ABSENCE_TYPE_LABELS } from '../lib/rh'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function fmtDay(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}`
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function Planning() {
  const { user, isAdmin, isRh } = useAuth()
  const canSeeAbsenceType = isAdmin || isRh
  const [weekStart, setWeekStart] = useState(() => new Date(startOfWeek(new Date())))

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  const team = useMemo<User[]>(
    () => usersDb.all().filter((u) => u.role === 'ouvrier' || u.role === 'admin'),
    [],
  )
  const entries = useMemo(() => timeDb.all(), [])
  const absences = useMemo(() => absencesDb.all().filter((a) => a.status === 'approuve'), [])
  const taskName = (id?: string) => (id ? tasksDb.byId(id)?.name : undefined)

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
  }

  const today = new Date()
  const weekLabel = `${fmtDay(days[0])} – ${fmtDay(days[6])}`

  function cellFor(u: User, day: Date) {
    const absence = absences.find((a) => {
      if (a.userId !== u.id) return false
      const start = new Date(a.dateDebut + 'T00:00:00')
      const end = new Date(a.dateFin + 'T23:59:59')
      return day >= start && day <= end
    })
    const dayEntries = entries.filter(
      (e) => e.userId === u.id && sameDay(new Date(e.clockIn), day),
    )
    return { absence, dayEntries }
  }

  return (
    <Layout title="Planning" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints RH</div>
          <h2>Planning des équipes</h2>
          <div className="rh-sub">Pointages réalisés et absences de la semaine</div>
        </div>
        <div className="rh-nav">
          <button onClick={() => shiftWeek(-1)} aria-label="Semaine précédente">‹</button>
          <span className="rh-nav-label">Semaine du {weekLabel}</span>
          <button onClick={() => shiftWeek(1)} aria-label="Semaine suivante">›</button>
          <button onClick={() => setWeekStart(new Date(startOfWeek(new Date())))}>Cette semaine</button>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">📅</span>
          Aucun employé à planifier.
        </div>
      ) : (
        <div className="rh-planning">
          <table>
            <thead>
              <tr>
                <th className="rh-person">Équipe</th>
                {days.map((d, i) => (
                  <th key={i} className={sameDay(d, today) ? 'today' : ''}>
                    {DAY_LABELS[i]}
                    <br />
                    {fmtDay(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((u) => (
                <tr key={u.id}>
                  <td className="rh-person">
                    {`${u.prenom} ${u.nom}`.trim() || u.username}
                    <small>{u.titre || (u.role === 'admin' ? 'Direction' : 'Employé')}{u.id === user?.id ? ' · vous' : ''}</small>
                  </td>
                  {days.map((d, i) => {
                    const { absence, dayEntries } = cellFor(u, d)
                    const total = dayEntries.reduce((s, e) => s + entryWorkedHours(e), 0)
                    return (
                      <td key={i} className={sameDay(d, today) ? 'today' : ''}>
                        {absence && (
                          <span className="rh-chip" style={{ background: '#6b7280' }}>
                            {canSeeAbsenceType || u.id === user?.id
                              ? ABSENCE_TYPE_LABELS[absence.type]
                              : 'Absent'}
                          </span>
                        )}
                        {dayEntries.map((e) => (
                          <span key={e.id} className="rh-chip">
                            {taskName(e.taskId) || 'Chantier'}
                            <small>{hoursToHM(entryWorkedHours(e))}</small>
                          </span>
                        ))}
                        {!absence && dayEntries.length > 0 && total > 0 && (
                          <div className="muted" style={{ fontSize: 11, textAlign: 'right' }}>
                            {hoursToHM(total)}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
