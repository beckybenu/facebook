import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const VIOLET = '#7b2fff'
const PLASMA = '#00ffd5'

/*
  Champ quantique : particules dérivantes reliées par des filaments quand
  elles sont proches ; la souris courbe leur trajectoire (gravité locale).
*/
function QuantumField() {
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
    const N = 90
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      hue: 180 + Math.random() * 140, // du teal au violet
    }))
    const mouse = { x: -9999, y: -9999 }
    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouse)

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of parts) {
        if (!reduced) {
          // gravité locale autour du curseur
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const d2 = dx * dx + dy * dy
          if (d2 < 40000 && d2 > 1) {
            p.vx += (dx / d2) * 6
            p.vy += (dy / d2) * 6
          }
          p.vx = Math.max(-0.8, Math.min(0.8, p.vx))
          p.vy = Math.max(-0.8, Math.min(0.8, p.vy))
          p.x += p.vx
          p.y += p.vy
          p.hue = (p.hue + 0.15) % 360
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        }
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, 0.9)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      // filaments entre particules proches
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = parts[i]
          const b = parts[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d < 130) {
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 100%, 65%, ${0.22 * (1 - d / 130)})`
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(render)
    }
    render()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="fixed inset-0 z-0 pointer-events-none opacity-60" />
}

/* Gyroscope : trois anneaux 3D tournant sur des axes différents autour d'un cœur d'énergie. */
function Gyroscope() {
  return (
    <div aria-hidden className="relative h-72 w-72 md:h-[26rem] md:w-[26rem] [perspective:900px] levitate">
      {[
        { axis: 'rotateX(70deg)', dur: 9 },
        { axis: 'rotateY(70deg)', dur: 13 },
        { axis: 'rotateX(45deg) rotateY(45deg)', dur: 17 },
      ].map((r, i) => (
        <div key={i} className="absolute inset-0" style={{ transform: r.axis, transformStyle: 'preserve-3d' }}>
          <div
            className="absolute inset-0 rounded-full border-2 gyro-spin"
            style={{
              borderColor: i % 2 === 0 ? `${PLASMA}66` : `${VIOLET}88`,
              boxShadow: `0 0 24px ${i % 2 === 0 ? PLASMA : VIOLET}33`,
              animationDuration: `${r.dur}s`,
            }}
          />
        </div>
      ))}
      {/* cœur d'énergie iridescent */}
      <div className="absolute inset-[34%] rounded-full core-pulse" />
    </div>
  )
}

/* Titre qui se matérialise : chaque lettre s'ionise (flou + éclat) dans un ordre aléatoire. */
function Materialize({
  text,
  className = '',
  letterClass = '',
  baseDelay = 0,
}: {
  text: string
  className?: string
  letterClass?: string
  baseDelay?: number
}) {
  const delays = useMemo(() => text.split('').map((_, i) => baseDelay + ((i * 7919) % (text.length * 45)) / 1000), [text, baseDelay])
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, filter: 'blur(14px)', scale: 1.6 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          transition={{ delay: delays[i], duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`inline-block ${letterClass}`}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  )
}

const warpIn = {
  initial: { opacity: 0, scale: 0.9, rotateX: 18, filter: 'blur(8px)' },
  whileInView: { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
} as const

export default function Singularite() {
  return (
    <div className="relative min-h-screen bg-[#010104] text-[#e8e6ff] overflow-x-hidden">
      {/* nébuleuse de fond */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 45% at 75% 15%, ${VIOLET}22, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 85%, ${PLASMA}14, transparent 60%)`,
        }}
      />
      <QuantumField />
      <StylePicker color={PLASMA} />

      {/* HUD supérieur */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#010104]/60 border-b border-white/10"
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/singularite" className="font-display font-bold tracking-[0.2em] iridescent-text">
            ⬡ BENU·2350
          </a>
          <p className="hidden md:block font-mono text-[10px] tracking-[0.3em] text-[#e8e6ff]/40">
            IA SYMBIOTIQUE : <span style={{ color: PLASMA }}>ACTIVE</span> // FLUX : STABLE
          </p>
          <a href={`mailto:${EMAIL}`} className="chamfer px-5 py-2 text-sm font-semibold text-[#010104] iridescent-bg">
            Initier un lien
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="min-h-screen flex items-center px-6">
          <div className="mx-auto max-w-6xl w-full grid md:grid-cols-[1.15fr_1fr] items-center gap-10 pt-24">
            <div style={{ perspective: 1000 }}>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-[#e8e6ff]/50"
              >
                ⬡ studio de développement — ère 2350
              </motion.p>
              <h1 className="font-display font-extrabold leading-[0.98] text-[clamp(2.6rem,7.5vw,6.2rem)]">
                <Materialize text="Au-delà" baseDelay={0.3} />
                <br />
                <Materialize text="du possible." baseDelay={0.6} className="chromatic" letterClass="iridescent-text" />
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.8 }}
                className="mt-8 max-w-lg text-lg text-[#e8e6ff]/65"
              >
                Interfaces symbiotiques, automatisations intelligentes,
                expériences qui semblent venir d&apos;un autre siècle.
                Nous codons trois cents ans en avance.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9, duration: 0.8 }}
                className="mt-10 flex flex-wrap gap-5"
              >
                <a href={`mailto:${EMAIL}`} className="chamfer px-8 py-4 font-semibold text-[#010104] iridescent-bg transition-transform hover:scale-105">
                  Transmettre votre vision
                </a>
                <a
                  href="#sing-projets"
                  className="chamfer border px-8 py-4 font-semibold transition-all hover:scale-105"
                  style={{ borderColor: `${PLASMA}55`, color: PLASMA }}
                >
                  Explorer les artefacts
                </a>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:flex justify-center"
            >
              <Gyroscope />
            </motion.div>
          </div>
        </section>

        {/* Bandeau flux de données */}
        <section className="border-y border-white/10 py-5 overflow-hidden">
          <motion.div
            className="flex w-max gap-14 whitespace-nowrap font-mono text-sm tracking-[0.25em] uppercase"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
          >
            {[...Array(2)].flatMap((_, r) =>
              ['Interfaces neurales', 'IA générative', 'Web quantique', 'Automatisation totale', 'Design symbiotique', 'Réalité augmentée'].map((t, i) => (
                <span key={`${r}-${i}`} className="flex items-center gap-14 text-[#e8e6ff]/50">
                  {t} <span className="iridescent-text">⬡</span>
                </span>
              )),
            )}
          </motion.div>
        </section>

        {/* Services : modules chanfreinés à bordure d'énergie rotative */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...warpIn} className="font-display text-4xl md:text-6xl font-extrabold mb-4">
            Modules<span className="iridescent-text">.</span>
          </motion.h2>
          <motion.p {...warpIn} className="text-[#e8e6ff]/50 mb-16 max-w-lg">
            Quatre capacités fondamentales, calibrées pour l&apos;ère post-singularité.
          </motion.p>
          <div className="grid gap-6 md:grid-cols-2" style={{ perspective: 1200 }}>
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                {...warpIn}
                transition={{ ...warpIn.transition, delay: i * 0.1 }}
                className="energy-border chamfer-lg group p-8"
              >
                <p className="font-mono text-[11px] tracking-[0.3em] mb-4 text-[#e8e6ff]/40">
                  MOD-{String(i + 1).padStart(2, '0')} ⬡ EN LIGNE
                </p>
                <h3 className="font-display text-2xl font-bold mb-3 group-hover:iridescent-text transition-all">
                  {s.title}
                </h3>
                <p className="text-[#e8e6ff]/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets : éclats de données en lévitation */}
        <section id="sing-projets" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...warpIn} className="font-display text-4xl md:text-6xl font-extrabold mb-16">
            Artefacts<span className="iridescent-text">.</span>
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...warpIn}
                transition={{ ...warpIn.transition, delay: i * 0.12 }}
                whileHover={{ y: -10, rotate: 0 }}
                className="shard levitate p-8 min-h-[240px] flex flex-col justify-end"
                style={{ animationDelay: `${i * 0.8}s`, rotate: i % 2 === 0 ? '-1.5deg' : '1.5deg' }}
              >
                <p className="font-mono text-[11px] tracking-[0.25em] text-[#e8e6ff]/40 mb-3 uppercase">{p.tag}</p>
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">{p.name}</h3>
                <p className="text-[#e8e6ff]/60 text-sm">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA : portail d'énergie */}
        <footer className="px-6 py-32 text-center relative">
          <div className="relative mx-auto flex items-center justify-center" style={{ height: '30rem' }}>
            {/* anneau-portail en rotation */}
            <div aria-hidden className="portal absolute h-[26rem] w-[26rem] md:h-[30rem] md:w-[30rem]" />
            <div className="relative">
              <motion.h2 {...warpIn} className="font-display font-extrabold text-3xl md:text-5xl mb-6">
                Franchissez
                <br />
                <span className="iridescent-text chromatic">le portail.</span>
              </motion.h2>
              <motion.a
                {...warpIn}
                href={`mailto:${EMAIL}`}
                whileHover={{ scale: 1.08 }}
                className="chamfer inline-block px-9 py-4 font-semibold text-[#010104] iridescent-bg"
              >
                {EMAIL}
              </motion.a>
            </div>
          </div>
          <p className="mt-10 font-mono text-[11px] tracking-[0.3em] text-[#e8e6ff]/35 uppercase">
            © 2350 benu studio ⬡ transmission achevée
          </p>
        </footer>
      </main>
    </div>
  )
}
