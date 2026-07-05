import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Mail } from 'lucide-react'

function MagneticButton({ children, href }: { children: React.ReactNode; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 15 })
  const springY = useSpring(y, { stiffness: 200, damping: 15 })

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35)
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.96 }}
      className="inline-flex items-center gap-3 rounded-full bg-ember px-10 py-5 text-lg font-semibold text-ink hover:bg-gold transition-colors"
    >
      {children}
    </motion.a>
  )
}

export default function Contact() {
  return (
    <footer id="contact" className="relative overflow-hidden">
      <div className="absolute inset-x-0 -top-40 h-96 bg-ember/10 blur-[140px] pointer-events-none" />
      <div className="mx-auto max-w-6xl px-6 py-32 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-extrabold leading-tight text-[clamp(2.4rem,7vw,5.5rem)] mb-6"
        >
          Un projet en tête&nbsp;?
          <br />
          <span className="text-gradient-animated">Construisons-le.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto max-w-xl text-paper/60 mb-12"
        >
          Racontez-nous votre idée — on revient vers vous sous 24&nbsp;h avec
          une première piste et une estimation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <MagneticButton href="mailto:beckybenu@gmail.com">
            <Mail className="h-5 w-5" />
            beckybenu@gmail.com
          </MagneticButton>
        </motion.div>

        <p className="mt-24 text-sm text-paper/40">
          © 2026 NeuralStarK <span className="text-ember">◆</span> Neural power. Stark reality.
        </p>
      </div>
    </footer>
  )
}
