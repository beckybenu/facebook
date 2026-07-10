import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const BIO = '#2dffc4'
const CORAL = '#ff6ec7'

/* Spores bioluminescentes qui remontent en ondulant vers la surface. */
function Spores() {
  const spores = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        left: `${(i * 241) % 100}%`,
        size: 2 + ((i * 37) % 5),
        duration: 9 + ((i * 83) % 100) / 8,
        delay: -(((i * 59) % 100) / 6),
        color: i % 4 === 0 ? CORAL : BIO,
      })),
    [],
  )
  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {spores.map((s, i) => (
        <span
          key={i}
          className="ab-spore"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {/* rais de lumière venus de la surface */}
      <div className="ab-ray left-[12%]" style={{ animationDelay: '0s' }} />
      <div className="ab-ray left-[55%]" style={{ animationDelay: '-4s' }} />
      <div className="ab-ray left-[80%]" style={{ animationDelay: '-8s' }} />
    </div>
  )
}

/* Méduse : dôme lumineux + tentacules qui ondulent. */
function Jellyfish({ className = '', hue = BIO, delay = 0 }: { className?: string; hue?: string; delay?: number }) {
  return (
    <div aria-hidden className={`absolute pointer-events-none ab-drift ${className}`} style={{ animationDelay: `${delay}s` }}>
      <div
        className="h-24 w-32 rounded-t-full ab-breathe"
        style={{ background: `radial-gradient(ellipse at 50% 90%, ${hue}66, ${hue}18 60%, transparent)`, boxShadow: `0 0 50px ${hue}44` }}
      />
      <div className="flex justify-center gap-2 -mt-1">
        {[0, 1, 2, 3, 4].map((t) => (
          <span
            key={t}
            className="ab-tentacle w-px h-20"
            style={{ background: `linear-gradient(to bottom, ${hue}88, transparent)`, animationDelay: `${t * 0.35}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/* Titre-houle : les lettres ondulent en continu comme portées par le courant. */
function Houle({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -7, 0] }}
          transition={{
            opacity: { delay: 0.3 + i * 0.04, duration: 0.6 },
            y: { delay: 0.3 + i * 0.13, duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="inline-block"
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  )
}

const emerge = {
  initial: { opacity: 0, y: 50, filter: 'blur(10px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
} as const

export default function Abysse() {
  return (
    <div className="relative min-h-screen bg-[#020610] text-[#dcfaf0] overflow-x-hidden">
      {/* dégradé de profondeur */}
      <div aria-hidden className="fixed inset-0 z-0" style={{ background: 'linear-gradient(to bottom, #041022, #020610 55%, #01030a)' }} />
      <Spores />
      <StylePicker color={BIO} />

      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#020610]/60 border-b"
        style={{ borderColor: `${BIO}22` }}
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/abysse" className="font-display font-bold text-lg ab-glow" style={{ color: BIO }}>
            ❋ BENU ABYSSE
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-[#020610] ab-breathe"
            style={{ background: BIO, boxShadow: `0 0 24px ${BIO}66` }}
          >
            Émerger ensemble
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="min-h-screen flex items-center px-6 relative overflow-hidden">
          <Jellyfish className="right-[8%] top-[20%] hidden md:block" hue={BIO} />
          <Jellyfish className="right-[26%] bottom-[14%] hidden lg:block scale-75" hue={CORAL} delay={-3} />
          <div className="mx-auto max-w-6xl w-full pt-24">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-sm uppercase tracking-[0.35em] text-[#dcfaf0]/50"
            >
              ❋ studio de développement — zone hadale, an 3000
            </motion.p>
            <h1 className="font-display font-extrabold leading-[1.02] text-[clamp(2.6rem,7.8vw,6.4rem)]">
              <Houle text="Des idées qui" />
              <br />
              <Houle text="brillent dans le noir." className="ab-glow" />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.9 }}
              className="mt-8 max-w-xl text-lg text-[#dcfaf0]/65"
            >
              Là où les autres ne voient rien, nous cultivons des produits
              digitaux vivants — qui respirent, réagissent et illuminent.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.9 }}
              className="mt-10 flex flex-wrap gap-5"
            >
              <a
                href={`mailto:${EMAIL}`}
                className="rounded-full px-9 py-4 font-semibold text-[#020610] ab-breathe"
                style={{ background: `linear-gradient(120deg, ${BIO}, #19e6a2)`, boxShadow: `0 0 34px ${BIO}55` }}
              >
                Plonger avec nous
              </a>
              <a
                href="#ab-projets"
                className="rounded-full border px-9 py-4 font-semibold transition-colors"
                style={{ borderColor: `${CORAL}66`, color: CORAL }}
              >
                Explorer la fosse
              </a>
            </motion.div>
          </div>
        </section>

        {/* Services : organismes qui respirent */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...emerge} className="font-display text-4xl md:text-6xl font-extrabold mb-4">
            Écosystème<span style={{ color: BIO }}>.</span>
          </motion.h2>
          <motion.p {...emerge} className="text-[#dcfaf0]/50 mb-16 max-w-lg">
            Chaque service est un organisme vivant de notre récif.
          </motion.p>
          <div className="grid gap-7 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                {...emerge}
                transition={{ ...emerge.transition, delay: i * 0.12 }}
                className="ab-cell ab-breathe rounded-[2.2rem] p-9"
                style={{ animationDelay: `${i * -1.6}s`, borderColor: i % 2 === 0 ? `${BIO}33` : `${CORAL}33` }}
              >
                <span
                  className="mb-5 inline-block h-3 w-3 rounded-full ab-pulse-dot"
                  style={{ background: i % 2 === 0 ? BIO : CORAL, boxShadow: `0 0 16px ${i % 2 === 0 ? BIO : CORAL}` }}
                />
                <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-[#dcfaf0]/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section id="ab-projets" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...emerge} className="font-display text-4xl md:text-6xl font-extrabold mb-16">
            Espèces découvertes<span style={{ color: CORAL }}>.</span>
          </motion.h2>
          <div className="grid gap-7 md:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...emerge}
                transition={{ ...emerge.transition, delay: i * 0.13 }}
                whileHover={{ y: -10 }}
                className="ab-cell rounded-[2.2rem] p-8 min-h-[230px] flex flex-col justify-end"
                style={{ borderColor: `${BIO}2a` }}
              >
                <p className="text-xs uppercase tracking-[0.25em] text-[#dcfaf0]/50 mb-3">{p.tag}</p>
                <h3 className="font-display text-2xl font-bold mb-1 ab-glow">{p.name}</h3>
                <p className="text-[#dcfaf0]/60 text-sm">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center">
          <motion.h2 {...emerge} className="font-display font-extrabold text-[clamp(2.2rem,6vw,4.6rem)] mb-10">
            Remontons votre projet <span className="ab-glow">à la surface.</span>
          </motion.h2>
          <motion.a
            {...emerge}
            href={`mailto:${EMAIL}`}
            whileHover={{ scale: 1.06 }}
            className="ab-breathe inline-block rounded-full px-10 py-5 text-lg font-semibold text-[#020610]"
            style={{ background: `linear-gradient(120deg, ${BIO}, ${CORAL})`, boxShadow: `0 0 40px ${BIO}55` }}
          >
            {EMAIL}
          </motion.a>
          <p className="mt-20 text-xs text-[#dcfaf0]/40">© 3000 Benu Studio — édition Abysse ❋ pression : 1 100 bars</p>
        </footer>
      </main>
    </div>
  )
}
