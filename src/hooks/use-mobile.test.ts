import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useIsMobile } from './use-mobile'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  })
}

describe('useIsMobile', () => {
  let changeListener: (() => void) | null = null

  beforeEach(() => {
    changeListener = null
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn((_event, listener) => {
        changeListener = listener as () => void
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('returns true below the mobile breakpoint', () => {
    setViewportWidth(640)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('returns false at and above the mobile breakpoint', () => {
    setViewportWidth(768)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('updates when the media query change listener fires', () => {
    setViewportWidth(900)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    setViewportWidth(500)
    act(() => {
      changeListener?.()
    })

    expect(result.current).toBe(true)
  })
})
