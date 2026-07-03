// Mini "backend" local basé sur localStorage.
// Reproduit le rôle de la base de données intégrée d'Adalo, mais 100% côté client.
import type { User, Task, Document, TimeEntry, Devis } from '../types'
import { isCloud, getCache, upsertLocal, removeLocal, type CollectionName } from './remote'

const KEYS = {
  users: 'sp_users',
  tasks: 'sp_tasks',
  documents: 'sp_documents',
  timeEntries: 'sp_time_entries',
  devis: 'sp_devis',
  session: 'sp_session',
  seeded: 'sp_seeded_v3',
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
  forUser: (userId: string) => tasksDb.all().filter((t) => t.assignedUserId === userId),
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
