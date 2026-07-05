import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'

const STATS = [
  { value: 40, suffix: '+', label: 'Projets livrés' },
  { value: 98, suffix: '%', label: 'Clients satisfaits' },
  { value: 6, suffix: ' ans', label: "D'expérience" },
  { value: 24, suffix: 'h', label: 'Temps de réponse max' },
]

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 })
  const rounded = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    if (inView) motionValue.set(value)
  }, [inView, motionValue, value])

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = `${v}${suffix}`
    })
  }, [rounded, suffix])

  return <span ref={ref}>0{suffix}</span>
}

export default function Stats() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-6 py-20 grid grid-cols-2 gap-10 md:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="text-center"
          >
            <p className="font-display text-4xl md:text-5xl font-extrabold text-gradient-animated">
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-paper/60">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
