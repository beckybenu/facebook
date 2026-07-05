import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

const line = {
  hidden: {},
  visible: (i: number) => ({
    transition: { staggerChildren: 0.045, delayChildren: 0.35 + i * 0.18 },
  }),
}

const letter = {
  hidden: { y: '110%', rotate: 6 },
  visible: {
    y: '0%',
    rotate: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

function AnimatedLine({ text, index, className = '' }: { text: string; index: number; className?: string }) {
  return (
    <motion.span
      custom={index}
      variants={line}
      className={`block overflow-hidden ${className}`}
      aria-label={text}
    >
      {text.split('').map((ch, i) => (
        <motion.span key={i} variants={letter} className="inline-block" aria-hidden>
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </motion.span>
  )
}

export default function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -160])
  const yOrb = useTransform(scrollYProgress, [0, 1], [0, 220])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6">
      {/* Orbes lumineux en parallaxe */}
      <motion.div
        style={{ y: yOrb }}
        className="absolute -top-32 -right-32 h-[34rem] w-[34rem] rounded-full bg-ember/25 blur-[130px]"
      />
      <motion.div
        style={{ y: yOrb }}
        className="absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-[120px]"
      />

      <motion.div style={{ y: yTitle, opacity }} className="mx-auto max-w-6xl w-full pt-24">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-paper/60"
        >
          <span className="h-px w-10 bg-ember" />
          Studio de développement web &amp; mobile
        </motion.p>

        <motion.h1
          initial="hidden"
          animate={ready ? 'visible' : 'hidden'}
          className="font-display font-extrabold leading-[0.95] text-[clamp(2.8rem,9vw,7.5rem)]"
        >
          <AnimatedLine text="On code des" index={0} />
          <AnimatedLine text="expériences" index={1} className="text-gradient-animated" />
          <AnimatedLine text="inoubliables." index={2} className="text-stroke" />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xl text-lg text-paper/70"
        >
          Sites, applications et produits digitaux conçus au pixel près —
          rapides, élégants et animés avec soin. De l&apos;idée au lancement.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-ember px-8 py-4 font-semibold text-ink"
          >
            Discutons de votre projet
          </motion.a>
          <motion.a
            href="#projets"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full border border-paper/25 px-8 py-4 font-semibold hover:border-ember transition-colors"
          >
            Voir nos projets
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Indicateur de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <ArrowDown className="h-5 w-5 text-paper/50" />
        </motion.div>
      </motion.div>
    </section>
  )
}
