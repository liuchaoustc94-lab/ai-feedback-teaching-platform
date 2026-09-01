import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitFor } from '@testing-library/react'

const platformAuthSource = readFileSync(resolve(process.cwd(), 'public/platform-auth.js'), 'utf8')

function mountPlatformAuth(payload: Record<string, unknown>) {
  document.body.innerHTML = '<header class="topbar"></header>'
  const fetchMock = vi.fn((path: string) => {
    if (path === '/api/auth/me') {
      return Promise.resolve({ ok: true, status: 200, json: async () => payload })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) })
  })
  const testWindow = Object.create(window) as Window & { location: { href: string } }
  Object.defineProperty(testWindow, 'location', {
    configurable: true,
    value: { href: 'https://111.231.120.59/platform.html', pathname: '/platform.html', search: '' },
  })

  new Function('window', 'document', 'fetch', platformAuthSource)(testWindow, document, fetchMock)
  return { fetchMock, testWindow }
}

describe('platform auth bridge user menu', () => {
  it('renders the signed-in profile in the topbar and exposes account actions', async () => {
    const { fetchMock, testWindow } = mountPlatformAuth({
      user: { displayName: 'Everest Administrator', username: 'admin', role: 'admin' },
      modules: [],
      isAdmin: true,
      csrfToken: 'test-csrf',
    })

    await waitFor(() => expect(document.querySelector('#aift-user-menu-trigger')).toBeInTheDocument())

    const trigger = document.querySelector<HTMLButtonElement>('#aift-user-menu-trigger')
    expect(trigger).toHaveAccessibleName('打开用户菜单')
    expect(trigger).toHaveTextContent('Everest Administrator')
    expect(trigger).toHaveTextContent('后端正常')
    expect(document.querySelector('.aift-user-avatar img')?.getAttribute('src')).toBe('/icons/user-round.svg')
    expect(document.querySelector('.topbar #aift-user-menu')).toBeInTheDocument()

    // The legacy unpacker replaces the whole document root after this bridge loads.
    // The authenticated chrome must survive that replacement with its styles.
    await new Promise((resolve) => setTimeout(resolve, 700))
    const nextRoot = document.createElement('html')
    nextRoot.innerHTML = '<head></head><body><header class="topbar"></header></body>'
    document.documentElement.replaceWith(nextRoot)
    await waitFor(() => {
      expect(document.querySelector('#aift-auth-bridge-style')).toBeInTheDocument()
      expect(document.querySelector('.topbar #aift-user-menu')).toBeInTheDocument()
      expect(document.querySelector('#aift-auth-bridge-style')?.textContent).toContain('#aift-user-menu-identity{display:flex;flex-direction:column;')
    }, { timeout: 3000 })

    document.querySelector<HTMLButtonElement>('#aift-user-menu-trigger')?.click()

    expect(document.querySelector('[role="menu"]')).toBeInTheDocument()
    expect(document.querySelector<HTMLAnchorElement>('[role="menu"] a[href="/admin/users"]')).toHaveTextContent('用户管理')
    expect(document.querySelector<HTMLAnchorElement>('[role="menu"] a[href="/change-password"]')).toHaveTextContent('修改密码')
    expect(document.querySelector('[role="menu"] button')).toHaveTextContent('退出登录并切换用户')
    expect(document.querySelector('[role="menu"] img[src="/icons/settings.svg"]')).toBeInTheDocument()
    expect(document.querySelector('[role="menu"] img[src="/icons/lock-keyhole.svg"]')).toBeInTheDocument()
    expect(document.querySelector('[role="menu"] img[src="/icons/log-out.svg"]')).toBeInTheDocument()

    document.querySelector<HTMLButtonElement>('[role="menu"] button')?.click()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' })))
    expect(testWindow.location.href).toContain('/login?next=%2Fplatform.html')
  })
})
