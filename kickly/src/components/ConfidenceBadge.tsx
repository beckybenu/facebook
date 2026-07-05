import { Sparkles } from 'lucide-react'
import { confidenceColor, confidenceLabel } from '../lib/format'

export function ConfidenceBadge({ value }: { value: number }) {
  return (
    <div className="chip bg-pitch-800 ring-1 ring-white/5">
      <Sparkles size={12} className={confidenceColor(value)} />
      <span className={confidenceColor(value)}>{value}%</span>
      <span className="text-slate-400">· Confiance {confidenceLabel(value)}</span>
    </div>
  )
}
