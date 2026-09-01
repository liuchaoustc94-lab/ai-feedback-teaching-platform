import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router'
import {
  ApiError,
  changePassword as changePasswordRequest,
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  type AuthPayload,
} from '../lib/api'
import type { ModuleKey } from '../lib/modules'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  payload: AuthPayload | null
  user: AuthPayload['user'] | null
  isAdmin: boolean
  modules: ModuleKey[]
  canDownload: boolean
  signIn: (username: string, password: string) => Promise<AuthPayload>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthPayload>
  refresh: () => Promise<AuthPayload | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [payload, setPayload] = useState<AuthPayload | null>(null)

  const refresh = useCallback(async () => {
    try {
      const nextPayload = await getMe()
      setPayload(nextPayload)
      setStatus('authenticated')
      return nextPayload
    } catch (error) {
      if (isUnauthorized(error)) {
        setPayload(null)
        setStatus('unauthenticated')
        return null
      }
      setStatus((current) => (current === 'loading' ? 'unauthenticated' : current))
      throw error
    }
  }, [])

  useEffect(() => {
    void refresh().catch(() => {
      setPayload(null)
      setStatus('unauthenticated')
    })
    const handleUnauthorized = () => {
      setPayload(null)
      setStatus('unauthenticated')
    }
    window.addEventListener('aift:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('aift:unauthorized', handleUnauthorized)
  }, [refresh])

  const signIn = useCallback(async (username: string, password: string) => {
    const nextPayload = await loginRequest(username, password)
    setPayload(nextPayload)
    setStatus('authenticated')
    return nextPayload
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setPayload(null)
      setStatus('unauthenticated')
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const nextPayload = await changePasswordRequest(currentPassword, newPassword)
    setPayload(nextPayload)
    setStatus('authenticated')
    return nextPayload
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      payload,
      user: payload?.user ?? null,
      isAdmin: payload?.isAdmin ?? false,
      modules: payload?.modules ?? [],
      canDownload: payload?.canDownload ?? false,
      signIn,
      signOut,
      changePassword,
      refresh,
    }),
    [changePassword, payload, refresh, signIn, signOut, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return context
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] text-sm text-[#666]">
      正在验证登录状态…
    </div>
  )
}

export function RequireAuth({
  children,
  allowPasswordChange = false,
}: {
  children: ReactNode
  allowPasswordChange?: boolean
}) {
  const { status, payload } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingScreen />
  if (status !== 'authenticated' || !payload) {
    const next = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  if (payload.mustChangePassword && !allowPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/forbidden" replace />
  return <>{children}</>
}

export function RequireModule({
  moduleKey,
  children,
}: {
  moduleKey: ModuleKey
  children: ReactNode
}) {
  const { isAdmin, modules } = useAuth()
  if (!isAdmin && !modules.includes(moduleKey)) return <Navigate to="/forbidden" replace />
  return <>{children}</>
}
