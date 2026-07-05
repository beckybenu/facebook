import type { League } from './types'

export const leagues: League[] = [
  { id: 'l1', name: 'Ligue 1', country: 'France', flag: '🇫🇷', color: '#1a2b6d' },
  { id: 'pl', name: 'Premier League', country: 'Angleterre', flag: '🏴', color: '#3d195b' },
  { id: 'liga', name: 'LaLiga', country: 'Espagne', flag: '🇪🇸', color: '#e60026' },
  { id: 'sa', name: 'Serie A', country: 'Italie', flag: '🇮🇹', color: '#0a4595' },
  { id: 'bl', name: 'Bundesliga', country: 'Allemagne', flag: '🇩🇪', color: '#d20515' },
  { id: 'ucl', name: 'Ligue des Champions', country: 'Europe', flag: '🇪🇺', color: '#0b1e5b' },
  { id: 'uel', name: 'Ligue Europa', country: 'Europe', flag: '🇪🇺', color: '#f68e1e' },
  { id: 'bra', name: 'Brasileirão', country: 'Brésil', flag: '🇧🇷', color: '#009c3b' },
  { id: 'argp', name: 'Primera División', country: 'Argentine', flag: '🇦🇷', color: '#75aadb' },
  { id: 'mls', name: 'MLS', country: 'États-Unis', flag: '🇺🇸', color: '#1d3c6e' },
  { id: 'wc', name: 'Coupe du Monde 2026', country: 'International', flag: '🌍', color: '#c6ff3d' },
]

export const leagueById = (id: string) => leagues.find((l) => l.id === id)
