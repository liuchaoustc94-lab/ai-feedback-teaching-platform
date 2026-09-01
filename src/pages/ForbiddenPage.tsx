import { ArrowLeft, ShieldX } from 'lucide-react'
import { useNavigate } from 'react-router'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
      <section className="max-w-md rounded-2xl border border-[#e5e5e5] bg-white p-8 text-center shadow-sm">
        <ShieldX size={42} className="mx-auto text-[#b82514]" />
        <h1 className="mt-5 text-xl font-semibold text-[#111]">没有访问权限</h1>
        <p className="mt-2 text-sm leading-6 text-[#777]">请联系管理员为当前账号开通对应模块或下载权限。</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#134A34] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3626]"
        >
          <ArrowLeft size={15} />
          返回平台首页
        </button>
      </section>
    </main>
  )
}
