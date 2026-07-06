import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Mail } from 'lucide-react'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const ICE = '#7dd3fc'
const VIOLET = '#a78bfa'

/* Aurores boréales : grandes nappes de couleur floutées qui dérivent lentement. */
function AuroraSky() {
  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="aurora-blob h-[60vh] w-[70vw] left-[-10%] top-[-15%]" style={{ background: `radial-gradient(ellipse, ${ICE}55, transparent 70%)`, animationDuration: '26s' }} />
      <div className="aurora-blob h-[55vh] w-[60vw] right-[-15%] top-[10%]" style={{ background: `radial-gradient(ellipse, ${VIOLET}4d, transparent 70%)`, animationDuration: '32s', animationDelay: '-8s' }} />
      <div className="aurora-blob h-[50vh] w-[65vw] left-[15%] bottom-[-20%]" style={{ background: `radial-gradient(ellipse, #34d39933, transparent 70%)`, animationDuration: '38s', animationDelay: '-16s' }} />
    </div>
  )
}

/* Système d'orbites : anneaux inclinés + satellites lumineux en rotation. */
function OrbitSystem() {
  return (
    <div aria-hidden className="relative h-72 w-72 md:h-96 md:w-96 [perspective:800px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 14 + i * 8, ease: 'linear' }}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: i % 2 === 0 ? `${ICE}44` : `${VIOLET}44`,
            transform: `rotateX(${58 + i * 8}deg) scale(${1 - i * 0.22})`,
            transformStyle: 'preserve-3d',
          }}
        >
          <span
            className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full"
            style={{ background: i % 2 === 0 ? ICE : VIOLET, boxShadow: `0 0 16px ${i % 2 === 0 ? ICE : VIOLET}` }}
          />
        </motion.div>
      ))}
      <div
        className="absolute inset-[38%] rounded-full"
        style={{ background: `radial-gradient(circle, ${ICE}, ${VIOLET})`, boxShadow: `0 0 60px ${ICE}88` }}
      />
    </div>
  )
}

function MagneticCta() {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 15 })
  const sy = useSpring(y, { stiffness: 200, damping: 15 })
  return (
    <motion.a
      ref={ref}
      href={`mailto:${EMAIL}`}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left - r.width / 2) * 0.3)
        y.set((e.clientY - r.top - r.height / 2) * 0.3)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{ x: sx, y: sy, background: `linear-gradient(120deg, ${ICE}, ${VIOLET})` }}
      whileTap={{ scale: 0.96 }}
      className="inline-flex items-center gap-3 rounded-full px-10 py-5 text-lg font-semibold text-[#050b1a]"
    >
      <Mail className="h-5 w-5" />
      {EMAIL}
    </motion.a>
  )
}

const fadeUp = {
  initial: { opacity: 0, y: 40, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
} as const

export default function Aurora() {
  return (
    <div className="relative min-h-screen bg-[#050b1a] text-[#eef4fb] overflow-x-hidden">
      <AuroraSky />
      <StylePicker color={ICE} />

      {/* Nav verre dépoli */}
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 inset-x-4 md:inset-x-10 z-40 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
      >
        <nav className="px-6 py-3.5 flex items-center justify-between">
          <a href="#/aurora" className="font-display font-bold tracking-tight">
            <span style={{ color: ICE }}>●</span> Benu Studio
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-full px-5 py-2 text-sm font-semibold text-[#050b1a] transition-transform hover:scale-105"
            style={{ background: `linear-gradient(120deg, ${ICE}, ${VIOLET})` }}
          >
            Démarrer
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO calme et premium */}
        <section className="min-h-screen flex items-center px-6">
          <div className="mx-auto max-w-6xl w-full grid md:grid-cols-[1.2fr_1fr] items-center gap-12 pt-28 md:pt-16">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mb-6 text-sm uppercase tracking-[0.35em] text-[#eef4fb]/50"
              >
                Studio de développement web &amp; mobile
              </motion.p>
              {['Des produits', 'digitaux qui', 'inspirent confiance.'].map((l, i) => (
                <motion.span
                  key={l}
                  initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.35 + i * 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="block font-display font-bold leading-[1.02] text-[clamp(2.4rem,6.5vw,5.2rem)]"
                >
                  {i === 2 ? (
                    <span
                      style={{
                        background: `linear-gradient(120deg, ${ICE}, ${VIOLET})`,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                      }}
                    >
                      {l}
                    </span>
                  ) : (
                    l
                  )}
                </motion.span>
              ))}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-8 max-w-lg text-lg text-[#eef4fb]/65"
              >
                Nous concevons des sites et applications d&apos;une fluidité
                absolue — pensés, dessinés et développés avec précision.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="mt-10 flex flex-wrap items-center gap-6"
              >
                <a
                  href={`mailto:${EMAIL}`}
                  className="rounded-full px-8 py-4 font-semibold text-[#050b1a] transition-transform hover:scale-105"
                  style={{ background: `linear-gradient(120deg, ${ICE}, ${VIOLET})`, boxShadow: `0 10px 40px ${ICE}33` }}
                >
                  Discuter du projet
                </a>
                <a href="#aurora-projets" className="group inline-flex items-center gap-2 text-[#eef4fb]/70 hover:text-[#eef4fb] transition-colors">
                  Voir les projets
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: ICE }} />
                </a>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:flex justify-center"
            >
              <OrbitSystem />
            </motion.div>
          </div>
        </section>

        {/* Services en panneaux de verre */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <motion.h2 {...fadeUp} className="font-display text-4xl md:text-5xl font-bold mb-14">
            Ce que nous faisons<span style={{ color: ICE }}>.</span>
          </motion.h2>
          <div className="grid gap-5 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 transition-shadow hover:shadow-[0_20px_60px_rgba(125,211,252,0.15)]"
              >
                <span
                  className="mb-5 inline-block h-10 w-10 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${i % 2 === 0 ? ICE : VIOLET}, transparent)`, boxShadow: `0 0 24px ${i % 2 === 0 ? ICE : VIOLET}44` }}
                />
                <h3 className="font-display text-2xl font-semibold mb-2">{s.title}</h3>
                <p className="text-[#eef4fb]/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section id="aurora-projets" className="mx-auto max-w-6xl px-6 py-24">
          <motion.h2 {...fadeUp} className="font-display text-4xl md:text-5xl font-bold mb-14">
            Projets récents<span style={{ color: VIOLET }}>.</span>
          </motion.h2>
          <div className="grid gap-5 md:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 min-h-[220px] flex flex-col justify-end transition-shadow hover:shadow-[0_20px_60px_rgba(167,139,250,0.18)]"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-[#eef4fb]/50 mb-3">{p.tag}</p>
                <h3 className="font-display text-2xl font-bold mb-1">{p.name}</h3>
                <p className="text-[#eef4fb]/60 text-sm">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center relative">
          <motion.h2 {...fadeUp} className="font-display font-bold text-[clamp(2.2rem,6vw,4.5rem)] mb-6">
            Créons quelque chose de{' '}
            <span
              style={{
                background: `linear-gradient(120deg, ${ICE}, ${VIOLET})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              lumineux.
            </span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-[#eef4fb]/60 max-w-lg mx-auto mb-12">
            Parlez-nous de votre idée — réponse sous 24 h.
          </motion.p>
          <motion.div {...fadeUp}>
            <MagneticCta />
          </motion.div>
          <p className="mt-20 text-xs text-[#eef4fb]/40">© 2026 Benu Studio — Aurora Edition</p>
        </footer>
      </main>
    </div>
  )
}
