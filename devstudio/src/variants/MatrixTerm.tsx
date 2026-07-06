import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const GREEN = '#00ff88'

/* Pluie de code : caractères katakana/symboles qui tombent en colonnes. */
function CodeRain() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let frame = 0
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const CHARS = 'アイウエオカキクケコサシスセソタチツテト01<>/{}[]=+*#$'
    const FS = 16
    const drops: number[] = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const draw = () => {
      frame++
      if (frame % 2 === 0 && !reduced) {
        ctx.fillStyle = 'rgba(2, 8, 3, 0.09)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.font = `${FS}px monospace`
        const cols = Math.floor(canvas.width / FS)
        for (let i = 0; i < cols; i++) {
          if (drops[i] === undefined) drops[i] = Math.floor(Math.random() * -60)
          const ch = CHARS[(Math.random() * CHARS.length) | 0]
          ctx.fillStyle = Math.random() > 0.975 ? '#d8ffe9' : GREEN
          ctx.globalAlpha = 0.75
          ctx.fillText(ch, i * FS, drops[i] * FS)
          ctx.globalAlpha = 1
          if (drops[i] * FS > canvas.height && Math.random() > 0.972) drops[i] = 0
          drops[i]++
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="fixed inset-0 z-0 pointer-events-none opacity-35" />
}

/* Texte qui se décode : les lettres cyclent des caractères aléatoires puis se figent. */
function Scramble({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [out, setOut] = useState('')

  useEffect(() => {
    if (!inView) return
    const POOL = '!<>-_\\/[]{}=+*^?#ABCDEF0123456789'
    let frame = 0
    const iv = setInterval(() => {
      frame++
      const settled = Math.floor(frame / 2.5)
      setOut(
        text
          .split('')
          .map((ch, i) => (i < settled ? ch : ch === ' ' ? ' ' : POOL[(Math.random() * POOL.length) | 0]))
          .join(''),
      )
      if (settled >= text.length) clearInterval(iv)
    }, 28)
    return () => clearInterval(iv)
  }, [inView, text])

  return (
    <span ref={ref} className={className}>
      {out || ' '}
    </span>
  )
}

/* Terminal qui tape ses lignes tout seul. */
const TERM_LINES = [
  '$ benu init --annee 2050',
  '> chargement du moteur créatif ......... OK',
  '> compilation des idées ................ OK',
  '> injection des animations ............. OK',
  `> contact : ${EMAIL}`,
  '$ benu deploy --production ▊',
]

function Terminal() {
  const [progress, setProgress] = useState(0) // nombre total de caractères affichés

  const fullText = TERM_LINES.join('\n')
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= fullText.length) {
          clearInterval(iv)
          return p
        }
        return p + 2
      })
    }, 24)
    return () => clearInterval(iv)
  }, [fullText.length])

  const shown = fullText.slice(0, progress).split('\n')

  return (
    <div className="rounded-xl border overflow-hidden font-terminal text-sm md:text-base" style={{ borderColor: `${GREEN}44`, boxShadow: `0 0 40px ${GREEN}22` }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-[#03140a]" style={{ borderColor: `${GREEN}33` }}>
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs" style={{ color: `${GREEN}88` }}>
          benu@studio: ~/futur
        </span>
      </div>
      <div className="bg-[#020803]/90 px-5 py-5 min-h-[190px]">
        {shown.map((l, i) => (
          <p key={i} className="leading-relaxed" style={{ color: l.startsWith('$') ? '#d8ffe9' : GREEN }}>
            {l}
            {i === shown.length - 1 && <span className="cursor-blink">▊</span>}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function MatrixTerm() {
  return (
    <div className="relative min-h-screen bg-[#020803] text-[#c9f7dd] overflow-x-hidden font-terminal crt">
      <CodeRain />
      <StylePicker color={GREEN} />

      {/* Nav terminal */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-sm bg-[#020803]/80 border-b"
        style={{ borderColor: `${GREEN}33` }}
      >
        <nav className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between text-sm">
          <a href="#/matrix" style={{ color: GREEN }}>
            [benu@studio ~]$
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="border px-4 py-1.5 transition-colors hover:text-[#020803]"
            style={{ borderColor: GREEN, color: GREEN }}
            onMouseEnter={(e) => (e.currentTarget.style.background = GREEN)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ./contact.sh
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-5xl px-6">
        {/* HERO terminal */}
        <section className="min-h-screen flex flex-col justify-center gap-10 pt-24">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs uppercase tracking-[0.35em] mb-5"
              style={{ color: `${GREEN}99` }}
            >
              // studio de développement web &amp; mobile
            </motion.p>
            <h1 className="font-display font-extrabold leading-tight text-[clamp(2.2rem,7vw,5.5rem)] text-[#eafff3]">
              <Scramble text="Le futur" />
              <br />
              <Scramble text="se compile ici." className="matrix-glow" />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.7 }}
              className="mt-6 max-w-xl text-[#c9f7dd]/70 text-lg"
            >
              Sites, applications et automatisations écrits ligne par ligne,
              testés, déployés. Aucun bug ne survit.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="max-w-2xl"
          >
            <Terminal />
          </motion.div>
        </section>

        {/* Services listés comme des process */}
        <section className="py-24">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-12 text-[#eafff3]">
            <span style={{ color: GREEN }}>~$</span> <Scramble text="ls ./services" />
          </h2>
          <div className="space-y-3">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.08 }}
                className="group border p-6 transition-colors hover:bg-[#00ff8812]"
                style={{ borderColor: `${GREEN}2e` }}
              >
                <div className="flex flex-wrap items-baseline gap-x-4">
                  <span style={{ color: GREEN }}>drwxr-xr-x</span>
                  <h3 className="text-xl md:text-2xl font-bold text-[#eafff3] group-hover:matrix-glow">
                    {s.title.toLowerCase().replace(/[ &]+/g, '_')}/
                  </h3>
                </div>
                <p className="mt-2 text-[#c9f7dd]/60 max-w-2xl">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Projets comme sorties de commande */}
        <section className="py-24">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-12 text-[#eafff3]">
            <span style={{ color: GREEN }}>~$</span> <Scramble text="git log --projets" />
          </h2>
          <div className="space-y-6">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1 }}
                className="block border-l-2 pl-6 py-2 transition-all hover:pl-8"
                style={{ borderColor: GREEN }}
              >
                <p className="text-xs mb-1" style={{ color: `${GREEN}99` }}>
                  commit {(i + 1) * 7}f2a{(i + 3) * 3}c · {p.tag}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-[#eafff3]">{p.name}</h3>
                <p className="text-[#c9f7dd]/60 mt-1">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="py-28 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
          >
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-8 text-[#eafff3]">
              <Scramble text="sudo lancer_votre_projet" />
            </h2>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-block border-2 px-10 py-5 text-lg font-bold transition-all hover:scale-105 hover:text-[#020803]"
              style={{ borderColor: GREEN, color: GREEN, boxShadow: `0 0 30px ${GREEN}44` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = GREEN)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {EMAIL} <span className="cursor-blink">▊</span>
            </a>
          </motion.div>
          <p className="mt-16 text-xs" style={{ color: `${GREEN}66` }}>
            © 2026 benu_studio // matrix_edition — exit code 0
          </p>
        </footer>
      </main>
    </div>
  )
}
