// Types métier de l'application SwissPaints

// 3 niveaux d'accès reproduits depuis l'app Adalo :
//  - client  : utilisateur "normal" (hors société) -> accès site web, devis, réservations...
//  - ouvrier : employé avec accès limité -> pointage, ses chantiers, documents
//  - admin   : gestion complète (users, tâches, documents)
export type UserRole = 'client' | 'ouvrier' | 'admin'

export interface User {
  id: string
  email: string
  password: string // mock uniquement (stocké en clair côté démo locale)
  username: string
  nom: string
  prenom: string
  role: UserRole
  titre?: string // ex: "Peintre", "Chef de chantier"
  telephone?: string
  image?: string // dataURL
  createdAt: string
}

export type TaskStatus = 'a_faire' | 'en_cours' | 'termine'
export type TaskPriority = 'basse' | 'normale' | 'haute' | 'urgente'

export interface Task {
  id: string
  name: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  contact?: string
  projet?: string // nom du chantier / projet
  sousType?: string // projet sous type
  assignedUserId?: string // ouvrier assigné
  // Géolocalisation du chantier
  lat?: number
  lng?: number
  adresse?: string
  imageAvant?: string // dataURL
  imageApres?: string // dataURL
  createdAt: string
}

export type DocVisibility = 'public' | 'prive'

export interface Document {
  id: string
  name: string
  titre?: string
  documentType?: string // ex: "Devis", "Facture", "Plan"
  visibility: DocVisibility
  // Quel type d'utilisateur peut voir ce document
  audience: UserRole | 'tous'
  fileName?: string
  fileData?: string // dataURL (mock upload)
  createdAt: string
}

// ---------- Devis (estimations) ----------
export type DevisStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse'
// Unité de facturation d'une ligne
export type DevisUnit = 'heures' | 'm2' | 'unite' | 'forfait'

export interface DevisItem {
  id: string
  titre: string // ex: "CHAMBRE DE DROITE – TRAVAUX DE MISE EN PEINTURE"
  description?: string
  note?: string // remarque en italique sous la description
  unit: DevisUnit
  quantite?: number // vide pour un forfait
  prixUnitaire?: number // CHF HT ; vide pour un forfait
  montant: number // CHF HT (calculé, ou saisi pour un forfait)
}

export interface Devis {
  id: string
  numero: string // ex: DE-2024-06-01
  titre: string // ex: "TRAVAUX DE REMISE EN ÉTAT"
  sousTitre?: string // ex: "ÉTAT DES LIEUX DE SORTIE"
  date: string // ISO
  validiteJours: number // ex: 30
  lieuTravaux: string
  contact: string
  clientId?: string
  intro: string
  items: DevisItem[]
  tvaRate: number // ex: 8.1
  remarques: string[]
  status: DevisStatus
  createdAt: string
}

// Pointage / badgeuse
export interface TimeEntry {
  id: string
  userId: string
  taskId?: string // chantier associé au pointage
  clockIn: string // ISO datetime
  clockOut?: string // ISO datetime (vide = en cours)
  // Position au moment du badge (géolocalisation des ouvriers)
  lat?: number
  lng?: number
  note?: string
}
