import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { timeDb, tasksDb, uid } from '../data/db'
import type { TimeEntry, Task } from '../types'
import { HR } from '../lib/company'
import {
  getCurrentPosition,
  haversineM,
  entryWorkedMs,
  entryWorkedHours,
  entryBreakMs,
  isOnBreak,
  msToHM,
  hoursToHM,
  formatDate,
  formatTime,
  mapsLink,
  startOfDay,
  startOfWeek,
  startOfMonth,
  downloadTimesheetCsv,
} from '../lib/utils'

type Period = 'jour' | 'semaine' | 'mois'

// Nombre de jours ouvrés (lun–ven) écoulés dans le mois jusqu'à aujourd'hui
function businessDaysThisMonth(): number {
  const now = new Date()
  let count = 0
  for (let d = 1; d <= now.getDate(); d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d).getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

export default function Pointage() {
  const { user } = useAuth()
  const [open, setOpen] = useState<TimeEntry | null>(null)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')
  const [period, setPeriod] = useState<Period>('jour')
  const [, setTick] = useState(0)

  function reload() {
    if (!user) return
    setOpen(timeDb.openForUser(user.id) ?? null)
    setEntries(timeDb.forUser(user.id))
  }

  useEffect(() => {
    if (!user) return
    reload()
    setTasks(user.role === 'admin' ? tasksDb.all() : tasksDb.forUser(user.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Rafraîchit le chrono tant qu'un pointage est ouvert
  useEffect(() => {
    if (!open) return
    const i = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [open])

  const taskById = (id?: string) => tasks.find((t) => t.id === id)
  const taskName = (id?: string) => taskById(id)?.name || 'Sans chantier'

  async function handleClockIn() {
    if (!user) return
    setInfo('')
    setBusy(true)
    let lat: number | undefined
    let lng: number | undefined
    let distanceM: number | undefined
    let onSite: boolean | undefined
    try {
      const pos = await getCurrentPosition()
      lat = pos.lat
      lng = pos.lng
      const t = taskById(selectedTask)
      if (t?.lat != null && t?.lng != null) {
        distanceM = haversineM(lat, lng, t.lat, t.lng)
        onSite = distanceM <= HR.onSiteRadiusM
      }
    } catch {
      setInfo('Position non disponible — pointage enregistré sans géolocalisation.')
    }
    timeDb.create({
      id: uid('te'),
      userId: user.id,
      taskId: selectedTask || undefined,
      clockIn: new Date().toISOString(),
      lat,
      lng,
      distanceM,
      onSite,
      breaks: [],
    })
    setSelectedTask('')
    setBusy(false)
    reload()
  }

  function toggleBreak() {
    if (!open) return
    const breaks = [...(open.breaks || [])]
    const openBreak = breaks.find((b) => !b.end)
    if (openBreak) {
      openBreak.end = new Date().toISOString() // reprendre
    } else {
      breaks.push({ start: new Date().toISOString() }) // mettre en pause
    }
    timeDb.update({ ...open, breaks })
    reload()
  }

  function handleClockOut() {
    if (!open) return
    // Ferme une éventuelle pause en cours
    const breaks = (open.breaks || []).map((b) => (b.end ? b : { ...b, end: new Date().toISOString() }))
    timeDb.update({ ...open, breaks, clockOut: new Date().toISOString() })
    reload()
  }

  // ----- Récapitulatifs -----
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
    return { worked, target, diff: worked - target, count: inPeriod.length }
  }, [entries, period])

  // ----- Export CSV -----
  function exportCsv() {
    downloadTimesheetCsv(entries, taskName, `fiche-heures-${user?.username || 'ouvrier'}.csv`)
  }

  const onBreak = open ? isOnBreak(open) : false

  return (
    <Layout title="Temps de travail">
      {/* Carte de pointage */}
      <div className="card clock-card">
        <div className="muted">{formatDate(new Date().toISOString())}</div>
        {open ? (
          <>
            <div className="clock-time">{msToHM(entryWorkedMs(open))}</div>
            <div className="clock-status">
              {onBreak ? (
                <span className="badge badge-amber">⏸️ En pause</span>
              ) : (
                <>
                  <span className="pulse-dot" />
                  En cours depuis {formatTime(open.clockIn)}
                </>
              )}
              <div className="muted" style={{ marginTop: 6 }}>
                {taskName(open.taskId)}
                {entryBreakMs(open) > 0 && <> · pause {msToHM(entryBreakMs(open))}</>}
              </div>
              {open.onSite != null && (
                <div style={{ marginTop: 6 }}>
                  <span className={`badge ${open.onSite ? 'badge-green' : 'badge-red'}`}>
                    {open.onSite ? '📍 Sur le chantier' : '⚠️ Hors zone'}
                    {open.distanceM != null && ` (${open.distanceM} m)`}
                  </span>
                </div>
              )}
            </div>
            <div className="btn-row">
              <button className="btn btn-outline" onClick={toggleBreak}>
                {onBreak ? '▶️ Reprendre' : '⏸️ Pause'}
              </button>
              <button className="btn btn-dark" onClick={handleClockOut}>
                ⏹️ Arrêter
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="clock-time">--:--</div>
            <div className="clock-status muted">Vous n'êtes pas en train de pointer</div>
            {tasks.length > 0 && (
              <div className="field" style={{ textAlign: 'left' }}>
                <label>Chantier (recommandé pour le contrôle de présence)</label>
                <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                  <option value="">— Aucun —</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button className="btn btn-success" onClick={handleClockIn} disabled={busy}>
              {busy ? 'Localisation…' : '▶️ Commencer le pointage'}
            </button>
          </>
        )}
        {info && <div className="info-msg" style={{ marginTop: 12 }}>{info}</div>}
      </div>

      {/* Récapitulatif jour / semaine / mois */}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title" style={{ margin: '18px 2px 8px' }}>
          Fiche d'heures
        </div>
        {entries.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={exportCsv}>
            ⬇️ Export CSV
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🕒</span>
          Aucun pointage pour le moment.
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
              {e.validated && <span className="badge badge-blue">✓ Validé</span>}
              {e.lat != null && e.lng != null && (
                <a className="link" style={{ fontSize: 12 }} href={mapsLink(e.lat, e.lng)} target="_blank" rel="noreferrer">
                  📍 Position
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </Layout>
  )
}
