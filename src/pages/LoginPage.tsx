import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { LockKeyhole, LogIn } from 'lucide-react'
import { ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export default function LoginPage() {
  const { status, payload, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !payload) return
    navigate(payload.mustChangePassword ? '/change-password' : safeNext(searchParams.get('next')), {
      replace: true,
    })
  }, [navigate, payload, searchParams, status])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const nextPayload = await signIn(username, password)
      navigate(
        nextPayload.mustChangePassword ? '/change-password' : safeNext(searchParams.get('next')),
        { replace: true },
      )
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#e5e5e5] bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#134A34] text-white">
            <LockKeyhole size={21} />
          </div>
          <p className="text-xs tracking-[0.18em] text-[#777]">AI FEEDBACK TEACHING PLATFORM</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#111]">登录教学平台</h1>
          <p className="mt-2 text-sm leading-6 text-[#777]">账号由管理员创建。系统不开放自助注册。</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[#555]">用户名</span>
            <input
              required
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-[#d1d1cf] px-3 py-2.5 text-sm outline-none focus:border-[#134A34]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[#555]">密码</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d1d1cf] px-3 py-2.5 text-sm outline-none focus:border-[#134A34]"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#134A34] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0d3626] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn size={16} />
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#999]">
          当前页面：{location.pathname} · 请联系管理员获取账号
        </p>
      </section>
    </main>
  )
}
