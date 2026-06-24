import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import PoseAnalysisPage from './PoseAnalysisPage'
import type { PoseReport } from '../lib/poseMetrics'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  savePoseReportToArchive: vi.fn(),
  startCamera: vi.fn(),
  stopCamera: vi.fn(),
  startDetection: vi.fn(),
  stopDetection: vi.fn(),
  setSelectedDeviceId: vi.fn(),
  hookState: {} as Record<string, unknown>,
}))

const validReport: PoseReport = {
  metrics: [
    {
      shoulderSymmetry: 1,
      hipSymmetry: 1,
      kneeAngle: { name: '膝关节角度', left: 170, right: 170, unit: '°' },
      elbowAngle: { name: '肘关节角度', left: null, right: null, unit: '°' },
      ankleAngle: { name: '踝关节角度', left: null, right: null, unit: '°' },
      hipAngle: { name: '髋关节角度', left: null, right: null, unit: '°' },
      centerOfGravity: { x: 0.5, y: 0.5 },
      headPosition: { x: 0.5, y: 0.1 },
      timestamp: 1_000,
    },
  ],
  summary: {
    avgShoulderSymmetry: 1,
    avgHipSymmetry: 1,
    postureQuality: 'excellent',
    keyFindings: ['双肩高度差异为 1%，对称性良好'],
    recommendations: ['整体姿态良好，建议保持当前训练计划'],
  },
  duration: 5,
  startTime: 1_000,
  endTime: 6_000,
}

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

vi.mock('../lib/trainingArchive', () => ({
  savePoseReportToArchive: (...args: unknown[]) => mocks.savePoseReportToArchive(...args),
}))

vi.mock('../hooks/useMediaPipePose', () => ({
  useMediaPipePose: () => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    isReady: true,
    isDetecting: true,
    currentMetrics: null,
    report: validReport,
    error: null,
    cameraActive: false,
    videoDevices: [],
    selectedDeviceId: '',
    previewInfo: null,
    setSelectedDeviceId: mocks.setSelectedDeviceId,
    startCamera: mocks.startCamera,
    stopCamera: mocks.stopCamera,
    startDetection: mocks.startDetection,
    stopDetection: mocks.stopDetection,
    ...mocks.hookState,
  }),
}))

function renderPage(initialEntry = '/pose-analysis') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/pose-analysis" element={<PoseAnalysisPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PoseAnalysisPage', () => {
  beforeEach(() => {
    mocks.navigate.mockClear()
    mocks.savePoseReportToArchive.mockClear()
    mocks.startCamera.mockClear()
    mocks.stopCamera.mockClear()
    mocks.startDetection.mockClear()
    mocks.stopDetection.mockClear()
    mocks.setSelectedDeviceId.mockClear()
    mocks.hookState = {}
    vi.restoreAllMocks()
  })

  it('customizes copy for lesson-specific pose modules', () => {
    renderPage('/pose-analysis?lesson=F4.1')

    expect(screen.getByText('F4.1 · 关节点轨迹分析')).toBeInTheDocument()
    expect(screen.getByText('实时识别人体骨架，观察动作过程中的关节角度和左右差异。')).toBeInTheDocument()
  })

  it('saves a generated report to the local archive once the report phase opens', async () => {
    const user = userEvent.setup()
    renderPage('/pose-analysis?lesson=F2.1')

    await user.click(screen.getByRole('button', { name: '停止并生成报告' }))

    expect(mocks.stopDetection).toHaveBeenCalled()
    await waitFor(() => {
      expect(mocks.savePoseReportToArchive).toHaveBeenCalledWith(
        validReport,
        'F2.1',
        '单腿站立平衡测试'
      )
    })
  })

  it('uses the default pose-analysis module when no lesson parameter is present', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '停止并生成报告' }))

    await waitFor(() => {
      expect(mocks.savePoseReportToArchive).toHaveBeenCalledWith(
        validReport,
        'POSE',
        '姿态识别与分析'
      )
    })
  })

  it('navigates back to the home page from the header', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '返回' }))

    expect(mocks.navigate).toHaveBeenCalledWith('/')
  })

  it('shows camera errors from the pose hook', () => {
    mocks.hookState = {
      isDetecting: false,
      report: null,
      error: '无法访问摄像头，请检查浏览器权限',
    }

    renderPage()

    expect(screen.getByText('出错啦')).toBeInTheDocument()
    expect(screen.getByText('无法访问摄像头，请检查浏览器权限')).toBeInTheDocument()
  })

  it('starts camera preview and then starts detection countdown', async () => {
    const user = userEvent.setup()
    mocks.hookState = {
      isDetecting: false,
      report: null,
      cameraActive: true,
      videoDevices: [
        {
          deviceId: 'camera-1',
          groupId: 'group-1',
          kind: 'videoinput',
          label: 'FaceTime HD Camera',
          toJSON: () => ({}),
        },
      ],
      previewInfo: {
        width: 1280,
        height: 720,
        readyState: 4,
        paused: false,
        deviceLabel: 'FaceTime HD Camera',
      },
    }

    renderPage()

    await user.click(screen.getByRole('button', { name: '开启摄像头' }))

    expect(mocks.startCamera).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '开始检测' })).toBeInTheDocument()
    expect(screen.getByLabelText('选择摄像头')).toBeInTheDocument()
    expect(screen.getByText(/FaceTime HD Camera · 1280x720/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('选择摄像头'), 'camera-1')
    expect(mocks.setSelectedDeviceId).toHaveBeenCalledWith('camera-1')

    await user.click(screen.getByRole('button', { name: '开始检测' }))
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('reconnects the camera from the preview controls', async () => {
    const user = userEvent.setup()
    mocks.hookState = {
      isDetecting: false,
      report: null,
      cameraActive: true,
    }

    renderPage()

    await user.click(screen.getByRole('button', { name: '开启摄像头' }))
    await user.click(screen.getByRole('button', { name: '重新连接' }))

    expect(mocks.stopCamera).toHaveBeenCalled()
    expect(mocks.startCamera).toHaveBeenCalledTimes(2)
  })

  it('exports the generated report as a text file', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickMock = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
      if (tagName === 'a') {
        Object.defineProperty(element, 'click', { value: clickMock })
      }
      return element as HTMLElement
    })

    renderPage('/pose-analysis?lesson=F4.2')

    await user.click(screen.getByRole('button', { name: '停止并生成报告' }))
    await user.click(screen.getByRole('button', { name: '导出报告' }))

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickMock).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })
})
