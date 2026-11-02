// Helpers métier RH : contrat, décompte de jours, libellés et styles de statut.
import type {
  User,
  Absence,
  AbsenceType,
  AbsenceStatus,
  NoteFraisStatus,
} from '../types'
import { HR } from './company'

// ---- Contrat (valeurs par défaut si non renseignées sur l'utilisateur) ----
export const DEFAULT_VACANCES = 25

export function heuresHebdo(u?: Partial<User> | null): number {
  const base = u?.heuresHebdo ?? HR.weeklyTargetHours
  const taux = (u?.tauxActivite ?? 100) / 100
  return Math.round(base * taux * 100) / 100
}

export function droitVacances(u?: Partial<User> | null): number {
  const base = u?.joursVacances ?? DEFAULT_VACANCES
  const taux = (u?.tauxActivite ?? 100) / 100
  return Math.round(base * taux * 10) / 10
}

export function tauxActivite(u?: Partial<User> | null): number {
  return u?.tauxActivite ?? 100
}

// ---- Décompte de jours ouvrés (lun–ven) entre deux dates incluses ----
export function countBusinessDays(startIso: string, endIso: string): number {
  const start = new Date(startIso + 'T00:00:00')
  const end = new Date(endIso + 'T00:00:00')
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

// Jours de vacances déjà pris / en attente sur l'année en cours
export function vacancesPrises(absences: Absence[], year = new Date().getFullYear()): number {
  return absences
    .filter(
      (a) =>
        a.type === 'vacances' &&
        a.status === 'approuve' &&
        new Date(a.dateDebut).getFullYear() === year,
    )
    .reduce((s, a) => s + a.jours, 0)
}

export function vacancesEnAttente(absences: Absence[], year = new Date().getFullYear()): number {
  return absences
    .filter(
      (a) =>
        a.type === 'vacances' &&
        a.status === 'en_attente' &&
        new Date(a.dateDebut).getFullYear() === year,
    )
    .reduce((s, a) => s + a.jours, 0)
}

// ---- Libellés ----
export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacances: 'Vacances',
  maladie: 'Maladie',
  accident: 'Accident',
  sans_solde: 'Congé sans solde',
  autre: 'Autre',
}

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  refuse: 'Refusé',
}

export const FRAIS_STATUS_LABELS: Record<NoteFraisStatus, string> = {
  en_attente: 'En attente',
  rembourse: 'Remboursé',
  refuse: 'Refusé',
}

// Classe de badge selon le statut (réutilise les badges existants)
export function statusBadgeClass(status: AbsenceStatus | NoteFraisStatus): string {
  switch (status) {
    case 'approuve':
    case 'rembourse':
      return 'badge-green'
    case 'refuse':
      return 'badge-red'
    default:
      return 'badge-amber'
  }
}

export const FRAIS_CATEGORIES = [
  'Carburant',
  'Matériel',
  'Repas',
  'Parking',
  'Transport',
  'Hébergement',
  'Autre',
]
