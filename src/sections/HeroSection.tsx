import { useEffect, useRef, useCallback } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  tail: { x: number; y: number }[]
  color: string
}

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 })
  const rafRef = useRef<number>(0)

  const COLORS = ['#dc2f1b', '#ff6b57', '#ff8f80']
  const WANDER_COLORS = ['#e5e5e5', '#d1d1cf', '#e8e8e6']
  const SPEED = 0.4

  const spawnParticle = useCallback((x: number, y: number, vx: number, vy: number, isWander: boolean = false) => {
    const colors = isWander ? WANDER_COLORS : COLORS
    const particle: Particle = {
      x,
      y,
      vx: vx * SPEED,
      vy: vy * SPEED,
      life: 1,
      maxLife: isWander ? 200 + Math.random() * 100 : 60 + Math.random() * 40,
      size: isWander ? 1 + Math.random() * 2 : 2 + Math.random() * 4,
      tail: [],
      color: colors[Math.floor(Math.random() * colors.length)],
    }
    particlesRef.current.push(particle)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // Spawn wander particles periodically
    const wanderInterval = setInterval(() => {
      if (particlesRef.current.length < 80) {
        spawnParticle(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          true
        )
      }
    }, 300)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x || e.clientX
      mouseRef.current.prevY = mouseRef.current.y || e.clientY
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY

      const dx = mouseRef.current.x - mouseRef.current.prevX
      const dy = mouseRef.current.y - mouseRef.current.prevY
      const speed = Math.sqrt(dx * dx + dy * dy)

      if (speed > 2) {
        const count = Math.min(Math.floor(speed / 5), 5)
        for (let i = 0; i < count; i++) {
          spawnParticle(
            mouseRef.current.x + (Math.random() - 0.5) * 10,
            mouseRef.current.y + (Math.random() - 0.5) * 10,
            dx * 0.1 + (Math.random() - 0.5) * 2,
            dy * 0.1 + (Math.random() - 0.5) * 2
          )
        }
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.globalCompositeOperation = 'screen'

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= 1 / p.maxLife
        if (p.life <= 0) return false

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.98
        p.vy *= 0.98

        p.tail.push({ x: p.x, y: p.y })
        if (p.tail.length > 8) p.tail.shift()

        // Draw tail
        if (p.tail.length > 1) {
          ctx.beginPath()
          ctx.moveTo(p.tail[0].x, p.tail[0].y)
          for (let i = 1; i < p.tail.length; i++) {
            ctx.lineTo(p.tail[i].x, p.tail[i].y)
          }
          ctx.strokeStyle = p.color
          ctx.lineWidth = p.size * p.life * 0.5
          ctx.globalAlpha = p.life * 0.4
          ctx.stroke()
        }

        // Draw head
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.life * 0.8
        ctx.fill()

        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life * 3, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * p.life * 3)
        gradient.addColorStop(0, p.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.globalAlpha = p.life * 0.15
        ctx.fill()

        return true
      })

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', resize)
      clearInterval(wanderInterval)
    }
  }, [spawnParticle])

  const scrollToContent = () => {
    const el = document.getElementById('info-processing')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen w-full grid-bg flex flex-col items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="font-serif-cn text-[#111] leading-tight tracking-tight mb-8"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}>
          看见看不见的
          <br />
          <span className="text-[#dc2f1b]">运动机制</span>
        </h1>

        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-[#333] text-base leading-relaxed">
            这是一个在浏览器里直接打开就能用的网页工具。课堂上学生对着摄像头做动作或者完成简单测试，网页把动作数据可视化出来，帮助学生亲眼看见课本上那些抽象的运动控制原理。
          </p>
          <p className="text-[#555] text-sm leading-relaxed">
            57.41% 的学生愿意接受 AI 反馈进入课堂，81.25% 的教师认可 AI 反馈适合引入《运动技能学习与控制》这门课程。
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/platform.html"
            className="inline-flex items-center gap-2 bg-[#134A34] text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-[#0d3626] transition-colors duration-300"
          >
            <ExternalLink size={15} />
            进入教学平台
          </a>
          <a
            href="#info-processing"
            onClick={(e) => {
              e.preventDefault()
              scrollToContent()
            }}
            className="border border-[#d1d1cf] text-[#333] px-8 py-3 rounded-lg text-sm font-medium hover:border-[#111] hover:text-[#111] transition-all duration-300"
          >
            探索核心模块
          </a>
        </div>
      </div>

      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#999] hover:text-[#111] transition-colors duration-300 animate-bounce"
        aria-label="向下滚动"
      >
        <ChevronDown size={24} />
      </button>
    </section>
  )
}
