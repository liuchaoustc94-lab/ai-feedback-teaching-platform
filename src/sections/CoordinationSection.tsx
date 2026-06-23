import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Move, RotateCcw, GitCompare, Camera, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

gsap.registerPlugin(ScrollTrigger)

const scrollImages = [
  '/images/balance-test.jpg',
  '/images/data-trajectory.jpg',
  '/images/workspace.jpg',
  '/images/balance-test.jpg',
  '/images/data-trajectory.jpg',
  '/images/workspace.jpg',
]

export default function CoordinationSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll('.coord-card'), {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="coordination"
      ref={sectionRef}
      className="py-32 md:py-40 bg-[#f7f7f5]"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-[#0a4fff]/10 text-[#0a4fff] text-xs font-mono-data px-3 py-1.5 rounded-full mb-6">
            <Move size={12} />
            MODULE F4 · F5
          </span>
          <h2 className="font-serif-cn text-3xl md:text-4xl text-[#111] mb-4 leading-tight">
            动作协调、控制与反馈
          </h2>
          <p className="text-[#555] leading-relaxed">
            打开摄像头，实时识别人体关节点，显示骨架轮廓与关键关节角度。
            追踪指定关节的运动轨迹，评估动作稳定性，实现练习前后的动作对比。
          </p>
        </div>

        {/* Main Feature Display */}
        <div className="relative rounded-3xl overflow-hidden bg-[#111] mb-12">
          <div className="aspect-[16/9] md:aspect-[21/9] relative">
            <img
              src="/images/balance-test.jpg"
              alt="关节点轨迹分析"
              className="w-full h-full object-cover opacity-80"
              loading="lazy"
            />
            {/* Overlay Skeleton Points */}
            <div className="absolute inset-0">
              {/* Simulated joint points */}
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Head */}
                <circle cx="50" cy="15" r="1.5" fill="#0a4fff" opacity="0.9" />
                {/* Shoulders */}
                <circle cx="38" cy="25" r="1" fill="#0a4fff" opacity="0.8" />
                <circle cx="62" cy="25" r="1" fill="#0a4fff" opacity="0.8" />
                {/* Elbows */}
                <circle cx="25" cy="30" r="1" fill="#0a4fff" opacity="0.7" />
                <circle cx="75" cy="30" r="1" fill="#0a4fff" opacity="0.7" />
                {/* Hands */}
                <circle cx="12" cy="28" r="1.2" fill="#dc2f1b" opacity="0.9" />
                <circle cx="88" cy="28" r="1.2" fill="#dc2f1b" opacity="0.9" />
                {/* Hips */}
                <circle cx="45" cy="45" r="1" fill="#0a4fff" opacity="0.8" />
                <circle cx="55" cy="45" r="1" fill="#0a4fff" opacity="0.8" />
                {/* Knees */}
                <circle cx="42" cy="60" r="1.2" fill="#dc2f1b" opacity="0.9" />
                <circle cx="58" cy="62" r="1" fill="#0a4fff" opacity="0.7" />
                {/* Ankles */}
                <circle cx="40" cy="78" r="1" fill="#0a4fff" opacity="0.8" />
                <circle cx="60" cy="85" r="1.2" fill="#dc2f1b" opacity="0.9" />
                {/* Connecting lines */}
                <line x1="50" y1="15" x2="50" y2="35" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="38" y1="25" x2="62" y2="25" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="38" y1="25" x2="25" y2="30" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="62" y1="25" x2="75" y2="30" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="25" y1="30" x2="12" y2="28" stroke="#dc2f1b" strokeWidth="0.3" opacity="0.6" />
                <line x1="75" y1="30" x2="88" y2="28" stroke="#dc2f1b" strokeWidth="0.3" opacity="0.6" />
                <line x1="50" y1="35" x2="45" y2="45" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="50" y1="35" x2="55" y2="45" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="45" y1="45" x2="42" y2="60" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="55" y1="45" x2="58" y2="62" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="42" y1="60" x2="40" y2="78" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
                <line x1="58" y1="62" x2="60" y2="85" stroke="#0a4fff" strokeWidth="0.3" opacity="0.5" />
              </svg>
              {/* Angle Label */}
              <div className="absolute bottom-[35%] left-[38%] bg-[#dc2f1b]/90 text-white text-xs font-mono-data px-2 py-1 rounded">
                膝关节 145°
              </div>
            </div>
            {/* Top overlay info */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <span className="bg-[#dc2f1b] text-white text-xs font-mono-data px-3 py-1.5 rounded-full">
                LIVE
              </span>
              <span className="text-white/70 text-xs font-mono-data">
                MediaPipe Pose · 33 joints
              </span>
            </div>
          </div>
        </div>

        {/* Live Pose Analysis CTA */}
        <div className="bg-[#134A34] rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Camera size={22} className="text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">实时姿态识别与分析</h4>
              <p className="text-white/60 text-xs mt-0.5">
                调用摄像头 · MediaPipe 姿态检测 · 自动生成分析报告
              </p>
            </div>
          </div>
          <Link
            to="/pose-analysis"
            className="inline-flex items-center gap-2 bg-white text-[#134A34] px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            开始分析
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="coord-card bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <div className="w-10 h-10 rounded-lg bg-[#0a4fff]/10 flex items-center justify-center mb-4">
              <Move size={18} className="text-[#0a4fff]" />
            </div>
            <h4 className="text-base font-medium text-[#111] mb-2">F4.1 关节点轨迹分析</h4>
            <p className="text-xs text-[#555] leading-relaxed">
              实时识别17-33个关节点，显示骨架轮廓，追踪指定关节运动路径。支持视频流模式与单帧分析模式。
            </p>
          </div>

          <div className="coord-card bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <div className="w-10 h-10 rounded-lg bg-[#dc2f1b]/10 flex items-center justify-center mb-4">
              <RotateCcw size={18} className="text-[#dc2f1b]" />
            </div>
            <h4 className="text-base font-medium text-[#111] mb-2">F4.2 动作稳定性分析</h4>
            <p className="text-xs text-[#555] leading-relaxed">
              重复同一动作3-5次，计算变异系数(CV)，量化动作稳定性。支持雷达图展示多次动作的关节参数分布。
            </p>
          </div>

          <div className="coord-card bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <div className="w-10 h-10 rounded-lg bg-[#111]/10 flex items-center justify-center mb-4">
              <GitCompare size={18} className="text-[#111]" />
            </div>
            <h4 className="text-base font-medium text-[#111] mb-2">F5.1 动作前后对比</h4>
            <p className="text-xs text-[#555] leading-relaxed">
              练习前与练习后动作并排显示，叠加骨架轮廓做差异对比。显示关键关节角度变化，如膝关节角度从 120° → 145°。
            </p>
          </div>
        </div>

        {/* Infinite Scroll Rail */}
        <div className="overflow-hidden rounded-xl">
          <div className="text-center mb-4">
            <span className="text-xs text-[#999] font-mono-data">动作序列帧预览</span>
          </div>
          <div className="relative flex overflow-hidden">
            <div className="infinite-scroll-rail flex gap-3" style={{ width: 'max-content' }}>
              {[...scrollImages, ...scrollImages].map((src, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden bg-[#111]"
                >
                  <img
                    src={src}
                    alt={`动作帧 ${(i % scrollImages.length) + 1}`}
                    className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
