import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

const GOLDEN = '#ffcf5c'
const CYAN = '#59f3ff'
const CORAL = '#ff6b4a'

/* Cycle d'animation de Byte : 0-13 s il code, 13-19 s il court, 19-22 s il salue. */
const CYCLE = 22
const DESK_POS: [number, number, number] = [1.25, 0, 0.35]

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* ---------- Byte, la mascotte ---------- */
function Robot() {
  const group = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const eyes = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const T = clock.getElapsedTime()
    const t = T % CYCLE
    const g = group.current

    // clignement des yeux
    const blink = T % 3.1
    eyes.current.scale.y = blink < 0.12 ? 0.12 : 1

    if (t < 13) {
      // ── PHASE 1 : Byte code au bureau (de trois quarts, visage visible) ──
      g.position.set(DESK_POS[0] + 0.72, 0, DESK_POS[1] - 0.42)
      g.rotation.y = 0.5
      body.current.position.y = Math.sin(T * 2.2) * 0.02
      // mains qui tapent en alternance
      armL.current.rotation.x = -1.15 + Math.sin(T * 13) * 0.28
      armR.current.rotation.x = -1.15 + Math.sin(T * 13 + Math.PI) * 0.28
      armL.current.rotation.z = 0.35
      armR.current.rotation.z = -0.35
      legL.current.rotation.x = 0
      legR.current.rotation.x = 0
      // la tête suit vaguement le code
      head.current.rotation.y = Math.sin(T * 0.9) * 0.12
      head.current.rotation.x = 0.12 + Math.sin(T * 13) * 0.015
    } else if (t < 19) {
      // ── PHASE 2 : Byte saute et court en cercle ──
      const rt = (t - 13) / 6
      const ang = Math.PI * 0.5 + rt * Math.PI * 2
      const R = 2.1
      const cx = 0.55
      const cz = -0.55
      g.position.x = cx + Math.cos(ang) * R
      g.position.z = cz + Math.sin(ang) * R * 0.62
      // petit saut au départ
      const jump = rt < 0.09 ? Math.sin((rt / 0.09) * Math.PI) * 0.55 : 0
      g.position.y = jump + Math.abs(Math.sin(T * 11)) * 0.09
      g.rotation.y = -ang // face à la tangente
      // foulée : jambes et bras en opposition
      legL.current.rotation.x = Math.sin(T * 11) * 0.95
      legR.current.rotation.x = Math.sin(T * 11 + Math.PI) * 0.95
      armL.current.rotation.x = Math.sin(T * 11 + Math.PI) * 0.85
      armR.current.rotation.x = Math.sin(T * 11) * 0.85
      armL.current.rotation.z = 0.25
      armR.current.rotation.z = -0.25
      head.current.rotation.x = -0.08
      head.current.rotation.y = 0
      body.current.position.y = 0
    } else {
      // ── PHASE 3 : retour au bureau, Byte salue la caméra ──
      g.position.set(DESK_POS[0] + 0.72, 0, DESK_POS[1] - 0.42)
      g.rotation.y = 0.15
      const w = t - 19
      legL.current.rotation.x = 0
      legR.current.rotation.x = 0
      armL.current.rotation.x = -0.25
      armL.current.rotation.z = 0.3
      // bras droit levé qui salue
      armR.current.rotation.x = 0
      armR.current.rotation.z = -2.25 + Math.sin(w * 9) * 0.35
      head.current.rotation.x = 0
      head.current.rotation.y = Math.sin(w * 9) * 0.06
      body.current.position.y = Math.sin(T * 2.2) * 0.02
    }
  })

  const white = <meshStandardMaterial color="#f4f6fb" roughness={0.32} metalness={0.12} />
  const dark = <meshStandardMaterial color="#1b2233" roughness={0.5} />

  return (
    <group ref={group}>
      <group ref={body}>
        {/* corps */}
        <mesh position={[0, 0.98, 0]} castShadow>
          <capsuleGeometry args={[0.34, 0.42, 8, 20]} />
          {white}
        </mesh>
        {/* écran ventral */}
        <mesh position={[0, 0.95, 0.3]}>
          <boxGeometry args={[0.3, 0.2, 0.08]} />
          <meshStandardMaterial color="#0c1322" emissive={CYAN} emissiveIntensity={0.55} roughness={0.3} />
        </mesh>
        {/* ceinture accent */}
        <mesh position={[0, 0.72, 0]}>
          <torusGeometry args={[0.315, 0.035, 10, 28]} />
          <meshStandardMaterial color={CORAL} roughness={0.35} />
        </mesh>

        {/* tête */}
        <group ref={head} position={[0, 1.62, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.5, 0.52]} />
            {white}
          </mesh>
          {/* visière */}
          <mesh position={[0, 0.02, 0.27]}>
            <boxGeometry args={[0.5, 0.34, 0.04]} />
            {dark}
          </mesh>
          {/* yeux lumineux */}
          <mesh ref={eyes} position={[0, 0.03, 0.3]}>
            <planeGeometry args={[0.3, 0.1]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
          {/* oreilles */}
          <mesh position={[-0.34, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
            <meshStandardMaterial color={CORAL} />
          </mesh>
          <mesh position={[0.34, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
            <meshStandardMaterial color={CORAL} />
          </mesh>
          {/* antenne */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
            {dark}
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.05, 14, 14]} />
            <meshBasicMaterial color={GOLDEN} toneMapped={false} />
          </mesh>
        </group>

        {/* bras (pivot à l'épaule) */}
        <group ref={armL} position={[-0.42, 1.22, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.3, 6, 14]} />
            {white}
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.11, 14, 14]} />
            <meshStandardMaterial color={CORAL} roughness={0.4} />
          </mesh>
        </group>
        <group ref={armR} position={[0.42, 1.22, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.3, 6, 14]} />
            {white}
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.11, 14, 14]} />
            <meshStandardMaterial color={CORAL} roughness={0.4} />
          </mesh>
        </group>

        {/* jambes (pivot à la hanche) */}
        <group ref={legL} position={[-0.16, 0.62, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.26, 6, 14]} />
            {white}
          </mesh>
          <mesh position={[0, -0.42, 0.05]}>
            <boxGeometry args={[0.16, 0.09, 0.26]} />
            <meshStandardMaterial color={CORAL} roughness={0.4} />
          </mesh>
        </group>
        <group ref={legR} position={[0.16, 0.62, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.26, 6, 14]} />
            {white}
          </mesh>
          <mesh position={[0, -0.42, 0.05]}>
            <boxGeometry args={[0.16, 0.09, 0.26]} />
            <meshStandardMaterial color={CORAL} roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* ombre portée douce */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

/* ---------- Écran holographique où le code défile ---------- */
function CodeScreen() {
  const { ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 300
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    return { ctx, texture }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const typing = t % CYCLE < 13
    ctx.fillStyle = 'rgba(8, 13, 26, 0.94)'
    ctx.fillRect(0, 0, 512, 300)
    // barre de fenêtre
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(0, 0, 512, 34)
    for (let d = 0; d < 3; d++) {
      ctx.fillStyle = ['#ff5f57', '#febc2e', '#28c840'][d]
      ctx.beginPath()
      ctx.arc(22 + d * 24, 17, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    // lignes de code qui défilent quand Byte tape
    const speed = typing ? 26 : 4
    const scroll = (t * speed) % 26
    const baseRow = Math.floor((t * speed) / 26)
    const palette = [CYAN, GOLDEN, '#c792ea', '#e8ecf4', CORAL]
    for (let i = 0; i < 11; i++) {
      const row = baseRow + i
      const y = 56 + i * 26 - scroll
      const indent = 24 + Math.floor(hash(row * 3.7) * 3) * 26
      let x = indent
      const segs = 2 + Math.floor(hash(row * 1.3) * 3)
      for (let s = 0; s < segs; s++) {
        const w = 30 + hash(row * 7.9 + s * 13.7) * 92
        ctx.fillStyle = palette[Math.floor(hash(row * 5.1 + s * 3.3) * palette.length)]
        ctx.globalAlpha = 0.85
        ctx.fillRect(x, y, w, 10)
        x += w + 14
      }
    }
    ctx.globalAlpha = 1
    // curseur clignotant
    if (typing && Math.floor(t * 2.4) % 2 === 0) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(30, 56 + 5 * 26 - scroll, 10, 14)
    }
    texture.needsUpdate = true
  })

  return (
    <group position={[DESK_POS[0] - 0.32, 1.33, DESK_POS[1] + 0.42]} rotation={[-0.08, 0.12, 0]}>
      <mesh>
        <planeGeometry args={[1.42, 0.84]} />
        <meshBasicMaterial map={texture} transparent opacity={0.96} />
      </mesh>
      {/* halo de l'écran */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.52, 0.94]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.09} />
      </mesh>
    </group>
  )
}

/* ---------- Mini site web qui s'assemble en boucle dans les airs ---------- */
function BrowserBuild() {
  const blocks = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() % 9
    blocks.current.children.forEach((child, i) => {
      const start = 0.7 + i * 0.75
      const p = THREE.MathUtils.clamp((t - start) / 0.5, 0, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const disappear = t > 8.2 ? 1 - (t - 8.2) / 0.8 : 1
      child.scale.setScalar(Math.max(0.0001, ease * disappear))
    })
  })

  return (
    <group position={[3.0, 2.75, -1.6]} rotation={[0, -0.38, 0]}>
      {/* cadre du navigateur */}
      <mesh>
        <planeGeometry args={[1.9, 1.35]} />
        <meshStandardMaterial color="#101828" transparent opacity={0.9} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.61, 0.01]}>
        <planeGeometry args={[1.9, 0.14]} />
        <meshBasicMaterial color="#1d2942" />
      </mesh>
      <group ref={blocks}>
        {/* hero du mini-site */}
        <mesh position={[0, 0.28, 0.02]}>
          <planeGeometry args={[1.66, 0.42]} />
          <meshBasicMaterial color={CORAL} transparent opacity={0.9} />
        </mesh>
        {/* deux colonnes */}
        <mesh position={[-0.44, -0.14, 0.02]}>
          <planeGeometry args={[0.78, 0.3]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.75} />
        </mesh>
        <mesh position={[0.44, -0.14, 0.02]}>
          <planeGeometry args={[0.78, 0.3]} />
          <meshBasicMaterial color="#e8ecf4" transparent opacity={0.55} />
        </mesh>
        {/* pied de page */}
        <mesh position={[0, -0.47, 0.02]}>
          <planeGeometry args={[1.66, 0.18]} />
          <meshBasicMaterial color={GOLDEN} transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  )
}

/* ---------- Cubes de code en orbite ---------- */
function CodeBits() {
  const group = useRef<THREE.Group>(null!)
  const bits = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        r: 2.6 + hash(i * 3.1) * 2.6,
        h: 0.5 + hash(i * 7.7) * 2.9,
        speed: 0.12 + hash(i * 5.3) * 0.2,
        phase: hash(i * 9.1) * Math.PI * 2,
        size: 0.05 + hash(i * 11.3) * 0.09,
        color: [CYAN, GOLDEN, CORAL, '#c792ea'][i % 4],
      })),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    group.current.children.forEach((m, i) => {
      const b = bits[i]
      const a = b.phase + t * b.speed
      m.position.set(0.55 + Math.cos(a) * b.r, b.h + Math.sin(t * 0.8 + b.phase) * 0.18, -0.2 + Math.sin(a) * b.r * 0.7)
      m.rotation.x = t * 0.6 + b.phase
      m.rotation.y = t * 0.8 + b.phase
    })
  })

  return (
    <group ref={group}>
      {bits.map((b, i) => (
        <mesh key={i}>
          <boxGeometry args={[b.size, b.size, b.size]} />
          <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- Caméra : parallaxe souris + recul au scroll ---------- */
function CameraRig() {
  const mouse = useRef({ x: 0, y: 0 })
  useMemo(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
        mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
      })
    }
  }, [])

  useFrame(({ camera }) => {
    const scroll = typeof window !== 'undefined' ? window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight) : 0
    const tx = mouse.current.x * 0.45
    const ty = 1.55 - mouse.current.y * 0.28 + scroll * 1.1
    const tz = 6.1 + scroll * 1.6
    camera.position.x += (tx - camera.position.x) * 0.04
    camera.position.y += (ty - camera.position.y) * 0.04
    camera.position.z += (tz - camera.position.z) * 0.04
    camera.lookAt(0.45, 1.05, 0)
  })
  return null
}

/* ---------- Scène complète ---------- */
function MascotScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [0, 1.55, 6.1], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={['#0b0e1a', 7.5, 15]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 4]} intensity={1.25} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 2.5, 2]} intensity={26} color={CYAN} />
      <pointLight position={[4, 3, -3]} intensity={20} color={CORAL} />

      <Robot />
      <CodeScreen />
      <BrowserBuild />
      <CodeBits />

      {/* bureau holographique */}
      <mesh position={[DESK_POS[0], 0.92, DESK_POS[1] + 0.42]}>
        <boxGeometry args={[1.95, 0.05, 0.6]} />
        <meshStandardMaterial color="#131c30" emissive={CYAN} emissiveIntensity={0.12} roughness={0.35} metalness={0.4} />
      </mesh>
      {/* pieds lumineux du bureau */}
      {[-0.85, 0.85].map((dx) => (
        <mesh key={dx} position={[DESK_POS[0] + dx, 0.46, DESK_POS[1] + 0.42]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 10]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* sol */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0d1120" roughness={0.9} />
      </mesh>
      <gridHelper args={[36, 72, '#1d2b4a', '#141d33']} position={[0, 0.01, 0]} />

      <CameraRig />
    </Canvas>
  )
}

/* ---------- Page ---------- */
const glass = 'rounded-3xl border border-white/12 bg-[#0b0e1a]/55 backdrop-blur-xl'

const rise = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
} as const

export default function Atelier() {
  return (
    <div className="relative min-h-screen bg-[#0b0e1a] text-[#eef2fb] overflow-x-hidden">
      {/* scène 3D fixe derrière tout le contenu */}
      <div className="fixed inset-0 z-0">
        <MascotScene />
      </div>
      <StylePicker color={GOLDEN} />

      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#0b0e1a]/55 border-b border-white/10"
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#/atelier" className="font-display font-bold text-lg">
            <span style={{ color: GOLDEN }}>⬢</span> BENU · L&apos;ATELIER
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-[#0b0e1a] transition-transform hover:scale-105"
            style={{ background: `linear-gradient(120deg, ${GOLDEN}, ${CORAL})` }}
          >
            Réveiller Byte
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO : le texte à gauche, Byte code à droite dans la scène */}
        <section className="min-h-screen flex items-center px-6">
          <div className="mx-auto max-w-6xl w-full pt-24">
            <div className="max-w-xl">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 text-sm uppercase tracking-[0.35em] text-[#eef2fb]/55"
              >
                ⬢ studio de développement — atelier 3D temps réel
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-extrabold leading-[1.0] text-[clamp(2.6rem,7vw,5.6rem)]"
              >
                Voici Byte.
                <br />
                <span
                  style={{
                    background: `linear-gradient(115deg, ${GOLDEN}, ${CORAL}, ${CYAN})`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Il code votre site
                </span>
                <br />
                sous vos yeux.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-8 text-lg text-[#eef2fb]/70"
              >
                Notre mascotte développeuse tape plus vite que son ombre,
                assemble des interfaces en plein vol et fait son jogging entre
                deux commits. Regarde-la travailler — tout est en 3D temps
                réel, calculé dans ton navigateur.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="mt-10 flex flex-wrap gap-4"
              >
                <a
                  href={`mailto:${EMAIL}`}
                  className="rounded-full px-8 py-4 font-semibold text-[#0b0e1a] transition-transform hover:scale-105"
                  style={{ background: `linear-gradient(120deg, ${GOLDEN}, ${CORAL})`, boxShadow: `0 10px 40px ${GOLDEN}33` }}
                >
                  Confier un projet à Byte
                </a>
                <a href="#at-services" className="rounded-full border border-white/25 px-8 py-4 font-semibold hover:border-white/60 transition-colors backdrop-blur-sm">
                  Visiter l&apos;atelier
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="at-services" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...rise} className="font-display text-4xl md:text-6xl font-extrabold mb-16">
            Ce que Byte sait faire<span style={{ color: GOLDEN }}>.</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                {...rise}
                transition={{ ...rise.transition, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`${glass} p-8`}
              >
                <p className="font-mono text-[11px] tracking-[0.3em] mb-4" style={{ color: [CYAN, GOLDEN, CORAL, '#c792ea'][i] }}>
                  APTITUDE ⬢ {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-[#eef2fb]/60 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...rise} className="font-display text-4xl md:text-6xl font-extrabold mb-16">
            Sorties d&apos;atelier<span style={{ color: CORAL }}>.</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...rise}
                transition={{ ...rise.transition, delay: i * 0.1 }}
                whileHover={{ y: -8, rotate: i % 2 === 0 ? -1 : 1 }}
                className={`${glass} p-8 min-h-[220px] flex flex-col justify-end`}
              >
                <p className="text-xs uppercase tracking-[0.25em] text-[#eef2fb]/50 mb-3">{p.tag}</p>
                <h3 className="font-display text-2xl font-bold mb-1" style={{ color: GOLDEN }}>
                  {p.name}
                </h3>
                <p className="text-[#eef2fb]/60 text-sm">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center">
          <motion.div {...rise} className={`${glass} mx-auto max-w-3xl px-8 py-16`}>
            <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.8rem)] mb-6">
              Byte n&apos;attend que{' '}
              <span
                style={{
                  background: `linear-gradient(115deg, ${GOLDEN}, ${CORAL})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                votre brief.
              </span>
            </h2>
            <p className="text-[#eef2fb]/60 mb-10 max-w-md mx-auto">
              Il a déjà chauffé le clavier. Envoyez votre idée, il compile le reste.
            </p>
            <motion.a
              href={`mailto:${EMAIL}`}
              whileHover={{ scale: 1.06 }}
              className="inline-block rounded-full px-10 py-5 text-lg font-semibold text-[#0b0e1a]"
              style={{ background: `linear-gradient(120deg, ${GOLDEN}, ${CORAL})`, boxShadow: `0 0 40px ${GOLDEN}44` }}
            >
              {EMAIL}
            </motion.a>
          </motion.div>
          <p className="mt-14 text-xs text-[#eef2fb]/40">© 3000 Benu Studio — l&apos;Atelier ⬢ Byte tourne en 60 fps</p>
        </footer>
      </main>
    </div>
  )
}
