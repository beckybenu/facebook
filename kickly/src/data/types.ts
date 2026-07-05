export interface League {
  id: string
  name: string
  country: string
  flag: string // emoji
  color: string
}

export interface Team {
  id: string
  name: string
  short: string
  leagueId: string
  color: string
  /** Attacking strength, roughly goals scored per match at neutral venue */
  attack: number
  /** Defensive strength, roughly goals conceded per match (lower = better) */
  defense: number
  /** Recent form: array of results, most recent last. W=win D=draw L=loss */
  form: Array<'W' | 'D' | 'L'>
}

export interface Fixture {
  id: string
  leagueId: string
  homeId: string
  awayId: string
  /** ISO datetime */
  kickoff: string
  status: 'upcoming' | 'live' | 'finished'
  /** Minute if live */
  minute?: number
  homeGoals?: number
  awayGoals?: number
}

export interface Prediction {
  fixtureId: string
  /** Probabilities that sum to 1 */
  homeWin: number
  draw: number
  awayWin: number
  /** Expected goals */
  xgHome: number
  xgAway: number
  /** Most likely scoreline */
  scoreHome: number
  scoreAway: number
  /** 0-100 confidence in the top pick */
  confidence: number
  /** Both teams to score probability */
  btts: number
  /** Over 2.5 goals probability */
  over25: number
  /** The recommended pick label */
  pick: '1' | 'N' | '2'
  /** Fair decimal odds for the pick */
  fairOdds: number
}
