import { isValidElement } from 'react'

const mainMocks = vi.hoisted(() => ({
  render: vi.fn(),
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}))

vi.mock('react-dom/client', () => ({
  createRoot: mainMocks.createRoot,
}))

vi.mock('./App.tsx', () => ({
  default: () => <div data-testid="mock-app" />,
}))

describe('main', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    mainMocks.render = vi.fn()
    mainMocks.createRoot.mockReturnValue({ render: mainMocks.render })
    vi.resetModules()
  })

  it('mounts the app into the root element inside BrowserRouter', async () => {
    await import('./main')

    expect(mainMocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'))
    expect(mainMocks.render).toHaveBeenCalledTimes(1)

    const renderedTree = mainMocks.render.mock.calls[0][0]
    expect(isValidElement(renderedTree)).toBe(true)
  })
})
