import { leagues } from '../data/leagues'
import { relativeDay } from '../lib/format'

export function LeagueFilter({
  value,
  onChange,
}: {
  value: string | null
  onChange: (id: string | null) => void
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
      <Pill active={value === null} onClick={() => onChange(null)}>
        🌐 Toutes
      </Pill>
      {leagues.map((l) => (
        <Pill key={l.id} active={value === l.id} onClick={() => onChange(l.id)}>
          {l.flag} {l.name}
        </Pill>
      ))}
    </div>
  )
}

export function DateStrip({
  days,
  value,
  onChange,
  today,
}: {
  days: Date[]
  value: number
  onChange: (i: number) => void
  today: Date
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
      {days.map((d, i) => (
        <Pill key={i} active={value === i} onClick={() => onChange(i)}>
          {relativeDay(d, today)}
        </Pill>
      ))}
    </div>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-lime text-pitch-950'
          : 'bg-pitch-800 text-slate-300 hover:bg-pitch-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
