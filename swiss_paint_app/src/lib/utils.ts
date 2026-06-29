// Utilitaires partagés : géolocalisation, fichiers, formats.
import type { TaskStatus, TaskPriority, UserRole, Devis, DevisItem, DevisUnit } from '../types'

export interface GeoPosition {
  lat: number
  lng: number
  accuracy?: number
}

// Géolocalisation des ouvriers (badgeage / position chantier)
export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(err.message || 'Impossible de récupérer la position.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  })
}

// Lecture d'un fichier (image / document) en dataURL pour stockage local
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'))
    reader.readAsDataURL(file)
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`
}

// Durée entre deux instants -> "Xh Ymin"
export function durationLabel(startIso: string, endIso?: string): string {
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  const ms = Math.max(0, end - new Date(startIso).getTime())
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m.toString().padStart(2, '0')}min`
}

export function durationHours(startIso: string, endIso?: string): number {
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  const ms = Math.max(0, end - new Date(startIso).getTime())
  return ms / 3600000
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  termine: 'Terminé',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Client',
  ouvrier: 'Ouvrier',
  admin: 'Admin',
}

export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

// ---------- Devis ----------
export const UNIT_LABELS: Record<DevisUnit, string> = {
  heures: 'heures',
  m2: 'm²',
  unite: 'unité',
  forfait: 'Forfait',
}

// Suffixe du prix unitaire ("/ h", "/ m²"…)
export const UNIT_PRICE_SUFFIX: Record<DevisUnit, string> = {
  heures: ' / h',
  m2: ' / m²',
  unite: ' / u',
  forfait: '',
}

// Format monétaire suisse : "1 234.50 CHF"
export function formatCHF(n: number): string {
  return `${n.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, ' ')} CHF`
}

// Date longue : "28 mai 2024"
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Montant HT d'une ligne (forfait = montant saisi, sinon quantité × prix unitaire)
export function lineAmount(item: Pick<DevisItem, 'unit' | 'quantite' | 'prixUnitaire' | 'montant'>): number {
  if (item.unit === 'forfait') return item.montant || 0
  return Math.round((item.quantite || 0) * (item.prixUnitaire || 0) * 100) / 100
}

export function devisTotals(devis: Pick<Devis, 'items' | 'tvaRate'>) {
  const totalHT = devis.items.reduce((s, it) => s + (it.montant || 0), 0)
  const tva = Math.round(totalHT * (devis.tvaRate / 100) * 100) / 100
  const totalTTC = Math.round((totalHT + tva) * 100) / 100
  return { totalHT: Math.round(totalHT * 100) / 100, tva, totalTTC }
}

export const DEVIS_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
}

// Chemins logo/icône qui respectent le base path (GitHub Pages sous-dossier)
export const LOGO = `${import.meta.env.BASE_URL}logo.jpg` // logo complet (paysage)
export const ICON = `${import.meta.env.BASE_URL}icon.svg` // icône carrée (PWA / favicon)
