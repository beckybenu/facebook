import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { EnrichedFixture } from '../lib/store'
import { teamById } from '../data/teams'
import { leagueById } from '../data/leagues'
import { pickTeamName } from '../data/predictions'
import { formatTime, pct } from '../lib/format'
import { TeamBadge } from './TeamBadge'
import { PredictionBar } from './PredictionBar'
import { ConfidenceBadge } from './ConfidenceBadge'

export function MatchCard({ item }: { item: EnrichedFixture }) {
  const { fixture, prediction } = item
  const home = teamById(fixture.homeId)!
  const away = teamById(fixture.awayId)!
  const league = leagueById(fixture.leagueId)!

  return (
    <Link
      to={`/match/${fixture.id}`}
      className="card group block p-4 transition hover:border-lime/30 hover:shadow-glow"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span>{league.flag}</span>
          <span>{league.name}</span>
        </span>
        {fixture.status === 'live' ? (
          <span className="chip bg-red-500/15 text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red-500" />
            {fixture.minute}'
          </span>
        ) : fixture.status === 'finished' ? (
          <span className="chip bg-pitch-800 text-slate-400">Terminé</span>
        ) : (
          <span className="font-semibold text-slate-300">{formatTime(fixture.kickoff)}</span>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2.5">
          <TeamBadge team={home} size={38} />
          <span className="truncate text-sm font-semibold text-white">{home.name}</span>
        </div>
        <div className="px-2 text-center">
          {fixture.status === 'upcoming' ? (
            <span className="text-xs font-medium text-slate-500">VS</span>
          ) : (
            <span className="rounded-lg bg-pitch-800 px-2.5 py-1 font-display text-lg font-bold text-white">
              {fixture.homeGoals}–{fixture.awayGoals}
            </span>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2.5">
          <span className="truncate text-right text-sm font-semibold text-white">{away.name}</span>
          <TeamBadge team={away} size={38} />
        </div>
      </div>

      <PredictionBar pred={prediction} />

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <span className="chip bg-lime/10 font-semibold text-lime">
            IA : {pickTeamName(fixture, prediction.pick)}
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            {pct(
              prediction.pick === '1'
                ? prediction.homeWin
                : prediction.pick === '2'
                  ? prediction.awayWin
                  : prediction.draw,
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ConfidenceBadge value={prediction.confidence} />
          </div>
          <ChevronRight
            size={18}
            className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-lime"
          />
        </div>
      </div>
    </Link>
  )
}
