// Données de démonstration (mêmes comptes que l'app locale).
import bcrypt from 'bcryptjs'
import { collection, uid, save, isEmpty } from './store.js'

export function seedIfEmpty() {
  if (!isEmpty()) return

  const now = new Date().toISOString()
  const hash = (p) => bcrypt.hashSync(p, 8)

  const users = collection('users')
  const admin = {
    id: uid('usr'),
    email: 'admin@swisspaints.ch',
    password: hash('admin'),
    username: 'admin',
    nom: 'Müller',
    prenom: 'Thomas',
    role: 'admin',
    titre: 'Administrateur',
    telephone: '+41 79 000 00 00',
    createdAt: now,
  }
  const ouvrier = {
    id: uid('usr'),
    email: 'ouvrier@swisspaints.ch',
    password: hash('ouvrier'),
    username: 'jdupont',
    nom: 'Dupont',
    prenom: 'Jean',
    role: 'ouvrier',
    titre: 'Peintre',
    telephone: '+41 78 111 11 11',
    createdAt: now,
  }
  const ouvrier2 = {
    id: uid('usr'),
    email: 'marc@swisspaints.ch',
    password: hash('ouvrier'),
    username: 'mrossi',
    nom: 'Rossi',
    prenom: 'Marc',
    role: 'ouvrier',
    titre: 'Chef de chantier',
    telephone: '+41 78 222 22 22',
    createdAt: now,
  }
  const client = {
    id: uid('usr'),
    email: 'client@example.com',
    password: hash('client'),
    username: 'client1',
    nom: 'Favre',
    prenom: 'Sophie',
    role: 'client',
    titre: 'Cliente',
    telephone: '+41 76 333 33 33',
    createdAt: now,
  }
  users.push(admin, ouvrier, ouvrier2, client)

  const tasks = collection('tasks')
  tasks.push(
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
  )

  save()
}
