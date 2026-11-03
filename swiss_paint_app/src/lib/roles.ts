// Capacités par rôle — source unique de vérité pour la navigation et les accès.
import type { UserRole } from '../types'

export interface Caps {
  staff: boolean // employé interne ou externe (tout sauf client)
  manageRh: boolean // valider absences/frais, gérer flotte/rappels/annonces
  manageUsers: boolean // CRUD comptes + espace admin
  pointer: boolean // timbrage
  chantiers: boolean
  tableauBord: boolean
  absences: boolean
  planning: boolean
  frais: boolean
  devis: boolean
  vehicules: boolean
  annonces: boolean
  documents: boolean
  assistant: boolean
  rappels: boolean
  changeLang: boolean // peut changer la langue de l'interface
}

export function caps(role?: UserRole): Caps {
  const admin = role === 'admin'
  const rh = role === 'rh'
  const ouvrier = role === 'ouvrier'
  const st = role === 'sous_traitant'
  const compta = role === 'comptable'
  const terrain = admin || rh || ouvrier || st // profils « terrain »

  return {
    staff: !!role && role !== 'client',
    manageRh: admin || rh,
    manageUsers: admin,
    pointer: terrain,
    chantiers: terrain,
    tableauBord: terrain,
    absences: admin || rh || ouvrier, // les sous-traitants n'ont pas de congés payés
    planning: terrain,
    frais: terrain || compta,
    devis: admin || rh || ouvrier || compta,
    vehicules: terrain,
    annonces: terrain,
    documents: true, // tous les connectés
    assistant: admin || rh || ouvrier, // IA réservée aux employés internes
    rappels: admin || rh,
    changeLang: admin || ouvrier || st, // seuls l'admin, les ouvriers et sous-traitants changent la langue
  }
}

// Rôles « gestionnaires RH » (peuvent valider / gérer)
export function isManager(role?: UserRole): boolean {
  return role === 'admin' || role === 'rh'
}
