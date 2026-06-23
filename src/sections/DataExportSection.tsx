import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Download, FileSpreadsheet, Shield, Clock } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const dataFields = [
  { category: '基础信息', fields: ['学生编号', '测试时间', '所属章节', '实验阶段'] },
  { category: '反应时', fields: ['刺激类型', '平均反应时(ms)', '正确率(%)'] },
  { category: '平衡测试', fields: ['重心晃动范围(cm)', '睁眼/闭眼', '姿态对称性'] },
  { category: '注意分配', fields: ['单任务反应时(ms)', '双任务反应时(ms)'] },
  { category: '姿态分析', fields: ['关节角度(度)', '动作稳定性 CV'] },
  { category: '动作对比', fields: ['前测得分', '后测得分', '练习次数'] },
]

export default function DataExportSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll('.data-row'), {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
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
      id="data-export"
      ref={sectionRef}
      className="py-32 md:py-40 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 bg-[#111]/10 text-[#111] text-xs font-mono-data px-3 py-1.5 rounded-full mb-6">
              <FileSpreadsheet size={12} />
              MODULE F6
            </span>
            <h2 className="font-serif-cn text-3xl md:text-4xl text-[#111] mb-4 leading-tight">
              实验记录与数据导出
            </h2>
            <p className="text-[#555] leading-relaxed">
              自动记录每次测试的数据，支持按班级、按时间段、按测试类型导出为 Excel 文件，供研究者做后续统计分析。
              数据字段设计严格遵循准实验研究规范。
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-[#111] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors duration-300 self-start md:self-auto">
            <Download size={16} />
            导出 Excel
          </button>
        </div>

        {/* Data Fields Table */}
        <div className="bg-[#f7f7f5] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e5e5]">
                  <th className="text-left text-xs font-mono-data text-[#999] uppercase tracking-wider px-6 py-4 w-32">
                    字段类型
                  </th>
                  <th className="text-left text-xs font-mono-data text-[#999] uppercase tracking-wider px-6 py-4">
                    字段名称
                  </th>
                  <th className="text-left text-xs font-mono-data text-[#999] uppercase tracking-wider px-6 py-4 hidden md:table-cell">
                    说明
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataFields.map((group, gi) =>
                  group.fields.map((field, fi) => (
                    <tr
                      key={`${gi}-${fi}`}
                      className="data-row border-b border-[#e5e5e5]/50 hover:bg-white/60 transition-colors"
                    >
                      {fi === 0 && (
                        <td
                          className="px-6 py-3 text-xs font-medium text-[#111] align-top"
                          rowSpan={group.fields.length}
                        >
                          {group.category}
                        </td>
                      )}
                      <td className="px-6 py-3 text-sm text-[#333] font-mono-data">
                        {field}
                      </td>
                      <td className="px-6 py-3 text-xs text-[#999] hidden md:table-cell">
                        {getFieldDescription(field)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="data-row flex items-start gap-4 p-6 bg-[#f7f7f5] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#dc2f1b]/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-[#dc2f1b]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#111] mb-1">隐私保护</h4>
              <p className="text-xs text-[#666] leading-relaxed">
                学生编号匿名化，不存储真实姓名、学号。视频画面不上传服务器，所有识别在本地浏览器完成。
              </p>
            </div>
          </div>

          <div className="data-row flex items-start gap-4 p-6 bg-[#f7f7f5] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#0a4fff]/10 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={18} className="text-[#0a4fff]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#111] mb-1">格式规范</h4>
              <p className="text-xs text-[#666] leading-relaxed">
                导出 .xlsx 格式，UTF-8 编码，中文不乱码。按"前测/后测/延迟测"标识，可直接导入 SPSS。
              </p>
            </div>
          </div>

          <div className="data-row flex items-start gap-4 p-6 bg-[#f7f7f5] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#111]/10 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-[#111]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#111] mb-1">跨课堂积累</h4>
              <p className="text-xs text-[#666] leading-relaxed">
                同一学生多次练习数据可关联追踪，支持 F5.3 再练习效果追踪，即使今天练3次、下周再练5次，曲线连贯。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function getFieldDescription(fieldName: string): string {
  const descriptions: Record<string, string> = {
    '学生编号': '匿名编号，保护隐私，如 S001',
    '测试时间': '自动记录，如 2026-09-15 10:30',
    '所属章节': '对应五大模块之一',
    '实验阶段': '前测/后测/延迟测，标识实验研究阶段',
    '刺激类型': '简单/选择，区分 F1.1 / F1.2',
    '平均反应时(ms)': '多次测试取均值，如 285',
    '正确率(%)': '反应选择正确比例，如 92',
    '重心晃动范围(cm)': '30秒内最大位移，如 4.2',
    '睁眼/闭眼': '测试条件标识，如闭眼',
    '姿态对称性': '姿态控制评估指标，如 0.92',
    '单任务反应时(ms)': '单任务条件下的反应时',
    '双任务反应时(ms)': '双任务干扰下的反应时',
    '关节角度(度)': '关键关节角度，如膝关节 145',
    '动作稳定性 CV': '变异系数，越小越稳定，如 0.08',
    '前测得分': '学习前动作标准度',
    '后测得分': '学习后动作标准度',
    '练习次数': '再练习效果追踪，如 5',
  }
  return descriptions[fieldName] || ''
}
