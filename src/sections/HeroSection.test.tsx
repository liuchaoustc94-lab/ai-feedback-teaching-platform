import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HeroSection from './HeroSection'

function canvasContext() {
  return {
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    set globalCompositeOperation(_value: string) {},
    set globalAlpha(_value: number) {},
    set strokeStyle(_value: string) {},
    set fillStyle(_value: string | CanvasGradient | CanvasPattern) {},
    set lineWidth(_value: number) {},
  }
}

describe('HeroSection', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext() as unknown as CanvasRenderingContext2D)
  })

  it('renders the primary platform link and scroll controls', async () => {
    const user = userEvent.setup()
    const target = document.createElement('section')
    target.id = 'info-processing'
    target.scrollIntoView = vi.fn()
    document.body.appendChild(target)

    render(<HeroSection />)

    expect(screen.getByRole('heading', { name: '看见看不见的运动机制' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入教学平台' })).toHaveAttribute('href', '/platform.html')

    await user.click(screen.getByRole('link', { name: '探索核心模块' }))
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })

    await user.click(screen.getByRole('button', { name: '向下滚动' }))
    expect(target.scrollIntoView).toHaveBeenCalledTimes(2)

    target.remove()
  })

  it('sizes the canvas for the current viewport and cleans up listeners on unmount', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')

    const { container, unmount } = render(<HeroSection />)

    const canvas = container.querySelector('canvas')
    expect(canvas?.width).toBe(window.innerWidth * window.devicePixelRatio)
    expect(canvas?.height).toBe(window.innerHeight * window.devicePixelRatio)

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
