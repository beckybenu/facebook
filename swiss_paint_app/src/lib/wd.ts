// Accès au serveur de fichiers de l'entreprise (WD My Cloud EX2 Ultra).
// On ne peut pas parcourir les fichiers du NAS directement dans l'app
// (sécurité navigateur : HTTPS + CORS), mais on peut ouvrir le portail WD.
const KEY = 'sp_wd_url'

// Portail d'accès à distance WD My Cloud OS5 par défaut.
export const WD_DEFAULT = 'https://os5.mycloud.com'

export function getWdUrl(): string {
  return localStorage.getItem(KEY) || WD_DEFAULT
}
export function setWdUrl(url: string) {
  const clean = url.trim()
  if (clean) localStorage.setItem(KEY, clean)
  else localStorage.removeItem(KEY)
}

// ---------- Catalogue WD (fichiers/dossiers référencés, interrogeable par l'IA) ----------
export interface WdItem {
  id: string
  nom: string
  lien: string // lien de partage WD (ou URL du fichier)
  dossier?: string // ex : "Chantiers", "Contrats", "Factures"
  description?: string // infos utiles (l'IA s'en sert pour répondre)
  createdAt: string
}

const ITEMS_KEY = 'sp_wd_items'

export function getWdItems(): WdItem[] {
  try {
    return JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]') as WdItem[]
  } catch {
    return []
  }
}
function saveWdItems(list: WdItem[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(list))
}
export function addWdItem(it: Omit<WdItem, 'id' | 'createdAt'>): WdItem {
  const item: WdItem = {
    ...it,
    id: `wd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  saveWdItems([...getWdItems(), item])
  return item
}
export function removeWdItem(id: string) {
  saveWdItems(getWdItems().filter((x) => x.id !== id))
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Recherche simple sur nom + dossier + description
export function searchWdItems(query: string): WdItem[] {
  const q = norm(query).trim()
  if (!q) return getWdItems()
  const terms = q.split(/\s+/)
  return getWdItems().filter((it) => {
    const hay = norm(`${it.nom} ${it.dossier || ''} ${it.description || ''}`)
    return terms.every((t) => hay.includes(t))
  })
}
