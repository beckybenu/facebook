import { motion } from 'framer-motion'

type Proposal = {
  href: string
  num: string
  name: string
  desc: string
  colors: string[]
  bg: string
  features: string[]
}

type Era = { title: string; subtitle: string; proposals: Proposal[] }

const ERAS: Era[] = [
  {
    title: 'Ère 2050',
    subtitle: 'Quatre ambiances fondatrices',
    proposals: [
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
    ],
  },
  {
    title: 'Ère 2350',
    subtitle: 'La post-singularité',
    proposals: [
      {
        href: '#/singularite',
        num: '05',
        name: 'Singularité',
        desc: 'Post-singularité — couleurs iridescentes, champ quantique réactif, gyroscope en lévitation, portail d’énergie.',
        colors: ['#7b2fff', '#00ffd5'],
        bg: 'from-[#150533] to-[#010104]',
        features: ['Spectre iridescent', 'Particules quantiques', 'Gyroscope 3D', 'Portail d’énergie'],
      },
    ],
  },
  {
    title: 'An 3000',
    subtitle: 'Cinq univers jamais observés',
    proposals: [
      {
        href: '#/mercure',
        num: '06',
        name: 'Mercure',
        desc: 'Métal liquide — gouttes de chrome qui fusionnent, formes organiques mouvantes, lettres-gouttes.',
        colors: ['#dfe9f5', '#66e0ff'],
        bg: 'from-[#131c2b] to-[#05070c]',
        features: ['Métaballs fusionnants', 'Formes qui mutent', 'Chrome animé'],
      },
      {
        href: '#/abysse',
        num: '07',
        name: 'Abysse',
        desc: 'Bioluminescence — spores qui remontent, méduses lumineuses, tout respire comme un organisme.',
        colors: ['#2dffc4', '#ff6ec7'],
        bg: 'from-[#04202b] to-[#020610]',
        features: ['Spores dérivantes', 'Méduses animées', 'Interface qui respire'],
      },
      {
        href: '#/chronos',
        num: '08',
        name: 'Chronoflux',
        desc: 'Distorsion temporelle — le titre traîne ses propres échos, sections rembobinées, cadran géant.',
        colors: ['#ffd166', '#b08d57'],
        bg: 'from-[#241a0c] to-[#0c0a08]',
        features: ['Échos temporels', 'Entrées rembobinées', 'Cadran rotatif'],
      },
      {
        href: '#/tesseract',
        num: '09',
        name: 'Tesseract',
        desc: 'Hypercube 4D réel calculé en direct — rotations dans la 4ᵉ dimension, minimalisme absolu.',
        colors: ['#ffffff', '#4da6ff'],
        bg: 'from-[#101828] to-[#000000]',
        features: ['Vrai 4D projeté', 'Plis dimensionnels', 'Moiré non-euclidien'],
      },
      {
        href: '#/trounoir',
        num: '10',
        name: 'Trou noir',
        desc: 'Singularité gravitationnelle — étoiles aspirées en spirale, disque d’accrétion, textes attirés par l’horizon.',
        colors: ['#ffb26b', '#b39dff'],
        bg: 'from-[#1c1030] to-[#000006]',
        features: ['Étoiles aspirées', 'Disque d’accrétion', 'Scroll gravitationnel'],
      },
    ],
  },
  {
    title: 'Hors catalogue',
    subtitle: 'Vraie 3D temps réel dans le navigateur',
    proposals: [
      {
        href: '#/atelier',
        num: '11',
        name: 'Le Studio de Byte',
        desc: 'Un vrai dessin animé 3D : Byte, personnage riggé professionnel, salue, marche, danse, court et lève le pouce sur son podium pastel — et il saute quand on clique sur lui.',
        colors: ['#ff6b57', '#8ed1ff'],
        bg: 'from-[#2a4a66] to-[#12263c]',
        features: ['Personnage riggé', 'Il danse & court', 'Clique = il saute !', 'Décor cartoon'],
      },
    ],
  },
]

let cardIndex = 0

export default function Selector() {
  cardIndex = 0
  return (
    <div className="min-h-screen bg-[#08080c] text-paper px-6 py-14">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-5xl w-full text-center mb-14"
      >
        <p className="text-xs uppercase tracking-[0.4em] text-paper/50 mb-4">
          Benu Studio · 10 propositions
        </p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl">
          Choisis ta <span className="text-gradient-animated">dimension</span>
        </h1>
        <p className="mt-4 text-paper/60 max-w-xl mx-auto">
          Dix univers complets — couleurs, ambiances et animations radicalement
          différentes, de 2050 à l&apos;an 3000. Clique pour explorer chaque démo.
        </p>
      </motion.header>

      <div className="mx-auto max-w-5xl w-full space-y-16">
        {ERAS.map((era) => (
          <section key={era.title}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              className="flex items-baseline gap-4 mb-6"
            >
              <h2 className="font-display text-2xl md:text-3xl font-bold">{era.title}</h2>
              <span className="text-sm text-paper/40">{era.subtitle}</span>
              <span className="flex-1 h-px bg-white/10" />
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2">
              {era.proposals.map((p) => {
                const delay = 0.06 * cardIndex++
                return (
                  <motion.a
                    key={p.num}
                    href={p.href}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -8, scale: 1.015 }}
                    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${p.bg} p-8 flex flex-col justify-between min-h-[230px]`}
                  >
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
                            <span key={c} className="h-4 w-4 rounded-full border border-white/20" style={{ background: c }} />
                          ))}
                        </span>
                      </div>
                      <h3 className="font-display text-3xl font-bold mb-2">
                        <span className="group-hover:hidden">{p.name}</span>
                        <span className="hidden group-hover:inline" style={{ color: p.colors[0] }}>
                          {p.name}
                        </span>
                      </h3>
                      <p className="text-paper/60 text-sm leading-relaxed">{p.desc}</p>
                    </div>
                    <div className="relative mt-6 flex items-center justify-between gap-3">
                      <ul className="flex flex-wrap gap-2">
                        {p.features.map((f) => (
                          <li key={f} className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-paper/60">
                            {f}
                          </li>
                        ))}
                      </ul>
                      <span
                        className="text-xl shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                        style={{ color: p.colors[0] }}
                      >
                        →
                      </span>
                    </div>
                  </motion.a>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-xs text-paper/40 mt-16"
      >
        © 2026 Benu Studio — chaque proposition est une démo complète et navigable.
      </motion.p>
    </div>
  )
}
