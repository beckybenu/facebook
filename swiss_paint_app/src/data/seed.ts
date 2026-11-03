// Données de démonstration initiales (comme la base Adalo pré-remplie).
import {
  KEYS,
  usersDb,
  tasksDb,
  docsDb,
  timeDb,
  devisDb,
  absencesDb,
  annoncesDb,
  vehiculesDb,
  rappelsDb,
  uid,
} from './db'
import type { User, Task, Document, TimeEntry, Devis, Absence, Annonce, Vehicule, Rappel } from '../types'
import { DEFAULT_REMARQUES, DEFAULT_INTRO } from '../lib/company'

export function seedIfNeeded(): void {
  if (localStorage.getItem(KEYS.seeded)) return

  // Nettoie d'éventuelles données d'une version de démo précédente (évite les doublons de comptes)
  ;[
    KEYS.users,
    KEYS.tasks,
    KEYS.documents,
    KEYS.timeEntries,
    KEYS.devis,
    KEYS.absences,
    KEYS.notesFrais,
    KEYS.annonces,
    KEYS.vehicules,
    KEYS.rappels,
    KEYS.notifications,
    'sp_seeded_v3',
    'sp_seeded_v4',
  ].forEach((k) => localStorage.removeItem(k))

  const now = new Date().toISOString()

  const admin: User = {
    id: uid('usr'),
    email: 'admin@swisspaints.ch',
    password: 'admin',
    username: 'admin',
    nom: 'Müller',
    prenom: 'Thomas',
    role: 'admin',
    titre: 'Administrateur',
    telephone: '+41 79 000 00 00',
    createdAt: now,
  }
  const ouvrier: User = {
    id: uid('usr'),
    email: 'ouvrier@swisspaints.ch',
    password: 'ouvrier',
    username: 'jdupont',
    nom: 'Dupont',
    prenom: 'Jean',
    role: 'ouvrier',
    titre: 'Peintre',
    telephone: '+41 78 111 11 11',
    createdAt: now,
  }
  const ouvrier2: User = {
    id: uid('usr'),
    email: 'marc@swisspaints.ch',
    password: 'ouvrier',
    username: 'mrossi',
    nom: 'Rossi',
    prenom: 'Marc',
    role: 'ouvrier',
    titre: 'Chef de chantier',
    telephone: '+41 78 222 22 22',
    createdAt: now,
  }
  const rh: User = {
    id: uid('usr'),
    email: 'rh@swisspaints.ch',
    password: 'rh',
    username: 'rh',
    nom: 'Dubois',
    prenom: 'Marc',
    role: 'rh',
    titre: 'Responsable RH',
    telephone: '+41 79 444 44 44',
    tauxActivite: 100,
    joursVacances: 25,
    createdAt: now,
  }
  const sousTraitant: User = {
    id: uid('usr'),
    email: 'soustraitant@swisspaints.ch',
    password: 'soustraitant',
    username: 'stgjonaj',
    nom: 'Gjonaj',
    prenom: 'Luan',
    role: 'sous_traitant',
    titre: 'Plâtrier (sous-traitant)',
    telephone: '+41 78 555 55 55',
    tauxActivite: 100,
    createdAt: now,
  }
  const comptable: User = {
    id: uid('usr'),
    email: 'comptable@swisspaints.ch',
    password: 'comptable',
    username: 'comptable',
    nom: 'Perret',
    prenom: 'Claire',
    role: 'comptable',
    titre: 'Comptable',
    telephone: '+41 79 666 66 66',
    createdAt: now,
  }
  const client: User = {
    id: uid('usr'),
    email: 'client@example.com',
    password: 'client',
    username: 'client1',
    nom: 'Favre',
    prenom: 'Sophie',
    role: 'client',
    titre: 'Cliente',
    telephone: '+41 76 333 33 33',
    createdAt: now,
  }

  ;[admin, ouvrier, ouvrier2, rh, sousTraitant, comptable, client].forEach((u) => usersDb.create(u))

  const tasks: Task[] = [
    {
      id: uid('tsk'),
      name: 'Rénovation appartement Lausanne',
      description: 'Peinture complète 3.5 pièces, murs et plafonds blanc cassé.',
      status: 'en_cours',
      priority: 'haute',
      contact: 'Mme Favre',
      projet: 'Chantier Lausanne Centre',
      sousType: 'Intérieur',
      assignedUserId: ouvrier.id,
      lat: 46.5197,
      lng: 6.6323,
      adresse: 'Rue de Bourg 12, 1003 Lausanne',
      createdAt: now,
    },
    {
      id: uid('tsk'),
      name: 'Façade immeuble Genève',
      description: 'Ravalement de façade, crépi et peinture extérieure.',
      status: 'a_faire',
      priority: 'normale',
      contact: 'Régie Dumont',
      projet: 'Chantier Genève Eaux-Vives',
      sousType: 'Extérieur',
      assignedUserId: ouvrier2.id,
      lat: 46.2044,
      lng: 6.1432,
      adresse: 'Rue du Lac 5, 1207 Genève',
      createdAt: now,
    },
    {
      id: uid('tsk'),
      name: 'Bureaux Montreux',
      description: 'Mise en peinture open space, teinte gris perle.',
      status: 'termine',
      priority: 'basse',
      contact: 'M. Blanc',
      projet: 'Chantier Montreux',
      sousType: 'Intérieur',
      assignedUserId: ouvrier.id,
      lat: 46.4312,
      lng: 6.9107,
      adresse: 'Av. des Alpes 30, 1820 Montreux',
      createdAt: now,
    },
  ]
  tasks.forEach((t) => tasksDb.create(t))

  const docs: Document[] = [
    {
      id: uid('doc'),
      name: 'Manuel utilisateur',
      titre: 'Guide de prise en main',
      documentType: 'Guide',
      visibility: 'public',
      audience: 'tous',
      createdAt: now,
    },
    {
      id: uid('doc'),
      name: 'Consignes sécurité chantier',
      titre: 'Sécurité',
      documentType: 'Procédure',
      visibility: 'prive',
      audience: 'ouvrier',
      createdAt: now,
    },
    {
      id: uid('doc'),
      name: 'Devis rénovation Lausanne',
      titre: 'Devis',
      documentType: 'Devis',
      visibility: 'prive',
      audience: 'client',
      createdAt: now,
    },
  ]
  docs.forEach((d) => docsDb.create(d))

  // Pointages déjà terminés pour la démo de la fiche d'heures (avec pause + présence chantier)
  const dayAt = (daysAgo: number, h: number, m = 0) => {
    const d = new Date(Date.now() - daysAgo * 86400000)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }
  const entries: TimeEntry[] = [
    {
      id: uid('te'),
      userId: ouvrier.id,
      taskId: tasks[0].id,
      clockIn: dayAt(1, 8, 0),
      clockOut: dayAt(1, 17, 0),
      lat: 46.5197,
      lng: 6.6323,
      distanceM: 45,
      onSite: true,
      breaks: [{ start: dayAt(1, 12, 0), end: dayAt(1, 13, 0) }], // pause déjeuner 1h
      validated: true,
      note: 'Journée chantier Lausanne',
    },
    {
      id: uid('te'),
      userId: ouvrier.id,
      taskId: tasks[0].id,
      clockIn: dayAt(2, 8, 15),
      clockOut: dayAt(2, 16, 45),
      lat: 46.5205,
      lng: 6.633,
      distanceM: 120,
      onSite: true,
      breaks: [{ start: dayAt(2, 12, 0), end: dayAt(2, 12, 45) }],
    },
    {
      id: uid('te'),
      userId: ouvrier2.id,
      taskId: tasks[1].id,
      clockIn: dayAt(1, 7, 30),
      clockOut: dayAt(1, 16, 0),
      lat: 46.21,
      lng: 6.15,
      distanceM: 780,
      onSite: false, // hors zone : trop loin du chantier
      breaks: [{ start: dayAt(1, 12, 0), end: dayAt(1, 13, 0) }],
    },
  ]
  entries.forEach((e) => timeDb.create(e))

  // Devis de démonstration (identique au modèle officiel SwissPaints)
  const devis: Devis = {
    id: uid('dev'),
    numero: 'DE-2024-06-01',
    titre: 'TRAVAUX DE REMISE EN ÉTAT',
    sousTitre: 'ÉTAT DES LIEUX DE SORTIE',
    date: '2024-05-28',
    validiteJours: 30,
    lieuTravaux: 'À définir',
    contact: 'À définir',
    intro: DEFAULT_INTRO,
    tvaRate: 8.1,
    remarques: [...DEFAULT_REMARQUES],
    status: 'envoye',
    createdAt: now,
    items: [
      {
        id: uid('it'),
        titre: 'CHAMBRE DE DROITE – RÉPARATION DU MUR EN PAPIER PEINT (INGRAIN)',
        description:
          "Préparations diverses comprenant le masticage des dégradations constatées sur le revêtement ingrain, la reprise des défauts afin d'obtenir une uniformisation au plus proche de l'existant, ainsi que toutes les préparations nécessaires à la bonne exécution des travaux.",
        note: 'Temps estimé : 2 heures',
        unit: 'heures',
        quantite: 2,
        prixUnitaire: 85,
        montant: 170,
      },
      {
        id: uid('it'),
        titre: 'CHAMBRE DE DROITE – TRAVAUX DE MISE EN PEINTURE',
        description:
          "Préparations diverses comprenant les retouches nécessaires, suivies de l'application de deux couches de peinture dispersion mate teinte RAL 9010, sur une surface d'environ 12.92 m², afin d'obtenir une finition homogène.",
        note: "Nous attirons toutefois votre attention sur le fait qu'une légère différence de teinte ou d'aspect par rapport aux surfaces existantes peut subsister en raison du vieillissement naturel des peintures et de l'absence de reprise complète des parois.",
        unit: 'm2',
        quantite: 12.92,
        prixUnitaire: 18,
        montant: 232.56,
      },
      {
        id: uid('it'),
        titre: 'ARMOIRE ENCASTRÉE À TROIS PORTES – REMISE EN ÉTAT DES FACES EXTÉRIEURES',
        description:
          "En raison de la configuration de l'armoire, accolée à la porte de la pièce, une reprise partielle ne permettrait pas d'obtenir un résultat esthétique satisfaisant. Les travaux comprennent donc la remise en état complète des trois faces extérieures.\n\nPréparations diverses comprenant le lessivage, le masticage des imperfections, le ponçage mécanique et manuel avec aspiration des poussières, puis l'application de deux couches d'émail teinté RAL 9010, avec une teinte adaptée au plus proche de l'existant afin d'assurer une uniformisation visuelle.",
        unit: 'forfait',
        montant: 300,
      },
      {
        id: uid('it'),
        titre: 'MISE EN ŒUVRE',
        description:
          "Comprenant le déplacement, la protection des ouvrages et des sols, la protection périphérique, l'installation et le repli du matériel, le chargement et le déchargement des matériaux, ainsi que le nettoyage sommaire de fin d'intervention.",
        unit: 'forfait',
        montant: 180,
      },
    ],
  }
  devisDb.create(devis)

  // ---- Démo RH : annonces (tableau blanc) ----
  const annonces: Annonce[] = [
    {
      id: uid('ann'),
      titre: 'Bienvenue sur SwissPaints RH',
      contenu: 'Pensez à timbrer chaque jour à votre arrivée et à votre départ. Bonne saison à toutes et à tous !',
      auteurId: rh.id,
      auteurNom: `${rh.prenom} ${rh.nom}`,
      epingle: true,
      createdAt: now,
    },
    {
      id: uid('ann'),
      titre: 'Notes de frais — rappel',
      contenu: "Merci de joindre systématiquement une photo du justificatif à chaque note de frais pour accélérer le remboursement.",
      auteurId: rh.id,
      auteurNom: `${rh.prenom} ${rh.nom}`,
      createdAt: now,
    },
  ]
  annonces.forEach((a) => annoncesDb.create(a))

  // ---- Démo RH : une absence approuvée (visible dans Absences + Planning) ----
  const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10)
  const absence: Absence = {
    id: uid('abs'),
    userId: ouvrier.id,
    type: 'vacances',
    dateDebut: inDays(7),
    dateFin: inDays(9),
    jours: 3,
    status: 'approuve',
    decisionBy: rh.id,
    createdAt: now,
  }
  absencesDb.create(absence)

  // ---- Démo RH : flotte de véhicules ----
  const inDaysDate = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10)
  const vehicules: Vehicule[] = [
    {
      id: uid('veh'),
      nom: 'Fourgon blanc chantiers',
      marque: 'Renault',
      modele: 'Master',
      plaque: 'GE 123456',
      type: 'fourgon',
      annee: 2021,
      km: 84200,
      assigneUserId: ouvrier.id,
      controleTechnique: inDaysDate(20), // échéance proche (démo)
      assuranceEcheance: inDaysDate(210),
      statut: 'actif',
      createdAt: now,
    },
    {
      id: uid('veh'),
      nom: 'Camionnette grise',
      marque: 'Fiat',
      modele: 'Ducato',
      plaque: 'GE 654321',
      type: 'camionnette',
      annee: 2019,
      km: 142500,
      assigneUserId: ouvrier2.id,
      controleTechnique: inDaysDate(150),
      assuranceEcheance: inDaysDate(60),
      statut: 'actif',
      createdAt: now,
    },
    {
      id: uid('veh'),
      nom: 'Voiture de service',
      marque: 'Skoda',
      modele: 'Octavia',
      plaque: 'GE 778899',
      type: 'voiture',
      annee: 2022,
      km: 38000,
      statut: 'entretien',
      note: 'Révision en cours au garage.',
      createdAt: now,
    },
  ]
  vehicules.forEach((v) => vehiculesDb.create(v))

  // ---- Démo RH : rappels / échéances ----
  const rappels: Rappel[] = [
    {
      id: uid('rap'),
      titre: 'Déclaration Tellco trimestrielle (LPP)',
      type: 'tellco',
      date: inDaysDate(12),
      note: '2ᵉ pilier — cotisations du trimestre.',
      createdAt: now,
    },
    {
      id: uid('rap'),
      titre: 'Renouvellement assurance flotte',
      type: 'assurance',
      date: inDaysDate(60),
      createdAt: now,
    },
    {
      id: uid('rap'),
      titre: 'Fin de période d’essai — Luan Gjonaj',
      type: 'contrat',
      date: inDaysDate(-3), // en retard (démo)
      cibleUserId: sousTraitant.id,
      createdAt: now,
    },
  ]
  rappels.forEach((r) => rappelsDb.create(r))

  localStorage.setItem(KEYS.seeded, '1')
}
