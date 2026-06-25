import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter } from 'react-router'
import App from './App'

const lenisDestroyMock = vi.fn()
const lenisRafMock = vi.fn()

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

  it('renders the home route', () => {
    renderApp('/')

    expect(screen.getByRole('heading', { name: '看见看不见的运动机制' })).toBeInTheDocument()
    expect(screen.getAllByText('信息加工')).toHaveLength(2)
  })

  it('renders the pose analysis route', () => {
    renderApp('/pose-analysis?lesson=F2.2')

    expect(screen.getByText('F2.2 · 重心轨迹可视化')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开启摄像头' })).toBeInTheDocument()
  })

  it('renders the local training archive route', () => {
    renderApp('/training-archive')

    expect(screen.getByText('我的训练档案')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '跨课堂历史记录' })).toBeInTheDocument()
  })

  it('runs and cleans up the smooth-scroll animation loop', () => {
    let rafCallback: FrameRequestCallback | null = null
    vi.mocked(requestAnimationFrame).mockImplementation((callback) => {
      rafCallback = callback
      return 1
    })

    const { unmount } = renderApp('/training-archive')

    act(() => {
      rafCallback?.(123)
    })

    expect(lenisRafMock).toHaveBeenCalledWith(123)

    unmount()

    expect(lenisDestroyMock).toHaveBeenCalled()
  })
})
