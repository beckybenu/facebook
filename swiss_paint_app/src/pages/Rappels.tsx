import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { rappelsDb, usersDb, uid } from '../data/db'
import type { Rappel, RappelType } from '../types'
import { formatDate } from '../lib/utils'

const TYPE_LABELS: Record<RappelType, string> = {
  tellco: 'Tellco / LPP',
  lpp: 'LPP (2ᵉ pilier)',
  assurance: 'Assurance',
  controle_technique: 'Contrôle technique',
  contrat: 'Contrat / échéance',
  autre: 'Autre',
}

function joursRestants(iso: string): number {
  return Math.ceil((new Date(iso + 'T00:00:00').getTime() - Date.now()) / 86400000)
}

export default function Rappels() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [, setTick] = useState(0)
  const reload = () => setTick((t) => t + 1)

  const list = useMemo(() => rappelsDb.all(), [showForm])
  const userName = (id?: string) => {
    if (!id) return 'Toute l’entreprise'
    const u = usersDb.byId(id)
    return u ? `${u.prenom} ${u.nom}`.trim() || u.username : 'Inconnu'
  }
  const employees = useMemo(() => usersDb.all().filter((u) => u.role !== 'client'), [])

  const aVenir = list.filter((r) => !r.fait)
  const enRetard = aVenir.filter((r) => joursRestants(r.date) < 0).length
  const proches = aVenir.filter((r) => { const d = joursRestants(r.date); return d >= 0 && d <= 30 }).length

  function toggleFait(r: Rappel) {
    rappelsDb.update({ ...r, fait: !r.fait })
    reload()
  }
  function remove(r: Rappel) {
    if (confirm(`Supprimer le rappel « ${r.titre} » ?`)) {
      rappelsDb.remove(r.id)
      reload()
    }
  }

  return (
    <Layout title="Rappels RH" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints RH</div>
          <h2>Rappels &amp; échéances</h2>
          <div className="rh-sub">Tellco / LPP, assurances, contrats et autres échéances</div>
        </div>
        <button className="btn btn-dark btn-sm" onClick={() => setShowForm(true)}>
          + Nouveau rappel
        </button>
      </div>

      <div className="rh-stats cols-3">
        <div className="rh-stat accent">
          <div className="rh-stat-label">À traiter</div>
          <div className="rh-stat-value">{aVenir.length}</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">Échéance &lt; 30 j</div>
          <div className={`rh-stat-value ${proches ? 'warn' : ''}`}>{proches}</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">En retard</div>
          <div className={`rh-stat-value ${enRetard ? 'neg' : ''}`}>{enRetard}</div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">⏰</span>
          Aucun rappel enregistré.
        </div>
      ) : (
        <table className="rh-table">
          <thead>
            <tr>
              <th>Échéance</th>
              <th>Type</th>
              <th>Titre</th>
              <th>Concerne</th>
              <th>État</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const jr = joursRestants(r.date)
              const cls = r.fait ? '' : jr < 0 ? 'neg' : jr <= 30 ? 'warn' : ''
              return (
                <tr key={r.id} style={r.fait ? { opacity: 0.55 } : undefined}>
                  <td className={cls} style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(r.date)}
                    {!r.fait && (
                      <div style={{ fontSize: 11 }}>
                        {jr < 0 ? `en retard de ${-jr} j` : jr === 0 ? "aujourd'hui" : `dans ${jr} j`}
                      </div>
                    )}
                  </td>
                  <td>{TYPE_LABELS[r.type]}</td>
                  <td>
                    {r.titre}
                    {r.note && <div className="muted" style={{ fontSize: 12 }}>{r.note}</div>}
                  </td>
                  <td>{userName(r.cibleUserId)}</td>
                  <td>
                    <span className={`badge ${r.fait ? 'badge-green' : 'badge-amber'}`}>
                      {r.fait ? 'Fait' : 'À faire'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleFait(r)}>
                      {r.fait ? '↺' : '✓'}
                    </button>{' '}
                    <button className="btn btn-outline btn-sm" onClick={() => remove(r)}>🗑️</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {showForm && user && (
        <RappelForm
          employees={employees.map((u) => ({ id: u.id, label: `${u.prenom} ${u.nom}` }))}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            rappelsDb.create({ id: uid('rap'), createdAt: new Date().toISOString(), ...data })
            setShowForm(false)
          }}
        />
      )}
    </Layout>
  )
}

function RappelForm({
  employees,
  onClose,
  onSave,
}: {
  employees: { id: string; label: string }[]
  onClose: () => void
  onSave: (data: { titre: string; type: RappelType; date: string; cibleUserId?: string; note?: string }) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [titre, setTitre] = useState('')
  const [type, setType] = useState<RappelType>('tellco')
  const [date, setDate] = useState(today)
  const [cible, setCible] = useState('')
  const [note, setNote] = useState('')

  return (
    <div className="rh-modal-backdrop" onClick={onClose}>
      <div className="rh-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Nouveau rappel</h3>
        <div className="field">
          <label>Titre</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Déclaration Tellco trimestrielle" />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as RappelType)}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date d'échéance</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Concerne (facultatif)</label>
          <select value={cible} onChange={(e) => setCible(e.target.value)}>
            <option value="">Toute l'entreprise</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Détail…" />
        </div>
        <div className="btn-row">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            disabled={!titre.trim()}
            onClick={() => onSave({ titre: titre.trim(), type, date, cibleUserId: cible || undefined, note: note.trim() || undefined })}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
