// Mini "backend" local basé sur localStorage.
// Reproduit le rôle de la base de données intégrée d'Adalo, mais 100% côté client.
import type {
  User,
  Task,
  Document,
  TimeEntry,
  Devis,
  Absence,
  NoteFrais,
  Annonce,
  Vehicule,
  Rappel,
  Notification,
} from '../types'
import { isCloud, getCache, upsertLocal, removeLocal, type CollectionName } from './remote'

const KEYS = {
  users: 'sp_users',
  tasks: 'sp_tasks',
  documents: 'sp_documents',
  timeEntries: 'sp_time_entries',
  devis: 'sp_devis',
  absences: 'sp_absences',
  notesFrais: 'sp_notes_frais',
  annonces: 'sp_annonces',
  vehicules: 'sp_vehicules',
  rappels: 'sp_rappels',
  notifications: 'sp_notifications',
  session: 'sp_session',
  seeded: 'sp_seeded_v5',
} as const

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// Accès unifié : en mode "cloud" on lit/écrit le cache distant, sinon localStorage.
function src<T>(name: CollectionName, key: string): T[] {
  return isCloud() ? getCache<T>(name) : read<T>(key)
}
function put<T extends { id: string }>(name: CollectionName, key: string, obj: T): T {
  if (isCloud()) return upsertLocal(name, obj)
  const list = read<T>(key)
  const idx = list.findIndex((x) => x.id === obj.id)
  if (idx >= 0) list[idx] = obj
  else list.push(obj)
  write(key, list)
  return obj
}
function del<T extends { id: string }>(name: CollectionName, key: string, id: string): void {
  if (isCloud()) {
    removeLocal(name, id)
    return
  }
  write(
    key,
    read<T>(key).filter((x) => x.id !== id),
  )
}

// ---------- Users ----------
export const usersDb = {
  all: () => src<User>('users', KEYS.users),
  byId: (id: string) => usersDb.all().find((u) => u.id === id),
  byEmail: (email: string) =>
    usersDb.all().find((u) => u.email.toLowerCase() === email.toLowerCase()),
  create: (u: User) => put('users', KEYS.users, u),
  update: (u: User) => put('users', KEYS.users, u),
  remove: (id: string) => del<User>('users', KEYS.users, id),
}

// ---------- Tasks (chantiers) ----------
export const tasksDb = {
  all: () => src<Task>('tasks', KEYS.tasks),
  byId: (id: string) => tasksDb.all().find((t) => t.id === id),
  forUser: (userId: string) =>
    tasksDb
      .all()
      .filter(
        (t) => t.assignedUserId === userId || (t.assignedUserIds || []).includes(userId),
      ),
  create: (t: Task) => put('tasks', KEYS.tasks, t),
  update: (t: Task) => put('tasks', KEYS.tasks, t),
  remove: (id: string) => del<Task>('tasks', KEYS.tasks, id),
}

// ---------- Documents ----------
export const docsDb = {
  all: () => src<Document>('documents', KEYS.documents),
  byId: (id: string) => docsDb.all().find((d) => d.id === id),
  create: (d: Document) => put('documents', KEYS.documents, d),
  update: (d: Document) => put('documents', KEYS.documents, d),
  remove: (id: string) => del<Document>('documents', KEYS.documents, id),
}

// ---------- Pointage ----------
export const timeDb = {
  all: () => src<TimeEntry>('timeEntries', KEYS.timeEntries),
  forUser: (userId: string) =>
    timeDb
      .all()
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.clockIn.localeCompare(a.clockIn)),
  openForUser: (userId: string) =>
    timeDb.all().find((e) => e.userId === userId && !e.clockOut),
  create: (e: TimeEntry) => put('timeEntries', KEYS.timeEntries, e),
  update: (e: TimeEntry) => put('timeEntries', KEYS.timeEntries, e),
}

// ---------- RH : Absences ----------
export const absencesDb = {
  all: () =>
    [...src<Absence>('absences', KEYS.absences)].sort((a, b) =>
      b.dateDebut.localeCompare(a.dateDebut),
    ),
  forUser: (userId: string) => absencesDb.all().filter((a) => a.userId === userId),
  byId: (id: string) => absencesDb.all().find((a) => a.id === id),
  create: (a: Absence) => put('absences', KEYS.absences, a),
  update: (a: Absence) => put('absences', KEYS.absences, a),
  remove: (id: string) => del<Absence>('absences', KEYS.absences, id),
}

// ---------- RH : Notes de frais ----------
export const fraisDb = {
  all: () =>
    [...src<NoteFrais>('notesFrais', KEYS.notesFrais)].sort((a, b) => b.date.localeCompare(a.date)),
  forUser: (userId: string) => fraisDb.all().filter((n) => n.userId === userId),
  byId: (id: string) => fraisDb.all().find((n) => n.id === id),
  create: (n: NoteFrais) => put('notesFrais', KEYS.notesFrais, n),
  update: (n: NoteFrais) => put('notesFrais', KEYS.notesFrais, n),
  remove: (id: string) => del<NoteFrais>('notesFrais', KEYS.notesFrais, id),
}

// ---------- RH : Annonces (tableau blanc) ----------
export const annoncesDb = {
  all: () =>
    [...src<Annonce>('annonces', KEYS.annonces)].sort((a, b) => {
      // épinglées d'abord, puis par date décroissante
      if (!!a.epingle !== !!b.epingle) return a.epingle ? -1 : 1
      return b.createdAt.localeCompare(a.createdAt)
    }),
  byId: (id: string) => annoncesDb.all().find((a) => a.id === id),
  create: (a: Annonce) => put('annonces', KEYS.annonces, a),
  update: (a: Annonce) => put('annonces', KEYS.annonces, a),
  remove: (id: string) => del<Annonce>('annonces', KEYS.annonces, id),
}

// ---------- RH : Véhicules (flotte) ----------
export const vehiculesDb = {
  all: () =>
    [...src<Vehicule>('vehicules', KEYS.vehicules)].sort((a, b) => a.nom.localeCompare(b.nom)),
  byId: (id: string) => vehiculesDb.all().find((v) => v.id === id),
  forUser: (userId: string) => vehiculesDb.all().filter((v) => v.assigneUserId === userId),
  create: (v: Vehicule) => put('vehicules', KEYS.vehicules, v),
  update: (v: Vehicule) => put('vehicules', KEYS.vehicules, v),
  remove: (id: string) => del<Vehicule>('vehicules', KEYS.vehicules, id),
}

// ---------- RH : Rappels / échéances ----------
export const rappelsDb = {
  all: () => [...src<Rappel>('rappels', KEYS.rappels)].sort((a, b) => a.date.localeCompare(b.date)),
  byId: (id: string) => rappelsDb.all().find((r) => r.id === id),
  create: (r: Rappel) => put('rappels', KEYS.rappels, r),
  update: (r: Rappel) => put('rappels', KEYS.rappels, r),
  remove: (id: string) => del<Rappel>('rappels', KEYS.rappels, id),
}

// ---------- Notifications ----------
export const notifDb = {
  all: () => src<Notification>('notifications', KEYS.notifications),
  forUser: (userId: string) =>
    notifDb
      .all()
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  unreadCount: (userId: string) => notifDb.forUser(userId).filter((n) => !n.lu).length,
  create: (n: Notification) => put('notifications', KEYS.notifications, n),
  update: (n: Notification) => put('notifications', KEYS.notifications, n),
  markAllRead: (userId: string) => {
    notifDb.forUser(userId).forEach((n) => {
      if (!n.lu) put('notifications', KEYS.notifications, { ...n, lu: true })
    })
  },
  remove: (id: string) => del<Notification>('notifications', KEYS.notifications, id),
}

// ---------- Devis ----------
export const devisDb = {
  all: () =>
    [...src<Devis>('devis', KEYS.devis)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  byId: (id: string) => devisDb.all().find((d) => d.id === id),
  create: (d: Devis) => put('devis', KEYS.devis, d),
  update: (d: Devis) => put('devis', KEYS.devis, d),
  remove: (id: string) => del<Devis>('devis', KEYS.devis, id),
  // Génère le prochain numéro au format DE-AAAA-MM-NN
  nextNumero: (year: number, month: number): string => {
    const mm = String(month).padStart(2, '0')
    const prefix = `DE-${year}-${mm}-`
    const n = devisDb.all().filter((d) => d.numero.startsWith(prefix)).length + 1
    return `${prefix}${String(n).padStart(2, '0')}`
  },
}

// ---------- Session ----------
export const sessionDb = {
  get: (): string | null => localStorage.getItem(KEYS.session),
  set: (userId: string) => localStorage.setItem(KEYS.session, userId),
  clear: () => localStorage.removeItem(KEYS.session),
}

export { KEYS }
