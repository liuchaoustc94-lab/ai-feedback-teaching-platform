import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const leftImages = [
  { src: '/images/balance-test.jpg', alt: '单腿站立平衡测试' },
  { src: '/images/data-trajectory.jpg', alt: '重心轨迹可视化' },
]

const rightImages = [
  { src: '/images/data-trajectory.jpg', alt: '数据轨迹分析' },
  { src: '/images/balance-test.jpg', alt: '姿态控制评估' },
]

export default function VisualTest3D() {
  const sectionRef = useRef<HTMLElement>(null)
  const columnsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const columns = columnsRef.current
    if (!section || !columns) return

    const ctx = gsap.context(() => {
      const leftCards = columns.querySelectorAll('.column-left .parallax-card')
      const rightCards = columns.querySelectorAll('.column-right .parallax-card')

      leftCards.forEach((card) => {
        gsap.to(card, {
          rotationY: -40,
          xPercent: -50,
          opacity: 0.3,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1,
          },
        })
      })

      rightCards.forEach((card) => {
        gsap.to(card, {
          rotationY: 40,
          xPercent: 50,
          opacity: 0.3,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1,
          },
        })
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="visual-test"
      ref={sectionRef}
      className="py-32 md:py-40 bg-[#f7f7f5] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-[#0a4fff]/10 text-[#0a4fff] text-xs font-mono-data px-3 py-1.5 rounded-full mb-6">
            MODULE F2
          </span>
          <h2 className="font-serif-cn text-3xl md:text-4xl text-[#111] mb-4 leading-tight">
            感觉系统与本体感觉
          </h2>
          <p className="text-[#555] leading-relaxed">
            学生单腿站立在摄像头前，平台实时识别骨架、计算重心位置，记录关键稳定性指标。
            支持睁眼/闭眼两种条件切换——这是讲解本体感觉与闭环控制的关键实验。
          </p>
        </div>
      </div>

      {/* 3D Parallax Columns */}
      <div
        ref={columnsRef}
        className="columns relative"
        style={{ perspective: '1000px' }}
      >
        <div className="flex gap-6 px-6 max-w-6xl mx-auto">
          {/* Left Column */}
          <div className="column-left w-1/2 space-y-6" style={{ transformStyle: 'preserve-3d' }}>
            {leftImages.map((img, i) => (
              <div
                key={`left-${i}`}
                className="parallax-card rounded-2xl overflow-hidden bg-white shadow-sm"
                style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <p className="text-xs text-[#999] font-mono-data">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="column-right w-1/2 space-y-6 pt-20" style={{ transformStyle: 'preserve-3d' }}>
            {rightImages.map((img, i) => (
              <div
                key={`right-${i}`}
                className="parallax-card rounded-2xl overflow-hidden bg-white shadow-sm"
                style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <p className="text-xs text-[#999] font-mono-data">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Summary */}
      <div className="max-w-7xl mx-auto px-6 mt-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: 'F2.1 单腿站立平衡测试', desc: '30秒站立，记录重心晃动范围、平均偏移与稳定时长' },
            { label: 'F2.2 重心轨迹可视化', desc: '实时二维轨迹曲线，渐变色显示时间顺序' },
            { label: 'F2.3 姿态控制评估', desc: '左右肩/髋高度差、重心微抖动标准差、关节角度偏差' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl p-6 border border-[#e5e5e5]">
              <h4 className="text-sm font-medium text-[#111] mb-2">{item.label}</h4>
              <p className="text-xs text-[#666] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
