import type { Prediction } from '../data/types'
import { pct } from '../lib/format'

export function PredictionBar({ pred }: { pred: Prediction }) {
  const segments = [
    { key: '1', label: '1', value: pred.homeWin, color: 'bg-lime' },
    { key: 'N', label: 'N', value: pred.draw, color: 'bg-slate-500' },
    { key: '2', label: '2', value: pred.awayWin, color: 'bg-sky-400' },
  ]
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-pitch-800">
        {segments.map((s) => (
          <div
            key={s.key}
            className={`${s.color} transition-all`}
            style={{ width: `${s.value * 100}%` }}
            title={`${s.label}: ${pct(s.value)}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs">
        {segments.map((s) => (
          <span
            key={s.key}
            className={`font-semibold ${
              pred.pick === s.key ? 'text-white' : 'text-slate-400'
            }`}
          >
            {s.label} · {pct(s.value)}
          </span>
        ))}
      </div>
    </div>
  )
}
