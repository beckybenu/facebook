import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Zap } from 'lucide-react'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const MAGENTA = '#ff2ecc'
const CYAN = '#00f0ff'

/* Pluie de streaks néon : traits verticaux qui tombent à des vitesses aléatoires. */
function NeonRain() {
  const streaks = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: `${(i * 137) % 100}%`,
        duration: 2.2 + ((i * 53) % 100) / 28,
        delay: -(((i * 91) % 100) / 18),
        color: i % 3 === 0 ? CYAN : MAGENTA,
        height: 14 + ((i * 71) % 100) / 6,
      })),
    [],
  )
  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {streaks.map((s, i) => (
        <span
          key={i}
          className="neon-streak"
          style={{
            left: s.left,
            height: `${s.height}vh`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            ['--sc' as string]: s.color,
          }}
        />
      ))}
    </div>
  )
}

export default function NeoTokyo() {
  return (
    <div className="relative min-h-screen bg-[#0a0412] text-[#f6eef8] overflow-x-hidden scanlines-strong">
      <NeonRain />
      <StylePicker color={CYAN} />

      {/* Nav néon */}
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#0a0412]/70 border-b border-[#ff2ecc]/30"
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/neo" className="font-display font-bold text-lg tracking-widest flicker" style={{ color: MAGENTA, textShadow: `0 0 12px ${MAGENTA}` }}>
            ベヌ • BENU
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-none border px-5 py-2 text-sm font-bold uppercase tracking-wider transition-all hover:text-[#0a0412]"
            style={{ borderColor: CYAN, color: CYAN, boxShadow: `0 0 14px ${CYAN}55` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = CYAN)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Projet_
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO glitch */}
        <section className="min-h-screen flex flex-col justify-center px-6 relative">
          <div className="mx-auto max-w-6xl w-full pt-24">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flicker mb-6 font-mono text-sm uppercase tracking-[0.4em]"
              style={{ color: CYAN, textShadow: `0 0 10px ${CYAN}` }}
            >
              ▶ studio de développement — secteur 2050
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-extrabold uppercase leading-[0.95] text-[clamp(2.6rem,8.5vw,7rem)]"
            >
              <span className="glitch block" data-text="Du code qui">
                Du code qui
              </span>
              <span className="glitch block" data-text="crève l'écran." style={{ color: MAGENTA, textShadow: `0 0 30px ${MAGENTA}88` }}>
                crève l&apos;écran.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-8 max-w-xl text-lg text-[#f6eef8]/70"
            >
              Sites et applications taillés comme des enseignes de nuit : impossibles
              à ignorer. Développement web, mobile et automatisation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <a
                href={`mailto:${EMAIL}`}
                className="px-8 py-4 font-bold uppercase tracking-wider text-[#0a0412] transition-transform hover:scale-105"
                style={{ background: MAGENTA, boxShadow: `0 0 30px ${MAGENTA}99, 0 0 60px ${MAGENTA}44` }}
              >
                Lancer un projet
              </a>
              <a
                href="#neo-projets"
                className="border px-8 py-4 font-bold uppercase tracking-wider transition-transform hover:scale-105"
                style={{ borderColor: CYAN, color: CYAN, boxShadow: `inset 0 0 20px ${CYAN}22` }}
              >
                Voir le travail
              </a>
            </motion.div>
          </div>

          {/* kanji décoratif */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 }}
            aria-hidden
            className="absolute right-6 top-1/3 hidden lg:block font-display text-7xl [writing-mode:vertical-rl] flicker"
            style={{ color: `${MAGENTA}66`, textShadow: `0 0 20px ${MAGENTA}44` }}
          >
            未来都市
          </motion.span>
        </section>

        {/* Marquee double sens */}
        <section className="border-y py-4 overflow-hidden space-y-3" style={{ borderColor: `${MAGENTA}33` }}>
          {[0, 1].map((row) => (
            <motion.div
              key={row}
              className="flex w-max gap-10 whitespace-nowrap font-display font-bold uppercase text-xl"
              animate={{ x: row === 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
              transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
            >
              {[...Array(2)].flatMap(() =>
                ['React', 'TypeScript', 'Node.js', 'React Native', 'Odoo', 'IA', 'Framer Motion', 'PostgreSQL'].map((t, i) => (
                  <span key={`${row}-${t}-${i}-${Math.min(i, 1)}`} className="flex items-center gap-10" style={row === 0 ? { color: CYAN } : { WebkitTextStroke: `1px ${MAGENTA}`, color: 'transparent' }}>
                    {t} <Zap className="h-4 w-4" style={{ color: MAGENTA }} />
                  </span>
                )),
              )}
            </motion.div>
          ))}
        </section>

        {/* Services en enseignes néon */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <motion.h2
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="glitch font-display text-4xl md:text-6xl font-extrabold uppercase mb-14"
            data-text="Services_"
          >
            Services_
          </motion.h2>
          <div className="grid gap-5 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ x: 6 }}
                className="neon-card p-7"
                style={{ ['--nc' as string]: i % 2 === 0 ? MAGENTA : CYAN }}
              >
                <p className="font-mono text-xs mb-3" style={{ color: i % 2 === 0 ? MAGENTA : CYAN }}>
                  [{String(i + 1).padStart(2, '0')}]
                </p>
                <h3 className="font-display text-2xl font-bold uppercase mb-2">{s.title}</h3>
                <p className="text-[#f6eef8]/60">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section id="neo-projets" className="mx-auto max-w-6xl px-6 py-24">
          <motion.h2
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="glitch font-display text-4xl md:text-6xl font-extrabold uppercase mb-14"
            data-text="Projets_"
          >
            Projets_
          </motion.h2>
          <div className="space-y-4">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-center justify-between gap-6 border-b py-6 transition-colors"
                style={{ borderColor: `${CYAN}26` }}
              >
                <div>
                  <p className="font-mono text-xs mb-1" style={{ color: CYAN }}>{p.tag}</p>
                  <h3 className="rgb-split font-display text-3xl md:text-5xl font-extrabold uppercase transition-all">
                    {p.name}
                  </h3>
                  <p className="text-[#f6eef8]/50 mt-1 max-w-lg">{p.text}</p>
                </div>
                <ArrowUpRight
                  className="h-8 w-8 shrink-0 transition-all duration-300 group-hover:rotate-45"
                  style={{ color: MAGENTA }}
                />
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA enseigne */}
        <footer className="px-6 py-28 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            className="mx-auto max-w-3xl border-2 p-10 md:p-16 flicker"
            style={{ borderColor: MAGENTA, boxShadow: `0 0 40px ${MAGENTA}55, inset 0 0 40px ${MAGENTA}22` }}
          >
            <h2 className="font-display text-3xl md:text-5xl font-extrabold uppercase mb-6">
              Branche ton projet <span style={{ color: CYAN, textShadow: `0 0 20px ${CYAN}` }}>au secteur.</span>
            </h2>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-block px-10 py-5 font-bold uppercase tracking-wider text-[#0a0412] transition-transform hover:scale-105"
              style={{ background: CYAN, boxShadow: `0 0 30px ${CYAN}99` }}
            >
              {EMAIL}
            </a>
          </motion.div>
          <p className="mt-14 text-xs text-[#f6eef8]/40 font-mono">© 2026 BENU STUDIO // NÉO-TOKYO EDITION</p>
        </footer>
      </main>
    </div>
  )
}
