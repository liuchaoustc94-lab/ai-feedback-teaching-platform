import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitFor } from '@testing-library/react'

const platformAuthSource = readFileSync(resolve(process.cwd(), 'public/platform-auth.js'), 'utf8')

describe('platform auth bridge recovery', () => {
  it('reconciles the menu after the legacy unpacker replaces the document root', async () => {
    document.body.innerHTML = '<header class="topbar"></header>'
    vi.stubGlobal('MutationObserver', class {
      observe() {}
      disconnect() {}
    })

    const fetchMock = vi.fn((path: string) => {
      if (path === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            user: { id: 1, displayName: '系统管理员', username: 'admin', role: 'admin' },
            modules: [],
            isAdmin: true,
            csrfToken: 'test-csrf',
          }),
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) })
    })
    const testWindow = Object.create(window) as Window & { location: { href: string; pathname: string; search: string } }
    Object.defineProperty(testWindow, 'location', {
      configurable: true,
      value: { href: 'http://localhost/platform.html', pathname: '/platform.html', search: '' },
    })

    try {
      new Function('window', 'document', 'fetch', platformAuthSource)(testWindow, document, fetchMock)
      await waitFor(() => expect(document.querySelector('.topbar #aift-user-menu')).toBeInTheDocument())
      await new Promise((resolve) => setTimeout(resolve, 700))

      const nextRoot = document.createElement('html')
      nextRoot.innerHTML = '<head></head><body><header class="topbar"></header></body>'
      document.documentElement.replaceWith(nextRoot)

      await waitFor(() => {
        expect(document.querySelector('#aift-auth-bridge-style')).toBeInTheDocument()
        expect(document.querySelector('.topbar #aift-user-menu')).toBeInTheDocument()
      }, { timeout: 3000 })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
