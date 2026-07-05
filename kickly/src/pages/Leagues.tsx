import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { leagues } from '../data/leagues'
import { teamsByLeague } from '../data/teams'
import { TeamBadge, FormDots } from '../components/TeamBadge'
import type { Team } from '../data/types'

/** Power rating used to sort a mini table (attack minus defense, scaled). */
function power(t: Team): number {
  const formPts = t.form.reduce((a, r) => a + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)
  return (t.attack - t.defense) * 10 + formPts
}

export function Leagues() {
  const [active, setActive] = useState(leagues[0].id)
  const league = leagues.find((l) => l.id === active)!
  const table = useMemo(
    () => [...teamsByLeague(active)].sort((a, b) => power(b) - power(a)),
    [active],
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
          <CalendarDays className="text-lime" /> Ligues
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Classement de force des équipes selon le modèle IA (attaque, défense et forme
          récente combinées).
        </p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {leagues.map((l) => (
          <button
            key={l.id}
            onClick={() => setActive(l.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              active === l.id
                ? 'bg-lime text-pitch-950'
                : 'bg-pitch-800 text-slate-300 hover:bg-pitch-700'
            }`}
          >
            {l.flag} {l.name}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/5 p-5">
          <div
            className="grid h-11 w-11 place-items-center rounded-xl text-xl"
            style={{ background: `${league.color}33` }}
          >
            {league.flag}
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white">{league.name}</div>
            <div className="text-xs text-slate-400">{league.country}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-2 py-3 font-medium">Équipe</th>
                <th className="px-2 py-3 text-center font-medium">ATT</th>
                <th className="px-2 py-3 text-center font-medium">DEF</th>
                <th className="px-2 py-3 font-medium">Forme</th>
                <th className="px-5 py-3 text-right font-medium">Note IA</th>
              </tr>
            </thead>
            <tbody>
              {table.map((t, i) => (
                <tr
                  key={t.id}
                  className="border-b border-white/5 transition last:border-0 hover:bg-white/5"
                >
                  <td className="px-5 py-3 font-semibold text-slate-400">{i + 1}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2.5">
                      <TeamBadge team={t} size={30} />
                      <span className="font-semibold text-white">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center text-slate-300">{t.attack.toFixed(2)}</td>
                  <td className="px-2 py-3 text-center text-slate-300">{t.defense.toFixed(2)}</td>
                  <td className="px-2 py-3">
                    <FormDots form={t.form} />
                  </td>
                  <td className="px-5 py-3 text-right font-display font-bold text-lime">
                    {power(t).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
