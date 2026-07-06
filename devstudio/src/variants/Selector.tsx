import { motion } from 'framer-motion'

const PROPOSALS = [
  {
    href: '#/neo',
    num: '01',
    name: 'Néo-Tokyo',
    desc: 'Cyberpunk néon — titres qui glitchent, enseignes qui grésillent, pluie lumineuse.',
    colors: ['#ff2ecc', '#00f0ff'],
    bg: 'from-[#1a0526] to-[#0a0412]',
    features: ['Glitch RGB', 'Néons pulsés', 'Streaks de pluie'],
  },
  {
    href: '#/aurora',
    num: '02',
    name: 'Aurora',
    desc: 'Élégance glaciale — aurores boréales mouvantes, verre dépoli, orbites planétaires.',
    colors: ['#7dd3fc', '#a78bfa'],
    bg: 'from-[#0a1830] to-[#050b1a]',
    features: ['Aurores animées', 'Glassmorphism', 'Orbites en rotation'],
  },
  {
    href: '#/nova',
    num: '03',
    name: 'Nova',
    desc: 'Odyssée spatiale — champ d’étoiles 3D, hologrammes flottants, tunnel de distorsion.',
    colors: ['#ff5c33', '#ffb347'],
    bg: 'from-[#2a1208] to-[#0a0a0b]',
    features: ['Étoiles 3D parallaxe', 'Hero en perspective', 'Tunnel de warp'],
  },
  {
    href: '#/matrix',
    num: '04',
    name: 'Matrix',
    desc: 'Terminal vivant — pluie de code, textes qui se décodent, console qui tape toute seule.',
    colors: ['#00ff88', '#00cc66'],
    bg: 'from-[#03140a] to-[#020803]',
    features: ['Pluie de code', 'Texte décodé', 'Terminal animé'],
  },
]

export default function Selector() {
  return (
    <div className="min-h-screen bg-[#08080c] text-paper flex flex-col px-6 py-12">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-5xl w-full text-center mb-12"
      >
        <p className="text-xs uppercase tracking-[0.4em] text-paper/50 mb-4">
          Benu Studio · 4 propositions
        </p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl">
          Choisis ta <span className="text-gradient-animated">dimension</span>
        </h1>
        <p className="mt-4 text-paper/60 max-w-xl mx-auto">
          Quatre univers complets — couleurs, ambiance et animations totalement
          différentes. Clique pour explorer chaque démo.
        </p>
      </motion.header>

      <div className="mx-auto max-w-5xl w-full grid gap-6 md:grid-cols-2 flex-1">
        {PROPOSALS.map((p, i) => (
          <motion.a
            key={p.num}
            href={p.href}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8, scale: 1.015 }}
            className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${p.bg} p-8 flex flex-col justify-between min-h-[240px]`}
            style={{ boxShadow: `0 0 0 rgba(0,0,0,0)` }}
          >
            {/* halo coloré au survol */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 30% 20%, ${p.colors[0]}22, transparent 60%)` }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-paper/40">{p.num}</span>
                <span className="flex gap-2">
                  {p.colors.map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />
                  ))}
                </span>
              </div>
              <h2
                className="font-display text-3xl md:text-4xl font-bold mb-2 transition-colors"
                style={{ color: undefined }}
              >
                <span className="group-hover:hidden">{p.name}</span>
                <span className="hidden group-hover:inline" style={{ color: p.colors[0] }}>
                  {p.name}
                </span>
              </h2>
              <p className="text-paper/60 text-sm leading-relaxed">{p.desc}</p>
            </div>
            <div className="relative mt-6 flex items-center justify-between">
              <ul className="flex flex-wrap gap-2">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-paper/60"
                  >
                    {f}
                  </li>
                ))}
              </ul>
              <span
                className="text-xl transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: p.colors[0] }}
              >
                →
              </span>
            </div>
          </motion.a>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-xs text-paper/40 mt-10"
      >
        © 2026 Benu Studio — chaque proposition est une démo complète et navigable.
      </motion.p>
    </div>
  )
}
