import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const AMBER = '#ffb26b'
const LILAC = '#b39dff'

/*
  Étoiles aspirées : chaque étoile spirale vers le centre de l'écran en
  accélérant, puis renaît à la périphérie. Gravité visible.
*/
function AccretionStars() {
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

    type Star = { angle: number; radius: number; speed: number; hue: string }
    const spawn = (): Star => ({
      angle: Math.random() * Math.PI * 2,
      radius: (0.55 + Math.random() * 0.6) * Math.hypot(canvas.width, canvas.height) * 0.5,
      speed: 0.35 + Math.random() * 0.5,
      hue: Math.random() > 0.75 ? AMBER : Math.random() > 0.5 ? LILAC : '#f4f0ff',
    })
    const stars = Array.from({ length: 130 }, spawn)

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 6, 0.28)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const cx = canvas.width / 2
      const cy = canvas.height * 0.46
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        if (!reduced) {
          // plus proche du centre → plus rapide (gravité)
          const pull = 1 + (1 - s.radius / (canvas.width * 0.6)) * 5
          s.angle += 0.0035 * pull * s.speed
          s.radius -= 0.22 * pull * s.speed
          if (s.radius < 46) stars[i] = spawn()
        }
        const x = cx + Math.cos(s.angle) * s.radius
        const y = cy + Math.sin(s.angle) * s.radius * 0.62 // disque incliné
        const near = 1 - Math.min(1, s.radius / (canvas.width * 0.5))
        ctx.fillStyle = s.hue
        ctx.globalAlpha = 0.25 + near * 0.75
        ctx.beginPath()
        ctx.arc(x, y, 0.8 + near * 1.8, 0, Math.PI * 2)
        ctx.fill()
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

/* Le trou noir lui-même : disque d'accrétion + anneau de photons + cœur absolu. */
function BlackHole() {
  return (
    <div aria-hidden className="pointer-events-none fixed left-1/2 top-[46%] z-0 -translate-x-1/2 -translate-y-1/2">
      <div className="bh-disk h-[30rem] w-[30rem] md:h-[38rem] md:w-[38rem]" />
      <div className="bh-photon absolute inset-[24%]" />
      <div className="absolute inset-[26%] rounded-full bg-[#000006]" />
    </div>
  )
}

export default function TrouNoir() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  // le contenu est « aspiré » vers le centre en scrollant
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.55])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -7])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <div className="relative min-h-screen bg-[#000006] text-[#f4f0ff] overflow-x-hidden">
      <AccretionStars />
      <BlackHole />
      <StylePicker color={AMBER} />

      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-sm bg-[#000006]/50 border-b border-white/10"
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/trounoir" className="font-display font-bold text-lg">
            <span style={{ color: AMBER }}>●</span> BENU SINGULIER
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-[#000006] transition-transform hover:scale-105"
            style={{ background: `linear-gradient(120deg, ${AMBER}, ${LILAC})` }}
          >
            Franchir l&apos;horizon
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO : centré sur le trou noir, aspiré au scroll */}
        <section ref={heroRef} className="min-h-[130vh] flex items-start justify-center px-6 pt-[22vh] text-center">
          <motion.div style={{ scale, rotate, opacity }} className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-[#f4f0ff]/50"
            >
              ● studio de développement — masse critique atteinte
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, scale: 1.3, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-extrabold leading-[0.98] text-[clamp(2.8rem,8.5vw,7rem)]"
            >
              Impossible de
              <br />
              <span className="bh-lens">nous échapper.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.9 }}
              className="mx-auto mt-8 max-w-xl text-lg text-[#f4f0ff]/65"
            >
              Nos interfaces ont leur propre gravité : les utilisateurs entrent
              en orbite et ne repartent plus. Scrolle — tout est déjà attiré.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.9 }}
              className="mt-10 flex flex-wrap justify-center gap-5"
            >
              <a
                href={`mailto:${EMAIL}`}
                className="rounded-full px-9 py-4 font-semibold text-[#000006] transition-transform hover:scale-105"
                style={{ background: `linear-gradient(120deg, ${AMBER}, ${LILAC})`, boxShadow: `0 0 40px ${AMBER}44` }}
              >
                Entrer en orbite
              </a>
              <a href="#bh-projets" className="rounded-full border border-white/25 px-9 py-4 font-semibold hover:border-white/60 transition-colors">
                Observer le disque
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Services : matière en orbite */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2
            initial={{ opacity: 0, scale: 1.15 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9 }}
            className="font-display text-4xl md:text-6xl font-extrabold mb-16"
          >
            Notre champ gravitationnel<span style={{ color: AMBER }}>.</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -70 : 70, rotate: i % 2 === 0 ? -3 : 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ delay: i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 0.97 }}
                className="bh-card rounded-3xl p-9"
              >
                <span
                  className="bh-orbit-dot mb-6 inline-block h-10 w-10 rounded-full"
                  style={{ background: `radial-gradient(circle at 32% 32%, ${i % 2 === 0 ? AMBER : LILAC}, #1a1030)` }}
                />
                <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-[#f4f0ff]/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section id="bh-projets" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2
            initial={{ opacity: 0, scale: 1.15 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9 }}
            className="font-display text-4xl md:text-6xl font-extrabold mb-16"
          >
            Capturés par le disque<span style={{ color: LILAC }}>.</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                initial={{ opacity: 0, y: 60, scale: 1.1 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ delay: i * 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 0.96 }}
                className="bh-card rounded-3xl p-8 min-h-[230px] flex flex-col justify-end"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-[#f4f0ff]/50 mb-3">{p.tag}</p>
                <h3 className="font-display text-2xl font-bold mb-1 bh-lens">{p.name}</h3>
                <p className="text-[#f4f0ff]/60 text-sm">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center">
          <motion.h2
            initial={{ opacity: 0, scale: 1.2, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1 }}
            className="font-display font-extrabold text-[clamp(2.2rem,6vw,4.6rem)] mb-10"
          >
            Passé l&apos;horizon, <span className="bh-lens">tout devient possible.</span>
          </motion.h2>
          <motion.a
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            href={`mailto:${EMAIL}`}
            whileHover={{ scale: 1.06 }}
            className="inline-block rounded-full px-10 py-5 text-lg font-semibold text-[#000006]"
            style={{ background: `linear-gradient(120deg, ${AMBER}, ${LILAC})`, boxShadow: `0 0 50px ${AMBER}55` }}
          >
            {EMAIL}
          </motion.a>
          <p className="mt-20 text-xs text-[#f4f0ff]/40">© 3000 Benu Studio — édition Singulier ● rayon de Schwarzschild : ∞ idées</p>
        </footer>
      </main>
    </div>
  )
}
