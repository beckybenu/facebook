import { useRef } from 'react'
import { motion, MotionValue, useScroll, useTransform } from 'framer-motion'

/*
  Tunnel de distorsion : des anneaux concentriques grossissent à des vitesses
  différentes pendant le scroll — impression de traverser une dimension.
*/
function Ring({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const scale = useTransform(progress, [0, 1], [0.15 + index * 0.12, 2.2 + index * 0.7])
  const opacity = useTransform(progress, [0, 0.35, 0.75, 1], [0, 0.55 - index * 0.06, 0.45 - index * 0.06, 0])
  const size = 180 + index * 90

  return (
    <motion.div
      style={{ scale, opacity, width: size, height: size }}
      className={`absolute rounded-full border-2 ${index % 2 === 0 ? 'border-ember' : 'border-gold'}`}
    />
  )
}

export default function WarpTunnel() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const textScale = useTransform(scrollYProgress, [0.15, 0.5, 0.85], [0.4, 1, 2.4])
  const textOpacity = useTransform(scrollYProgress, [0.15, 0.4, 0.6, 0.85], [0, 1, 1, 0])
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.35, 0])

  return (
    <section ref={ref} className="relative h-[80vh] overflow-hidden flex items-center justify-center">
      <motion.div
        style={{ opacity: glow }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,92,51,0.35),transparent_60%)]"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Ring key={i} progress={scrollYProgress} index={i} />
      ))}
      <motion.p
        style={{ scale: textScale, opacity: textOpacity }}
        className="relative font-display font-extrabold text-center text-3xl md:text-5xl"
      >
        Plus vite. Plus loin.
        <br />
        <span className="text-gradient-animated">Plus profond.</span>
      </motion.p>
    </section>
  )
}
