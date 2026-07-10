import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const GOLD = '#ffd166'
const BRONZE = '#b08d57'

/* Cadran temporel : anneaux gradués tournant en sens opposés + aiguille. */
function ChronoDial() {
  return (
    <div aria-hidden className="relative h-72 w-72 md:h-[24rem] md:w-[24rem]">
      <div className="absolute inset-0 rounded-full ch-ticks ch-spin-slow" />
      <div className="absolute inset-[14%] rounded-full ch-ticks-fine ch-spin-rev" />
      <div className="absolute inset-[30%] rounded-full border" style={{ borderColor: `${GOLD}44` }} />
      {/* aiguille */}
      <div className="absolute inset-0 ch-spin-hand">
        <span
          className="absolute left-1/2 top-[8%] h-[42%] w-[2.5px] -translate-x-1/2 origin-bottom rounded"
          style={{ background: `linear-gradient(to top, ${GOLD}, transparent)`, boxShadow: `0 0 12px ${GOLD}88` }}
        />
      </div>
      <div className="absolute inset-[47%] rounded-full" style={{ background: GOLD, boxShadow: `0 0 30px ${GOLD}aa` }} />
    </div>
  )
}

/*
  Titre à échos temporels : deux copies fantômes suivent le titre avec un
  retard croissant — le texte existe dans trois instants à la fois.
*/
function EchoTitle() {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const echo1x = useSpring(x, { stiffness: 60, damping: 14 })
  const echo1y = useSpring(y, { stiffness: 60, damping: 14 })
  const echo2x = useSpring(x, { stiffness: 22, damping: 12 })
  const echo2y = useSpring(y, { stiffness: 22, damping: 12 })

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set(((e.clientX - r.left) / r.width - 0.5) * 26)
    y.set(((e.clientY - r.top) / r.height - 0.5) * 18)
  }

  const lines = (
    <>
      Le temps
      <br />
      nous obéit.
    </>
  )

  return (
    <div ref={ref} onMouseMove={onMove} className="relative cursor-default select-none">
      <motion.h1
        aria-hidden
        style={{ x: echo2x, y: echo2y }}
        className="absolute inset-0 font-display font-extrabold leading-[0.98] text-[clamp(2.7rem,8vw,6.6rem)] opacity-20"
      >
        <span style={{ color: BRONZE }}>{lines}</span>
      </motion.h1>
      <motion.h1
        aria-hidden
        style={{ x: echo1x, y: echo1y }}
        className="absolute inset-0 font-display font-extrabold leading-[0.98] text-[clamp(2.7rem,8vw,6.6rem)] opacity-45"
      >
        <span style={{ color: GOLD }}>{lines}</span>
      </motion.h1>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative font-display font-extrabold leading-[0.98] text-[clamp(2.7rem,8vw,6.6rem)] text-[#f5eee0]"
      >
        {lines}
      </motion.h1>
    </div>
  )
}

/* Entrée « rembobinée » : l'élément dépasse sa position puis revient — comme une bande qu'on rembobine. */
const rewind = {
  initial: { opacity: 0, x: 90 },
  whileInView: { opacity: 1, x: [90, -14, 0] as number[] },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 1, times: [0, 0.7, 1], ease: 'easeOut' as const },
}

const YEARS = ['2026', '2150', '2350', '2600', '2800', '3000']

export default function Chronoflux() {
  return (
    <div className="relative min-h-screen bg-[#0c0a08] text-[#f5eee0] overflow-x-hidden">
      {/* halo sépia */}
      <div aria-hidden className="fixed inset-0 z-0" style={{ background: `radial-gradient(ellipse 60% 50% at 70% 20%, ${BRONZE}1c, transparent 65%)` }} />
      <StylePicker color={GOLD} />

      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#0c0a08]/70 border-b"
        style={{ borderColor: `${GOLD}26` }}
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/chronos" className="font-display font-bold text-lg" style={{ color: GOLD }}>
            ◷ BENU CHRONOFLUX
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-full border px-6 py-2.5 text-sm font-semibold transition-all hover:text-[#0c0a08]"
            style={{ borderColor: GOLD, color: GOLD }}
            onMouseEnter={(e) => (e.currentTarget.style.background = GOLD)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Gagner du temps
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="min-h-screen flex items-center px-6">
          <div className="mx-auto max-w-6xl w-full grid md:grid-cols-[1.2fr_1fr] items-center gap-12 pt-24">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-[#f5eee0]/50"
              >
                ◷ studio de développement — flux temporel maîtrisé
              </motion.p>
              <EchoTitle />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-8 max-w-lg text-lg text-[#f5eee0]/65"
              >
                Nous livrons avant l&apos;échéance, automatisons l&apos;ennui et
                rendons chaque seconde de vos utilisateurs mémorable.
                Survole le titre : il traîne son propre passé.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-10 flex flex-wrap gap-5"
              >
                <a
                  href={`mailto:${EMAIL}`}
                  className="rounded-full px-9 py-4 font-semibold text-[#0c0a08] transition-transform hover:scale-105"
                  style={{ background: `linear-gradient(120deg, ${GOLD}, ${BRONZE})`, boxShadow: `0 10px 40px ${GOLD}33` }}
                >
                  Remonter le temps
                </a>
                <a href="#ch-projets" className="rounded-full border px-9 py-4 font-semibold" style={{ borderColor: `${GOLD}44`, color: GOLD }}>
                  Consulter les archives
                </a>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:flex justify-center"
            >
              <ChronoDial />
            </motion.div>
          </div>
        </section>

        {/* Frise des années qui défile */}
        <section className="border-y py-6 overflow-hidden" style={{ borderColor: `${GOLD}22` }}>
          <motion.div
            className="flex w-max gap-16 whitespace-nowrap font-display font-bold text-3xl"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
          >
            {[...Array(2)].flatMap((_, r) =>
              YEARS.map((yr, i) => (
                <span key={`${r}-${i}`} className="flex items-center gap-16" style={{ color: yr === '3000' ? GOLD : '#f5eee055' }}>
                  {yr} <span style={{ color: `${BRONZE}88` }}>◷</span>
                </span>
              )),
            )}
          </motion.div>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...rewind} className="font-display text-4xl md:text-6xl font-extrabold mb-16">
            Nos époques<span style={{ color: GOLD }}>.</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                {...rewind}
                transition={{ ...rewind.transition, delay: i * 0.1 }}
                className="ch-ghost group relative rounded-2xl border p-8"
                style={{ borderColor: `${GOLD}2e`, background: 'rgba(255, 209, 102, 0.04)' }}
              >
                <p className="font-mono text-[11px] tracking-[0.3em] mb-4" style={{ color: `${GOLD}88` }}>
                  ÈRE {String(i + 1).padStart(2, '0')} — STABILISÉE
                </p>
                <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-[#f5eee0]/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section id="ch-projets" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...rewind} className="font-display text-4xl md:text-6xl font-extrabold mb-16">
            Les archives<span style={{ color: BRONZE }}>.</span>
          </motion.h2>
          <div className="space-y-5">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...rewind}
                transition={{ ...rewind.transition, delay: i * 0.1 }}
                className="ch-ghost group flex items-center justify-between gap-6 rounded-2xl border p-7"
                style={{ borderColor: `${GOLD}26`, background: 'rgba(255, 209, 102, 0.03)' }}
              >
                <div>
                  <p className="font-mono text-xs mb-1" style={{ color: `${GOLD}99` }}>{p.tag}</p>
                  <h3 className="font-display text-2xl md:text-4xl font-bold">{p.name}</h3>
                  <p className="text-[#f5eee0]/55 mt-1 max-w-lg">{p.text}</p>
                </div>
                <span className="text-3xl transition-transform duration-500 group-hover:rotate-[360deg]" style={{ color: GOLD }}>
                  ◷
                </span>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center">
          <motion.h2 {...rewind} className="font-display font-extrabold text-[clamp(2.2rem,6vw,4.6rem)] mb-10">
            Votre futur commence{' '}
            <span style={{ color: GOLD, textShadow: `0 0 30px ${GOLD}66` }}>maintenant.</span>
          </motion.h2>
          <motion.a
            {...rewind}
            href={`mailto:${EMAIL}`}
            whileHover={{ scale: 1.06 }}
            className="inline-block rounded-full px-10 py-5 text-lg font-semibold text-[#0c0a08]"
            style={{ background: `linear-gradient(120deg, ${GOLD}, ${BRONZE})`, boxShadow: `0 0 40px ${GOLD}44` }}
          >
            {EMAIL}
          </motion.a>
          <p className="mt-20 text-xs text-[#f5eee0]/40">© 3000 Benu Studio — édition Chronoflux ◷ boucle fermée</p>
        </footer>
      </main>
    </div>
  )
}
