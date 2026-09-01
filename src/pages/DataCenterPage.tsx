import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Download, RefreshCw, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ApiError, buildDataCenterExportPath, downloadFile, getDataCenter, type ApiTrainingRecord } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function DataCenterPage() {
  const navigate = useNavigate()
  const { canDownload, isAdmin } = useAuth()
  const [records, setRecords] = useState<ApiTrainingRecord[]>([])
  const [total, setTotal] = useState(0)
  const [classes, setClasses] = useState<string[]>([])
  const [className, setClassName] = useState('')
  const [functionCode, setFunctionCode] = useState('')
  const [stage, setStage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getDataCenter({ className, functionCode, stage })
      setRecords(result.records)
      setTotal(result.total)
      setClasses(result.filters.classes)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [className, functionCode, stage])

  useEffect(() => {
    void load()
  }, [load])

  const handleExport = async () => {
    setDownloading(true)
    try {
      const blob = await downloadFile(buildDataCenterExportPath({ className, functionCode, stage }))
      saveBlob(blob, `数据中心_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '导出失败')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-[#111]">
              <ArrowLeft size={16} /> 返回
            </button>
            <div className="h-5 w-px bg-[#e5e5e5]" />
            <span className="font-serif-cn text-sm text-[#111]">数据中心</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-700">
            <ShieldCheck size={13} /> {isAdmin ? '管理员 · 全量数据' : '学生 · 仅本人数据'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#111]">训练数据中心</h1>
            <p className="mt-1 text-sm text-[#777]">姿态指标、训练阶段和 AI 报告均来自后端记录，不上传原始视频。</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-[#d1d1cf] bg-white px-3 py-2 text-sm text-[#333] hover:border-[#999]">
              <RefreshCw size={14} /> 刷新
            </button>
            <button
              onClick={() => void handleExport()}
              disabled={!canDownload || downloading}
              title={canDownload ? '导出数据中心' : '管理员未授予下载权限'}
              className="inline-flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} /> {downloading ? '导出中…' : '导出 Excel'}
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-4 md:grid-cols-3">
          <label className="text-xs text-[#666]">
            班级
            <select value={className} onChange={(event) => setClassName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm text-[#333]">
              <option value="">全部班级</option>
              {classes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-xs text-[#666]">
            功能
            <input value={functionCode} onChange={(event) => setFunctionCode(event.target.value)} placeholder="例如 F4.1" className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm text-[#333]" />
          </label>
          <label className="text-xs text-[#666]">
            阶段
            <input value={stage} onChange={(event) => setStage(event.target.value)} placeholder="例如 正式" className="mt-1.5 w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm text-[#333]" />
          </label>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <section className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0efed] px-5 py-4">
            <h2 className="font-medium text-[#111]">记录列表</h2>
            <span className="font-mono-data text-xs text-[#777]">共 {total} 条</span>
          </div>
          {loading ? <div className="p-10 text-center text-sm text-[#777]">加载中…</div> : records.length === 0 ? <div className="p-10 text-center text-sm text-[#777]">暂无符合条件的训练记录</div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#f7f7f5] text-xs text-[#666]"><tr><th className="px-5 py-3 font-medium">时间</th><th className="px-5 py-3 font-medium">学生</th><th className="px-5 py-3 font-medium">班级/学号</th><th className="px-5 py-3 font-medium">功能</th><th className="px-5 py-3 font-medium">阶段</th><th className="px-5 py-3 font-medium">结果</th></tr></thead>
                <tbody>{records.map((record) => <tr key={record.id} className="border-t border-[#f0efed]"><td className="px-5 py-3 font-mono-data text-xs text-[#555]">{formatDate(record.occurredAt)}</td><td className="px-5 py-3"><div className="font-medium text-[#111]">{record.displayName || record.username}</div><div className="text-xs text-[#777]">{record.username}</div></td><td className="px-5 py-3 text-xs text-[#555]">{record.className || '--'} / {record.studentNo || '--'}</td><td className="px-5 py-3"><div className="font-medium text-[#111]">{record.functionCode}</div><div className="text-xs text-[#777]">{record.moduleTitle}</div></td><td className="px-5 py-3 text-xs text-[#555]">{record.stage}</td><td className="px-5 py-3 text-[#333]">{record.result || '--'}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
