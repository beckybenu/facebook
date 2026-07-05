import type { Fixture, Team } from './types'

/**
 * Client TheSportsDB (https://www.thesportsdb.com/api.php).
 * API publique avec clé de test, CORS ouvert — utilisable depuis une app
 * statique. Les réponses sont mises en cache dans localStorage pour
 * respecter le rate limit (~30 req/min).
 */

/** Nos ids de ligue → ids TheSportsDB */
export const TSDB_LEAGUE_IDS: Record<string, string> = {
  l1: '4334', // Ligue 1
  pl: '4328', // Premier League
  liga: '4335', // LaLiga
  sa: '4332', // Serie A
  bl: '4331', // Bundesliga
  ucl: '4480', // UEFA Champions League
  wc: '4429', // FIFA World Cup
}

// La clé de test documentée a changé au fil du temps ('3' puis '123') :
// on essaie les deux avant d'abandonner.
const API_KEYS = ['123', '3']
const CACHE_TTL_MS = 15 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000

interface TsdbEvent {
  idEvent: string
  idHomeTeam: string | null
  idAwayTeam: string | null
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  dateEvent: string | null
  strTime: string | null
  strTimestamp: string | null
  strStatus: string | null
}

export interface LeagueLiveData {
  leagueId: string
  teams: Team[]
  fixtures: Fixture[]
}

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

function cacheGet(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function cacheSet(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // stockage plein ou indisponible : on continue sans cache
  }
}

async function fetchEvents(
  endpoint: 'eventsnextleague' | 'eventspastleague',
  tsdbId: string,
): Promise<TsdbEvent[]> {
  const cacheKey = `kickly:${endpoint}:${tsdbId}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached as TsdbEvent[]

  let lastError: unknown = null
  for (const key of API_KEYS) {
    try {
      const data = (await fetchJson(
        `https://www.thesportsdb.com/api/v1/json/${key}/${endpoint}.php?id=${tsdbId}`,
      )) as { events?: TsdbEvent[] | null; results?: TsdbEvent[] | null }
      const events = data.events ?? data.results ?? []
      cacheSet(cacheKey, events)
      return events
    } catch (e) {
      lastError = e
    }
  }
  throw lastError ?? new Error('API indisponible')
}

/** Nom court dérivé du nom complet (ignore les préfixes FC/AS/AC...). */
function shortName(name: string): string {
  const skip = new Set(['fc', 'as', 'ac', 'sc', 'cf', 'afc', 'ssc', 'rc', 'rcd', 'cd', 'us', '1.'])
  const words = name.split(/\s+/).filter((w) => !skip.has(w.toLowerCase()))
  const main = words[0] ?? name
  return main.slice(0, 3).toUpperCase()
}

/** Couleur stable dérivée du nom (les logos ne sont pas embarqués). */
function teamColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff
  return `hsl(${h % 360}, 62%, 42%)`
}

function kickoffIso(ev: TsdbEvent): string {
  if (ev.strTimestamp) {
    // Les timestamps TSDB sont en UTC, parfois sans suffixe de zone
    const iso = ev.strTimestamp.includes('T') ? ev.strTimestamp : ev.strTimestamp.replace(' ', 'T')
    return iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`
  }
  const date = ev.dateEvent ?? new Date().toISOString().slice(0, 10)
  const time = ev.strTime && /^\d\d:\d\d/.test(ev.strTime) ? ev.strTime.slice(0, 5) : '20:00'
  return `${date}T${time}:00Z`
}

const LIVE_STATUSES = new Set(['1H', '2H', 'HT', '1st Half', '2nd Half', 'Halftime', 'ET', 'BT', 'P'])
const FINISHED_RE = /finish|^ft$|aet|pen/i

function eventStatus(ev: TsdbEvent, kickoff: string): Fixture['status'] {
  const status = ev.strStatus ?? ''
  if (FINISHED_RE.test(status)) return 'finished'
  if (LIVE_STATUSES.has(status)) return 'live'
  const started = Date.now() - new Date(kickoff).getTime()
  const hasScore = ev.intHomeScore != null && ev.intAwayScore != null
  if (hasScore && started > 130 * 60 * 1000) return 'finished'
  if (hasScore && started > 0) return 'live'
  return 'upcoming'
}

interface TeamStats {
  id: string
  name: string
  played: number
  scored: number
  conceded: number
  results: Array<'W' | 'D' | 'L'>
}

/**
 * Charge et transforme les données d'une ligue : équipes (avec ratings
 * calculés depuis les vrais résultats récents) + matchs à venir/passés.
 */
export async function loadLeagueLive(leagueId: string): Promise<LeagueLiveData | null> {
  const tsdbId = TSDB_LEAGUE_IDS[leagueId]
  if (!tsdbId) return null

  const [next, past] = await Promise.all([
    fetchEvents('eventsnextleague', tsdbId),
    fetchEvents('eventspastleague', tsdbId).catch(() => [] as TsdbEvent[]),
  ])
  if (next.length === 0 && past.length === 0) return null

  // Statistiques par équipe à partir des résultats passés
  const stats = new Map<string, TeamStats>()
  const statFor = (id: string, name: string): TeamStats => {
    let s = stats.get(id)
    if (!s) {
      s = { id, name, played: 0, scored: 0, conceded: 0, results: [] }
      stats.set(id, s)
    }
    return s
  }

  // past est trié du plus récent au plus ancien → on parcourt à l'envers
  // pour que results finisse par le match le plus récent (convention de Team.form)
  for (const ev of [...past].reverse()) {
    const hs = ev.intHomeScore != null ? Number(ev.intHomeScore) : null
    const as_ = ev.intAwayScore != null ? Number(ev.intAwayScore) : null
    if (hs == null || as_ == null || Number.isNaN(hs) || Number.isNaN(as_)) continue
    const homeId = ev.idHomeTeam ?? ev.strHomeTeam
    const awayId = ev.idAwayTeam ?? ev.strAwayTeam
    const home = statFor(homeId, ev.strHomeTeam)
    const away = statFor(awayId, ev.strAwayTeam)
    home.played++
    away.played++
    home.scored += hs
    home.conceded += as_
    away.scored += as_
    away.conceded += hs
    home.results.push(hs > as_ ? 'W' : hs === as_ ? 'D' : 'L')
    away.results.push(as_ > hs ? 'W' : hs === as_ ? 'D' : 'L')
  }

  // Toutes les équipes rencontrées (passé + à venir)
  const teamIds = new Map<string, string>() // id -> name
  for (const ev of [...past, ...next]) {
    teamIds.set(ev.idHomeTeam ?? ev.strHomeTeam, ev.strHomeTeam)
    teamIds.set(ev.idAwayTeam ?? ev.strAwayTeam, ev.strAwayTeam)
  }

  const teams: Team[] = [...teamIds.entries()].map(([id, name]) => {
    const s = stats.get(id)
    const attack = s && s.played > 0 ? Math.max(0.4, s.scored / s.played) : 1.4
    const defense = s && s.played > 0 ? Math.max(0.4, s.conceded / s.played) : 1.2
    const form = (s?.results ?? []).slice(-5)
    while (form.length < 5) form.unshift('D')
    return {
      id: `live-${id}`,
      name,
      short: shortName(name),
      leagueId,
      color: teamColor(name),
      attack: Math.round(attack * 100) / 100,
      defense: Math.round(defense * 100) / 100,
      form,
    }
  })

  const seen = new Set<string>()
  const fixtures: Fixture[] = []
  for (const ev of [...past, ...next]) {
    if (seen.has(ev.idEvent)) continue
    seen.add(ev.idEvent)
    const kickoff = kickoffIso(ev)
    const status = eventStatus(ev, kickoff)
    const minute =
      status === 'live'
        ? Math.min(90, Math.max(1, Math.floor((Date.now() - new Date(kickoff).getTime()) / 60000)))
        : undefined
    fixtures.push({
      id: `live-${ev.idEvent}`,
      leagueId,
      homeId: `live-${ev.idHomeTeam ?? ev.strHomeTeam}`,
      awayId: `live-${ev.idAwayTeam ?? ev.strAwayTeam}`,
      kickoff,
      status,
      minute,
      homeGoals: ev.intHomeScore != null ? Number(ev.intHomeScore) : undefined,
      awayGoals: ev.intAwayScore != null ? Number(ev.intAwayScore) : undefined,
    })
  }

  return { leagueId, teams, fixtures }
}
