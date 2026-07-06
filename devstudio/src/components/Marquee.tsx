import { motion } from 'framer-motion'

const ITEMS = [
  'React', 'TypeScript', 'Node.js', 'Next.js', 'React Native',
  'Python', 'Odoo', 'Tailwind', 'Framer Motion', 'PostgreSQL',
]

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <section
      className="relative border-y border-white/5 bg-white/[0.02] py-6 overflow-hidden"
      style={{ perspective: 500 }}
    >
      {/* Bandeau légèrement incliné en 3D, comme un ticker holographique */}
      <motion.div
        className="flex w-max gap-12 whitespace-nowrap"
        style={{ rotateX: 14, transformStyle: 'preserve-3d' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-2xl font-semibold text-paper/40">
            {item}
            <span className="text-ember text-lg">✦</span>
          </span>
        ))}
      </motion.div>
    </section>
  )
}
