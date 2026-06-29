import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { devisDb } from '../data/db'
import type { Devis } from '../types'
import { COMPANY } from '../lib/company'
import {
  UNIT_LABELS,
  UNIT_PRICE_SUFFIX,
  formatCHF,
  formatDateLong,
  devisTotals,
  LOGO,
} from '../lib/utils'

const num2 = (n: number) =>
  n.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function DevisView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [devis, setDevis] = useState<Devis | null>(null)

  useEffect(() => {
    if (id) setDevis(devisDb.byId(id) ?? null)
  }, [id])

  if (!devis) {
    return (
      <div className="app-shell">
        <div className="empty" style={{ marginTop: 60 }}>
          Devis introuvable.
          <br />
          <button className="link" onClick={() => navigate('/devis')}>
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  const { totalHT, tva, totalTTC } = devisTotals(devis)

  function shareEmail() {
    if (!devis) return
    const subject = encodeURIComponent(`Devis ${devis.numero} — ${COMPANY.name}`)
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver notre devis ${devis.numero} (${devis.titre}).\nMontant total TTC : ${formatCHF(totalTTC)}.\n\nCordialement,\n${COMPANY.signataire}\n${COMPANY.legalName}`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className="app-shell devis-print-wrap">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="devis-actionbar no-print">
        <button className="icon-btn" onClick={() => navigate('/devis')} aria-label="Retour">
          ‹
        </button>
        <div className="devis-actions">
          <button className="btn btn-sm btn-outline" onClick={() => navigate(`/devis/${devis.id}/edit`)}>
            ✏️ Modifier
          </button>
          <button className="btn btn-sm btn-outline" onClick={shareEmail}>
            ✉️ Envoyer
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* Feuille du devis */}
      <div className="devis-sheet" id="devis-sheet">
        <div className="devis-head">
          <div className="devis-brand">
            <img src={LOGO} alt={COMPANY.name} className="devis-logo" />
            <div className="devis-tagline">{COMPANY.tagline}</div>
            <div className="devis-contact">
              {COMPANY.website.toUpperCase()}
              <br />
              {COMPANY.phone1} &nbsp; {COMPANY.phone2}
            </div>
          </div>
          <div className="devis-titleblock">
            <h1 className="devis-title">DEVIS ESTIMATIF</h1>
            <div className="devis-subtitle">{devis.titre}</div>
            {devis.sousTitre && <div className="devis-subtitle2">— {devis.sousTitre} —</div>}
            <table className="devis-info">
              <tbody>
                <tr>
                  <td>Devis n° :</td>
                  <td>{devis.numero}</td>
                </tr>
                <tr>
                  <td>Date :</td>
                  <td>{formatDateLong(devis.date)}</td>
                </tr>
                <tr>
                  <td>Validité de l'offre :</td>
                  <td>{devis.validiteJours} jours</td>
                </tr>
                <tr>
                  <td>Lieu des travaux :</td>
                  <td>{devis.lieuTravaux}</td>
                </tr>
                <tr>
                  <td>Contact :</td>
                  <td>{devis.contact}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="devis-intro">{devis.intro}</p>

        <table className="devis-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>N°</th>
              <th style={{ width: '55%' }}>DÉSIGNATION DES TRAVAUX</th>
              <th style={{ width: '13%' }}>QUANTITÉ / SURFACE</th>
              <th style={{ width: '13%' }}>PRIX UNIT. (HT)</th>
              <th style={{ width: '14%' }}>MONTANT (HT)</th>
            </tr>
          </thead>
          <tbody>
            {devis.items.map((it, i) => (
              <tr key={it.id}>
                <td className="c">{i + 1}</td>
                <td>
                  <div className="it-titre">{it.titre}</div>
                  {it.description && <div className="it-desc">{it.description}</div>}
                  {it.note && <div className="it-note">{it.note}</div>}
                </td>
                <td className="c">
                  {it.unit === 'forfait'
                    ? 'Forfait'
                    : `${num2(it.quantite || 0)} ${UNIT_LABELS[it.unit]}`}
                </td>
                <td className="c">
                  {it.unit === 'forfait'
                    ? '—'
                    : `${num2(it.prixUnitaire || 0)} CHF${UNIT_PRICE_SUFFIX[it.unit]}`}
                </td>
                <td className="r b">{num2(it.montant)} CHF</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="devis-totaux">
          <tbody>
            <tr>
              <td>TOTAL HT</td>
              <td className="r b">{num2(totalHT)} CHF</td>
            </tr>
            <tr>
              <td>TVA {devis.tvaRate} %</td>
              <td className="r">{num2(tva)} CHF</td>
            </tr>
            <tr className="ttc">
              <td>TOTAL TTC</td>
              <td className="r b">{num2(totalTTC)} CHF</td>
            </tr>
          </tbody>
        </table>

        <div className="devis-bottom">
          <div className="devis-remarques">
            <strong>REMARQUES :</strong>
            <ul>
              {devis.remarques
                .filter((r) => r.trim())
                .map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
            </ul>
          </div>
          <div className="devis-signature">
            <p>
              Nous restons à votre disposition pour tout complément d'information et vous prions
              d'agréer, Madame, Monsieur, nos salutations distinguées.
            </p>
            <div className="sign-name">{COMPANY.signataire}</div>
            <div className="sign-role">{COMPANY.signataireRole}</div>
          </div>
        </div>

        <div className="devis-footer">
          <div className="ft-name">{COMPANY.legalName}</div>
          <div>
            {COMPANY.address} – {COMPANY.zipCity} – {COMPANY.country}
          </div>
          <div>
            {COMPANY.ide} – TVA : {COMPANY.tva}
          </div>
          <div>
            {COMPANY.email} – {COMPANY.website}
          </div>
        </div>
      </div>
    </div>
  )
}
