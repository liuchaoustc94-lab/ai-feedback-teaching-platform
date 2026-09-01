import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { KeyRound } from 'lucide-react'
import { ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      window.setTimeout(() => navigate('/'), 500)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '修改密码失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#e5e5e5] bg-white p-8 shadow-sm">
        <div className="mb-7">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#134A34] text-white">
            <KeyRound size={21} />
          </div>
          <h1 className="text-2xl font-semibold text-[#111]">首次登录，请修改密码</h1>
          <p className="mt-2 text-sm leading-6 text-[#777]">
            {user?.displayName ?? user?.username} 的临时密码只能使用一次。新密码至少 8 个字符。
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[#555]">当前密码</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d1d1cf] px-3 py-2.5 text-sm outline-none focus:border-[#134A34]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[#555]">新密码</span>
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d1d1cf] px-3 py-2.5 text-sm outline-none focus:border-[#134A34]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[#555]">确认新密码</span>
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d1d1cf] px-3 py-2.5 text-sm outline-none focus:border-[#134A34]"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && <p className="text-sm text-green-700">密码已修改，正在进入平台…</p>}
          <button
            type="submit"
            disabled={submitting || success}
            className="w-full rounded-lg bg-[#134A34] px-4 py-3 text-sm font-medium text-white hover:bg-[#0d3626] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '保存中…' : '保存新密码'}
          </button>
        </form>
      </section>
    </main>
  )
}
