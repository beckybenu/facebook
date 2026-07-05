import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Sparkles, TrendingUp } from 'lucide-react'
import { useFixtures, useNow } from '../lib/store'
import { sameDay } from '../data/fixtures'
import { MatchCard } from '../components/MatchCard'
import { DateStrip, LeagueFilter } from '../components/Filters'
import { pickTeamName } from '../data/predictions'
import { teamById } from '../data/teams'
import { leagues } from '../data/leagues'
import { pct } from '../lib/format'

export function Home() {
  const now = useNow()
  const all = useFixtures(now)
  const [league, setLeague] = useState<string | null>(null)
  const [dayIdx, setDayIdx] = useState(1) // today (index 0 is yesterday)

  const days = useMemo(() => {
    const arr: Date[] = []
    for (let i = -1; i < 6; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [now])

  const filtered = useMemo(
    () =>
      all.filter(
        (f) =>
          sameDay(new Date(f.fixture.kickoff), days[dayIdx]) &&
          (league === null || f.fixture.leagueId === league),
      ),
    [all, days, dayIdx, league],
  )

  const topPick = useMemo(() => {
    const upcoming = all.filter((f) => f.fixture.status !== 'finished')
    return [...upcoming].sort((a, b) => b.prediction.confidence - a.prediction.confidence)[0]
  }, [all])

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-pitch-800 to-pitch-900 p-6 lg:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative">
          <span className="chip bg-lime/10 text-lime">
            <Sparkles size={12} /> Propulsé par l'IA · 210+ sources de données
          </span>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight text-white lg:text-4xl">
            L'IA au service de vos <span className="text-lime">pronostics football</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 lg:text-base">
            Des analyses claires, des probabilités calculées et des combinés générés
            automatiquement. Comprenez les matchs — ne suivez plus seulement les scores.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/predictions" className="btn-primary">
              Voir les pronostics du jour <ArrowRight size={16} />
            </Link>
            <Link to="/parlays" className="btn-ghost">
              Combinés IA
            </Link>
          </div>
        </div>
      </section>

      {/* Top pick of the day */}
      {topPick && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Flame size={16} className="text-lime" /> Pari du jour selon l'IA
          </h2>
          <Link
            to={`/match/${topPick.fixture.id}`}
            className="card group flex flex-col items-start justify-between gap-4 bg-gradient-to-r from-lime/10 to-transparent p-5 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-lime/15 font-display text-2xl font-bold text-lime">
                {topPick.prediction.confidence}%
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {teamById(topPick.fixture.homeId)!.name} vs {teamById(topPick.fixture.awayId)!.name}
                </div>
                <div className="mt-0.5 text-sm text-slate-300">
                  Recommandation IA :{' '}
                  <span className="font-semibold text-lime">
                    {pickTeamName(topPick.fixture, topPick.prediction.pick)}
                  </span>{' '}
                  · cote {topPick.prediction.fairOdds}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-lime">
              Analyse complète
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </div>
          </Link>
        </section>
      )}

      {/* Fixtures */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <TrendingUp size={18} className="text-lime" /> Matchs & pronostics
          </h2>
          <span className="text-xs text-slate-500">{filtered.length} matchs</span>
        </div>
        <DateStrip days={days} value={dayIdx} onChange={setDayIdx} today={now} />
        <LeagueFilter value={league} onChange={setLeague} />

        {filtered.length === 0 ? (
          <div className="card grid place-items-center p-12 text-center text-sm text-slate-400">
            Aucun match programmé pour cette sélection.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((item) => (
              <MatchCard key={item.fixture.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Sources de données', value: '210+' },
          { label: 'Matchs analysés', value: all.length.toString() },
          { label: 'Confiance moy.', value: pct(avg(all.map((a) => a.prediction.confidence / 100))) },
          { label: 'Ligues couvertes', value: leagues.length.toString() },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="font-display text-2xl font-bold text-lime">{s.value}</div>
            <div className="mt-1 text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / (nums.length || 1)
}
