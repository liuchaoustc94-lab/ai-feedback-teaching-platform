import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AttentionSection from './AttentionSection'
import CoordinationSection from './CoordinationSection'
import DataExportSection from './DataExportSection'
import FeatureInfoProcessing from './FeatureInfoProcessing'
import Footer from './Footer'
import VisualTest3D from './VisualTest3D'

describe('Static teaching sections', () => {
  it('renders the information-processing module cards', () => {
    render(<FeatureInfoProcessing />)

    expect(screen.getByRole('heading', { name: '从刺激识别到反应选择' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '信息加工模块展示' })).toHaveAttribute('src', '/images/workspace.jpg')
    expect(screen.getByText('简单反应时测试')).toBeInTheDocument()
    expect(screen.getByText('选择反应时测试')).toBeInTheDocument()
    expect(screen.getByText("希克定律(Hick's Law)的课堂演示")).toBeInTheDocument()
  })

  it('renders the attention dashboard values and teaching concepts', () => {
    render(<AttentionSection />)

    expect(screen.getByRole('heading', { name: '注意分配与双任务范式' })).toBeInTheDocument()
    expect(screen.getByText('单任务条件')).toBeInTheDocument()
    expect(screen.getByText('双任务条件')).toBeInTheDocument()
    expect(screen.getByText('+135')).toBeInTheDocument()
    expect(screen.getByText('注意分配、认知负荷、心理不应期、双任务范式')).toBeInTheDocument()
  })

  it('renders coordination content and links to live pose analysis', () => {
    render(
      <MemoryRouter>
        <CoordinationSection />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '动作协调、控制与反馈' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '关节点轨迹分析' })).toHaveAttribute('src', '/images/balance-test.jpg')
    expect(screen.getByRole('link', { name: '开始分析' })).toHaveAttribute('href', '/pose-analysis')
    expect(screen.getByText('F4.2 动作稳定性分析')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: '动作帧 1' })).toHaveLength(2)
  })

  it('renders the visual test image columns and F2 summaries', () => {
    render(<VisualTest3D />)

    expect(screen.getByRole('heading', { name: '感觉系统与本体感觉' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '单腿站立平衡测试' })).toHaveAttribute('src', '/images/balance-test.jpg')
    expect(screen.getByRole('img', { name: '重心轨迹可视化' })).toHaveAttribute('src', '/images/data-trajectory.jpg')
    expect(screen.getByText('F2.3 姿态控制评估')).toBeInTheDocument()
  })

  it('renders the data export field table and privacy affordances', () => {
    render(<DataExportSection />)

    expect(screen.getByRole('heading', { name: '实验记录与数据导出' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导出 Excel' })).toBeInTheDocument()

    const table = screen.getByRole('table')
    expect(within(table).getByText('学生编号')).toBeInTheDocument()
    expect(within(table).getByText('匿名编号，保护隐私，如 S001')).toBeInTheDocument()
    expect(within(table).getByText('动作稳定性 CV')).toBeInTheDocument()
    expect(screen.getByText('隐私保护')).toBeInTheDocument()
    expect(screen.getByText('跨课堂积累')).toBeInTheDocument()
  })

  it('renders footer platform entry and support metadata', () => {
    render(<Footer />)

    expect(screen.getByText('Motor Control Lab')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入 AI 反馈教学平台' })).toHaveAttribute('href', '/platform.html')
    expect(screen.getByText('运动技能学习与控制课题组')).toBeInTheDocument()
    expect(screen.getByText('© 2026 AI反馈教学平台 · v1.2 修订版')).toBeInTheDocument()
  })
})
