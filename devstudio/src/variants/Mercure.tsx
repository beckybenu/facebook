import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const CYAN = '#66e0ff'

/*
  Métal liquide : des gouttes de mercure dérivent et FUSIONNENT entre elles.
  Le canvas est flouté puis re-contrasté en CSS → effet « goo » de métaballs.
*/
function LiquidMetal() {
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
    let t = 0
    const blobs = Array.from({ length: 8 }, (_, i) => ({
      r: 40 + (i % 4) * 26,
      sx: 0.25 + (i % 3) * 0.18,
      sy: 0.18 + ((i + 1) % 3) * 0.14,
      px: (i * 977) % 100,
      py: (i * 613) % 100,
    }))

    const render = () => {
      if (!reduced) t += 0.004
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const b of blobs) {
        const x = canvas.width * (0.5 + 0.42 * Math.sin(t * b.sx * 4 + b.px))
        const y = canvas.height * (0.5 + 0.4 * Math.cos(t * b.sy * 4 + b.py))
        const g = ctx.createRadialGradient(x - b.r * 0.3, y - b.r * 0.3, b.r * 0.1, x, y, b.r)
        g.addColorStop(0, '#dfe9f5')
        g.addColorStop(0.55, '#8fa8c8')
        g.addColorStop(1, '#3d5573')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(render)
    }
    render()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none opacity-45 goo-wrap">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  )
}

/* Lettres qui tombent comme des gouttes et rebondissent (ressort liquide). */
function DropIn({
  text,
  className = '',
  letterClass = '',
  delay = 0,
}: {
  text: string
  className?: string
  letterClass?: string
  delay?: number
}) {
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ y: -90, opacity: 0, scaleY: 1.6 }}
          animate={{ y: 0, opacity: 1, scaleY: 1 }}
          transition={{ delay: delay + i * 0.05, type: 'spring', stiffness: 320, damping: 13 }}
          className={`inline-block ${letterClass}`}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  )
}

export default function Mercure() {
  return (
    <div className="relative min-h-screen bg-[#05070c] text-[#eaf1f9] overflow-x-hidden">
      <LiquidMetal />
      <StylePicker color={CYAN} />

      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#05070c]/60 border-b border-white/10"
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/mercure" className="font-display font-bold text-lg chrome-text">
            ◉ BENU LIQUIDE
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="mq-blob-btn px-6 py-2.5 text-sm font-semibold text-[#05070c]"
          >
            Couler un projet
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="min-h-screen flex items-center px-6">
          <div className="mx-auto max-w-6xl w-full pt-24">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-sm uppercase tracking-[0.35em] text-[#eaf1f9]/50"
            >
              ◉ studio de développement — état : fusion
            </motion.p>
            <h1 className="font-display font-extrabold leading-[0.98] text-[clamp(2.7rem,8vw,6.8rem)]">
              <DropIn text="Un code" delay={0.3} letterClass="chrome-text" />
              <br />
              <DropIn text="à l'état liquide." delay={0.8} />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.8 }}
              className="mt-8 max-w-xl text-lg text-[#eaf1f9]/65"
            >
              Des interfaces qui coulent, fusionnent et épousent chaque écran.
              Web, mobile, automatisation — sans une seule soudure apparente.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.8 }}
              className="mt-10 flex flex-wrap gap-5"
            >
              <a href={`mailto:${EMAIL}`} className="mq-blob-btn px-9 py-4 font-semibold text-[#05070c]">
                Entrer en fusion
              </a>
              <a
                href="#mq-projets"
                className="mq-morph border border-white/25 px-9 py-4 font-semibold hover:border-[#66e0ff] transition-colors"
              >
                Voir les coulées
              </a>
            </motion.div>
          </div>
        </section>

        {/* Services : cellules organiques qui changent de forme */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="font-display text-4xl md:text-6xl font-extrabold mb-16 chrome-text"
          >
            Nos alliages.
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 160, damping: 14 }}
                whileHover={{ rotate: i % 2 === 0 ? 1.5 : -1.5, scale: 1.02 }}
                className="mq-morph mq-cell p-9"
                style={{ animationDelay: `${i * -3}s` }}
              >
                <span className="mb-5 inline-block h-11 w-11 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, #eaf1f9, ${CYAN} 45%, #3d5573)` }} />
                <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-[#eaf1f9]/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets : gouttes étirées */}
        <section id="mq-projets" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="font-display text-4xl md:text-6xl font-extrabold mb-16"
          >
            Coulées récentes<span className="chrome-text">.</span>
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                initial={{ opacity: 0, y: 70, scaleY: 1.3 }}
                whileInView={{ opacity: 1, y: 0, scaleY: 1 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 15 }}
                whileHover={{ y: -10 }}
                className="mq-cell mq-morph p-8 min-h-[230px] flex flex-col justify-end"
                style={{ animationDelay: `${i * -4}s` }}
              >
                <p className="text-xs uppercase tracking-[0.25em] text-[#eaf1f9]/50 mb-3">{p.tag}</p>
                <h3 className="font-display text-2xl font-bold mb-1 chrome-text">{p.name}</h3>
                <p className="text-[#eaf1f9]/60 text-sm">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center">
          <motion.h2
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 140, damping: 12 }}
            className="font-display font-extrabold text-[clamp(2.2rem,6vw,4.6rem)] mb-10"
          >
            Fondons vos idées <span className="chrome-text">en or.</span>
          </motion.h2>
          <motion.a
            href={`mailto:${EMAIL}`}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            className="mq-blob-btn inline-block px-10 py-5 text-lg font-semibold text-[#05070c]"
          >
            {EMAIL}
          </motion.a>
          <p className="mt-20 text-xs text-[#eaf1f9]/40">© 3000 Benu Studio — édition Mercure ◉ état stable</p>
        </footer>
      </main>
    </div>
  )
}
