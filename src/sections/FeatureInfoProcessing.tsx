import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Zap, Brain, ArrowRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: Zap,
    tag: 'F1.1 刺激识别',
    title: '简单反应时测试',
    desc: '经典视觉刺激-按键反应任务。屏幕上灰色方块等待随机 1-3 秒后变红，学生立即按键。测量"看到信号到做出反应"的最快速度，对应信息加工下限速度概念。',
    highlight: '测量信息加工的下限速度',
  },
  {
    icon: Brain,
    tag: 'F1.2 反应选择',
    title: '选择反应时测试',
    desc: '出现红色或蓝色方块，要求学生看到红色按 J、看到蓝色按 K。记录反应时与正确率，与简单反应时对比，体现"反应选择阶段"带来的额外时间消耗。',
    highlight: '希克定律(Hick\'s Law)的课堂演示',
  },
]

export default function FeatureInfoProcessing() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll('.feature-card'), {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="info-processing"
      ref={sectionRef}
      className="py-32 md:py-40 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-20">
          <div className="lg:w-1/2">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#f7f7f5]">
              <img
                src="/images/workspace.jpg"
                alt="信息加工模块展示"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-mono-data text-xs text-white/70 tracking-wider">
                  MODULE F1
                </span>
                <h3 className="text-white text-xl font-medium mt-1">
                  信息加工模块
                </h3>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 bg-[#dc2f1b]/10 text-[#dc2f1b] text-xs font-mono-data px-3 py-1.5 rounded-full w-fit glow-pulse-anim mb-6">
              <Zap size={12} />
              信息加工
            </span>
            <h2 className="font-serif-cn text-3xl md:text-4xl text-[#111] mb-4 leading-tight">
              从刺激识别到反应选择
            </h2>
            <p className="text-[#555] leading-relaxed mb-6">
              信息加工模块覆盖信息加工三阶段中的关键概念：刺激识别阶段、反应选择阶段与反应组织阶段。学生通过亲身参与反应时测试，直观感受从"看到信号"到"做出动作"之间大脑经历的复杂加工过程。
            </p>
            <div className="flex items-center gap-2 text-sm text-[#333]">
              <span>了解更多</span>
              <ArrowRight size={14} className="text-[#dc2f1b]" />
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.tag}
              className="feature-card bg-[#f7f7f5] rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#111] flex items-center justify-center">
                  <f.icon size={18} className="text-white" />
                </div>
                <span className="font-mono-data text-xs text-[#999] bg-white px-2 py-1 rounded">
                  {f.tag}
                </span>
              </div>

              <h3 className="text-xl font-medium text-[#111] mb-3">{f.title}</h3>
              <p className="text-sm text-[#555] leading-relaxed mb-4">{f.desc}</p>

              <div className="border-t border-[#e5e5e5] pt-4">
                <span className="text-xs text-[#dc2f1b] font-medium">
                  {f.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
