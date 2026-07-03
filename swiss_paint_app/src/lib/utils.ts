// Utilitaires partagés : géolocalisation, fichiers, formats.
import type {
  TaskStatus,
  TaskPriority,
  UserRole,
  Devis,
  DevisItem,
  DevisUnit,
  TimeEntry,
} from '../types'

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

// ---------- Pointage avancé ----------

// Distance en mètres entre deux points GPS (formule de Haversine)
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

// Durée totale des pauses d'un pointage (ms)
export function entryBreakMs(e: TimeEntry, nowMs = Date.now()): number {
  return (e.breaks || []).reduce((sum, b) => {
    const end = b.end ? new Date(b.end).getTime() : nowMs
    return sum + Math.max(0, end - new Date(b.start).getTime())
  }, 0)
}

// Temps réellement travaillé (pauses déduites), en ms
export function entryWorkedMs(e: TimeEntry, nowMs = Date.now()): number {
  const end = e.clockOut ? new Date(e.clockOut).getTime() : nowMs
  const gross = Math.max(0, end - new Date(e.clockIn).getTime())
  return Math.max(0, gross - entryBreakMs(e, nowMs))
}

export function entryWorkedHours(e: TimeEntry, nowMs = Date.now()): number {
  return entryWorkedMs(e, nowMs) / 3600000
}

// Pause en cours ?
export function isOnBreak(e: TimeEntry): boolean {
  return (e.breaks || []).some((b) => !b.end)
}

// "8h 05" à partir de millisecondes
export function msToHM(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m.toString().padStart(2, '0')}`
}

// "8h 05" à partir d'heures décimales (accepte le négatif : "-1h 30")
export function hoursToHM(h: number): string {
  const sign = h < 0 ? '-' : ''
  return sign + msToHM(Math.abs(h) * 3600000)
}

// Début de journée / semaine (lundi) / mois — en ms
export function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}
export function startOfWeek(d: Date): number {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // lundi = 0
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}
export function startOfMonth(d: Date): number {
  const x = new Date(d)
  x.setDate(1)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

// Génère + télécharge une fiche d'heures CSV
export function downloadTimesheetCsv(
  entries: TimeEntry[],
  taskName: (id?: string) => string,
  filename: string,
): void {
  const header = ['Date', 'Chantier', 'Entrée', 'Sortie', 'Pause (h)', 'Travaillé (h)', 'Sur site', 'Distance (m)', 'Validé']
  const rows = entries.map((e) => [
    formatDate(e.clockIn),
    taskName(e.taskId),
    formatTime(e.clockIn),
    e.clockOut ? formatTime(e.clockOut) : 'en cours',
    (entryBreakMs(e) / 3600000).toFixed(2),
    entryWorkedHours(e).toFixed(2),
    e.onSite == null ? '' : e.onSite ? 'oui' : 'non',
    e.distanceM != null ? String(e.distanceM) : '',
    e.validated ? 'oui' : 'non',
  ])
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
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
