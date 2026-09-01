import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, KeyRound, Plus, RefreshCw, ShieldCheck, UserCog, UserX } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  ApiError,
  createUser,
  listUsers,
  resetUserPassword,
  revokeUserSessions,
  updateUser,
  updateUserPermissions,
  type ApiUser,
  type Role,
  type UserStatus,
} from '../lib/api'
import { MODULE_KEYS, MODULE_LABELS, type ModuleKey } from '../lib/modules'
import { useAuth } from '../auth/AuthContext'

const emptyCreate = {
  username: '',
  displayName: '',
  role: 'student' as Role,
  className: '',
  studentNo: '',
  password: '',
  modules: [] as ModuleKey[],
  canDownload: false,
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '从未登录'
}

function toggleModule(values: ModuleKey[], moduleKey: ModuleKey) {
  return values.includes(moduleKey) ? values.filter((value) => value !== moduleKey) : [...values, moduleKey]
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<ApiUser[]>([])
  const [activeAdminCount, setActiveAdminCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{
    displayName: string
    role: Role
    status: UserStatus
    className: string
    studentNo: string
    modules: ModuleKey[]
    canDownload: boolean
  } | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listUsers({ q: query || undefined })
      setUsers(result.users)
      setActiveAdminCount(result.activeAdminCount)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '用户列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const editingUser = useMemo(() => users.find((item) => item.id === editingId) ?? null, [editingId, users])

  useEffect(() => {
    if (!editingUser) {
      setEditForm(null)
      return
    }
    setEditForm({
      displayName: editingUser.displayName,
      role: editingUser.role,
      status: editingUser.status,
      className: editingUser.className ?? '',
      studentNo: editingUser.studentNo ?? '',
      modules: editingUser.modules,
      canDownload: editingUser.canDownload,
    })
  }, [editingUser])

  const handleError = (requestError: unknown) => {
    setError(requestError instanceof ApiError ? requestError.detail : '操作失败，请稍后重试')
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      const result = await createUser({
        ...createForm,
        className: createForm.className || undefined,
        studentNo: createForm.studentNo || undefined,
        password: createForm.password || undefined,
      })
      setCreateForm(emptyCreate)
      setNotice(result.temporaryPassword ? `账号已创建，临时密码：${result.temporaryPassword}` : '账号已创建')
      await loadUsers()
    } catch (requestError) {
      handleError(requestError)
    }
  }

  const handleSave = async () => {
    if (!editingUser || !editForm) return
    setError('')
    setNotice('')
    try {
      await updateUser(editingUser.id, {
        displayName: editForm.displayName,
        role: editForm.role,
        status: editForm.status,
        className: editForm.className || null,
        studentNo: editForm.studentNo || null,
      })
      if (editForm.role === 'student') {
        await updateUserPermissions(editingUser.id, editForm.modules, editForm.canDownload)
      }
      setNotice('用户信息和逐用户权限已保存')
      await loadUsers()
    } catch (requestError) {
      handleError(requestError)
    }
  }

  const handleResetPassword = async (target: ApiUser) => {
    setError('')
    try {
      const result = await resetUserPassword(target.id)
      setNotice(`${target.username} 的临时密码：${result.temporaryPassword}`)
      await loadUsers()
    } catch (requestError) {
      handleError(requestError)
    }
  }

  const handleRevokeSessions = async (target: ApiUser) => {
    setError('')
    try {
      const result = await revokeUserSessions(target.id)
      setNotice(`已回收 ${target.username} 的 ${result.revokedSessionCount} 个会话`)
      await loadUsers()
    } catch (requestError) {
      handleError(requestError)
    }
  }

  const self = (target: ApiUser) => target.id === currentUser?.id
  const updateCreateModules = (moduleKey: ModuleKey) => {
    setCreateForm((current) => ({ ...current, modules: toggleModule(current.modules, moduleKey) }))
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-[#111]"><ArrowLeft size={16} /> 返回</button>
            <div className="h-5 w-px bg-[#e5e5e5]" />
            <span className="font-serif-cn text-sm text-[#111]">用户与权限管理</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-700"><ShieldCheck size={13} /> 有效管理员 {activeAdminCount} 个</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-2xl font-semibold text-[#111]">用户注册与管理</h1><p className="mt-1 text-sm text-[#777]">账号由管理员创建；停用、角色变化、重置密码和回收会话会立即使旧会话失效。</p></div>
          <div className="flex gap-2"><input aria-label="搜索用户" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户名、姓名或学号" className="rounded-lg border border-[#d1d1cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#134A34]" /><button onClick={() => void loadUsers()} className="inline-flex items-center gap-2 rounded-lg border border-[#d1d1cf] bg-white px-3 py-2 text-sm text-[#333] hover:border-[#999]"><RefreshCw size={14} />刷新</button></div>
        </div>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p className="mb-4 rounded-lg bg-[#DBEDE2] px-4 py-3 text-sm text-[#134A34]">{notice}</p>}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><Plus size={17} className="text-[#134A34]" /><h2 className="font-medium text-[#111]">创建账号</h2></div>
            <form className="space-y-3" onSubmit={handleCreate}>
              <label className="block text-xs text-[#666]">用户名（创建后不可修改）<input required minLength={2} value={createForm.username} onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label>
              <label className="block text-xs text-[#666]">显示名<input required value={createForm.displayName} onChange={(event) => setCreateForm((current) => ({ ...current, displayName: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label>
              <label className="block text-xs text-[#666]">角色<select value={createForm.role} onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value as Role }))} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm"><option value="student">学生用户</option><option value="admin">管理员</option></select></label>
              <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[#666]">班级<input value={createForm.className} onChange={(event) => setCreateForm((current) => ({ ...current, className: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label><label className="block text-xs text-[#666]">学号<input value={createForm.studentNo} onChange={(event) => setCreateForm((current) => ({ ...current, studentNo: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label></div>
              <label className="block text-xs text-[#666]">初始密码（留空则生成临时密码）<input type="password" minLength={8} value={createForm.password} onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label>
              {createForm.role === 'student' && <><div><p className="mb-2 text-xs text-[#666]">初始模块权限（默认全部关闭）</p><div className="grid gap-2">{MODULE_KEYS.map((moduleKey) => <label key={moduleKey} className="flex items-center gap-2 text-xs text-[#444]"><input type="checkbox" checked={createForm.modules.includes(moduleKey)} onChange={() => updateCreateModules(moduleKey)} />{MODULE_LABELS[moduleKey]}</label>)}</div></div><label className="flex items-center gap-2 text-xs text-[#444]"><input type="checkbox" checked={createForm.canDownload} onChange={(event) => setCreateForm((current) => ({ ...current, canDownload: event.target.checked }))} />允许下载文件</label></>}
              <button type="submit" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#134A34] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3626]"><Plus size={15} />创建用户</button>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
            <div className="flex items-center justify-between border-b border-[#f0efed] px-5 py-4"><h2 className="font-medium text-[#111]">用户列表</h2><span className="font-mono-data text-xs text-[#777]">{users.length} 个账号</span></div>
            {loading ? <div className="p-10 text-center text-sm text-[#777]">加载中…</div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f7f7f5] text-xs text-[#666]"><tr><th className="px-5 py-3 font-medium">用户</th><th className="px-5 py-3 font-medium">角色/状态</th><th className="px-5 py-3 font-medium">班级/学号</th><th className="px-5 py-3 font-medium">模块权限</th><th className="px-5 py-3 font-medium">会话</th><th className="px-5 py-3 font-medium">操作</th></tr></thead><tbody>{users.map((target) => <tr key={target.id} className="border-t border-[#f0efed] align-top"><td className="px-5 py-4"><div className="font-medium text-[#111]">{target.displayName}</div><div className="font-mono-data text-xs text-[#777]">{target.username}</div><div className="mt-1 text-[11px] text-[#999]">最近登录：{formatDate(target.lastLoginAt)}</div></td><td className="px-5 py-4"><div className="text-xs font-medium text-[#333]">{target.role === 'admin' ? '管理员' : '学生用户'}</div><div className={`mt-1 text-xs ${target.status === 'active' ? 'text-green-700' : 'text-red-600'}`}>{target.status === 'active' ? '有效' : '已停用'}</div>{target.mustChangePassword && <div className="mt-1 text-[11px] text-amber-700">待改密</div>}</td><td className="px-5 py-4 text-xs text-[#555]">{target.className || '--'}<br />{target.studentNo || '--'}</td><td className="max-w-[220px] px-5 py-4 text-xs leading-5 text-[#555]">{target.role === 'admin' ? '全部模块 · 可下载' : target.modules.length ? target.modules.map((moduleKey) => MODULE_LABELS[moduleKey]).join('、') + (target.canDownload ? ' · 可下载' : '') : '暂无授权'}</td><td className="px-5 py-4 font-mono-data text-xs text-[#555]">{target.activeSessionCount}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5"><button onClick={() => setEditingId(target.id)} className="inline-flex items-center gap-1 rounded-md border border-[#d1d1cf] px-2 py-1 text-xs text-[#333] hover:border-[#999]"><UserCog size={12} />编辑</button><button onClick={() => void handleResetPassword(target)} className="inline-flex items-center gap-1 rounded-md border border-[#d1d1cf] px-2 py-1 text-xs text-[#333] hover:border-[#999]"><KeyRound size={12} />重置密码</button><button onClick={() => void handleRevokeSessions(target)} className="inline-flex items-center gap-1 rounded-md border border-[#d1d1cf] px-2 py-1 text-xs text-[#333] hover:border-[#999]"><RefreshCw size={12} />回收会话</button><button disabled={self(target)} onClick={() => void updateUser(target.id, { status: target.status === 'active' ? 'disabled' : 'active' }).then(() => loadUsers()).catch(handleError)} className="inline-flex items-center gap-1 rounded-md border border-[#f0c5bd] px-2 py-1 text-xs text-[#b82514] hover:border-[#b82514] disabled:cursor-not-allowed disabled:opacity-40"><UserX size={12} />{target.status === 'active' ? '停用' : '启用'}</button></div></td></tr>)}</tbody></table></div>}
          </section>
        </div>

        {editingUser && editForm && <div className="mt-6 rounded-2xl border border-[#cfe3d5] bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-medium text-[#111]">编辑：{editingUser.username}</h2><p className="mt-1 text-xs text-[#777]">用户名不可修改；后端会再次校验管理员自我保护和最后一个有效管理员规则。</p></div><button onClick={() => setEditingId(null)} className="text-sm text-[#777] hover:text-[#111]">关闭</button></div><div className="grid gap-4 md:grid-cols-2"><label className="text-xs text-[#666]">显示名<input value={editForm.displayName} onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label><label className="text-xs text-[#666]">角色<select disabled={self(editingUser)} value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value as Role })} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm disabled:bg-[#f7f7f5]"><option value="student">学生用户</option><option value="admin">管理员</option></select></label><label className="text-xs text-[#666]">状态<select disabled={self(editingUser)} value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as UserStatus })} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm disabled:bg-[#f7f7f5]"><option value="active">有效</option><option value="disabled">停用</option></select></label><label className="text-xs text-[#666]">班级<input value={editForm.className} onChange={(event) => setEditForm({ ...editForm, className: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label><label className="text-xs text-[#666]">学号<input value={editForm.studentNo} onChange={(event) => setEditForm({ ...editForm, studentNo: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm" /></label></div>{editForm.role === 'student' && <div className="mt-4 rounded-xl bg-[#f7f7f5] p-4"><p className="mb-3 text-xs font-medium text-[#555]">逐用户模块权限</p><div className="grid gap-2 md:grid-cols-2">{MODULE_KEYS.map((moduleKey) => <label key={moduleKey} className="flex items-center gap-2 text-xs text-[#444]"><input type="checkbox" checked={editForm.modules.includes(moduleKey)} onChange={() => setEditForm({ ...editForm, modules: toggleModule(editForm.modules, moduleKey) })} />{MODULE_LABELS[moduleKey]}</label>)}</div><label className="mt-3 flex items-center gap-2 text-xs text-[#444]"><input type="checkbox" checked={editForm.canDownload} onChange={(event) => setEditForm({ ...editForm, canDownload: event.target.checked })} />允许下载文件</label></div>}<div className="mt-4 flex justify-end gap-2"><button onClick={() => setEditingId(null)} className="rounded-lg border border-[#d1d1cf] px-4 py-2 text-sm text-[#555]">取消</button><button onClick={() => void handleSave()} className="rounded-lg bg-[#134A34] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d3626]">保存修改</button></div></div>}
      </main>
    </div>
  )
}
