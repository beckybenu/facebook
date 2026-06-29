import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { devisDb, uid } from '../data/db'
import type { Devis, DevisItem, DevisUnit, DevisStatus } from '../types'
import { COMPANY, DEFAULT_INTRO, DEFAULT_REMARQUES } from '../lib/company'
import { UNIT_LABELS, formatCHF, lineAmount, devisTotals } from '../lib/utils'

function emptyItem(): DevisItem {
  return { id: uid('it'), titre: '', description: '', note: '', unit: 'forfait', montant: 0 }
}

export default function DevisEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [existing, setExisting] = useState<Devis | null>(null)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<Omit<Devis, 'id' | 'createdAt'>>({
    numero: '',
    titre: 'TRAVAUX DE REMISE EN ÉTAT',
    sousTitre: '',
    date: today,
    validiteJours: 30,
    lieuTravaux: 'À définir',
    contact: 'À définir',
    intro: DEFAULT_INTRO,
    items: [emptyItem()],
    tvaRate: COMPANY.tvaRate,
    remarques: [...DEFAULT_REMARQUES],
    status: 'brouillon',
  })

  useEffect(() => {
    if (id) {
      const d = devisDb.byId(id)
      if (d) {
        setExisting(d)
        const { id: _id, createdAt: _c, ...rest } = d
        setForm(rest)
      }
    } else {
      // Numéro auto pour un nouveau devis
      const now = new Date()
      setForm((f) => ({ ...f, numero: devisDb.nextNumero(now.getFullYear(), now.getMonth() + 1) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setItem(idx: number, patch: Partial<DevisItem>) {
    setForm((f) => {
      const items = f.items.map((it, i) => {
        if (i !== idx) return it
        const next = { ...it, ...patch }
        next.montant = lineAmount(next)
        return next
      })
      return { ...f, items }
    })
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))
  }
  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  const totals = useMemo(() => devisTotals(form), [form])

  function save() {
    setError('')
    if (!form.numero.trim()) return setError('Le numéro de devis est obligatoire.')
    if (form.items.length === 0) return setError('Ajoute au moins une ligne.')
    if (form.items.some((it) => !it.titre.trim()))
      return setError('Chaque ligne doit avoir une désignation.')

    const items = form.items.map((it) => ({ ...it, montant: lineAmount(it) }))
    if (isNew) {
      const d: Devis = { ...form, items, id: uid('dev'), createdAt: new Date().toISOString() }
      devisDb.create(d)
      navigate(`/devis/${d.id}`)
    } else if (existing) {
      const d: Devis = { ...existing, ...form, items }
      devisDb.update(d)
      navigate(`/devis/${existing.id}`)
    }
  }

  function remove() {
    if (existing && confirm('Supprimer ce devis ?')) {
      devisDb.remove(existing.id)
      navigate('/devis')
    }
  }

  return (
    <Layout title={isNew ? 'Nouveau devis' : 'Modifier le devis'} back nav={false}>
      {error && <div className="error-msg">{error}</div>}

      <div className="section-title">En-tête</div>
      <div className="card">
        <div className="btn-row">
          <div className="field" style={{ flex: 1, marginBottom: 12 }}>
            <label>N° de devis</label>
            <input value={form.numero} onChange={(e) => set('numero', e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 12 }}>
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Titre</label>
          <input value={form.titre} onChange={(e) => set('titre', e.target.value)} />
        </div>
        <div className="field">
          <label>Sous-titre (optionnel)</label>
          <input
            value={form.sousTitre}
            onChange={(e) => set('sousTitre', e.target.value)}
            placeholder="ex : ÉTAT DES LIEUX DE SORTIE"
          />
        </div>
        <div className="btn-row">
          <div className="field" style={{ flex: 1 }}>
            <label>Validité (jours)</label>
            <input
              type="number"
              value={form.validiteJours}
              onChange={(e) => set('validiteJours', Number(e.target.value))}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>TVA (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.tvaRate}
              onChange={(e) => set('tvaRate', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="field">
          <label>Lieu des travaux</label>
          <input value={form.lieuTravaux} onChange={(e) => set('lieuTravaux', e.target.value)} />
        </div>
        <div className="field">
          <label>Contact</label>
          <input value={form.contact} onChange={(e) => set('contact', e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Texte d'introduction</label>
          <textarea value={form.intro} onChange={(e) => set('intro', e.target.value)} />
        </div>
      </div>

      <div className="section-title">Lignes du devis</div>
      {form.items.map((it, idx) => (
        <div className="card" key={it.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Ligne {idx + 1}</strong>
            <button
              className="link"
              style={{ color: 'var(--sp-red)' }}
              onClick={() => removeItem(idx)}
            >
              🗑️ Retirer
            </button>
          </div>
          <div className="field">
            <label>Désignation</label>
            <input
              value={it.titre}
              onChange={(e) => setItem(idx, { titre: e.target.value })}
              placeholder="ex : CHAMBRE – TRAVAUX DE MISE EN PEINTURE"
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              value={it.description}
              onChange={(e) => setItem(idx, { description: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Note en italique (optionnel)</label>
            <input value={it.note} onChange={(e) => setItem(idx, { note: e.target.value })} />
          </div>
          <div className="field">
            <label>Type de facturation</label>
            <select
              value={it.unit}
              onChange={(e) => setItem(idx, { unit: e.target.value as DevisUnit })}
            >
              <option value="heures">Heures</option>
              <option value="m2">Surface (m²)</option>
              <option value="unite">Unité</option>
              <option value="forfait">Forfait</option>
            </select>
          </div>

          {it.unit === 'forfait' ? (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Montant forfaitaire (CHF HT)</label>
              <input
                type="number"
                step="0.01"
                value={it.montant || ''}
                onChange={(e) => setItem(idx, { montant: Number(e.target.value) })}
              />
            </div>
          ) : (
            <>
              <div className="btn-row">
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Quantité ({UNIT_LABELS[it.unit]})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={it.quantite ?? ''}
                    onChange={(e) => setItem(idx, { quantite: Number(e.target.value) })}
                  />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Prix unit. (CHF HT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={it.prixUnitaire ?? ''}
                    onChange={(e) => setItem(idx, { prixUnitaire: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="kv" style={{ marginTop: 10 }}>
                <span className="k">Montant ligne (HT)</span>
                <span className="v">{formatCHF(lineAmount(it))}</span>
              </div>
            </>
          )}
        </div>
      ))}

      <button className="btn btn-outline" onClick={addItem}>
        ＋ Ajouter une ligne
      </button>

      {/* Totaux en direct */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="kv">
          <span className="k">Total HT</span>
          <span className="v">{formatCHF(totals.totalHT)}</span>
        </div>
        <div className="kv">
          <span className="k">TVA {form.tvaRate} %</span>
          <span className="v">{formatCHF(totals.tva)}</span>
        </div>
        <div className="kv">
          <span className="k" style={{ fontWeight: 700, color: 'var(--sp-black)' }}>
            Total TTC
          </span>
          <span className="v" style={{ color: 'var(--sp-red)', fontSize: 17 }}>
            {formatCHF(totals.totalTTC)}
          </span>
        </div>
      </div>

      <div className="section-title">Remarques</div>
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Une remarque par ligne</label>
          <textarea
            style={{ minHeight: 120 }}
            value={form.remarques.join('\n')}
            onChange={(e) =>
              set(
                'remarques',
                e.target.value.split('\n'),
              )
            }
          />
        </div>
      </div>

      <div className="section-title">Statut</div>
      <div className="field">
        <select value={form.status} onChange={(e) => set('status', e.target.value as DevisStatus)}>
          <option value="brouillon">Brouillon</option>
          <option value="envoye">Envoyé</option>
          <option value="accepte">Accepté</option>
          <option value="refuse">Refusé</option>
        </select>
      </div>

      <button className="btn btn-primary" onClick={save}>
        {isNew ? 'Créer le devis' : 'Enregistrer'}
      </button>
      {!isNew && (
        <button
          className="btn btn-outline"
          style={{ marginTop: 12, color: 'var(--sp-red)' }}
          onClick={remove}
        >
          🗑️ Supprimer le devis
        </button>
      )}
    </Layout>
  )
}
