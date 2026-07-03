// Persistance simple par fichier JSON (aucune dépendance native, déployable partout).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// DATA_FILE surchargeable via variable d'env (ex: disque persistant Render)
const DATA_FILE = process.env.DATA_FILE || join(__dirname, '..', 'data.json')

const EMPTY = { users: [], tasks: [], timeEntries: [], devis: [], documents: [] }

let db = { ...EMPTY }

export function load() {
  if (existsSync(DATA_FILE)) {
    try {
      db = { ...EMPTY, ...JSON.parse(readFileSync(DATA_FILE, 'utf-8')) }
    } catch {
      db = { ...EMPTY }
    }
  }
  return db
}

export function save() {
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2))
}

export function collection(name) {
  if (!db[name]) db[name] = []
  return db[name]
}

export function isEmpty() {
  return Object.values(db).every((arr) => arr.length === 0)
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export { DATA_FILE }
