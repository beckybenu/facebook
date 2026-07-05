import type { Team } from './types'

type Seed = Omit<Team, 'form'> & { form?: Team['form'] }

// attack ≈ goals scored / match, defense ≈ goals conceded / match (lower is better)
const seeds: Seed[] = [
  // Ligue 1
  { id: 'psg', name: 'Paris Saint-Germain', short: 'PSG', leagueId: 'l1', color: '#004170', attack: 2.35, defense: 0.85 },
  { id: 'om', name: 'Olympique de Marseille', short: 'OM', leagueId: 'l1', color: '#2faee0', attack: 1.75, defense: 1.15 },
  { id: 'ol', name: 'Olympique Lyonnais', short: 'OL', leagueId: 'l1', color: '#d90429', attack: 1.6, defense: 1.2 },
  { id: 'asm', name: 'AS Monaco', short: 'MON', leagueId: 'l1', color: '#e51b22', attack: 1.85, defense: 1.1 },
  { id: 'losc', name: 'LOSC Lille', short: 'LIL', leagueId: 'l1', color: '#e01e24', attack: 1.55, defense: 1.05 },
  { id: 'rcl', name: 'RC Lens', short: 'LEN', leagueId: 'l1', color: '#ffed00', attack: 1.5, defense: 1.1 },
  { id: 'rennes', name: 'Stade Rennais', short: 'REN', leagueId: 'l1', color: '#e30613', attack: 1.55, defense: 1.25 },
  { id: 'nice', name: 'OGC Nice', short: 'NIC', leagueId: 'l1', color: '#c8102e', attack: 1.4, defense: 1.0 },

  // Premier League
  { id: 'mci', name: 'Manchester City', short: 'MCI', leagueId: 'pl', color: '#6cabdd', attack: 2.4, defense: 0.9 },
  { id: 'ars', name: 'Arsenal', short: 'ARS', leagueId: 'pl', color: '#ef0107', attack: 2.15, defense: 0.85 },
  { id: 'liv', name: 'Liverpool', short: 'LIV', leagueId: 'pl', color: '#c8102e', attack: 2.25, defense: 1.0 },
  { id: 'che', name: 'Chelsea', short: 'CHE', leagueId: 'pl', color: '#034694', attack: 1.9, defense: 1.05 },
  { id: 'mun', name: 'Manchester United', short: 'MUN', leagueId: 'pl', color: '#da291c', attack: 1.7, defense: 1.25 },
  { id: 'tot', name: 'Tottenham', short: 'TOT', leagueId: 'pl', color: '#132257', attack: 2.0, defense: 1.3 },
  { id: 'new', name: 'Newcastle', short: 'NEW', leagueId: 'pl', color: '#241f20', attack: 1.8, defense: 1.15 },
  { id: 'avl', name: 'Aston Villa', short: 'AVL', leagueId: 'pl', color: '#95bfe5', attack: 1.75, defense: 1.2 },

  // LaLiga
  { id: 'rma', name: 'Real Madrid', short: 'RMA', leagueId: 'liga', color: '#febe10', attack: 2.3, defense: 0.9 },
  { id: 'fcb', name: 'FC Barcelone', short: 'BAR', leagueId: 'liga', color: '#a50044', attack: 2.35, defense: 1.0 },
  { id: 'atm', name: 'Atlético Madrid', short: 'ATM', leagueId: 'liga', color: '#cb3524', attack: 1.85, defense: 0.85 },
  { id: 'ath', name: 'Athletic Bilbao', short: 'ATH', leagueId: 'liga', color: '#ee2523', attack: 1.55, defense: 1.05 },
  { id: 'rso', name: 'Real Sociedad', short: 'RSO', leagueId: 'liga', color: '#0067b1', attack: 1.5, defense: 1.1 },
  { id: 'bet', name: 'Real Betis', short: 'BET', leagueId: 'liga', color: '#00954c', attack: 1.5, defense: 1.2 },
  { id: 'vil', name: 'Villarreal', short: 'VIL', leagueId: 'liga', color: '#ffe667', attack: 1.6, defense: 1.15 },
  { id: 'gir', name: 'Girona', short: 'GIR', leagueId: 'liga', color: '#cd2534', attack: 1.65, defense: 1.25 },

  // Serie A
  { id: 'int', name: 'Inter Milan', short: 'INT', leagueId: 'sa', color: '#0068a8', attack: 2.15, defense: 0.85 },
  { id: 'juv', name: 'Juventus', short: 'JUV', leagueId: 'sa', color: '#000000', attack: 1.75, defense: 0.9 },
  { id: 'mil', name: 'AC Milan', short: 'MIL', leagueId: 'sa', color: '#fb090b', attack: 1.85, defense: 1.05 },
  { id: 'nap', name: 'Napoli', short: 'NAP', leagueId: 'sa', color: '#12a0d7', attack: 1.9, defense: 1.0 },
  { id: 'rom', name: 'AS Roma', short: 'ROM', leagueId: 'sa', color: '#8e1f2f', attack: 1.65, defense: 1.1 },
  { id: 'laz', name: 'Lazio', short: 'LAZ', leagueId: 'sa', color: '#87d8f7', attack: 1.6, defense: 1.15 },
  { id: 'ata', name: 'Atalanta', short: 'ATA', leagueId: 'sa', color: '#1d1d1b', attack: 2.05, defense: 1.15 },
  { id: 'fio', name: 'Fiorentina', short: 'FIO', leagueId: 'sa', color: '#59349d', attack: 1.55, defense: 1.2 },

  // Bundesliga
  { id: 'bay', name: 'Bayern Munich', short: 'BAY', leagueId: 'bl', color: '#dc052d', attack: 2.5, defense: 0.95 },
  { id: 'bvb', name: 'Borussia Dortmund', short: 'BVB', leagueId: 'bl', color: '#fde100', attack: 2.05, defense: 1.2 },
  { id: 'rbl', name: 'RB Leipzig', short: 'RBL', leagueId: 'bl', color: '#dd0741', attack: 1.95, defense: 1.05 },
  { id: 'b04', name: 'Bayer Leverkusen', short: 'B04', leagueId: 'bl', color: '#e32221', attack: 2.15, defense: 0.95 },
  { id: 'sge', name: 'Eintracht Francfort', short: 'SGE', leagueId: 'bl', color: '#e1000f', attack: 1.75, defense: 1.25 },
  { id: 'vfb', name: 'VfB Stuttgart', short: 'VFB', leagueId: 'bl', color: '#e32219', attack: 1.8, defense: 1.2 },

  // National teams (World Cup 2026)
  { id: 'fra', name: 'France', short: 'FRA', leagueId: 'wc', color: '#1a2b6d', attack: 2.2, defense: 0.85 },
  { id: 'bra', name: 'Brésil', short: 'BRA', leagueId: 'wc', color: '#ffdf00', attack: 2.25, defense: 0.9 },
  { id: 'arg', name: 'Argentine', short: 'ARG', leagueId: 'wc', color: '#75aadb', attack: 2.15, defense: 0.85 },
  { id: 'esp', name: 'Espagne', short: 'ESP', leagueId: 'wc', color: '#c60b1e', attack: 2.1, defense: 0.9 },
  { id: 'eng', name: 'Angleterre', short: 'ENG', leagueId: 'wc', color: '#ffffff', attack: 2.0, defense: 0.95 },
  { id: 'ger', name: 'Allemagne', short: 'GER', leagueId: 'wc', color: '#000000', attack: 2.0, defense: 1.0 },
  { id: 'por', name: 'Portugal', short: 'POR', leagueId: 'wc', color: '#006600', attack: 2.05, defense: 0.95 },
  { id: 'ned', name: 'Pays-Bas', short: 'NED', leagueId: 'wc', color: '#ff6600', attack: 1.95, defense: 1.0 },
]

// Deterministic form generation from a team's own strength (no randomness at runtime)
function deriveForm(seed: Seed): Team['form'] {
  const strength = seed.attack - seed.defense // higher = better team
  const results: Array<'W' | 'D' | 'L'> = []
  // Hash the id into a stable pseudo-sequence
  let h = 0
  for (let i = 0; i < seed.id.length; i++) h = (h * 31 + seed.id.charCodeAt(i)) & 0xffff
  for (let i = 0; i < 5; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff
    const roll = (h % 100) / 100 // 0..1
    const winThreshold = 0.35 + strength * 0.25
    const drawThreshold = winThreshold + 0.25
    if (roll < winThreshold) results.push('W')
    else if (roll < drawThreshold) results.push('D')
    else results.push('L')
  }
  return results
}

export const teams: Team[] = seeds.map((s) => ({ ...s, form: s.form ?? deriveForm(s) }))

// Registre dynamique : les équipes de démo sont pré-enregistrées, les équipes
// issues de l'API live (préfixe "live-") s'y ajoutent au chargement.
const registry = new Map<string, Team>(teams.map((t) => [t.id, t]))

export function registerTeams(list: Team[]): void {
  for (const t of list) registry.set(t.id, t)
}

export const teamById = (id: string): Team | undefined => registry.get(id)

/**
 * Équipes d'une ligue. Si des équipes live sont enregistrées pour cette
 * ligue, elles remplacent les équipes de démonstration.
 */
export function teamsByLeague(leagueId: string): Team[] {
  const all = [...registry.values()].filter((t) => t.leagueId === leagueId)
  const live = all.filter((t) => t.id.startsWith('live-'))
  return live.length > 0 ? live : all
}
