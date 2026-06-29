// Mini "backend" local basé sur localStorage.
// Reproduit le rôle de la base de données intégrée d'Adalo, mais 100% côté client.
import type { User, Task, Document, TimeEntry } from '../types'

const KEYS = {
  users: 'sp_users',
  tasks: 'sp_tasks',
  documents: 'sp_documents',
  timeEntries: 'sp_time_entries',
  session: 'sp_session',
  seeded: 'sp_seeded_v2',
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

// ---------- Users ----------
export const usersDb = {
  all: () => read<User>(KEYS.users),
  byId: (id: string) => read<User>(KEYS.users).find((u) => u.id === id),
  byEmail: (email: string) =>
    read<User>(KEYS.users).find((u) => u.email.toLowerCase() === email.toLowerCase()),
  create: (u: User) => {
    const list = read<User>(KEYS.users)
    list.push(u)
    write(KEYS.users, list)
    return u
  },
  update: (u: User) => {
    const list = read<User>(KEYS.users).map((x) => (x.id === u.id ? u : x))
    write(KEYS.users, list)
    return u
  },
  remove: (id: string) => write(KEYS.users, read<User>(KEYS.users).filter((u) => u.id !== id)),
}

// ---------- Tasks (chantiers) ----------
export const tasksDb = {
  all: () => read<Task>(KEYS.tasks),
  byId: (id: string) => read<Task>(KEYS.tasks).find((t) => t.id === id),
  forUser: (userId: string) => read<Task>(KEYS.tasks).filter((t) => t.assignedUserId === userId),
  create: (t: Task) => {
    const list = read<Task>(KEYS.tasks)
    list.push(t)
    write(KEYS.tasks, list)
    return t
  },
  update: (t: Task) => {
    write(KEYS.tasks, read<Task>(KEYS.tasks).map((x) => (x.id === t.id ? t : x)))
    return t
  },
  remove: (id: string) => write(KEYS.tasks, read<Task>(KEYS.tasks).filter((t) => t.id !== id)),
}

// ---------- Documents ----------
export const docsDb = {
  all: () => read<Document>(KEYS.documents),
  byId: (id: string) => read<Document>(KEYS.documents).find((d) => d.id === id),
  create: (d: Document) => {
    const list = read<Document>(KEYS.documents)
    list.push(d)
    write(KEYS.documents, list)
    return d
  },
  update: (d: Document) => {
    write(KEYS.documents, read<Document>(KEYS.documents).map((x) => (x.id === d.id ? d : x)))
    return d
  },
  remove: (id: string) =>
    write(KEYS.documents, read<Document>(KEYS.documents).filter((d) => d.id !== id)),
}

// ---------- Pointage ----------
export const timeDb = {
  all: () => read<TimeEntry>(KEYS.timeEntries),
  forUser: (userId: string) =>
    read<TimeEntry>(KEYS.timeEntries)
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.clockIn.localeCompare(a.clockIn)),
  openForUser: (userId: string) =>
    read<TimeEntry>(KEYS.timeEntries).find((e) => e.userId === userId && !e.clockOut),
  create: (e: TimeEntry) => {
    const list = read<TimeEntry>(KEYS.timeEntries)
    list.push(e)
    write(KEYS.timeEntries, list)
    return e
  },
  update: (e: TimeEntry) => {
    write(KEYS.timeEntries, read<TimeEntry>(KEYS.timeEntries).map((x) => (x.id === e.id ? e : x)))
    return e
  },
}

// ---------- Session ----------
export const sessionDb = {
  get: (): string | null => localStorage.getItem(KEYS.session),
  set: (userId: string) => localStorage.setItem(KEYS.session, userId),
  clear: () => localStorage.removeItem(KEYS.session),
}

export { KEYS }
