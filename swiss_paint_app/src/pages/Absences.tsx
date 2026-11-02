import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { absencesDb, usersDb, uid } from '../data/db'
import type { Absence, AbsenceType } from '../types'
import { formatDate } from '../lib/utils'
import {
  ABSENCE_TYPE_LABELS,
  ABSENCE_STATUS_LABELS,
  statusBadgeClass,
  countBusinessDays,
  droitVacances,
  vacancesPrises,
  vacancesEnAttente,
} from '../lib/rh'

export default function Absences() {
  const { user, isAdmin, isRh } = useAuth()
  const canManage = isAdmin || isRh
  const [tab, setTab] = useState<'mes' | 'equipe'>('mes')
  const [showForm, setShowForm] = useState(false)
  const [, setTick] = useState(0)
  const reload = () => setTick((t) => t + 1)

  const mine = useMemo(() => (user ? absencesDb.forUser(user.id) : []), [user, showForm])
  const all = useMemo(() => absencesDb.all(), [showForm, tab])
  const userName = (id: string) => {
    const u = usersDb.byId(id)
    return u ? `${u.prenom} ${u.nom}`.trim() || u.username : 'Employé'
  }

  const droit = droitVacances(user)
  const pris = vacancesPrises(mine)
  const attente = vacancesEnAttente(mine)
  const restant = Math.max(0, Math.round((droit - pris) * 10) / 10)

  function decide(a: Absence, status: 'approuve' | 'refuse') {
    // Séparation des tâches : on ne valide pas sa propre demande
    if (!user || a.userId === user.id) return
    absencesDb.update({ ...a, status, decisionBy: user.id })
    reload()
  }

  const teamPending = all.filter((a) => a.status === 'en_attente')

  return (
    <Layout title="Absences" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints RH</div>
          <h2>Absences et vacances</h2>
          <div className="rh-sub">Demandes, soldes et calendrier de l'équipe</div>
        </div>
        <button className="btn btn-dark btn-sm" onClick={() => setShowForm(true)}>
          + Nouvelle demande
        </button>
      </div>

      <div className="rh-stats">
        <div className="rh-stat accent">
          <div className="rh-stat-label">Solde restant</div>
          <div className="rh-stat-value">{restant} j</div>
          <div className="rh-stat-foot">Année {new Date().getFullYear()}</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">Droit annuel</div>
          <div className="rh-stat-value">{droit} j</div>
          <div className="rh-stat-foot">Au prorata du taux d'activité</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">Jours pris</div>
          <div className="rh-stat-value">{pris} j</div>
          <div className="rh-stat-foot">Vacances approuvées</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">En attente</div>
          <div className="rh-stat-value">{attente} j</div>
          <div className="rh-stat-foot">Demandes non traitées</div>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'mes' ? 'active' : ''} onClick={() => setTab('mes')}>
          Mes demandes
        </button>
        <button className={tab === 'equipe' ? 'active' : ''} onClick={() => setTab('equipe')}>
          {canManage ? `À valider${teamPending.length ? ` (${teamPending.length})` : ''}` : "Calendrier de l'équipe"}
        </button>
      </div>

      {tab === 'mes' ? (
        mine.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">🌴</span>
            Vous n'avez encore fait aucune demande.
          </div>
        ) : (
          <AbsenceTable rows={mine} />
        )
      ) : (
        <TeamView
          rows={canManage ? all : all.filter((a) => a.status === 'approuve')}
          userName={userName}
          isAdmin={canManage}
          selfId={user?.id}
          onDecide={decide}
        />
      )}

      {showForm && user && (
        <NewAbsenceForm
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            absencesDb.create({
              id: uid('abs'),
              userId: user.id,
              status: 'en_attente',
              createdAt: new Date().toISOString(),
              ...data,
            })
            setShowForm(false)
          }}
        />
      )}
    </Layout>
  )
}

function AbsenceTable({ rows }: { rows: Absence[] }) {
  return (
    <table className="rh-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Période</th>
          <th className="r">Jours</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <tr key={a.id}>
            <td>{ABSENCE_TYPE_LABELS[a.type]}</td>
            <td>
              {formatDate(a.dateDebut)} → {formatDate(a.dateFin)}
              {a.motif && <div className="muted" style={{ fontSize: 12 }}>{a.motif}</div>}
            </td>
            <td className="r">{a.jours}</td>
            <td>
              <span className={`badge ${statusBadgeClass(a.status)}`}>
                {ABSENCE_STATUS_LABELS[a.status]}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TeamView({
  rows,
  userName,
  isAdmin,
  selfId,
  onDecide,
}: {
  rows: Absence[]
  userName: (id: string) => string
  isAdmin: boolean
  selfId?: string
  onDecide: (a: Absence, s: 'approuve' | 'refuse') => void
}) {
  if (rows.length === 0) {
    return (
      <div className="empty">
        <span className="empty-icon">📅</span>
        Aucune absence à afficher.
      </div>
    )
  }
  return (
    <table className="rh-table">
      <thead>
        <tr>
          <th>Employé</th>
          <th>Type</th>
          <th>Période</th>
          <th className="r">Jours</th>
          <th>{isAdmin ? 'Action' : 'Statut'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <tr key={a.id}>
            <td>{userName(a.userId)}</td>
            <td>{isAdmin || a.userId === selfId ? ABSENCE_TYPE_LABELS[a.type] : 'Absent'}</td>
            <td>
              {formatDate(a.dateDebut)} → {formatDate(a.dateFin)}
            </td>
            <td className="r">{a.jours}</td>
            <td>
              {isAdmin && a.status === 'en_attente' && a.userId !== selfId ? (
                <div className="btn-row" style={{ gap: 6 }}>
                  <button className="btn btn-success btn-sm" onClick={() => onDecide(a, 'approuve')}>
                    ✓
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => onDecide(a, 'refuse')}>
                    ✕
                  </button>
                </div>
              ) : (
                <span className={`badge ${statusBadgeClass(a.status)}`}>
                  {ABSENCE_STATUS_LABELS[a.status]}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function NewAbsenceForm({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (data: { type: AbsenceType; dateDebut: string; dateFin: string; jours: number; motif?: string }) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState<AbsenceType>('vacances')
  const [debut, setDebut] = useState(today)
  const [fin, setFin] = useState(today)
  const [motif, setMotif] = useState('')
  const jours = countBusinessDays(debut, fin)

  return (
    <div className="rh-modal-backdrop" onClick={onClose}>
      <div className="rh-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Nouvelle demande d'absence</h3>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as AbsenceType)}>
            {Object.entries(ABSENCE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Du</label>
          <input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
        </div>
        <div className="field">
          <label>Au</label>
          <input type="date" value={fin} min={debut} onChange={(e) => setFin(e.target.value)} />
        </div>
        <div className="field">
          <label>Motif (facultatif)</label>
          <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Précisez si besoin…" />
        </div>
        <div className="info-msg" style={{ marginBottom: 14 }}>
          {jours > 0 ? `${jours} jour${jours > 1 ? 's' : ''} ouvré${jours > 1 ? 's' : ''} demandé${jours > 1 ? 's' : ''}.` : 'Sélectionnez une période valide.'}
        </div>
        <div className="btn-row">
          <button className="btn btn-outline" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            disabled={jours <= 0}
            onClick={() => onSave({ type, dateDebut: debut, dateFin: fin, jours, motif: motif.trim() || undefined })}
          >
            Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  )
}
