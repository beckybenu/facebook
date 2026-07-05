import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layers, TrendingUp, Zap } from 'lucide-react'
import { useFixtures, useNow, type EnrichedFixture } from '../lib/store'
import { teamById } from '../data/teams'
import { leagueById } from '../data/leagues'
import { pickTeamName } from '../data/predictions'
import { formatTime } from '../lib/format'

interface Parlay {
  id: string
  title: string
  subtitle: string
  risk: 'Sûr' | 'Équilibré' | 'Audacieux'
  legs: EnrichedFixture[]
}

function buildParlays(items: EnrichedFixture[]): Parlay[] {
  const upcoming = items.filter((f) => f.fixture.status === 'upcoming')
  const byConfidence = [...upcoming].sort(
    (a, b) => b.prediction.confidence - a.prediction.confidence,
  )

  const safe = byConfidence.slice(0, 3)
  const balanced = byConfidence.filter((f) => f.prediction.confidence < 75).slice(0, 3)
  const bold = [...upcoming]
    .sort((a, b) => b.prediction.fairOdds - a.prediction.fairOdds)
    .slice(0, 4)

  const parlays: Parlay[] = []
  if (safe.length >= 2)
    parlays.push({
      id: 'safe',
      title: 'Combiné Sécurité',
      subtitle: 'Les 3 pronostics les plus fiables du jour',
      risk: 'Sûr',
      legs: safe,
    })
  if (balanced.length >= 2)
    parlays.push({
      id: 'balanced',
      title: 'Combiné Équilibré',
      subtitle: 'Bon compromis entre cote et probabilité',
      risk: 'Équilibré',
      legs: balanced,
    })
  if (bold.length >= 2)
    parlays.push({
      id: 'bold',
      title: 'Combiné Audacieux',
      subtitle: 'Cotes élevées pour un gros gain potentiel',
      risk: 'Audacieux',
      legs: bold,
    })
  return parlays
}

const riskStyle: Record<Parlay['risk'], string> = {
  Sûr: 'bg-lime/15 text-lime',
  Équilibré: 'bg-amber-400/15 text-amber-400',
  Audacieux: 'bg-orange-500/15 text-orange-400',
}

export function Parlays() {
  const now = useNow()
  const all = useFixtures(now)
  const parlays = useMemo(() => buildParlays(all), [all])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
          <Layers className="text-lime" /> Combinés IA
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Des paris combinés construits automatiquement à partir des meilleures sélections
          du modèle. Trois profils de risque, générés à chaque nouvelle journée.
        </p>
      </header>

      <div className="space-y-5">
        {parlays.map((p) => {
          const odds = p.legs.reduce((acc, l) => acc * l.prediction.fairOdds, 1)
          const avgConf =
            p.legs.reduce((a, l) => a + l.prediction.confidence, 0) / p.legs.length
          return (
            <div key={p.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-white">{p.title}</h2>
                    <span className={`chip ${riskStyle[p.risk]}`}>{p.risk}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{p.subtitle}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Cote totale</div>
                  <div className="font-display text-2xl font-bold text-lime">
                    {odds.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {p.legs.map((leg) => {
                  const home = teamById(leg.fixture.homeId)!
                  const away = teamById(leg.fixture.awayId)!
                  const league = leagueById(leg.fixture.leagueId)!
                  return (
                    <Link
                      key={leg.fixture.id}
                      to={`/match/${leg.fixture.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {home.name} <span className="text-slate-500">vs</span> {away.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {league.flag} {league.name} · {formatTime(leg.fixture.kickoff)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="chip bg-lime/10 text-lime">
                          {pickTeamName(leg.fixture, leg.prediction.pick)}
                        </span>
                        <span className="font-display text-sm font-bold text-white">
                          {leg.prediction.fairOdds.toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 bg-pitch-800/40 p-4">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-lime" /> Confiance moy.{' '}
                    {Math.round(avgConf)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap size={14} className="text-lime" /> {p.legs.length} sélections
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  10€ misés →{' '}
                  <span className="font-semibold text-lime">{(odds * 10).toFixed(2)}€</span>{' '}
                  potentiels
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
