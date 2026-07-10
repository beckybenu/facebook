import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { motion } from 'framer-motion'
import { EMAIL, PROJECTS, SERVICES } from './data'
import StylePicker from './StylePicker'

/*
  Byte est le modèle « Robot Expressive » (Tomás Laulhé, CC0 — créé pour
  Three.js) : un vrai personnage de dessin animé riggé, avec 13 animations
  squelettiques professionnelles qu'on enchaîne comme une chorégraphie.
*/

const SKY_TOP = '#8ed1ff'
const CORAL = '#ff6b57'
const SUN = '#ffd23f'

const MODEL_URL = `${import.meta.env.BASE_URL}models/RobotExpressive.glb`

/* La chorégraphie : nom du clip + durée + déplacement éventuel */
const SHOW: { clip: string; dur: number; move?: 'walk' | 'run' }[] = [
  { clip: 'Idle', dur: 2.2 },
  { clip: 'Wave', dur: 3.2 },
  { clip: 'Walking', dur: 5.5, move: 'walk' },
  { clip: 'Dance', dur: 6.5 },
  { clip: 'ThumbsUp', dur: 3 },
  { clip: 'Running', dur: 4.2, move: 'run' },
  { clip: 'Jump', dur: 1.4 },
]

const HOME: [number, number, number] = [0.95, 0, 0.15]

function Byte() {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const group = useRef<THREE.Group>(null!)
  const jumpRequest = useRef(false)

  const { mixer, actions } = useMemo(() => {
    const mixer = new THREE.AnimationMixer(gltf.scene)
    const actions: Record<string, THREE.AnimationAction> = {}
    for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip)
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = false
      }
    })
    return { mixer, actions }
  }, [gltf])

  const state = useRef({ phase: 0, elapsed: 0, current: 'Idle', angle: Math.PI / 2, interrupted: false })

  useEffect(() => {
    actions['Idle']?.play()
  }, [actions])

  const crossfade = (to: string, loopOnce = false) => {
    const s = state.current
    if (s.current === to) return
    const prev = actions[s.current]
    const next = actions[to]
    if (!next) return
    next.reset()
    if (loopOnce) {
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity)
    }
    next.fadeIn(0.35).play()
    prev?.fadeOut(0.35)
    s.current = to
  }

  useFrame((_, dt) => {
    const s = state.current
    mixer.update(dt)
    s.elapsed += dt

    // clic sur Byte → il saute, puis reprend son spectacle
    if (jumpRequest.current) {
      jumpRequest.current = false
      s.interrupted = true
      s.elapsed = 0
      crossfade('Jump', true)
    }
    if (s.interrupted) {
      if (s.elapsed > 1.3) {
        s.interrupted = false
        s.elapsed = 0
        crossfade(SHOW[s.phase].clip, SHOW[s.phase].clip === 'Jump')
      }
      return
    }

    const step = SHOW[s.phase]
    if (s.elapsed >= step.dur) {
      s.phase = (s.phase + 1) % SHOW.length
      s.elapsed = 0
      const next = SHOW[s.phase]
      crossfade(next.clip, next.clip === 'Jump')
    }

    const g = group.current
    if (step.move) {
      // Byte se déplace en cercle autour de la scène
      const speed = step.move === 'run' ? 1.5 : 0.75
      s.angle += dt * speed
      const R = 1.9
      g.position.x = 0.55 + Math.cos(s.angle) * R
      g.position.z = -0.3 + Math.sin(s.angle) * R * 0.55
      g.rotation.y = -s.angle
    } else {
      // retour en douceur à sa marque, face caméra
      g.position.x += (HOME[0] - g.position.x) * Math.min(1, dt * 3)
      g.position.z += (HOME[2] - g.position.z) * Math.min(1, dt * 3)
      const targetRot = 0
      let d = targetRot - (g.rotation.y % (Math.PI * 2))
      if (d > Math.PI) d -= Math.PI * 2
      if (d < -Math.PI) d += Math.PI * 2
      g.rotation.y += d * Math.min(1, dt * 4)
    }
  })

  return (
    <group
      ref={group}
      position={HOME}
      scale={0.36}
      onPointerDown={(e) => {
        e.stopPropagation()
        jumpRequest.current = true
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <primitive object={gltf.scene} />
    </group>
  )
}

/* Nuage cartoon : grappes de sphères blanches qui dérivent */
function Cloud({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref.current.position.x = position[0] + Math.sin(t * 0.1 * speed) * 1.4
    ref.current.position.y = position[1] + Math.sin(t * 0.35 * speed) * 0.12
  })
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 0.55],
    [0.55, 0.08, 0.1, 0.4],
    [-0.55, 0.05, -0.05, 0.42],
    [0.2, 0.3, -0.1, 0.38],
    [-0.25, 0.28, 0.08, 0.34],
  ]
  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 18, 18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* Confettis multicolores qui tombent en continu sur la scène */
function Confetti() {
  const group = useRef<THREE.Group>(null!)
  const bits = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: -4.5 + ((i * 977) % 100) / 11.1,
        z: -2.5 + ((i * 613) % 100) / 25,
        y0: ((i * 359) % 100) / 18,
        fall: 0.35 + ((i * 191) % 100) / 220,
        spin: 1.5 + ((i * 83) % 100) / 30,
        color: ['#ff6b57', '#ffd23f', '#54d1ff', '#7ce38b', '#c792ea'][i % 5],
      })),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    group.current.children.forEach((m, i) => {
      const b = bits[i]
      m.position.set(b.x + Math.sin(t * 0.8 + i) * 0.25, 5.4 - ((b.y0 + t * b.fall) % 5.6), b.z)
      m.rotation.set(t * b.spin, t * b.spin * 0.7, t * b.spin * 0.5)
    })
  })
  return (
    <group ref={group}>
      {bits.map((b, i) => (
        <mesh key={i}>
          <planeGeometry args={[0.09, 0.14]} />
          <meshBasicMaterial color={b.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/* Étoiles / anneaux pastel qui flottent autour de la scène */
function Props() {
  const group = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    group.current.children.forEach((m, i) => {
      m.position.y += Math.sin(t * 1.1 + i * 2.1) * 0.0022
      m.rotation.y = t * 0.4 + i
      m.rotation.x = Math.sin(t * 0.5 + i) * 0.3
    })
  })
  return (
    <group ref={group}>
      <mesh position={[-2.6, 2.3, -1.4]}>
        <torusGeometry args={[0.34, 0.13, 14, 28]} />
        <meshStandardMaterial color={CORAL} roughness={0.5} />
      </mesh>
      <mesh position={[3.3, 2.9, -1.8]}>
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={SUN} roughness={0.5} />
      </mesh>
      <mesh position={[2.9, 1.1, -2.2]}>
        <torusKnotGeometry args={[0.22, 0.08, 48, 10]} />
        <meshStandardMaterial color="#54d1ff" roughness={0.5} />
      </mesh>
      <mesh position={[-3.1, 0.9, -1.9]}>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#7ce38b" roughness={0.5} />
      </mesh>
    </group>
  )
}

function CameraRig() {
  const mouse = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  useFrame(({ camera }) => {
    const scroll = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)
    camera.position.x += (mouse.current.x * 0.55 - camera.position.x) * 0.045
    camera.position.y += (1.7 - mouse.current.y * 0.3 + scroll * 1.4 - camera.position.y) * 0.045
    camera.position.z += (5.4 + scroll * 1.8 - camera.position.z) * 0.045
    camera.lookAt(0.45, 1.0, 0)
  })
  return null
}

function CartoonScene() {
  return (
    <Canvas dpr={[1, 1.75]} shadows camera={{ position: [0, 1.7, 5.4], fov: 40 }}>
      {/* ciel dégradé */}
      <color attach="background" args={[SKY_TOP]} />
      <fog attach="fog" args={[SKY_TOP, 11, 22]} />

      <ambientLight intensity={0.75} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.6}
        color="#fff6e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-4, 3, 3]} intensity={18} color="#bfe3ff" />

      <Byte />
      <Cloud position={[-3.4, 3.6, -3]} scale={1.15} />
      <Cloud position={[3.6, 4.2, -3.6]} scale={0.9} speed={1.5} />
      <Cloud position={[0.4, 4.6, -4.4]} scale={0.7} speed={0.8} />
      <Confetti />
      <Props />

      {/* scène / podium */}
      <mesh position={[0.55, -0.09, 0]} receiveShadow>
        <cylinderGeometry args={[4.4, 4.8, 0.2, 56]} />
        <meshStandardMaterial color="#fff8ef" roughness={0.85} />
      </mesh>
      <mesh position={[0.55, -0.045, 0]} receiveShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[3.1, 3.1, 0.14, 56]} />
        <meshStandardMaterial color="#ffe9d6" roughness={0.8} />
      </mesh>
      {/* liseré du podium */}
      <mesh position={[0.55, 0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.1, 0.035, 10, 64]} />
        <meshStandardMaterial color={CORAL} roughness={0.5} />
      </mesh>
      {/* sol lointain */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#9adcff" roughness={1} />
      </mesh>

      <CameraRig />
    </Canvas>
  )
}

/* ---------- Page (thème clair, cartoon) ---------- */
const card = 'rounded-[2rem] border border-[#17233c]/10 bg-white/80 backdrop-blur-xl shadow-[0_18px_50px_rgba(23,35,60,0.14)]'

const pop = {
  initial: { opacity: 0, y: 46, scale: 0.94 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: '-80px' },
  transition: { type: 'spring', stiffness: 170, damping: 17 },
} as const

export default function Atelier() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#8ed1ff] text-[#17233c] overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <CartoonScene />
      </div>
      <StylePicker color="#0d5bd6" />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 130, damping: 15 }}
        className="fixed top-4 inset-x-4 md:inset-x-10 z-40 rounded-full border border-white/60 bg-white/75 backdrop-blur-xl shadow-lg"
      >
        <nav className="px-6 py-3 flex items-center justify-between">
          <a href="#/atelier" className="font-display font-extrabold text-lg tracking-tight">
            <span style={{ color: CORAL }}>●</span> BENU · Le Studio de Byte
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105"
            style={{ background: CORAL, boxShadow: '0 8px 24px rgba(255,107,87,0.4)' }}
          >
            Engager Byte 🎬
          </a>
        </nav>
      </motion.header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="min-h-screen flex items-center px-6">
          <div className="mx-auto max-w-6xl w-full pt-28">
            <div className="max-w-lg">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={ready ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="mb-5 inline-block rounded-full bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] shadow"
              >
                🎬 studio de développement · le dessin animé
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 46, scale: 0.95 }}
                animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.1 }}
                className="font-display font-extrabold leading-[1.0] text-[clamp(2.6rem,7vw,5.4rem)] drop-shadow-sm"
              >
                Byte fait
                <br />
                <span style={{ color: CORAL }}>son show.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={ready ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35, duration: 0.7 }}
                className="mt-6 text-lg font-medium text-[#17233c]/75"
              >
                Notre mascotte est un vrai personnage de dessin animé 3D :
                il salue, marche, danse, lève le pouce et fait son footing
                entre deux livraisons. <strong>Clique sur lui</strong> — il saute !
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={ready ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-9 flex flex-wrap gap-4"
              >
                <a
                  href={`mailto:${EMAIL}`}
                  className="rounded-full px-8 py-4 font-bold text-white transition-transform hover:scale-105"
                  style={{ background: CORAL, boxShadow: '0 12px 34px rgba(255,107,87,0.45)' }}
                >
                  Lancer votre projet
                </a>
                <a
                  href="#at-services"
                  className="rounded-full bg-white/80 backdrop-blur px-8 py-4 font-bold shadow hover:scale-105 transition-transform"
                >
                  Voir ses talents
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="at-services" className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...pop} className="font-display text-4xl md:text-6xl font-extrabold mb-14 drop-shadow-sm">
            Les talents de Byte<span style={{ color: CORAL }}>.</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-2">
            {SERVICES.map((s, i) => (
              <motion.article
                key={s.title}
                {...pop}
                transition={{ ...pop.transition, delay: i * 0.08 }}
                whileHover={{ y: -10, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
                className={`${card} p-8`}
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-xl" style={{ background: ['#ffe3de', '#fff3cf', '#dcf1ff', '#e2f7e6'][i] }}>
                  {['🌐', '📱', '⚙️', '✨'][i]}
                </span>
                <h3 className="font-display text-2xl font-extrabold mb-2">{s.title}</h3>
                <p className="text-[#17233c]/70 leading-relaxed">{s.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Projets */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <motion.h2 {...pop} className="font-display text-4xl md:text-6xl font-extrabold mb-14 drop-shadow-sm">
            Ses derniers épisodes<span style={{ color: CORAL }}>.</span>
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <motion.a
                key={p.name}
                href={`mailto:${EMAIL}`}
                {...pop}
                transition={{ ...pop.transition, delay: i * 0.09 }}
                whileHover={{ y: -10, rotate: i % 2 === 0 ? -1 : 1, scale: 1.02 }}
                className={`${card} p-8 min-h-[210px] flex flex-col justify-end`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#17233c]/50 mb-3">{p.tag}</p>
                <h3 className="font-display text-2xl font-extrabold mb-1" style={{ color: CORAL }}>
                  {p.name}
                </h3>
                <p className="text-[#17233c]/70 text-sm">{p.text}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <footer className="px-6 py-32 text-center">
          <motion.div {...pop} className={`${card} mx-auto max-w-3xl px-8 py-16`}>
            <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.6rem)] mb-5">
              Votre projet mérite <span style={{ color: CORAL }}>sa propre scène.</span>
            </h2>
            <p className="text-[#17233c]/65 mb-9 max-w-md mx-auto font-medium">
              Byte répète déjà. Envoyez le scénario, on tourne cette semaine.
            </p>
            <motion.a
              href={`mailto:${EMAIL}`}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.96 }}
              className="inline-block rounded-full px-10 py-5 text-lg font-bold text-white"
              style={{ background: CORAL, boxShadow: '0 14px 40px rgba(255,107,87,0.45)' }}
            >
              {EMAIL}
            </motion.a>
          </motion.div>
          <p className="mt-12 text-xs font-medium text-[#17233c]/50">
            © 3000 Benu Studio — Le Studio de Byte 🎬 personnage : « Robot Expressive » (CC0)
          </p>
        </footer>
      </main>
    </div>
  )
}
