import { FlaskConical, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-20 bg-[#f7f7f5] border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          {/* Left */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
              <FlaskConical size={18} className="text-[#dc2f1b]" />
              <span className="font-serif-cn text-base text-[#111]">
                Motor Control Lab
              </span>
            </div>
            <p className="text-xs text-[#999] leading-relaxed max-w-sm">
              基于 AI 反馈的《运动技能学习与控制》课程教学模式创新研究
            </p>
          </div>

          {/* Center - Platform Entry */}
          <div className="text-center">
            <a
              href="/platform.html"
              className="inline-flex items-center gap-2 bg-[#134A34] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#0d3626] transition-colors duration-300"
            >
              <ExternalLink size={14} />
              进入 AI 反馈教学平台
            </a>
            <p className="text-xs text-[#999] mt-2">
              浏览器打开即用 · 8 个 P0 子功能 · 数据一键导出 Excel
            </p>
          </div>

          {/* Right */}
          <div className="text-center md:text-right">
            <p className="text-xs text-[#999]">
              课题支持单位
            </p>
            <p className="text-sm text-[#555] mt-1">
              运动技能学习与控制课题组
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#e5e5e5] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#bbb]">
            © 2026 AI反馈教学平台 · v1.2 修订版
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[#999] hover:text-[#111] transition-colors">使用文档</a>
            <a href="#" className="text-xs text-[#999] hover:text-[#111] transition-colors">教师培训</a>
            <a href="#" className="text-xs text-[#999] hover:text-[#111] transition-colors">课题信息</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
