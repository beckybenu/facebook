import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { vehiculesDb, usersDb, uid } from '../data/db'
import type { Vehicule, VehiculeType, VehiculeStatut, User } from '../types'
import { formatDate } from '../lib/utils'
import { isManager } from '../lib/roles'

const TYPE_LABELS: Record<VehiculeType, string> = {
  fourgon: 'Fourgon',
  camionnette: 'Camionnette',
  utilitaire: 'Utilitaire',
  voiture: 'Voiture',
  autre: 'Autre',
}
const STATUT_LABELS: Record<VehiculeStatut, string> = {
  actif: 'Actif',
  entretien: 'En entretien',
  hors_service: 'Hors service',
}
function statutBadge(s: VehiculeStatut) {
  return s === 'actif' ? 'badge-green' : s === 'entretien' ? 'badge-amber' : 'badge-red'
}
// Échéance proche (< 30 j) ou dépassée ?
function echeanceClass(iso?: string): string {
  if (!iso) return ''
  const days = (new Date(iso + 'T00:00:00').getTime() - Date.now()) / 86400000
  if (days < 0) return 'neg'
  if (days < 30) return 'warn'
  return ''
}

export default function Vehicules() {
  const { user } = useAuth()
  const manager = isManager(user?.role)
  const [showForm, setShowForm] = useState(false)
  const [edit, setEdit] = useState<Vehicule | null>(null)
  const [, setTick] = useState(0)
  const reload = () => setTick((t) => t + 1)

  const all = useMemo(() => vehiculesDb.all(), [showForm])
  const employees = useMemo<User[]>(
    () => usersDb.all().filter((u) => u.role === 'ouvrier' || u.role === 'sous_traitant' || u.role === 'admin'),
    [],
  )
  const userName = (id?: string) => {
    if (!id) return '—'
    const u = usersDb.byId(id)
    return u ? `${u.prenom} ${u.nom}`.trim() || u.username : 'Inconnu'
  }

  // Un non-gestionnaire ne voit que les véhicules (lecture) ; son véhicule d'abord
  const list = manager
    ? all
    : [...all].sort((a) => (a.assigneUserId === user?.id ? -1 : 1))

  const actifs = all.filter((v) => v.statut === 'actif').length
  const entretien = all.filter((v) => v.statut === 'entretien').length
  const echeances = all.filter(
    (v) => echeanceClass(v.controleTechnique) || echeanceClass(v.assuranceEcheance),
  ).length

  function openNew() {
    setEdit(null)
    setShowForm(true)
  }
  function openEdit(v: Vehicule) {
    setEdit(v)
    setShowForm(true)
  }
  function remove(v: Vehicule) {
    if (confirm(`Supprimer le véhicule « ${v.nom} » ?`)) {
      vehiculesDb.remove(v.id)
      reload()
    }
  }

  return (
    <Layout title="Véhicules" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints RH</div>
          <h2>Flotte de véhicules</h2>
          <div className="rh-sub">Suivi, attribution et échéances des véhicules</div>
        </div>
        {manager && (
          <button className="btn btn-dark btn-sm" onClick={openNew}>
            + Nouveau véhicule
          </button>
        )}
      </div>

      <div className="rh-stats cols-3">
        <div className="rh-stat accent">
          <div className="rh-stat-label">Véhicules actifs</div>
          <div className="rh-stat-value">{actifs}</div>
          <div className="rh-stat-foot">sur {all.length} au total</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">En entretien</div>
          <div className="rh-stat-value">{entretien}</div>
        </div>
        <div className="rh-stat">
          <div className="rh-stat-label">Échéances proches</div>
          <div className={`rh-stat-value ${echeances ? 'neg' : ''}`}>{echeances}</div>
          <div className="rh-stat-foot">contrôle / assurance &lt; 30 j</div>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🚚</span>
          Aucun véhicule enregistré.
        </div>
      ) : (
        <table className="rh-table">
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Plaque</th>
              <th>Attribué à</th>
              <th>Contrôle tech.</th>
              <th>Assurance</th>
              <th>Statut</th>
              {manager && <th></th>}
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className={v.assigneUserId === user?.id ? 'today' : ''}>
                <td>
                  <strong>{v.nom}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {[TYPE_LABELS[v.type], v.marque, v.modele].filter(Boolean).join(' · ')}
                    {v.km != null && ` · ${v.km.toLocaleString('fr-CH')} km`}
                  </div>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{v.plaque}</td>
                <td>{userName(v.assigneUserId)}</td>
                <td className={echeanceClass(v.controleTechnique)}>
                  {v.controleTechnique ? formatDate(v.controleTechnique) : '—'}
                </td>
                <td className={echeanceClass(v.assuranceEcheance)}>
                  {v.assuranceEcheance ? formatDate(v.assuranceEcheance) : '—'}
                </td>
                <td>
                  <span className={`badge ${statutBadge(v.statut)}`}>{STATUT_LABELS[v.statut]}</span>
                </td>
                {manager && (
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)}>Modifier</button>{' '}
                    <button className="btn btn-outline btn-sm" onClick={() => remove(v)}>🗑️</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && manager && (
        <VehiculeForm
          vehicule={edit}
          employees={employees}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (edit) vehiculesDb.update({ ...edit, ...data })
            else vehiculesDb.create({ id: uid('veh'), createdAt: new Date().toISOString(), ...data })
            setShowForm(false)
          }}
        />
      )}
    </Layout>
  )
}

type FormData = Omit<Vehicule, 'id' | 'createdAt'>

function VehiculeForm({
  vehicule,
  employees,
  onClose,
  onSave,
}: {
  vehicule: Vehicule | null
  employees: User[]
  onClose: () => void
  onSave: (data: FormData) => void
}) {
  const [nom, setNom] = useState(vehicule?.nom || '')
  const [marque, setMarque] = useState(vehicule?.marque || '')
  const [modele, setModele] = useState(vehicule?.modele || '')
  const [plaque, setPlaque] = useState(vehicule?.plaque || '')
  const [type, setType] = useState<VehiculeType>(vehicule?.type || 'fourgon')
  const [statut, setStatut] = useState<VehiculeStatut>(vehicule?.statut || 'actif')
  const [km, setKm] = useState(vehicule?.km != null ? String(vehicule.km) : '')
  const [assigne, setAssigne] = useState(vehicule?.assigneUserId || '')
  const [ct, setCt] = useState(vehicule?.controleTechnique || '')
  const [assur, setAssur] = useState(vehicule?.assuranceEcheance || '')
  const [note, setNote] = useState(vehicule?.note || '')

  const valid = nom.trim() && plaque.trim()

  return (
    <div className="rh-modal-backdrop" onClick={onClose}>
      <div className="rh-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{vehicule ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h3>
        <div className="field">
          <label>Nom / désignation</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Fourgon blanc chantiers" />
        </div>
        <div className="btn-row">
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Marque</label>
            <input value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Renault" />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Modèle</label>
            <input value={modele} onChange={(e) => setModele(e.target.value)} placeholder="Master" />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Plaque d'immatriculation</label>
          <input value={plaque} onChange={(e) => setPlaque(e.target.value)} placeholder="GE 123456" />
        </div>
        <div className="btn-row">
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as VehiculeType)}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value as VehiculeStatut)}>
              {Object.entries(STATUT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Attribué à</label>
          <select value={assigne} onChange={(e) => setAssigne(e.target.value)}>
            <option value="">— Aucun —</option>
            {employees.map((u) => (
              <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.titre || u.role})</option>
            ))}
          </select>
        </div>
        <div className="btn-row">
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Prochain contrôle technique</label>
            <input type="date" value={ct} onChange={(e) => setCt(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Échéance assurance</label>
            <input type="date" value={assur} onChange={(e) => setAssur(e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Kilométrage</label>
          <input type="number" min="0" value={km} onChange={(e) => setKm(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label>Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Remarque…" />
        </div>
        <div className="btn-row">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() =>
              onSave({
                nom: nom.trim(),
                marque: marque.trim() || undefined,
                modele: modele.trim() || undefined,
                plaque: plaque.trim(),
                type,
                statut,
                km: km.trim() ? Number(km) : undefined,
                assigneUserId: assigne || undefined,
                controleTechnique: ct || undefined,
                assuranceEcheance: assur || undefined,
                note: note.trim() || undefined,
              })
            }
          >
            {vehicule ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
