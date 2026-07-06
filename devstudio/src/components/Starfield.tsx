import { useEffect, useRef } from 'react'

/*
  Champ d'étoiles 3D : les étoiles ont une coordonnée de profondeur (z) et
  foncent vers l'écran ; la souris déplace le point de fuite (parallaxe).
*/
export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const COLORS = ['#f4f1ea', '#f4f1ea', '#f4f1ea', '#ff5c33', '#ffb347']
    const stars = Array.from({ length: 240 }, () => ({
      x: (Math.random() - 0.5) * w * 2,
      y: (Math.random() - 0.5) * h * 2,
      z: Math.random() * 1000 + 1,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    }))
    const mouse = { x: 0, y: 0 }

    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / w - 0.5) * 2
      mouse.y = (e.clientY / h - 0.5) * 2
    }
    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize', onResize)

    const render = () => {
      ctx.clearRect(0, 0, w, h)
      const focal = 420
      for (const s of stars) {
        if (!reduced) s.z -= 1.5
        if (s.z <= 1) {
          s.z = 1000
          s.x = (Math.random() - 0.5) * w * 2
          s.y = (Math.random() - 0.5) * h * 2
        }
        const k = focal / s.z
        const px = w / 2 + (s.x - mouse.x * 140) * k
        const py = h / 2 + (s.y - mouse.y * 140) * k
        if (px < 0 || px > w || py < 0 || py > h) continue
        const depth = 1 - s.z / 1000
        ctx.globalAlpha = Math.min(1, depth * 1.2 + 0.08)
        ctx.fillStyle = s.c
        ctx.beginPath()
        ctx.arc(px, py, Math.max(0.3, 2.4 * depth), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="fixed inset-0 z-0 pointer-events-none opacity-70" />
}
