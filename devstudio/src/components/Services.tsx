import { motion } from 'framer-motion'
import { Globe, Smartphone, Workflow, Sparkles } from 'lucide-react'

const SERVICES = [
  {
    icon: Globe,
    title: 'Sites web sur mesure',
    text: 'Sites vitrines, e-commerce et plateformes web performants, pensés pour convertir et impressionner.',
  },
  {
    icon: Smartphone,
    title: 'Applications mobiles',
    text: 'Apps iOS et Android fluides en React Native, du prototype à la publication sur les stores.',
  },
  {
    icon: Workflow,
    title: 'Automatisation & CRM',
    text: 'Intégrations Odoo, synchronisation de leads et workflows automatisés qui font gagner des heures.',
  },
  {
    icon: Sparkles,
    title: 'Design & animation',
    text: 'Interfaces animées au pixel près avec Framer Motion — des expériences qui marquent les esprits.',
  },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const card = {
  hidden: { opacity: 0, y: 60, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Services() {
  return (
    <section id="services" className="relative mx-auto max-w-6xl px-6 py-28">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-4xl md:text-6xl font-bold mb-4"
      >
        Ce qu&apos;on fait <span className="text-ember">.</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="max-w-lg text-paper/60 mb-16"
      >
        Une équipe compacte, un haut niveau d&apos;exigence, et une obsession du détail.
      </motion.p>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-6 md:grid-cols-2"
      >
        {SERVICES.map((s) => (
          <motion.article
            key={s.title}
            variants={card}
            whileHover={{ y: -8 }}
            className="group rounded-3xl border border-white/8 bg-white/[0.03] p-8 transition-colors hover:border-ember/50 hover:bg-white/[0.05]"
          >
            <div className="mb-6 inline-flex rounded-2xl bg-ember/10 p-4 text-ember transition-transform duration-500 group-hover:rotate-[360deg]">
              <s.icon className="h-7 w-7" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-3">{s.title}</h3>
            <p className="text-paper/60 leading-relaxed">{s.text}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}
