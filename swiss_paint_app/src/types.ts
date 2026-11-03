// Types métier de l'application SwissPaints

// 3 niveaux d'accès reproduits depuis l'app Adalo :
//  - client  : utilisateur "normal" (hors société) -> accès site web, devis, réservations...
//  - ouvrier : employé avec accès limité -> pointage, ses chantiers, documents
//  - admin   : gestion complète (users, tâches, documents)
export type UserRole = 'client' | 'ouvrier' | 'sous_traitant' | 'comptable' | 'rh' | 'admin'

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
  // ---- Contrat RH (valeurs par défaut gérées en code si absentes) ----
  heuresHebdo?: number // base contractuelle hebdomadaire (défaut 42)
  tauxActivite?: number // % d'occupation (défaut 100)
  joursVacances?: number // droit annuel en jours (défaut 25)
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
  assignedUserId?: string // ouvrier assigné (principal — conservé pour compatibilité)
  assignedUserIds?: string[] // équipe assignée (plusieurs ouvriers/sous-traitants)
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
export interface Break {
  start: string // ISO
  end?: string // ISO (vide = pause en cours)
}

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
  // Pauses (déjeuner, etc.) déduites du temps travaillé
  breaks?: Break[]
  // Contrôle de présence sur chantier au badge
  distanceM?: number // distance au chantier en mètres
  onSite?: boolean // dans le rayon autorisé du chantier
  // Validation des heures par l'admin
  validated?: boolean
}

// ---------- RH : Absences / vacances ----------
export type AbsenceType = 'vacances' | 'maladie' | 'accident' | 'sans_solde' | 'autre'
export type AbsenceStatus = 'en_attente' | 'approuve' | 'refuse'

export interface Absence {
  id: string
  userId: string
  type: AbsenceType
  dateDebut: string // ISO (jour)
  dateFin: string // ISO (jour, inclus)
  jours: number // nb de jours ouvrés demandés
  motif?: string
  status: AbsenceStatus
  decisionBy?: string // userId de l'admin ayant décidé
  createdAt: string
}

// ---------- RH : Notes de frais ----------
export type NoteFraisStatus = 'en_attente' | 'rembourse' | 'refuse'

export interface NoteFrais {
  id: string
  userId: string
  date: string // ISO (jour de la dépense)
  categorie: string // ex: "Carburant", "Matériel", "Repas", "Parking"
  description?: string
  montant: number // CHF
  justificatif?: string // dataURL (photo / scan du reçu)
  status: NoteFraisStatus
  decisionBy?: string
  createdAt: string
}

// ---------- RH : Tableau blanc (annonces internes) ----------
export interface Annonce {
  id: string
  titre: string
  contenu: string
  auteurId: string
  auteurNom: string
  epingle?: boolean
  createdAt: string
}

// ---------- RH : Véhicules (flotte) ----------
export type VehiculeType = 'fourgon' | 'camionnette' | 'voiture' | 'utilitaire' | 'autre'
export type VehiculeStatut = 'actif' | 'entretien' | 'hors_service'

export interface Vehicule {
  id: string
  nom: string // ex: "Fourgon blanc chantiers"
  marque?: string // ex: "Renault"
  modele?: string // ex: "Master"
  plaque: string // immatriculation, ex: "GE 123456"
  type: VehiculeType
  annee?: number
  km?: number
  assigneUserId?: string // ouvrier / sous-traitant attribué
  controleTechnique?: string // ISO (jour) — prochain contrôle
  assuranceEcheance?: string // ISO (jour) — échéance assurance
  statut: VehiculeStatut
  note?: string
  createdAt: string
}

// ---------- RH : Rappels (échéances RH : Tellco/LPP, contrôles…) ----------
export type RappelType = 'tellco' | 'lpp' | 'assurance' | 'controle_technique' | 'contrat' | 'autre'

export interface Rappel {
  id: string
  titre: string
  type: RappelType
  date: string // ISO (jour de l'échéance)
  cibleUserId?: string // concerne un employé précis (facultatif)
  note?: string
  fait?: boolean
  createdAt: string
}

// ---------- Notifications (ouvriers) ----------
export type NotifType = 'chantier' | 'annonce' | 'absence' | 'frais' | 'info'

export interface Notification {
  id: string
  userId: string // destinataire
  type: NotifType
  titre: string
  message?: string
  lien?: string // route interne (ex: /chantiers/xxx)
  lu?: boolean
  createdAt: string
}
