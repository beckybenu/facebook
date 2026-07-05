import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

const PROJECTS = [
  {
    name: 'Kickly',
    tag: 'Application web · IA',
    text: 'Plateforme de pronostics football propulsée par l’IA, avec scores en direct.',
    gradient: 'from-emerald-500/30 to-teal-700/20',
  },
  {
    name: 'Leads Hub CRM',
    tag: 'Intégration · Odoo',
    text: 'Synchronisation automatique des leads publicitaires Facebook vers le CRM Odoo.',
    gradient: 'from-sky-500/30 to-indigo-700/20',
  },
  {
    name: 'Votre projet',
    tag: 'À venir · 2026',
    text: 'La prochaine étude de cas de cette page peut être la vôtre. Parlons-en.',
    gradient: 'from-ember/40 to-gold/20',
  },
]

function TiltCard({ project, index }: { project: (typeof PROJECTS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: -py * 10, ry: px * 10 })
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      style={{ transformStyle: 'preserve-3d', perspective: 800 }}
      className="group cursor-pointer"
    >
      <motion.div
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br ${project.gradient} p-8 md:p-10 min-h-[280px] flex flex-col justify-end`}
      >
        <span className="absolute top-6 left-8 text-xs uppercase tracking-[0.25em] text-paper/60">
          {project.tag}
        </span>
        <ArrowUpRight className="absolute top-6 right-6 h-6 w-6 text-paper/40 transition-all duration-300 group-hover:text-ember group-hover:translate-x-1 group-hover:-translate-y-1" />
        <h3 className="font-display text-3xl md:text-4xl font-bold mb-2">{project.name}</h3>
        <p className="text-paper/70 max-w-md">{project.text}</p>
      </motion.div>
    </motion.div>
  )
}

export default function Work() {
  return (
    <section id="projets" className="mx-auto max-w-6xl px-6 py-28">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-4xl md:text-6xl font-bold mb-16"
      >
        Projets récents <span className="text-ember">.</span>
      </motion.h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p, i) => (
          <TiltCard key={p.name} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
