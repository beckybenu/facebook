import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { teamsByLeague } from '../data/teams'
import { TeamBadge, FormDots } from '../components/TeamBadge'
import { useData } from '../lib/DataContext'
import type { Team } from '../data/types'

/** Rough title probability from team strength, softmax-normalised. */
function titleOdds(teams: Team[]): Array<{ team: Team; prob: number }> {
  const scores = teams.map((t) => Math.exp((t.attack - t.defense) * 2.2))
  const total = scores.reduce((a, b) => a + b, 0)
  return teams
    .map((t, i) => ({ team: t, prob: scores[i] / total }))
    .sort((a, b) => b.prob - a.prob)
}

export function WorldCup() {
  const { liveLeagues } = useData() // re-rend quand les équipes live sont enregistrées
  const teams = useMemo(() => teamsByLeague('wc'), [liveLeagues])
  const odds = useMemo(() => titleOdds(teams), [teams])
  const favourite = odds[0]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-br from-lime/15 to-transparent p-6 lg:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-lime text-pitch-950">
            <Trophy size={28} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Coupe du Monde 2026</h1>
            <p className="text-sm text-slate-300">
              Analyses IA, favoris et probabilités de titre — États-Unis · Canada · Mexique
            </p>
          </div>
        </div>
        <div className="relative mt-6 flex items-center gap-4 rounded-2xl bg-pitch-900/60 p-4">
          <TeamBadge team={favourite.team} size={48} />
          <div>
            <div className="text-xs text-slate-400">Grand favori de l'IA</div>
            <div className="font-display text-xl font-bold text-white">
              {favourite.team.name}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-slate-400">Proba. titre</div>
            <div className="font-display text-2xl font-bold text-lime">
              {Math.round(favourite.prob * 100)}%
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-white/5 p-5 font-display text-lg font-bold text-white">
          Favoris pour le titre
        </div>
        <div className="divide-y divide-white/5">
          {odds.slice(0, 12).map(({ team, prob }, i) => (
            <div key={team.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-5 text-center font-display font-bold text-slate-500">
                {i + 1}
              </span>
              <TeamBadge team={team} size={34} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white">{team.name}</div>
                <div className="mt-1">
                  <FormDots form={team.form} />
                </div>
              </div>
              <div className="hidden w-40 sm:block">
                <div className="h-2 w-full overflow-hidden rounded-full bg-pitch-800">
                  <div
                    className="h-full bg-lime"
                    style={{ width: `${(prob / favourite.prob) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-14 text-right font-display font-bold text-lime">
                {Math.round(prob * 100)}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
