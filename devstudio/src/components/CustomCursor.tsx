import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 400, damping: 35 })
  const springY = useSpring(y, { stiffness: 400, damping: 35 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[90] hidden md:block h-6 w-6 -ml-3 -mt-3 rounded-full border-2 border-ember mix-blend-difference"
      style={{ x: springX, y: springY }}
    />
  )
}
