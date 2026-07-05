import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useFixtures, useNow } from '../lib/store'
import { MatchCard } from '../components/MatchCard'
import { LeagueFilter } from '../components/Filters'

type Sort = 'confidence' | 'time' | 'value'

export function Predictions() {
  const now = useNow()
  const all = useFixtures(now)
  const [league, setLeague] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('confidence')

  const items = useMemo(() => {
    const upcoming = all.filter(
      (f) => f.fixture.status !== 'finished' && (league === null || f.fixture.leagueId === league),
    )
    return [...upcoming].sort((a, b) => {
      if (sort === 'confidence') return b.prediction.confidence - a.prediction.confidence
      if (sort === 'time') return a.fixture.kickoff.localeCompare(b.fixture.kickoff)
      // value: highest edge = lowest fair odds relative to confidence
      return b.prediction.confidence / b.prediction.fairOdds - a.prediction.confidence / a.prediction.fairOdds
    })
  }, [all, league, sort])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
          <Sparkles className="text-lime" /> Pronostics IA
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Chaque match est passé au crible d'un modèle de Poisson bivarié combinant force
          d'attaque, solidité défensive, avantage du terrain et forme récente.
        </p>
      </header>

      <LeagueFilter value={league} onChange={setLeague} />

      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">Trier par :</span>
        {(
          [
            ['confidence', 'Confiance'],
            ['value', 'Value bet'],
            ['time', 'Heure'],
          ] as Array<[Sort, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              sort === key ? 'bg-lime text-pitch-950' : 'bg-pitch-800 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <MatchCard key={item.fixture.id} item={item} />
        ))}
      </div>
    </div>
  )
}
