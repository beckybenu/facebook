import type { Fixture } from './types'
import { teamsByLeague } from './teams'
import { leagues } from './leagues'

/**
 * Build a deterministic fixture list for the coming days. Each league plays a
 * round; matchups are paired stably so the schedule is identical on reload.
 * Kickoffs are spread across afternoons/evenings starting from `from`.
 */
export function buildFixtures(from: Date): Fixture[] {
  const fixtures: Fixture[] = []
  const startOfDay = new Date(from)
  startOfDay.setHours(0, 0, 0, 0)

  const kickoffSlots = [13, 15, 17, 18.5, 21] // hours

  leagues.forEach((league, li) => {
    const teams = teamsByLeague(league.id)
    // Pair teams: 0-1, 2-3, ... rotating home/away by day
    for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
      const rotation = dayOffset % (teams.length - 1 || 1)
      for (let i = 0; i < Math.floor(teams.length / 2); i++) {
        const homeIdx = (i + rotation) % teams.length
        const awayIdx = (teams.length - 1 - i + rotation) % teams.length
        if (homeIdx === awayIdx) continue
        // Only schedule ~2 matches per league per day to keep it realistic
        if (i > 1) continue

        const kickoff = new Date(startOfDay)
        kickoff.setDate(kickoff.getDate() + dayOffset)
        const slot = kickoffSlots[(li + i) % kickoffSlots.length]
        kickoff.setHours(Math.floor(slot), (slot % 1) * 60, 0, 0)

        const home = teams[homeIdx]
        const away = teams[awayIdx]
        const id = `${league.id}-${dayOffset}-${home.id}-${away.id}`

        const now = from.getTime()
        const diff = kickoff.getTime() - now
        let status: Fixture['status'] = 'upcoming'
        let minute: number | undefined
        let homeGoals: number | undefined
        let awayGoals: number | undefined
        if (diff < -110 * 60 * 1000) {
          status = 'finished'
          // Stable pseudo score from id
          let h = 0
          for (let c = 0; c < id.length; c++) h = (h * 31 + id.charCodeAt(c)) & 0xffff
          homeGoals = h % 4
          awayGoals = (h >> 3) % 4
        } else if (diff < 0) {
          status = 'live'
          minute = Math.min(90, Math.floor(-diff / (60 * 1000)))
          let h = 0
          for (let c = 0; c < id.length; c++) h = (h * 31 + id.charCodeAt(c)) & 0xffff
          homeGoals = (h % 3) as number
          awayGoals = ((h >> 4) % 2) as number
        }

        fixtures.push({
          id,
          leagueId: league.id,
          homeId: home.id,
          awayId: away.id,
          kickoff: kickoff.toISOString(),
          status,
          minute,
          homeGoals,
          awayGoals,
        })
      }
    }
  })

  return fixtures.sort((a, b) => a.kickoff.localeCompare(b.kickoff))
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
