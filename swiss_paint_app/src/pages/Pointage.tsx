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
import { heuresHebdo } from '../lib/rh'

type Period = 'jour' | 'semaine' | 'mois'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

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
  const [weekCursor, setWeekCursor] = useState(() => new Date(startOfWeek(new Date())))
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

  // ----- Historique hebdomadaire (Effectué / Prévu / Écart par jour) -----
  const weekBase = heuresHebdo(user) // base contractuelle (42h × taux par défaut)
  const dailyTarget = Math.round((weekBase / 5) * 100) / 100 // réparti lun–ven
  const week = useMemo(() => {
    const start = new Date(weekCursor)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = ymd(d)
      const dayEntries = entries.filter((e) => ymd(new Date(e.clockIn)) === key)
      const effectue = dayEntries.reduce((s, e) => s + entryWorkedHours(e), 0)
      const isWeekday = d.getDay() !== 0 && d.getDay() !== 6
      const prevu = isWeekday ? dailyTarget : 0
      return { date: d, pointages: dayEntries.length, effectue, prevu, ecart: effectue - prevu }
    })
    const totEff = days.reduce((s, x) => s + x.effectue, 0)
    const totPrev = days.reduce((s, x) => s + x.prevu, 0)
    return { days, totEff, totPrev, totEcart: totEff - totPrev }
  }, [entries, weekCursor, dailyTarget])

  const shiftWeek = (delta: number) => {
    const d = new Date(weekCursor)
    d.setDate(d.getDate() + delta * 7)
    setWeekCursor(d)
  }
  const weekLabel = `${week.days[0].date.getDate()}/${week.days[0].date.getMonth() + 1} – ${week.days[6].date.getDate()}/${week.days[6].date.getMonth() + 1}`
  const todayKey = ymd(new Date())

  // ----- Export CSV -----
  function exportCsv() {
    downloadTimesheetCsv(entries, taskName, `fiche-heures-${user?.username || 'ouvrier'}.csv`)
  }

  const onBreak = open ? isOnBreak(open) : false

  return (
    <Layout title="Timbrage" wide>
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

      {/* Historique hebdomadaire : Effectué / Prévu / Écart par jour */}
      <div className="rh-toolbar" style={{ marginTop: 18 }}>
        <div className="section-title" style={{ margin: 0 }}>
          Historique · base {hoursToHM(weekBase)}/sem.
        </div>
        <div className="rh-nav">
          <button onClick={() => shiftWeek(-1)} aria-label="Semaine précédente">‹</button>
          <span className="rh-nav-label">Semaine du {weekLabel}</span>
          <button onClick={() => shiftWeek(1)} aria-label="Semaine suivante">›</button>
          <button onClick={() => setWeekCursor(new Date(startOfWeek(new Date())))}>Aujourd'hui</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table className="rh-table">
          <thead>
            <tr>
              <th>Jour</th>
              <th className="r">Pointages</th>
              <th className="r">Effectué</th>
              <th className="r">Prévu</th>
              <th className="r">Écart</th>
            </tr>
          </thead>
          <tbody>
            {week.days.map((d) => {
              const isToday = ymd(d.date) === todayKey
              return (
                <tr key={d.date.toISOString()} className={isToday ? 'today' : ''}>
                  <td>
                    {DAY_NAMES[d.date.getDay()]} {d.date.getDate()}/{d.date.getMonth() + 1}
                  </td>
                  <td className="r">{d.pointages || '—'}</td>
                  <td className="r">{hoursToHM(d.effectue)}</td>
                  <td className="r">{hoursToHM(d.prevu)}</td>
                  <td className="r" style={{ color: d.ecart >= 0 ? 'var(--sp-success)' : 'var(--sp-red)', fontWeight: 600 }}>
                    {d.ecart >= 0 ? '+' : ''}
                    {hoursToHM(d.ecart)}
                  </td>
                </tr>
              )
            })}
            <tr style={{ fontWeight: 700 }}>
              <td>Total semaine</td>
              <td className="r">—</td>
              <td className="r">{hoursToHM(week.totEff)}</td>
              <td className="r">{hoursToHM(week.totPrev)}</td>
              <td className="r" style={{ color: week.totEcart >= 0 ? 'var(--sp-success)' : 'var(--sp-red)' }}>
                {week.totEcart >= 0 ? '+' : ''}
                {hoursToHM(week.totEcart)}
              </td>
            </tr>
          </tbody>
        </table>
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
