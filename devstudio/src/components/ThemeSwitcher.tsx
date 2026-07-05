import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const THEMES = [
  { id: 'arc', label: '01 · Arc', colors: ['#00e5ff', '#3d7bff'] },
  { id: 'neon', label: '02 · Néon', colors: ['#ff2ecc', '#00f0ff'] },
  { id: 'plasma', label: '03 · Plasma', colors: ['#945cff', '#22d3ee'] },
  { id: 'stark', label: '04 · Stark', colors: ['#ff4040', '#ffc53d'] },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
  localStorage.setItem('nsk-theme', id)
}

export default function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>('arc')

  useEffect(() => {
    const saved = localStorage.getItem('nsk-theme') as ThemeId | null
    if (saved && THEMES.some((t) => t.id === saved)) {
      setActive(saved)
      applyTheme(saved)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.2, duration: 0.6 }}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-ink/80 backdrop-blur-md px-3 py-2"
    >
      <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-paper/50 pl-1">
        Thème
      </span>
      {THEMES.map((t) => (
        <motion.button
          key={t.id}
          title={t.label}
          aria-label={`Thème ${t.label}`}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setActive(t.id)
            applyTheme(t.id)
          }}
          className={`h-6 w-6 rounded-full transition-shadow ${
            active === t.id ? 'ring-2 ring-paper/80 ring-offset-2 ring-offset-ink' : ''
          }`}
          style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}
        />
      ))}
    </motion.div>
  )
}
