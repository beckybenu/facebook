import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { annoncesDb, uid } from '../data/db'
import { formatDate } from '../lib/utils'

export default function Annonces() {
  const { user, isAdmin, isRh } = useAuth()
  const canManage = isAdmin || isRh
  const [showForm, setShowForm] = useState(false)
  const [, setTick] = useState(0)
  const reload = () => setTick((t) => t + 1)
  const notes = useMemo(() => annoncesDb.all(), [showForm])

  function togglePin(id: string, epingle: boolean) {
    const a = annoncesDb.byId(id)
    if (a) {
      annoncesDb.update({ ...a, epingle: !epingle })
      reload()
    }
  }
  function remove(id: string) {
    if (confirm('Supprimer cette annonce ?')) {
      annoncesDb.remove(id)
      reload()
    }
  }

  return (
    <Layout title="Tableau blanc" wide>
      <div className="rh-head">
        <div>
          <div className="rh-eyebrow">SwissPaints RH</div>
          <h2>Tableau blanc</h2>
          <div className="rh-sub">Les annonces internes de SwissPaints</div>
        </div>
        {canManage && (
          <button className="btn btn-dark btn-sm" onClick={() => setShowForm(true)}>
            + Nouvelle annonce
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">📌</span>
          Aucune annonce pour le moment.
        </div>
      ) : (
        notes.map((a) => (
          <div key={a.id} className={`rh-note ${a.epingle ? 'pinned' : ''}`}>
            {a.epingle && <span className="rh-pin">📌</span>}
            <h4>{a.titre}</h4>
            <p>{a.contenu}</p>
            <div className="rh-note-meta">
              {a.auteurNom} · {formatDate(a.createdAt)}
            </div>
            {canManage && (
              <div className="btn-row" style={{ marginTop: 10, gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => togglePin(a.id, !!a.epingle)}>
                  {a.epingle ? 'Désépingler' : 'Épingler'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => remove(a.id)}>
                  Supprimer
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {showForm && user && (
        <NewAnnonceForm
          onClose={() => setShowForm(false)}
          onSave={(titre, contenu, epingle) => {
            annoncesDb.create({
              id: uid('ann'),
              titre,
              contenu,
              epingle,
              auteurId: user.id,
              auteurNom: `${user.prenom} ${user.nom}`.trim() || user.username,
              createdAt: new Date().toISOString(),
            })
            setShowForm(false)
          }}
        />
      )}
    </Layout>
  )
}

function NewAnnonceForm({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (titre: string, contenu: string, epingle: boolean) => void
}) {
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [epingle, setEpingle] = useState(false)

  return (
    <div className="rh-modal-backdrop" onClick={onClose}>
      <div className="rh-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Nouvelle annonce</h3>
        <div className="field">
          <label>Titre</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de l'annonce" />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} rows={5} placeholder="Votre message à l'équipe…" />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 14 }}>
          <input type="checkbox" checked={epingle} onChange={(e) => setEpingle(e.target.checked)} />
          Épingler en haut
        </label>
        <div className="btn-row">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            disabled={!titre.trim() || !contenu.trim()}
            onClick={() => onSave(titre.trim(), contenu.trim(), epingle)}
          >
            Publier
          </button>
        </div>
      </div>
    </div>
  )
}
