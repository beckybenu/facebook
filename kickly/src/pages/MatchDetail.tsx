import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Brain, Goal, Percent, Shield, Sparkles, Target } from 'lucide-react'
import { useFixture, useNow } from '../lib/store'
import { teamById } from '../data/teams'
import { leagueById } from '../data/leagues'
import { analysis, pickTeamName } from '../data/predictions'
import { TeamBadge, FormDots } from '../components/TeamBadge'
import { PredictionBar } from '../components/PredictionBar'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { formatDay, formatTime, pct } from '../lib/format'

export function MatchDetail() {
  const { id } = useParams()
  const now = useNow()
  const item = useFixture(id!, now)

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-slate-400">Match introuvable.</p>
        <Link to="/" className="btn-ghost mt-4">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const { fixture, prediction } = item
  const home = teamById(fixture.homeId)!
  const away = teamById(fixture.awayId)!
  const league = leagueById(fixture.leagueId)!
  const notes = analysis(fixture, prediction)

  const markets = [
    { label: '1 (Domicile)', value: prediction.homeWin, pick: '1' },
    { label: 'Nul', value: prediction.draw, pick: 'N' },
    { label: '2 (Extérieur)', value: prediction.awayWin, pick: '2' },
    { label: 'Both teams to score', value: prediction.btts },
    { label: 'Plus de 2.5 buts', value: prediction.over25 },
    { label: 'Moins de 2.5 buts', value: 1 - prediction.over25 },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-lime">
        <ArrowLeft size={16} /> Retour
      </Link>

      {/* Header */}
      <section className="card overflow-hidden">
        <div className="border-b border-white/5 px-5 py-3 text-sm text-slate-400">
          {league.flag} {league.name} · {formatDay(fixture.kickoff)} · {formatTime(fixture.kickoff)}
        </div>
        <div className="grid grid-cols-3 items-center gap-4 p-6">
          <TeamSide team={home} align="right" />
          <div className="text-center">
            {fixture.status === 'upcoming' ? (
              <div className="font-display text-3xl font-bold text-slate-500">VS</div>
            ) : (
              <div className="font-display text-4xl font-bold text-white">
                {fixture.homeGoals}<span className="text-slate-600">–</span>{fixture.awayGoals}
              </div>
            )}
            {fixture.status === 'live' && (
              <span className="chip mt-2 bg-red-500/15 text-red-400">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red-500" />
                {fixture.minute}'
              </span>
            )}
          </div>
          <TeamSide team={away} align="left" />
        </div>
      </section>

      {/* AI verdict */}
      <section className="card bg-gradient-to-br from-lime/10 to-transparent p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-lime">
            <Brain size={16} /> Verdict de l'IA
          </div>
          <ConfidenceBadge value={prediction.confidence} />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <div className="text-xs text-slate-400">Recommandation</div>
            <div className="font-display text-2xl font-bold text-white">
              {pickTeamName(fixture, prediction.pick)}
            </div>
          </div>
          <Stat label="Score projeté" value={`${prediction.scoreHome}–${prediction.scoreAway}`} />
          <Stat label="Cote équitable" value={prediction.fairOdds.toString()} />
          <Stat label="xG" value={`${prediction.xgHome} – ${prediction.xgAway}`} />
        </div>
        <div className="mt-5">
          <PredictionBar pred={prediction} />
        </div>
      </section>

      {/* Analysis */}
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <Sparkles size={16} className="text-lime" /> Analyse IA du match
        </h2>
        <ul className="space-y-3">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
              {n}
            </li>
          ))}
        </ul>
      </section>

      {/* Markets */}
      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <Percent size={16} className="text-lime" /> Probabilités par marché
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {markets.map((m) => (
            <div key={m.label} className="rounded-xl bg-pitch-800/60 p-3">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-300">{m.label}</span>
                <span className="font-semibold text-white">{pct(m.value)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-pitch-700">
                <div className="h-full bg-lime" style={{ width: `${m.value * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key indicators */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Indicator icon={Target} label="xG domicile" value={prediction.xgHome.toString()} />
        <Indicator icon={Goal} label="xG extérieur" value={prediction.xgAway.toString()} />
        <Indicator icon={Percent} label="BTTS" value={pct(prediction.btts)} />
        <Indicator icon={Shield} label="Over 2.5" value={pct(prediction.over25)} />
      </section>
    </div>
  )
}

function TeamSide({ team, align }: { team: ReturnType<typeof teamById>; align: 'left' | 'right' }) {
  if (!team) return null
  return (
    <div className={`flex flex-col items-center gap-2 ${align === 'right' ? 'sm:items-end' : 'sm:items-start'}`}>
      <TeamBadge team={team} size={56} />
      <div className="text-center text-sm font-bold text-white sm:text-base">{team.name}</div>
      <FormDots form={team.form} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-display text-xl font-bold text-white">{value}</div>
    </div>
  )
}

function Indicator({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target
  label: string
  value: string
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-lime/10 text-lime">
        <Icon size={18} />
      </div>
      <div>
        <div className="font-display text-lg font-bold text-white">{value}</div>
        <div className="text-[11px] text-slate-400">{label}</div>
      </div>
    </div>
  )
}
