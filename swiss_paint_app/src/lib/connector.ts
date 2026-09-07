// Client du connecteur WD local (lecture du contenu des fichiers).
// Config stockée dans le navigateur ; appels HTTPS avec jeton.
const KEY = 'sp_connector'

export interface ConnCfg {
  url: string
  token: string
}

export function getConnector(): ConnCfg | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null') as ConnCfg | null
    return c && c.url ? c : null
  } catch {
    return null
  }
}
export function setConnector(c: ConnCfg) {
  localStorage.setItem(KEY, JSON.stringify(c))
}
export function clearConnector() {
  localStorage.removeItem(KEY)
}
export function connectorConfigured(): boolean {
  return !!getConnector()
}

async function api(pathq: string, cfg = getConnector()): Promise<Response> {
  if (!cfg) throw new Error('Connecteur non configuré')
  const base = cfg.url.replace(/\/+$/, '')
  return fetch(`${base}${pathq}`, {
    headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
  })
}

export async function pingConnector(cfg: ConnCfg): Promise<boolean> {
  try {
    const r = await fetch(`${cfg.url.replace(/\/+$/, '')}/api/health`)
    return (await r.json()).ok === true
  } catch {
    return false
  }
}

export interface WdEntry {
  name: string
  path: string
  type: 'dir' | 'file'
  size?: number
}

export async function connList(path = ''): Promise<{ path: string; entries: WdEntry[] } | null> {
  try {
    const r = await api(`/api/list?path=${encodeURIComponent(path)}`)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}
export async function connSearch(q: string): Promise<WdEntry[]> {
  try {
    const r = await api(`/api/search?q=${encodeURIComponent(q)}`)
    if (!r.ok) return []
    return (await r.json()).results || []
  } catch {
    return []
  }
}
export async function connRead(
  path: string,
): Promise<{ name: string; text: string; truncated?: boolean; unsupported?: boolean } | null> {
  try {
    const r = await api(`/api/read?path=${encodeURIComponent(path)}`)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}
