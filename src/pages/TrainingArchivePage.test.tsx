import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import TrainingArchivePage from './TrainingArchivePage'

const navigateMock = vi.fn()
const authState = vi.hoisted(() => ({
  canDownload: true,
  user: { displayName: '学生一号', username: 'student01', className: '体教2401', studentNo: '01' },
}))
const apiMocks = vi.hoisted(() => ({
  listTrainingRecords: vi.fn(),
  downloadFile: vi.fn(async () => new Blob(['file'], { type: 'application/octet-stream' })),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, listTrainingRecords: apiMocks.listTrainingRecords, downloadFile: apiMocks.downloadFile }
})

function renderPage() {
  return render(<MemoryRouter><TrainingArchivePage /></MemoryRouter>)
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1-record',
    clientId: 'pose-F4.1-9000',
    userId: 1,
    username: 'student01',
    displayName: '学生一号',
    moduleKey: 'motor-coordination',
    moduleLabel: '动作协调与控制',
    functionCode: 'F4.1',
    moduleTitle: '关节点轨迹分析',
    className: '体教2401',
    studentNo: '01',
    occurredAt: '2026-06-24T08:00:00Z',
    stage: '正式',
    condition: '',
    result: '姿态质量：good',
    duration: 8,
    metrics: { avgShoulderSymmetry: 2, avgHipSymmetry: 3, samples: [{ timestamp: 1 }] },
    report: { summary: { postureQuality: 'good' } },
    ...overrides,
  }
}

describe('TrainingArchivePage', () => {
  beforeEach(() => {
    navigateMock.mockClear()
    authState.canDownload = true
    apiMocks.listTrainingRecords.mockResolvedValue({ records: [], total: 0 })
    apiMocks.downloadFile.mockClear()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:archive')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  it('renders an empty backend archive without local identity or destructive actions', async () => {
    renderPage()

    expect(await screen.findByText('还没有训练记录')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导出 Excel' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: '清空' })).not.toBeInTheDocument()
  })

  it('renders records returned for the authenticated user', async () => {
    apiMocks.listTrainingRecords.mockResolvedValue({ records: [record()], total: 1 })
    renderPage()

    expect(await screen.findByText('关节点轨迹分析')).toBeInTheDocument()
    expect(screen.getAllByText('良好')).toHaveLength(2)
    expect(screen.getByText(/体教2401 \/ 01/)).toBeInTheDocument()
  })

  it('uses the protected backend endpoint for Excel export', async () => {
    apiMocks.listTrainingRecords.mockResolvedValue({ records: [record()], total: 1 })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('关节点轨迹分析')
    await user.click(screen.getByRole('button', { name: '导出 Excel' }))

    await waitFor(() => expect(apiMocks.downloadFile).toHaveBeenCalledWith('/api/training-records/export'))
  })

  it('disables downloads when the account has no download permission', async () => {
    authState.canDownload = false
    apiMocks.listTrainingRecords.mockResolvedValue({ records: [record()], total: 1 })
    renderPage()

    await screen.findByText('关节点轨迹分析')
    expect(screen.getByRole('button', { name: '导出 Excel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下载' })).toBeDisabled()
  })

  it('navigates to pose analysis from the empty state', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('还没有训练记录')
    await user.click(screen.getByRole('button', { name: '去做一次检测' }))
    expect(navigateMock).toHaveBeenCalledWith('/pose-analysis')
  })
})
