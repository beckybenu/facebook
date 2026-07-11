import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

/*
  Proposition 12 · CONSTELLATION — « constellation floating on black velvet ».
  Système : vide noir absolu (#000), hiérarchie par l'échelle (400 partout,
  corps en 200 ultra-léger), un seul violet #8052ff pour l'action, ambre
  #ffb829 pour l'emphase. Aucune carte, aucune bordure, aucune ombre.
*/

const IRIS = '#8052ff'
const AMBER = '#ffb829'
const ASH = '#9a9a9a'
const MIST = '#bdbdbd'
const PALETTE = [IRIS, AMBER, '#1fbf9e', '#ff4fd8', '#4f7dff', '#b18bff', '#6a3df5', '#2f9bff']

const font = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  fontFeatureSettings: "'ss01' on",
} as const

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* Un point (x, y) normalisé appartient-il au profil du cerveau ? */
function inBrain(x: number, y: number) {
  // masse principale : grande ellipse
  const main = x * x + ((y + 0.06) * (y + 0.06)) / 0.56 < 1
  // base aplatie côté frontal
  if (y > 0.5 && x < 0.18) return false
  // cervelet : petit lobe bas-droit
  const cereb = ((x - 0.52) * (x - 0.52)) / 0.09 + ((y - 0.5) * (y - 0.5)) / 0.035 < 1
  // tronc cérébral
  const stem = x > 0.1 && x < 0.34 && y > 0.5 && y < 0.78
  return main || cereb || stem
}

/*
  Le visuel signature : des milliers de petits triangles colorés, en contour
  fin, qui forment un cerveau — le savoir visualisé en intelligence
  distribuée. Sillons obtenus en creusant la densité le long de bandes
  sinueuses. Scintillement + dérive lente + parallaxe souris.
*/
function BrainConstellation() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const size = () => Math.min(740, Math.max(340, canvas.parentElement!.clientWidth))
    let S = size()
    const setup = () => {
      S = size()
      canvas.width = S * dpr
      canvas.height = S * 0.85 * dpr
      canvas.style.width = `${S}px`
      canvas.style.height = `${S * 0.85}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setup()
    window.addEventListener('resize', setup)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // échantillonnage des particules dans le profil du cerveau
    type P = { x: number; y: number; c: string; s: number; ph: number; rot: number }
    const parts: P[] = []
    let seed = 1
    while (parts.length < 2400 && seed < 90000) {
      seed++
      const x = hash(seed * 1.7) * 2.4 - 1.2
      const y = hash(seed * 3.1) * 1.7 - 0.85
      if (!inBrain(x, y)) continue
      // sillons : on creuse la densité le long de bandes sinueuses
      const fold = Math.sin(Math.atan2(y, x) * 6 + Math.hypot(x, y) * 11)
      if (Math.abs(fold) < 0.22 && hash(seed * 5.3) < 0.8) continue
      parts.push({
        x,
        y,
        c: PALETTE[Math.floor(hash(seed * 7.7) * PALETTE.length)],
        s: 1.3 + hash(seed * 9.1) * 2.2,
        ph: hash(seed * 11.3) * Math.PI * 2,
        rot: hash(seed * 13.7) * Math.PI * 2,
      })
    }

    const mouse = { x: 0, y: 0 }
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    const tri = (x: number, y: number, s: number, rot: number) => {
      ctx.beginPath()
      for (let k = 0; k < 3; k++) {
        const a = rot + (k * Math.PI * 2) / 3
        const px = x + Math.cos(a) * s
        const py = y + Math.sin(a) * s
        k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    }

    let t = 0
    const render = () => {
      if (!reduced) t += 0.016
      ctx.clearRect(0, 0, S, S * 0.85)
      const cx = S * 0.5 - mouse.x * 9
      const cy = S * 0.42 - mouse.y * 7
      const R = S * 0.42
      ctx.lineWidth = 1.1
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        const wob = Math.sin(t * 0.7 + p.ph)
        const px = cx + (p.x + wob * 0.012) * R
        const py = cy + (p.y + Math.cos(t * 0.55 + p.ph) * 0.012) * R
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.6 + p.ph * 3))
        ctx.globalAlpha = tw
        ctx.strokeStyle = p.c
        tri(px, py, p.s, p.rot + t * 0.12)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(render)
    }
    render()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', setup)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="mx-auto" />
}

/* Triangles ambiants épars, très faibles, sur tout le fond */
function AmbientField() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const parts = Array.from({ length: 70 }, (_, i) => ({
      x: hash(i * 1.9),
      y: hash(i * 3.7),
      c: PALETTE[i % PALETTE.length],
      s: 1.4 + hash(i * 5.1) * 2.2,
      ph: hash(i * 7.3) * Math.PI * 2,
    }))
    let t = 0
    const render = () => {
      if (!reduced) t += 0.016
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 1
      for (const p of parts) {
        const px = p.x * canvas.width + Math.sin(t * 0.3 + p.ph) * 14
        const py = p.y * canvas.height + Math.cos(t * 0.24 + p.ph) * 10
        ctx.globalAlpha = 0.16 + 0.1 * Math.sin(t + p.ph)
        ctx.strokeStyle = p.c
        ctx.beginPath()
        for (let k = 0; k < 3; k++) {
          const a = p.ph + t * 0.1 + (k * Math.PI * 2) / 3
          const vx = px + Math.cos(a) * p.s
          const vy = py + Math.sin(a) * p.s
          k === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy)
        }
        ctx.closePath()
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(render)
    }
    render()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} aria-hidden className="fixed inset-0 z-0 pointer-events-none" />
}

/* Logo : fragment triangulaire violet → sarcelle */
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <defs>
        <linearGradient id="benu-tri" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={IRIS} />
          <stop offset="100%" stopColor="#15846e" />
        </linearGradient>
      </defs>
      <path d="M3 19 L11 2 L19 19 Z" fill="url(#benu-tri)" />
    </svg>
  )
}

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-90px' },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
} as const

/* Étiquette ambre uppercase au-dessus des blocs */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-6 uppercase"
      style={{ ...font, fontSize: 14, fontWeight: 600, letterSpacing: '0.35px', color: AMBER }}
    >
      {children}
    </p>
  )
}

export default function Constellation() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden" style={font}>
      <AmbientField />
      <StylePicker color={IRIS} />

      {/* Navigation : transparente, posée sur le vide */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-20"
      >
        <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-7">
          <a href="#/constellation" className="flex items-center gap-2.5">
            <LogoMark />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Benu</span>
          </a>
          <div className="hidden md:flex items-center gap-9 uppercase" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.35px' }}>
            <a href="#c-manifeste" className="transition-colors hover:text-white" style={{ color: ASH }}>
              Manifeste
            </a>
            <a href="#c-services" className="transition-colors hover:text-white" style={{ color: ASH }}>
              Services
            </a>
            <a href="#c-projets" className="transition-colors hover:text-white" style={{ color: ASH }}>
              Projets
            </a>
          </div>
          <a
            href={`mailto:${EMAIL}`}
            className="uppercase text-white transition-transform hover:scale-[1.04]"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.025em',
              background: IRIS,
              borderRadius: 22.5,
              padding: '14.4px 16px',
            }}
          >
            Demander un accès
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-[1280px] px-6">
        {/* HERO : deux colonnes asymétriques — titre à gauche, cerveau à droite */}
        <section className="grid items-center gap-12 md:grid-cols-[1.05fr_1fr] pt-16 md:pt-24 pb-[120px]">
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.9 }}>
              <Label>Studio de développement web &amp; mobile</Label>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: 'clamp(44px, 6.1vw, 78px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.04em' }}
            >
              Votre entreprise
              <br />
              a la réponse.
              <br />
              Demandez-la à Benu.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.9 }}
              className="mt-9 max-w-[480px]"
              style={{ fontSize: 18, fontWeight: 200, lineHeight: 1.5 }}
            >
              Sites, applications et automatisations conçus comme une
              intelligence collective : chaque détail connecté, chaque écran
              pensé, aucun bruit superflu.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9 }}
              className="mt-10 flex items-center gap-8"
            >
              <a
                href={`mailto:${EMAIL}`}
                className="uppercase text-white transition-transform hover:scale-[1.04]"
                style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.025em', background: IRIS, borderRadius: 22.5, padding: '14.4px 16px' }}
              >
                Démarrer un projet
              </a>
              <a href="#c-manifeste" className="transition-colors hover:text-white" style={{ fontSize: 14, fontWeight: 400, color: ASH }}>
                Lire le manifeste ↓
              </a>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrainConstellation />
          </motion.div>
        </section>

        {/* MANIFESTE : composition inversée */}
        <section id="c-manifeste" className="grid gap-12 md:grid-cols-[1fr_1.1fr] items-center py-[120px]">
          <motion.p
            {...fadeUp}
            className="order-2 md:order-1 max-w-[520px]"
            style={{ fontSize: 18, fontWeight: 200, lineHeight: 1.5, color: MIST }}
          >
            Nous croyons que la technologie disparaît quand elle est bien
            faite. Pas de tableaux de bord inutiles, pas d&apos;options que
            personne n&apos;ouvre — seulement le chemin le plus court entre
            votre intention et son exécution. C&apos;est notre seule mesure du
            succès&nbsp;: <span style={{ color: AMBER }}>vous ne pensez plus à l&apos;outil.</span>
          </motion.p>
          <motion.div {...fadeUp} className="order-1 md:order-2">
            <Label>Manifeste</Label>
            <h2 style={{ fontSize: 'clamp(42px, 5.5vw, 78px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
              Un studio,
              <br />
              une intelligence
              <br />
              collective.
            </h2>
          </motion.div>
        </section>

        {/* SERVICES : blocs typographiques purs, aucune carte */}
        <section id="c-services" className="py-[120px]">
          <motion.div {...fadeUp}>
            <Label>Ce que nous faisons</Label>
            <h2 style={{ fontSize: 'clamp(42px, 5.5vw, 78px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
              Quatre disciplines.
            </h2>
          </motion.div>
          <div className="mt-[60px] grid gap-x-16 gap-y-[60px] md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.div key={s.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
                <p className="uppercase mb-4" style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.35px', color: IRIS }}>
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 style={{ fontSize: 27, fontWeight: 400, lineHeight: 1 }}>{s.title}</h3>
                <p className="mt-4 max-w-[440px]" style={{ fontSize: 18, fontWeight: 200, lineHeight: 1.5, color: MIST }}>
                  {s.text}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PROJETS : liste typographique, liens fantômes */}
        <section id="c-projets" className="py-[120px]">
          <motion.div {...fadeUp}>
            <Label>Projets</Label>
          </motion.div>
          <div className="mt-2">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                className="group block py-8"
              >
                <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                  <h3
                    className="transition-colors group-hover:text-[#ffb829]"
                    style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.035em' }}
                  >
                    {p.name}
                  </h3>
                  <span className="uppercase" style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.35px', color: ASH }}>
                    {p.tag}
                  </span>
                </div>
                <p className="mt-2 max-w-[520px]" style={{ fontSize: 18, fontWeight: 200, lineHeight: 1.5, color: MIST }}>
                  {p.text}
                </p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="py-[120px] pb-[96px]">
          <motion.div {...fadeUp}>
            <Label>Contact</Label>
            <h2 style={{ fontSize: 'clamp(52px, 8vw, 113px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
              Construisons
              <br />
              votre constellation.
            </h2>
            <div className="mt-12 flex items-center gap-8">
              <a
                href={`mailto:${EMAIL}`}
                className="uppercase text-white transition-transform hover:scale-[1.04]"
                style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.025em', background: IRIS, borderRadius: 22.5, padding: '14.4px 16px' }}
              >
                Demander un accès
              </a>
              <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-white" style={{ fontSize: 14, fontWeight: 400, color: ASH }}>
                {EMAIL}
              </a>
            </div>
          </motion.div>
        </section>

        {/* Pied de page minimal */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-0 py-10">
          <span className="flex items-center gap-2.5">
            <LogoMark />
            <span style={{ fontSize: 14, fontWeight: 400, color: ASH }}>© 2026 Benu Studio</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 400, color: ASH }}>
            Le savoir, visualisé en intelligence distribuée.
          </span>
        </footer>
      </main>
    </div>
  )
}
