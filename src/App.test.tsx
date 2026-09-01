import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter } from 'react-router'
import App from './App'

const lenisDestroyMock = vi.fn()
const lenisRafMock = vi.fn()

const appApiMocks = vi.hoisted(() => ({
  getMe: vi.fn(() => Promise.resolve({
    user: {
      id: 1,
      username: 'admin',
      displayName: '系统管理员',
      role: 'admin',
      status: 'active',
      className: null,
      studentNo: null,
      mustChangePassword: false,
      modules: [
        'information-processing',
        'sensory-proprioception',
        'attention-allocation',
        'motor-coordination',
        'feedback-motor-learning',
        'data-center',
        'training-archive',
      ],
      canDownload: true,
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: null,
      activeSessionCount: 1,
    },
    modules: [
      'information-processing',
      'sensory-proprioception',
      'attention-allocation',
      'motor-coordination',
      'feedback-motor-learning',
      'data-center',
      'training-archive',
    ],
    canDownload: true,
    isAdmin: true,
    mustChangePassword: false,
    csrfToken: 'test-csrf',
  })),
  listTrainingRecords: vi.fn(() => Promise.resolve({ records: [], total: 0 })),
}))

vi.mock('./lib/api', async () => {
  const actual = await vi.importActual<typeof import('./lib/api')>('./lib/api')
  return {
    ...actual,
    getMe: appApiMocks.getMe,
    listTrainingRecords: appApiMocks.listTrainingRecords,
  }
})

vi.mock('@studio-freight/lenis', () => ({
  default: vi.fn(function LenisMock() {
    return {
      raf: lenisRafMock,
      destroy: lenisDestroyMock,
    }
  }),
}))

vi.mock('./hooks/useMediaPipePose', () => ({
  useMediaPipePose: () => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    isReady: true,
    isDetecting: false,
    currentMetrics: null,
    report: null,
    error: null,
    cameraActive: false,
    videoDevices: [],
    selectedDeviceId: '',
    previewInfo: null,
    setSelectedDeviceId: vi.fn(),
    startCamera: vi.fn(),
    stopCamera: vi.fn(),
    startDetection: vi.fn(),
    stopDetection: vi.fn(),
  }),
}))

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  )
}

describe('App routes', () => {
  beforeEach(() => {
    lenisDestroyMock.mockClear()
    lenisRafMock.mockClear()
  })

  it('renders the home route', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: '看见看不见的运动机制' })).toBeInTheDocument()
    expect(screen.getAllByText('信息加工')).toHaveLength(2)
  })

  it('renders the pose analysis route', async () => {
    renderApp('/pose-analysis?lesson=F2.2')

    expect(await screen.findByText('F2.2 · 重心轨迹可视化')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开启摄像头' })).toBeInTheDocument()
  })

  it('renders the local training archive route', async () => {
    renderApp('/training-archive')

    expect(await screen.findByText('我的训练档案')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '跨课堂历史记录' })).toBeInTheDocument()
  })

  it('runs and cleans up the smooth-scroll animation loop', async () => {
    let rafCallback: FrameRequestCallback | null = null
    vi.mocked(requestAnimationFrame).mockImplementation((callback) => {
      rafCallback = callback
      return 1
    })

    const { unmount } = renderApp('/training-archive')

    await screen.findByText('我的训练档案')

    act(() => {
      rafCallback?.(123)
    })

    expect(lenisRafMock).toHaveBeenCalledWith(123)

    unmount()

    expect(lenisDestroyMock).toHaveBeenCalled()
  })
})
