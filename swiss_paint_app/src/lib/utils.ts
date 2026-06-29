// Utilitaires partagés : géolocalisation, fichiers, formats.
import type { TaskStatus, TaskPriority, UserRole } from '../types'

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

// Chemins logo/icône qui respectent le base path (GitHub Pages sous-dossier)
export const LOGO = `${import.meta.env.BASE_URL}logo.jpg` // logo complet (paysage)
export const ICON = `${import.meta.env.BASE_URL}icon.svg` // icône carrée (PWA / favicon)
