import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const WORDS = ['Bonjour', 'Hello', 'Hola', 'Ciao', 'こんにちは', 'Salam', 'Benu Studio']

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index === WORDS.length - 1) {
      const end = setTimeout(onDone, 900)
      return () => clearTimeout(end)
    }
    const t = setTimeout(() => setIndex(index + 1), index === 0 ? 500 : 220)
    return () => clearTimeout(t)
  }, [index, onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
      exit={{ y: '-100%', transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
    >
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="font-display text-4xl md:text-6xl font-bold"
      >
        <span className="text-ember mr-3">✦</span>
        {WORDS[index]}
      </motion.p>

      {/* Rideau arrondi qui suit la sortie */}
      <motion.div
        className="absolute -bottom-24 left-0 right-0 h-24 bg-ink rounded-b-[100%]"
        exit={{ height: 200, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
      />
    </motion.div>
  )
}
