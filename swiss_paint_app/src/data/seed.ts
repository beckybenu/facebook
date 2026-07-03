// Données de démonstration initiales (comme la base Adalo pré-remplie).
import { KEYS, usersDb, tasksDb, docsDb, timeDb, devisDb, uid } from './db'
import type { User, Task, Document, TimeEntry, Devis } from '../types'
import { DEFAULT_REMARQUES, DEFAULT_INTRO } from '../lib/company'

export function seedIfNeeded(): void {
  if (localStorage.getItem(KEYS.seeded)) return

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

  ;[admin, ouvrier, ouvrier2, client].forEach((u) => usersDb.create(u))

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

  localStorage.setItem(KEYS.seeded, '1')
}
