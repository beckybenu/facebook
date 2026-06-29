// Types métier de l'application Swiss Paint

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
