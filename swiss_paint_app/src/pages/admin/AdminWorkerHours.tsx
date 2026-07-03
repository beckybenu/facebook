import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import { timeDb, tasksDb, usersDb } from '../../data/db'
import { HR } from '../../lib/company'
import {
  entryWorkedHours,
  entryWorkedMs,
  entryBreakMs,
  hoursToHM,
  msToHM,
  formatDate,
  formatTime,
  startOfDay,
  startOfWeek,
  startOfMonth,
  downloadTimesheetCsv,
} from '../../lib/utils'

type Period = 'jour' | 'semaine' | 'mois'

function businessDaysThisMonth(): number {
  const now = new Date()
  let c = 0
  for (let d = 1; d <= now.getDate(); d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d).getDay()
    if (day !== 0 && day !== 6) c++
  }
  return c
}

export default function AdminWorkerHours() {
  const { userId } = useParams()
  const user = userId ? usersDb.byId(userId) : undefined
  const [period, setPeriod] = useState<Period>('semaine')
  const [refresh, setRefresh] = useState(0)

  const entries = useMemo(
    () => (userId ? timeDb.forUser(userId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, refresh],
  )
  const taskName = (id?: string) => tasksDb.byId(id || '')?.name || 'Sans chantier'

  const summary = useMemo(() => {
    const now = new Date()
    const from =
      period === 'jour' ? startOfDay(now) : period === 'semaine' ? startOfWeek(now) : startOfMonth(now)
    const inPeriod = entries.filter((e) => new Date(e.clockIn).getTime() >= from)
    const worked = inPeriod.reduce((s, e) => s + entryWorkedHours(e), 0)
    const target =
      period === 'jour'
        ? HR.dailyTargetHours
        : period === 'semaine'
          ? HR.weeklyTargetHours
          : HR.dailyTargetHours * businessDaysThisMonth()
    return { worked, target, diff: worked - target }
  }, [entries, period])

  function toggleValidated(id: string) {
    const e = timeDb.all().find((x) => x.id === id)
    if (e) {
      timeDb.update({ ...e, validated: !e.validated })
      setRefresh((r) => r + 1)
    }
  }

  if (!user) {
    return (
      <Layout title="Ouvrier" back nav={false}>
        <div className="empty">Ouvrier introuvable.</div>
      </Layout>
    )
  }

  return (
    <Layout
      title={`${user.prenom} ${user.nom}`}
      back
      nav={false}
      right={
        <button
          className="icon-btn"
          onClick={() =>
            downloadTimesheetCsv(entries, taskName, `heures-${user.username}.csv`)
          }
          aria-label="Export CSV"
        >
          ⬇️
        </button>
      }
    >
      <div className="tabs">
        <button className={period === 'jour' ? 'active' : ''} onClick={() => setPeriod('jour')}>
          Jour
        </button>
        <button className={period === 'semaine' ? 'active' : ''} onClick={() => setPeriod('semaine')}>
          Semaine
        </button>
        <button className={period === 'mois' ? 'active' : ''} onClick={() => setPeriod('mois')}>
          Mois
        </button>
      </div>

      <div className="card">
        <div className="kv">
          <span className="k">Travaillé</span>
          <span className="v">{hoursToHM(summary.worked)}</span>
        </div>
        <div className="kv">
          <span className="k">Objectif</span>
          <span className="v">{hoursToHM(summary.target)}</span>
        </div>
        <div className="kv">
          <span className="k" style={{ fontWeight: 700, color: 'var(--sp-black)' }}>
            {summary.diff >= 0 ? 'Heures supplémentaires' : 'Heures manquantes'}
          </span>
          <span
            className="v"
            style={{ color: summary.diff >= 0 ? 'var(--sp-success)' : 'var(--sp-red)', fontSize: 16 }}
          >
            {summary.diff >= 0 ? '+' : ''}
            {hoursToHM(summary.diff)}
          </span>
        </div>
      </div>

      <div className="section-title">Détail des pointages</div>
      {entries.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🕒</span>
          Aucun pointage.
        </div>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="card-title" style={{ fontSize: 15 }}>
                  {taskName(e.taskId)}
                </div>
                <div className="card-sub">
                  {formatDate(e.clockIn)} · {formatTime(e.clockIn)}
                  {e.clockOut ? ` – ${formatTime(e.clockOut)}` : ' – en cours'}
                </div>
              </div>
              <span className={`badge ${e.clockOut ? 'badge-gray' : 'badge-green'}`}>
                {msToHM(entryWorkedMs(e))}
              </span>
            </div>
            <div className="row-meta">
              {entryBreakMs(e) > 0 && (
                <span className="badge badge-amber">Pause {msToHM(entryBreakMs(e))}</span>
              )}
              {e.onSite != null && (
                <span className={`badge ${e.onSite ? 'badge-green' : 'badge-red'}`}>
                  {e.onSite ? 'Sur site' : 'Hors zone'}
                  {e.distanceM != null && ` ${e.distanceM}m`}
                </span>
              )}
            </div>
            {e.clockOut && (
              <button
                className={`btn btn-sm ${e.validated ? 'btn-outline' : 'btn-success'}`}
                style={{ marginTop: 10 }}
                onClick={() => toggleValidated(e.id)}
              >
                {e.validated ? '✓ Validé — annuler' : 'Valider ces heures'}
              </button>
            )}
          </div>
        ))
      )}
    </Layout>
  )
}
