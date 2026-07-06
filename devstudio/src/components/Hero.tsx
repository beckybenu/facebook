import { useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
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

  // Inclinaison 3D du bloc titre pilotée par la souris
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 80, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 80, damping: 20 })
  // Couches parallaxes : plus le facteur est grand, plus l'élément semble proche
  const holoX = useSpring(useTransform(mx, (v) => v * -60), { stiffness: 60, damping: 18 })
  const holoY = useSpring(useTransform(my, (v) => v * -60), { stiffness: 60, damping: 18 })
  const holoX2 = useSpring(useTransform(mx, (v) => v * 30), { stiffness: 60, damping: 18 })
  const holoY2 = useSpring(useTransform(my, (v) => v * 30), { stiffness: 60, damping: 18 })

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6"
      style={{ perspective: 1200 }}
    >
      {/* Orbes lumineux en parallaxe */}
      <motion.div
        style={{ y: yOrb }}
        className="absolute -top-32 -right-32 h-[34rem] w-[34rem] rounded-full bg-ember/25 blur-[130px]"
      />
      <motion.div
        style={{ y: yOrb }}
        className="absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-[120px]"
      />

      {/* Sol quadrillé en perspective, façon horizon rétro-futuriste */}
      <div className="absolute inset-x-0 bottom-0 h-[42vh] [perspective:600px] pointer-events-none" aria-hidden>
        <div className="grid-floor absolute inset-[-60%_-30%_-10%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/60 to-transparent" />
      </div>

      {/* Hologrammes flottants — couche proche (parallaxe inverse forte) */}
      <motion.div style={{ x: holoX, y: holoY }} className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
          className="absolute right-[8%] top-[18%] h-40 w-40 rounded-full border-2 border-ember/50 shadow-[0_0_60px_rgba(255,92,51,0.35),inset_0_0_40px_rgba(255,92,51,0.15)]"
        />
        <motion.div
          animate={{ y: [0, 14, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
          className="absolute right-[16%] bottom-[22%] hidden md:block rounded-xl border border-white/15 bg-white/5 backdrop-blur-md p-4 shadow-[0_0_40px_rgba(255,179,71,0.15)]"
        >
          <p className="font-mono text-[10px] text-gold/80 mb-2">// benu.deploy(2050)</p>
          <div className="h-1.5 w-28 rounded bg-gradient-to-r from-ember to-gold mb-1.5" />
          <div className="h-1.5 w-20 rounded bg-white/20 mb-1.5" />
          <div className="h-1.5 w-24 rounded bg-white/10" />
        </motion.div>
      </motion.div>

      {/* Hologrammes flottants — couche lointaine (parallaxe douce) */}
      <motion.div style={{ x: holoX2, y: holoY2 }} className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.span
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 5 }}
          className="absolute left-[10%] top-[24%] text-3xl text-gold/60"
        >
          ✦
        </motion.span>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          className="absolute left-[6%] bottom-[28%] h-24 w-24 rounded-full border border-dashed border-gold/30"
        />
        <p className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:block font-mono text-[10px] tracking-[0.3em] text-paper/30 [writing-mode:vertical-rl]">
          SYS.2050 // DEPTH ENGINE ACTIVE // BENU STUDIO
        </p>
      </motion.div>

      {/* Bloc titre incliné en 3D par la souris */}
      <motion.div
        style={{ y: yTitle, opacity, rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative mx-auto max-w-6xl w-full pt-24"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.6 }}
          style={{ transform: 'translateZ(30px)' }}
          className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-paper/60"
        >
          <span className="h-px w-10 bg-ember" />
          Studio de développement web &amp; mobile
        </motion.p>

        <motion.h1
          initial="hidden"
          animate={ready ? 'visible' : 'hidden'}
          style={{ transform: 'translateZ(80px)' }}
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
          style={{ transform: 'translateZ(40px)' }}
          className="mt-8 max-w-xl text-lg text-paper/70"
        >
          Sites, applications et produits digitaux conçus au pixel près —
          rapides, élégants et animés avec soin. De l&apos;idée au lancement.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transform: 'translateZ(50px)' }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-ember px-8 py-4 font-semibold text-ink shadow-[0_0_30px_rgba(255,92,51,0.4)]"
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
