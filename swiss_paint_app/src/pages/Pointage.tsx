import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { timeDb, tasksDb, uid } from '../data/db'
import type { TimeEntry, Task } from '../types'
import {
  getCurrentPosition,
  durationLabel,
  durationHours,
  formatDate,
  formatTime,
  mapsLink,
} from '../lib/utils'

export default function Pointage() {
  const { user } = useAuth()
  const [open, setOpen] = useState<TimeEntry | null>(null)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [, setTick] = useState(0) // pour rafraîchir le chrono en cours

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

  // Met à jour le compteur de temps en cours chaque seconde
  useEffect(() => {
    if (!open) return
    const i = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [open])

  async function handleClockIn() {
    if (!user) return
    setError('')
    setInfo('')
    setBusy(true)
    let lat: number | undefined
    let lng: number | undefined
    try {
      const pos = await getCurrentPosition()
      lat = pos.lat
      lng = pos.lng
    } catch {
      setInfo('Position non disponible — pointage enregistré sans géolocalisation.')
    }
    const entry: TimeEntry = {
      id: uid('te'),
      userId: user.id,
      taskId: selectedTask || undefined,
      clockIn: new Date().toISOString(),
      lat,
      lng,
    }
    timeDb.create(entry)
    setSelectedTask('')
    setBusy(false)
    reload()
  }

  function handleClockOut() {
    if (!open) return
    timeDb.update({ ...open, clockOut: new Date().toISOString() })
    reload()
  }

  const totalWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000
    return entries
      .filter((e) => e.clockOut && new Date(e.clockIn).getTime() >= weekAgo)
      .reduce((sum, e) => sum + durationHours(e.clockIn, e.clockOut), 0)
  }, [entries])

  const taskName = (id?: string) => tasks.find((t) => t.id === id)?.name || 'Sans chantier'
  const now = new Date()

  return (
    <Layout title="Temps de travail">
      <div className="card clock-card">
        <div className="muted">{formatDate(now.toISOString())}</div>
        {open ? (
          <>
            <div className="clock-time">{durationLabel(open.clockIn)}</div>
            <div className="clock-status">
              <span className="pulse-dot" />
              En cours depuis {formatTime(open.clockIn)} · {taskName(open.taskId)}
            </div>
            <button className="btn btn-dark" onClick={handleClockOut}>
              ⏹️ Arrêter le pointage
            </button>
          </>
        ) : (
          <>
            <div className="clock-time">--:--</div>
            <div className="clock-status muted">Vous n'êtes pas en train de pointer</div>

            {tasks.length > 0 && (
              <div className="field" style={{ textAlign: 'left' }}>
                <label>Chantier (optionnel)</label>
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
        {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}
        {info && <div className="info-msg" style={{ marginTop: 12 }}>{info}</div>}
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div className="card-sub">Total cette semaine</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {totalWeek.toFixed(1)} h
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="card-sub">Pointages</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{entries.length}</div>
        </div>
      </div>

      <div className="section-title">Fiche d'heures</div>
      {entries.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🕒</span>
          Aucun pointage pour le moment.
        </div>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {durationLabel(e.clockIn, e.clockOut)}
              </span>
            </div>
            {e.lat != null && e.lng != null && (
              <a
                className="link"
                style={{ fontSize: 12, display: 'inline-block', marginTop: 8 }}
                href={mapsLink(e.lat, e.lng)}
                target="_blank"
                rel="noreferrer"
              >
                📍 Voir la position du badge
              </a>
            )}
          </div>
        ))
      )}
    </Layout>
  )
}
