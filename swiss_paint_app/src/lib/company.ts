// Informations officielles de l'entreprise — reprises du devis officiel SwissPaints.
export const COMPANY = {
  name: 'SwissPaints Group Sàrl',
  legalName: 'SWISSPAINTS GROUP SÀRL',
  tagline: 'Rénovation - Peinture - Décoration\nGypserie - Parquet - Nettoyage',
  address: 'Rue de la Prulay 19B',
  zipCity: '1217 Meyrin',
  country: 'Suisse',
  ide: 'CHE-258.570.836',
  tva: 'CHE-258.570.836 MWST',
  tvaRate: 8.1, // TVA suisse en vigueur
  phone1: '+41 22 558 12 19',
  phone2: '+41 78 668 12 19',
  email: 'info@swisspaints.ch',
  emailContact: 'contact@swisspaints.ch',
  website: 'www.swisspaints.ch',
  websiteUrl: 'https://www.swisspaints.ch',
  signataire: 'Noshaj Kujtim',
  signataireRole: 'Associé-Gérant',
} as const

// Paramètres RH / pointage
export const HR = {
  dailyTargetHours: 8.4, // objectif journalier (≈ 42h / 5 jours)
  weeklyTargetHours: 42, // objectif hebdomadaire (temps plein suisse)
  onSiteRadiusM: 200, // rayon (m) pour considérer l'ouvrier « sur le chantier »
} as const

// Remarques par défaut d'un devis (reprises du modèle officiel)
export const DEFAULT_REMARQUES = [
  'Ce devis est estimatif et pourra être ajusté en fonction des constatations définitives sur place.',
  'Les prix sont exprimés en CHF, hors taxes.',
  "Les travaux seront exécutés selon les règles de l'art et les normes en vigueur.",
  "Délai d'exécution : à convenir selon planning et accès.",
]

export const DEFAULT_INTRO =
  'Nous vous remercions pour votre demande et avons le plaisir de vous soumettre notre offre estimative pour les travaux suivants :'
