import { motion } from 'framer-motion'

const LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Projets', href: '#projets' },
  { label: 'Méthode', href: '#methode' },
  { label: 'Contact', href: '#contact' },
]

export default function Nav({ ready }: { ready: boolean }) {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={ready ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-ink/60 border-b border-white/5"
    >
      <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="font-logo font-extrabold text-lg tracking-wider">
          <span className="text-ember">◆</span> Neural<span className="text-ember">StarK</span>
        </a>
        <ul className="hidden md:flex gap-8 text-sm text-paper/70">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="relative group hover:text-paper transition-colors">
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-ember transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-ink hover:bg-gold transition-colors"
        >
          Démarrer un projet
        </a>
      </nav>
    </motion.header>
  )
}
