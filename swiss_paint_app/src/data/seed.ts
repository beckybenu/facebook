// Données de démonstration initiales (comme la base Adalo pré-remplie).
import { KEYS, usersDb, tasksDb, docsDb, timeDb, uid } from './db'
import type { User, Task, Document, TimeEntry } from '../types'

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

  // Un pointage déjà terminé pour la démo de la fiche d'heures
  const yesterday = new Date(Date.now() - 86400000)
  const entry: TimeEntry = {
    id: uid('te'),
    userId: ouvrier.id,
    taskId: tasks[0].id,
    clockIn: new Date(yesterday.setHours(8, 0, 0, 0)).toISOString(),
    clockOut: new Date(yesterday.setHours(17, 0, 0, 0)).toISOString(),
    lat: 46.5197,
    lng: 6.6323,
    note: 'Journée chantier Lausanne',
  }
  timeDb.create(entry)

  localStorage.setItem(KEYS.seeded, '1')
}
