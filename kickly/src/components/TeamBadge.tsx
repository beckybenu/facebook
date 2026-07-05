import type { Team } from '../data/types'

export function TeamBadge({ team, size = 40 }: { team: Team; size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-full font-display font-bold text-white shadow-inner ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${team.color}, ${team.color}99)`,
        fontSize: size * 0.32,
      }}
      title={team.name}
    >
      {team.short.slice(0, 3)}
    </div>
  )
}

export function FormDots({ form }: { form: Team['form'] }) {
  return (
    <div className="flex items-center gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`grid h-4 w-4 place-items-center rounded text-[9px] font-bold ${
            r === 'W'
              ? 'bg-lime/20 text-lime'
              : r === 'D'
                ? 'bg-slate-500/20 text-slate-300'
                : 'bg-red-500/20 text-red-400'
          }`}
          title={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}
        >
          {r}
        </span>
      ))}
    </div>
  )
}
