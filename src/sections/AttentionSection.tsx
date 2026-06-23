import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Activity, TrendingUp } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function AttentionSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll('.data-block'), {
        y: 40,
        opacity: 0,
        duration: 0.8,
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
      id="attention"
      ref={sectionRef}
      className="py-32 md:py-40 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-[#dc2f1b]/10 text-[#dc2f1b] text-xs font-mono-data px-3 py-1.5 rounded-full mb-6">
            <Activity size={12} />
            MODULE F3
          </span>
          <h2 className="font-serif-cn text-3xl md:text-4xl text-[#111] mb-4 leading-tight">
            注意分配与双任务范式
          </h2>
          <p className="text-[#555] leading-relaxed">
            让学生先做单任务反应时，再做双任务反应时（同时完成反应时测试 + 一个干扰任务），
            对比两次反应时的差异，直观展示"注意分配"对表现的影响。
          </p>
        </div>

        {/* Data Dashboard */}
        <div className="bg-[#111] rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Single Task */}
            <div className="data-block text-center md:text-left">
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                <div className="w-2 h-2 rounded-full bg-[#0a4fff]" />
                <span className="text-xs text-white/60 font-mono-data tracking-wider">
                  单任务条件
                </span>
              </div>
              <div className="font-mono-data text-5xl md:text-6xl text-white mb-2">
                285
              </div>
              <div className="text-sm text-white/50">毫秒 (ms)</div>
              <p className="text-xs text-white/40 mt-4 leading-relaxed">
                只做反应时测试，无额外认知负荷
              </p>
            </div>

            {/* Difference */}
            <div className="data-block text-center relative">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp size={20} className="text-[#dc2f1b]" />
                <span className="text-xs text-[#dc2f1b] font-mono-data tracking-wider">
                  认知代价
                </span>
              </div>
              <div className="font-mono-data text-5xl md:text-6xl text-[#dc2f1b] mb-2">
                +135
              </div>
              <div className="text-sm text-white/50">毫秒延迟</div>
              <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-0 w-full h-px bg-white/10" />
              <div className="mt-4 px-4 py-2 bg-[#dc2f1b]/10 rounded-lg inline-block">
                <p className="text-xs text-[#ff8f80] leading-relaxed">
                  双任务比单任务多用 47% 的时间
                </p>
              </div>
            </div>

            {/* Dual Task */}
            <div className="data-block text-center md:text-right">
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-end">
                <span className="text-xs text-white/60 font-mono-data tracking-wider">
                  双任务条件
                </span>
                <div className="w-2 h-2 rounded-full bg-[#dc2f1b]" />
              </div>
              <div className="font-mono-data text-5xl md:text-6xl text-white mb-2">
                420
              </div>
              <div className="text-sm text-white/50">毫秒 (ms)</div>
              <p className="text-xs text-white/40 mt-4 leading-relaxed">
                同时进行"从100连续减3"的算术干扰任务
              </p>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-12 pt-8 border-t border-white/10 grid md:grid-cols-3 gap-6">
            <div className="data-block">
              <h4 className="text-sm text-white/80 mb-2">对应教学概念</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                注意分配、认知负荷、心理不应期、双任务范式
              </p>
            </div>
            <div className="data-block">
              <h4 className="text-sm text-white/80 mb-2">干扰任务配置</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                连续减法、读单词、心算等多种难度可选，由教师课前设置
              </p>
            </div>
            <div className="data-block">
              <h4 className="text-sm text-white/80 mb-2">结果解读</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                自动生成课堂用解读语，如"注意分配使你的反应慢了 X 毫秒"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
