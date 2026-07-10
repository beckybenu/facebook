import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const BLUE = '#4da6ff'

/*
  Tesseract : un véritable hypercube 4D. Les 16 sommets (±1,±1,±1,±1) subissent
  une double rotation dans les plans XW et YZ, puis sont projetés 4D→3D→2D.
*/
function TesseractCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const SIZE = Math.min(window.innerWidth * 0.42, 460)
    canvas.width = SIZE * 2
    canvas.height = SIZE * 2
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    ctx.scale(2, 2)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 16 sommets de l'hypercube
    const verts: number[][] = []
    for (let i = 0; i < 16; i++) verts.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
    // arêtes : sommets qui diffèrent d'une seule coordonnée
    const edges: [number, number][] = []
    for (let i = 0; i < 16; i++)
      for (let j = i + 1; j < 16; j++) {
        let diff = 0
        for (let k = 0; k < 4; k++) if (verts[i][k] !== verts[j][k]) diff++
        if (diff === 1) edges.push([i, j])
      }

    let a = 0
    const render = () => {
      if (!reduced) a += 0.007
      ctx.clearRect(0, 0, SIZE, SIZE)
      const cosA = Math.cos(a)
      const sinA = Math.sin(a)
      const cosB = Math.cos(a * 0.7)
      const sinB = Math.sin(a * 0.7)

      const projected = verts.map(([x, y, z, w]) => {
        // rotation XW puis YZ
        const x1 = x * cosA - w * sinA
        const w1 = x * sinA + w * cosA
        const y1 = y * cosB - z * sinB
        const z1 = y * sinB + z * cosB
        // projection 4D → 3D (perspective depuis w)
        const k4 = 1.9 / (2.6 - w1)
        const x3 = x1 * k4
        const y3 = y1 * k4
        const z3 = z1 * k4
        // projection 3D → 2D
        const k3 = 2.2 / (3.4 - z3)
        return { px: SIZE / 2 + x3 * k3 * SIZE * 0.28, py: SIZE / 2 + y3 * k3 * SIZE * 0.28, depth: w1 }
      })

      for (const [i, j] of edges) {
        const A = projected[i]
        const B = projected[j]
        const near = (A.depth + B.depth) / 2 > 0
        ctx.strokeStyle = near ? 'rgba(255,255,255,0.9)' : 'rgba(77,166,255,0.45)'
        ctx.lineWidth = near ? 1.4 : 0.8
        ctx.shadowColor = near ? '#ffffff' : BLUE
        ctx.shadowBlur = near ? 6 : 3
        ctx.beginPath()
        ctx.moveTo(A.px, A.py)
        ctx.lineTo(B.px, B.py)
        ctx.stroke()
      }
      ctx.shadowBlur = 0
      for (const p of projected) {
        ctx.fillStyle = p.depth > 0 ? '#ffffff' : BLUE
        ctx.beginPath()
        ctx.arc(p.px, p.py, p.depth > 0 ? 2.4 : 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} aria-hidden />
}

/* Titre : l'interlettrage se déplie, comme un espace qui se déploie. */
function Unfold({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, letterSpacing: '0.6em', filter: 'blur(10px)' }}
      animate={{ opacity: 1, letterSpacing: '0.02em', filter: 'blur(0px)' }}
      transition={{ delay, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-block ${className}`}
    >
      {text}
    </motion.span>
  )
}

/* Les cartes se déplient depuis la 4e dimension (rotation Y à 90°). */
const fold = {
  initial: { opacity: 0, rotateY: 88, x: -30 },
  whileInView: { opacity: 1, rotateY: 0, x: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
} as const

export default function Tesseract() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* moiré non-euclidien : deux grilles superposées en rotation lente */}
      <div aria-hidden className="fixed inset-0 z-0 ts-grid ts-grid-a" />
      <div aria-hidden className="fixed inset-0 z-0 ts-grid ts-grid-b" />
      <StylePicker color={BLUE} />

      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-sm bg-black/60 border-b border-white/10"
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/tesseract" className="font-display font-light tracking-[0.35em] text-sm">
            BENU <span style={{ color: BLUE }}>⁴</span>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="border border-white/30 px-6 py-2 text-sm font-light tracking-widest transition-all hover:bg-white hover:text-black"
          >
            CONTACT
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="min-h-screen flex items-center px-6">
          <div className="mx-auto max-w-6xl w-full grid md:grid-cols-[1.15fr_1fr] items-center gap-10 pt-24">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="mb-8 font-mono text-[11px] uppercase tracking-[0.5em] text-white/40"
              >
                studio de développement · dimension 4
              </motion.p>
              <h1 className="font-display font-light leading-[1.05] text-[clamp(2.5rem,7vw,5.8rem)]">
                <Unfold text="Nous pensons" delay={0.4} />
                <br />
                <Unfold text="en 4 dimensions." delay={0.9} className="font-semibold" />
              </h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="my-8 h-px w-40 origin-left"
                style={{ background: BLUE }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2, duration: 1 }}
                className="max-w-lg text-lg font-light text-white/60"
              >
                Largeur, hauteur, profondeur — et le temps de vos utilisateurs.
                Des produits digitaux pensés dans toutes les directions à la fois.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                className="mt-10 flex flex-wrap gap-5"
              >
                <a
                  href={`mailto:${EMAIL}`}
                  className="px-9 py-4 font-medium tracking-wide text-black transition-transform hover:scale-105"
                  style={{ background: 'white' }}
                >
                  Déplier votre projet
                </a>
                <a href="#ts-projets" className="border border-white/25 px-9 py-4 font-light tracking-wide transition-colors hover:border-white">
                  Explorer
                </a>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:flex justify-center"
            >
              <TesseractCanvas />
            </motion.div>
          </div>
        </section>

        {/* Services : plis dimensionnels */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...fold} className="font-display font-light text-4xl md:text-6xl mb-16">
            Axes de travail<span style={{ color: BLUE }}>.</span>
          </motion.h2>
          <div className="grid gap-px md:grid-cols-2 border border-white/15" style={{ perspective: 1400 }}>
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                {...fold}
                transition={{ ...fold.transition, delay: i * 0.12 }}
                className="group bg-black p-10 border border-white/10 transition-colors hover:bg-white hover:text-black"
              >
                <p className="font-mono text-[11px] tracking-[0.4em] mb-5 text-white/40 group-hover:text-black/50">
                  AXE·{['X', 'Y', 'Z', 'W'][i]}
                </p>
                <h3 className="font-display text-2xl font-semibold mb-3">{s.title}</h3>
                <p className="font-light text-white/55 group-hover:text-black/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section id="ts-projets" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...fold} className="font-display font-light text-4xl md:text-6xl mb-16">
            Coordonnées connues<span style={{ color: BLUE }}>.</span>
          </motion.h2>
          <div className="space-y-px" style={{ perspective: 1400 }}>
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...fold}
                transition={{ ...fold.transition, delay: i * 0.1 }}
                className="group flex items-center justify-between gap-6 border border-white/15 p-8 transition-colors hover:bg-white hover:text-black"
              >
                <div>
                  <p className="font-mono text-[11px] tracking-[0.3em] mb-2 text-white/40 group-hover:text-black/50 uppercase">
                    [{p.tag}]
                  </p>
                  <h3 className="font-display text-2xl md:text-4xl font-semibold">{p.name}</h3>
                  <p className="font-light text-white/50 group-hover:text-black/60 mt-1 max-w-lg">{p.text}</p>
                </div>
                <span className="text-2xl font-light transition-transform duration-500 group-hover:translate-x-2" style={{ color: BLUE }}>
                  ⁴→
                </span>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center">
          <motion.h2 {...fold} className="font-display font-light text-[clamp(2.2rem,6vw,4.6rem)] mb-10">
            Sortez du <span className="font-semibold" style={{ color: BLUE }}>cube.</span>
          </motion.h2>
          <motion.a
            {...fold}
            href={`mailto:${EMAIL}`}
            whileHover={{ scale: 1.05 }}
            className="inline-block bg-white px-10 py-5 text-lg font-medium text-black"
          >
            {EMAIL}
          </motion.a>
          <p className="mt-20 font-mono text-[11px] tracking-[0.3em] text-white/35 uppercase">
            © 3000 benu studio · coordonnées (x, y, z, w) verrouillées
          </p>
        </footer>
      </main>
    </div>
  )
}
