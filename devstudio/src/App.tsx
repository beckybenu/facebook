import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import Preloader from './components/Preloader'
import CustomCursor from './components/CustomCursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Services from './components/Services'
import Work from './components/Work'
import Stats from './components/Stats'
import Process from './components/Process'
import Contact from './components/Contact'
import ThemeSwitcher from './components/ThemeSwitcher'

export default function App() {
  const [loading, setLoading] = useState(true)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [loading])

  return (
    <div className="grain">
      <CustomCursor />
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" onDone={() => setLoading(false)} />}
      </AnimatePresence>

      {/* Barre de progression du scroll */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] origin-left bg-gradient-to-r from-ember to-gold z-50"
        style={{ scaleX: progress }}
      />

      <Nav ready={!loading} />
      <ThemeSwitcher />
      <main>
        <Hero ready={!loading} />
        <Marquee />
        <Services />
        <Work />
        <Stats />
        <Process />
        <Contact />
      </main>
    </div>
  )
}
