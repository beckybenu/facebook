import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { fraisDb, usersDb, uid } from '../data/db'
import type { NoteFrais } from '../types'
import { formatCHF, formatDate, fileToDataURL } from '../lib/utils'
import { FRAIS_STATUS_LABELS, FRAIS_CATEGORIES, statusBadgeClass } from '../lib/rh'

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

// N'autorise que des justificatifs images (data:) ou des URL https — évite
// qu'une valeur piégée (ex. javascript:) injectée via le backend ne s'exécute.
function isSafeJustificatif(url?: string): boolean {
  if (!url) return false
  return /^data:image\/(png|jpe?g|gif|webp|heic|heif);base64,/i.test(url) || /^https:\/\//i.test(url)
}

export default function NotesFrais() {
  const { user, isAdmin, isRh, isComptable } = useAuth()
  const canManage = isAdmin || isRh || isComptable
  const [cursor, setCursor] = useState(() => new Date())
  const [showForm, setShowForm] = useState(false)
  const [scope, setScope] = useState<'mes' | 'equipe'>('mes')
  const [, setTick] = useState(0)
  const reload = () => setTick((t) => t + 1)

  const list = useMemo(() => {
    const base = scope === 'equipe' && canManage ? fraisDb.all() : user ? fraisDb.forUser(user.id) : []
    return base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, scope, showForm])

  const mk = monthKey(cursor)
  const monthRows = list.filter((n) => monthKey(new Date(n.date)) === mk)

  const total = monthRows.filter((n) => n.status !== 'refuse').reduce((s, n) => s + n.montant, 0)
  const attente = monthRows.filter((n) => n.status === 'en_attente').reduce((s, n) => s + n.montant, 0)
  const rembourse = monthRows.filter((n) => n.status === 'rembourse').reduce((s, n) => s + n.montant, 0)

  const shiftMonth = (delta: number) => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + delta)
    setCursor(d)
  }
  const userName = (id: string) => {
    const u = usersDb.byId(id)
    return u ? `${u.prenom} ${u.nom}`.trim() || u.username : 'Employé'
  }

  function decide(n: NoteFrais, status: 'rembourse' | 'refuse') {
    // Séparation des tâches : on ne valide pas sa propre note de frais
    if (!user || n.userId === user.id) return
    fraisDb.update({ ...n, status, decisionBy: user.id })
    reload()
  }

  return (
    <Layout title="Notes de frais" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints RH</div>
          <h2>Notes de frais</h2>
          <div className="rh-sub">Saisissez vos frais avec le justificatif</div>
        </div>
        <button className="btn btn-dark btn-sm" onClick={() => setShowForm(true)}>
          + Nouvelle note
        </button>
      </div>

      <div className="rh-toolbar">
        <div className="rh-nav">
          <button onClick={() => shiftMonth(-1)} aria-label="Mois précédent">‹</button>
          <span className="rh-nav-label">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button onClick={() => shiftMonth(1)} aria-label="Mois suivant">›</button>
          <button onClick={() => setCursor(new Date())}>Aujourd'hui</button>
        </div>
        {canManage && (
          <div className="tabs" style={{ margin: 0 }}>
            <button className={scope === 'mes' ? 'active' : ''} onClick={() => setScope('mes')}>
              Mes notes
            </button>
            <button className={scope === 'equipe' ? 'active' : ''} onClick={() => setScope('equipe')}>
              Équipe
            </button>
          </div>
        )}
      </div>

      <div className="rh-stats cols-3">
        <div className="rh-stat accent">
          <div className="rh-stat-label">Mon total du mois</div>
          <div className="rh-stat-value">{formatCHF(total)}</div>
          <div className="rh-stat-foot">Hors notes refusées</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">En attente</div>
          <div className="rh-stat-value">{formatCHF(attente)}</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">Remboursé</div>
          <div className="rh-stat-value">{formatCHF(rembourse)}</div>
        </div>
      </div>

      {monthRows.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">💳</span>
          Aucune note de frais pour {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}.
        </div>
      ) : (
        <table className="rh-table">
          <thead>
            <tr>
              <th>Date</th>
              {scope === 'equipe' && canManage && <th>Employé</th>}
              <th>Catégorie</th>
              <th className="r">Montant</th>
              <th>Justif.</th>
              <th>{canManage ? 'Action' : 'Statut'}</th>
            </tr>
          </thead>
          <tbody>
            {monthRows.map((n) => (
              <tr key={n.id}>
                <td>{formatDate(n.date)}</td>
                {scope === 'equipe' && canManage && <td>{userName(n.userId)}</td>}
                <td>
                  {n.categorie}
                  {n.description && <div className="muted" style={{ fontSize: 12 }}>{n.description}</div>}
                </td>
                <td className="r">{formatCHF(n.montant)}</td>
                <td>
                  {isSafeJustificatif(n.justificatif) ? (
                    <a href={n.justificatif} target="_blank" rel="noreferrer" className="link" style={{ fontSize: 12 }}>
                      Voir
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {canManage && n.status === 'en_attente' && n.userId !== user?.id ? (
                    <div className="btn-row" style={{ gap: 6 }}>
                      <button className="btn btn-success btn-sm" onClick={() => decide(n, 'rembourse')}>✓</button>
                      <button className="btn btn-outline btn-sm" onClick={() => decide(n, 'refuse')}>✕</button>
                    </div>
                  ) : (
                    <span className={`badge ${statusBadgeClass(n.status)}`}>{FRAIS_STATUS_LABELS[n.status]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && user && (
        <NewFraisForm
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            fraisDb.create({
              id: uid('frais'),
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

function NewFraisForm({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (data: { date: string; categorie: string; montant: number; description?: string; justificatif?: string }) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [categorie, setCategorie] = useState(FRAIS_CATEGORIES[0])
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [justificatif, setJustificatif] = useState<string>('')
  const m = parseFloat(montant.replace(',', '.'))
  const valid = !isNaN(m) && m > 0

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setJustificatif(await fileToDataURL(f))
  }

  return (
    <div className="rh-modal-backdrop" onClick={onClose}>
      <div className="rh-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Nouvelle note de frais</h3>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Catégorie</label>
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {FRAIS_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Montant (CHF)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.05"
            min="0"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="field">
          <label>Description (facultatif)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détail de la dépense…" />
        </div>
        <div className="field">
          <label>Justificatif (photo du reçu)</label>
          <input type="file" accept="image/*" onChange={onFile} />
          {justificatif && <img src={justificatif} className="rh-receipt" alt="Justificatif" />}
        </div>
        <div className="btn-row">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onSave({ date, categorie, montant: Math.round(m * 100) / 100, description: description.trim() || undefined, justificatif: justificatif || undefined })}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
