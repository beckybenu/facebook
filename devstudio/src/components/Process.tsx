import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const STEPS = [
  {
    num: '01',
    title: 'Découverte',
    text: 'On écoute, on questionne, on comprend votre métier et vos objectifs avant d’écrire une ligne de code.',
  },
  {
    num: '02',
    title: 'Design',
    text: 'Maquettes et prototypes interactifs — vous voyez et validez l’expérience avant le développement.',
  },
  {
    num: '03',
    title: 'Développement',
    text: 'Code propre, testé et performant. Des démos régulières pour avancer ensemble, sans surprise.',
  },
  {
    num: '04',
    title: 'Lancement & suivi',
    text: 'Mise en production, mesure, itération. On reste à vos côtés après le lancement.',
  },
]

export default function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] })
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section id="methode" className="mx-auto max-w-6xl px-6 py-28">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-4xl md:text-6xl font-bold mb-16"
      >
        Notre méthode <span className="text-ember">.</span>
      </motion.h2>

      <div ref={ref} className="relative pl-10 md:pl-16">
        {/* Ligne de progression dessinée au scroll */}
        <div className="absolute left-3 md:left-6 top-0 bottom-0 w-px bg-white/10">
          <motion.div style={{ height: lineHeight }} className="w-full bg-gradient-to-b from-ember to-gold" />
        </div>

        <div className="space-y-16">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <span className="absolute -left-10 md:-left-16 top-1 flex h-6 w-6 md:h-8 md:w-8 -translate-x-[1px] items-center justify-center rounded-full border border-ember bg-ink text-[10px] md:text-xs font-bold text-ember">
                {step.num}
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-semibold mb-2">{step.title}</h3>
              <p className="max-w-xl text-paper/60 leading-relaxed">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
