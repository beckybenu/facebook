import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { timeDb, absencesDb, annoncesDb, uid } from '../data/db'
import type { TimeEntry } from '../types'
import {
  entryWorkedMs,
  entryWorkedHours,
  msToHM,
  hoursToHM,
  formatTime,
  formatDate,
  startOfDay,
  startOfWeek,
} from '../lib/utils'
import { heuresHebdo, droitVacances, vacancesPrises, tauxActivite } from '../lib/rh'

export default function TableauBord() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState<TimeEntry | null>(null)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [, setTick] = useState(0)

  function reload() {
    if (!user) return
    setOpen(timeDb.openForUser(user.id) ?? null)
    setEntries(timeDb.forUser(user.id))
  }
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Chrono en direct tant qu'un pointage est ouvert
  useEffect(() => {
    if (!open) return
    const i = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [open])

  const stats = useMemo(() => {
    const todayFrom = startOfDay(new Date())
    const weekFrom = startOfWeek(new Date())
    const todayWorked = entries
      .filter((e) => new Date(e.clockIn).getTime() >= todayFrom)
      .reduce((s, e) => s + entryWorkedHours(e), 0)
    const weekWorked = entries
      .filter((e) => new Date(e.clockIn).getTime() >= weekFrom)
      .reduce((s, e) => s + entryWorkedHours(e), 0)
    const target = heuresHebdo(user)
    const dailyTarget = Math.round((target / 5) * 100) / 100
    const droit = droitVacances(user)
    const pris = user ? vacancesPrises(absencesDb.forUser(user.id)) : 0
    return {
      todayWorked,
      weekWorked,
      target,
      dailyTarget,
      solde: weekWorked - target,
      vacancesRestantes: Math.max(0, Math.round((droit - pris) * 10) / 10),
      taux: tauxActivite(user),
    }
  }, [entries, user, open])

  const annonces = useMemo(() => annoncesDb.all().slice(0, 3), [])

  function clockIn() {
    if (!user) return
    timeDb.create({ id: uid('te'), userId: user.id, clockIn: new Date().toISOString(), breaks: [] })
    reload()
  }
  function clockOut() {
    if (!open) return
    timeDb.update({ ...open, clockOut: new Date().toISOString() })
    reload()
  }

  const soldePos = stats.solde >= 0

  return (
    <Layout title="Tableau de bord" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints RH</div>
          <h2>Bonjour, {user?.prenom} 👋</h2>
          <div className="rh-sub">Votre journée en un coup d'œil</div>
        </div>
      </div>

      <div className="rh-dash">
        {/* Carte pointage */}
        <div className="rh-clock-card">
          <div className="rh-clock-left">
            <div className="rh-clock-status">{open ? 'En service' : 'Pas en service'}</div>
            <div className="rh-clock-time">{open ? msToHM(entryWorkedMs(open)) : '-- : -- : --'}</div>
            {open && <div className="muted">Depuis {formatTime(open.clockIn)}</div>}
          </div>
          <div className="rh-clock-action">
            {open ? (
              <button className="btn btn-dark" onClick={clockOut}>⏹️ Départ</button>
            ) : (
              <button className="btn btn-success" onClick={clockIn}>→] Arrivée</button>
            )}
          </div>
          <div className="rh-clock-foot">
            <div>
              <span className="muted">Aujourd'hui</span>
              <strong>{hoursToHM(stats.todayWorked)} / {hoursToHM(stats.dailyTarget)}</strong>
            </div>
            <div>
              <span className="muted">Semaine</span>
              <strong>{hoursToHM(stats.weekWorked)} / {hoursToHM(stats.target)}</strong>
            </div>
            <div>
              <span className="muted">Solde d'heures</span>
              <strong className={soldePos ? 'pos' : 'neg'}>
                {soldePos ? '+' : ''}{hoursToHM(stats.solde)}
              </strong>
            </div>
          </div>
        </div>

        {/* Stats à droite */}
        <div className="rh-dash-stats">
          <div className="rh-stat">
            <div className="rh-stat-label">Solde d'heures</div>
            <div className={`rh-stat-value ${soldePos ? 'pos' : 'neg'}`}>
              {soldePos ? '+' : ''}{hoursToHM(stats.solde)}
            </div>
            <div className="rh-stat-foot">Cette semaine, heures sup. incluses</div>
          </div>
          <div className="rh-stat">
            <div className="rh-stat-label">Vacances restantes</div>
            <div className="rh-stat-value">{stats.vacancesRestantes} j</div>
            <div className="rh-stat-foot">Sur {droitVacances(user)} j/an</div>
          </div>
          <div className="rh-stat">
            <div className="rh-stat-label">Cette semaine</div>
            <div className="rh-stat-value">{hoursToHM(stats.weekWorked)}</div>
            <div className="rh-stat-foot">sur {hoursToHM(stats.target)} prévues</div>
          </div>
          <div className="rh-stat">
            <div className="rh-stat-label">Taux d'activité</div>
            <div className="rh-stat-value">{stats.taux} %</div>
            <div className="rh-stat-foot">Contrat en vigueur</div>
          </div>
        </div>
      </div>

      {/* Bas : prochains horaires + dernières annonces */}
      <div className="rh-dash-bottom">
        <div>
          <div className="rh-dash-head">
            <h3>Mes prochains horaires</h3>
            <button className="link" onClick={() => navigate('/planning')}>Planning →</button>
          </div>
          <div className="empty" style={{ marginTop: 0 }}>
            <span className="empty-icon">📅</span>
            Aucun horaire planifié pour les prochains jours.
          </div>
        </div>

        <div>
          <div className="rh-dash-head">
            <h3>Dernières annonces</h3>
            <button className="link" onClick={() => navigate('/annonces')}>Tableau blanc →</button>
          </div>
          {annonces.length === 0 ? (
            <div className="empty" style={{ marginTop: 0 }}>
              <span className="empty-icon">📌</span>
              Aucune annonce.
            </div>
          ) : (
            annonces.map((a) => (
              <div key={a.id} className={`rh-note ${a.epingle ? 'pinned' : ''}`} style={{ marginBottom: 10 }}>
                {a.epingle && <span className="rh-pin">📌</span>}
                <h4>{a.titre}</h4>
                <p>{a.contenu}</p>
                <div className="rh-note-meta">{a.auteurNom} · {formatDate(a.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
