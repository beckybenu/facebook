// Client de l'API SwissPaints (mode "cloud").
// Un cache en mémoire miroir permet aux pages de rester synchrones ;
// les écritures sont envoyées au serveur et le cache est rafraîchi par polling.
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

const URL_KEY = 'sp_server_url'
const TOKEN_KEY = 'sp_token'

export type CollectionName =
  | 'users'
  | 'tasks'
  | 'timeEntries'
  | 'devis'
  | 'documents'
  | 'absences'
  | 'notesFrais'
  | 'annonces'
  | 'vehicules'
  | 'rappels'
  | 'notifications'

interface Cache {
  users: User[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  devis: Devis[]
  documents: Document[]
  absences: Absence[]
  notesFrais: NoteFrais[]
  annonces: Annonce[]
  vehicules: Vehicule[]
  rappels: Rappel[]
  notifications: Notification[]
}

const cache: Cache = {
  users: [],
  tasks: [],
  timeEntries: [],
  devis: [],
  documents: [],
  absences: [],
  notesFrais: [],
  annonces: [],
  vehicules: [],
  rappels: [],
  notifications: [],
}

// Mapping collection -> chemin d'API
const PATHS: Record<CollectionName, string> = {
  users: 'users',
  tasks: 'tasks',
  timeEntries: 'timeentries',
  devis: 'devis',
  documents: 'documents',
  absences: 'absences',
  notesFrais: 'notesfrais',
  annonces: 'annonces',
  vehicules: 'vehicules',
  rappels: 'rappels',
  notifications: 'notifications',
}

// ---------- Config ----------
export function getServerUrl(): string {
  return (localStorage.getItem(URL_KEY) || '').replace(/\/+$/, '')
}
export function setServerUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, '')
  if (clean) localStorage.setItem(URL_KEY, clean)
  else localStorage.removeItem(URL_KEY)
}
export function isCloud(): boolean {
  return !!getServerUrl()
}
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

// ---------- Bas niveau ----------
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getServerUrl()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${base}/api/${path}`, { ...options, headers })
}

export async function ping(url: string): Promise<boolean> {
  try {
    const base = url.trim().replace(/\/+$/, '')
    const r = await fetch(`${base}/api/health`)
    const j = await r.json()
    return !!j.ok
  } catch {
    return false
  }
}

// ---------- Auth ----------
export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string; user?: User }> {
  try {
    const r = await apiFetch('auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    const j = await r.json()
    if (!r.ok) return { ok: false, error: j.error || 'Connexion impossible.' }
    setToken(j.token)
    await hydrate()
    return { ok: true, user: j.user }
  } catch {
    return { ok: false, error: 'Serveur injoignable.' }
  }
}

export async function signup(input: Record<string, unknown>): Promise<{ ok: boolean; error?: string; user?: User }> {
  try {
    const r = await apiFetch('auth/signup', { method: 'POST', body: JSON.stringify(input) })
    const j = await r.json()
    if (!r.ok) return { ok: false, error: j.error || 'Inscription impossible.' }
    setToken(j.token)
    await hydrate()
    return { ok: true, user: j.user }
  } catch {
    return { ok: false, error: 'Serveur injoignable.' }
  }
}

export async function me(): Promise<User | null> {
  try {
    const r = await apiFetch('me')
    if (!r.ok) return null
    const j = await r.json()
    return j.user
  } catch {
    return null
  }
}

export function logout() {
  setToken(null)
  cache.users = []
  cache.tasks = []
  cache.timeEntries = []
  cache.devis = []
  cache.documents = []
  cache.absences = []
  cache.notesFrais = []
  cache.annonces = []
  cache.vehicules = []
  cache.rappels = []
  cache.notifications = []
}

// ---------- Cache ----------
export async function hydrate(): Promise<boolean> {
  try {
    const r = await apiFetch('state')
    if (!r.ok) return false
    const j = (await r.json()) as Cache
    cache.users = j.users || []
    cache.tasks = j.tasks || []
    cache.timeEntries = j.timeEntries || []
    cache.devis = j.devis || []
    cache.documents = j.documents || []
    return true
  } catch {
    return false
  }
}

export function getCache<T>(name: CollectionName): T[] {
  return cache[name] as unknown as T[]
}

// Écriture optimiste : met à jour le cache tout de suite, puis synchronise le serveur.
export function upsertLocal<T extends { id: string }>(name: CollectionName, obj: T): T {
  const list = cache[name] as unknown as T[]
  const idx = list.findIndex((x) => x.id === obj.id)
  if (idx >= 0) list[idx] = obj
  else list.push(obj)
  // Envoi serveur en arrière-plan (le cache sera reconfirmé au prochain polling)
  apiFetch(PATHS[name], { method: 'POST', body: JSON.stringify(obj) }).catch(() => {})
  return obj
}

export function removeLocal(name: CollectionName, id: string): void {
  const list = cache[name] as unknown as { id: string }[]
  const idx = list.findIndex((x) => x.id === id)
  if (idx >= 0) list.splice(idx, 1)
  apiFetch(`${PATHS[name]}/${id}`, { method: 'DELETE' }).catch(() => {})
}

// ---------- IA ----------
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function aiStatus(): Promise<boolean> {
  if (!isCloud()) return false
  try {
    const r = await apiFetch('ai/status')
    if (!r.ok) return false
    return (await r.json()).available === true
  } catch {
    return false
  }
}

export async function aiChat(messages: ChatMessage[]): Promise<{ ok: boolean; reply?: string; error?: string }> {
  try {
    const r = await apiFetch('ai/chat', { method: 'POST', body: JSON.stringify({ messages }) })
    const j = await r.json()
    if (!r.ok) return { ok: false, error: j.error || 'Erreur IA.' }
    return { ok: true, reply: j.reply }
  } catch {
    return { ok: false, error: 'Serveur injoignable.' }
  }
}

export async function aiDevis(prompt: string): Promise<{ ok: boolean; devis?: unknown; error?: string }> {
  try {
    const r = await apiFetch('ai/devis', { method: 'POST', body: JSON.stringify({ prompt }) })
    const j = await r.json()
    if (!r.ok) return { ok: false, error: j.error || 'Erreur IA.' }
    return { ok: true, devis: j }
  } catch {
    return { ok: false, error: 'Serveur injoignable.' }
  }
}

// ---------- Recherche documentaire NAS (administrateur uniquement) ----------
export interface NasSearchResult {
  path: string
  reference: string
  extrait: string
}

export async function searchNasDocuments(
  query: string
): Promise<{ ok: boolean; results?: NasSearchResult[]; error?: string }> {
  if (!isCloud()) {
    return { ok: false, error: 'Connecte d’abord ton application au serveur SwissPaints.' }
  }

  try {
    const response = await apiFetch('ai/documents', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Recherche documentaire impossible.',
      }
    }

    return { ok: true, results: data.results || [] }
  } catch {
    return { ok: false, error: 'Serveur SwissPaints injoignable.' }
  }
}

// ---------- Assistant IA documentaire local (Qwen3 / Ollama) ----------
export interface NasAiSource {
  numero: number
  reference: string
  path: string
}

export async function askNasAi(
  question: string
): Promise<{ ok: boolean; reply?: string; sources?: NasAiSource[]; error?: string }> {
  if (!isCloud()) {
    return { ok: false, error: 'Connecte d’abord ton application au serveur SwissPaints.' }
  }

  try {
    const response = await apiFetch('ai/nas-chat', {
      method: 'POST',
      body: JSON.stringify({ question }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Assistant documentaire indisponible.',
      }
    }

    return {
      ok: true,
      reply: data.reply || '',
      sources: data.sources || [],
    }
  } catch {
    return { ok: false, error: 'Connexion à l’assistant local impossible.' }
  }
}
