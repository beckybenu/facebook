import { motion } from 'framer-motion'

/* Pilule fixe permettant de revenir au sélecteur de propositions. */
export default function StylePicker({ color }: { color: string }) {
  return (
    <motion.a
      href="#/"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.6 }}
      whileHover={{ scale: 1.06 }}
      className="fixed bottom-5 left-5 z-50 rounded-full border bg-black/50 backdrop-blur-md px-4 py-2 text-xs font-semibold tracking-wide"
      style={{ borderColor: color, color }}
    >
      ◇ Changer de style
    </motion.a>
  )
}
