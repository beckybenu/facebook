export function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDay(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function relativeDay(d: Date, today: Date): string {
  const diff = Math.round(
    (new Date(d).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) /
      86400000,
  )
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  if (diff === -1) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function confidenceLabel(c: number): string {
  if (c >= 75) return 'Élevée'
  if (c >= 55) return 'Modérée'
  return 'Prudente'
}

export function confidenceColor(c: number): string {
  if (c >= 75) return 'text-lime'
  if (c >= 55) return 'text-amber-400'
  return 'text-orange-400'
}
