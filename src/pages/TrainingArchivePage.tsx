import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Download, FileText, RefreshCw, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  ApiError,
  buildReportDownloadPath,
  buildTrainingExportPath,
  downloadFile,
  listTrainingRecords,
  type ApiTrainingRecord,
} from '../lib/api'
import { useAuth } from '../auth/AuthContext'

const qualityLabel: Record<string, string> = {
  excellent: '优秀',
  good: '良好',
  fair: '一般',
  needs_improvement: '需改善',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function summaryValue(record: ApiTrainingRecord, key: string) {
  const value = record.metrics[key]
  return typeof value === 'number' ? value : '--'
}

function qualityOf(record: ApiTrainingRecord) {
  const summary = record.report.summary
  if (summary && typeof summary === 'object' && 'postureQuality' in summary) {
    const value = (summary as { postureQuality?: unknown }).postureQuality
    return typeof value === 'string' ? qualityLabel[value] ?? value : '--'
  }
  return '--'
}

function sampleCount(record: ApiTrainingRecord) {
  const samples = record.metrics.samples
  return Array.isArray(samples) ? samples.length : '--'
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function TrainingArchivePage() {
  const navigate = useNavigate()
  const { user, canDownload } = useAuth()
  const [records, setRecords] = useState<ApiTrainingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listTrainingRecords()
      setRecords(result.records)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '训练档案加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  const summary = useMemo(() => ({
    total: records.length,
    modules: new Set(records.map((record) => record.functionCode)).size,
    totalDuration: records.reduce((sum, record) => sum + record.duration, 0),
    latest: records[0],
  }), [records])

  const handleExport = async () => {
    setDownloading(true)
    setError('')
    try {
      const blob = await downloadFile(buildTrainingExportPath())
      saveBlob(blob, `训练档案_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '导出失败')
    } finally {
      setDownloading(false)
    }
  }

  const handleReportDownload = async (record: ApiTrainingRecord) => {
    setError('')
    try {
      const blob = await downloadFile(buildReportDownloadPath(record.id))
      saveBlob(blob, `姿态报告_${record.functionCode}_${new Date().toISOString().slice(0, 10)}.txt`)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail : '报告下载失败')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-[#111]"><ArrowLeft size={16} /> 返回</button>
            <div className="h-5 w-px bg-[#e5e5e5]" />
            <span className="font-serif-cn text-sm text-[#111]">我的训练档案</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-700"><ShieldCheck size={13} /> 后端保存 · 仅本人可见</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold text-[#111]">跨课堂历史记录</h1><p className="mt-1 text-sm text-[#777]">{user?.displayName ?? user?.username} 的训练指标与报告保存在服务端；不上传原始视频。</p><p className="mt-1 text-xs text-[#999]">{user?.className || '未填写班级'} / {user?.studentNo || '未填写学号'}</p></div><div className="flex gap-2"><button onClick={() => void loadRecords()} className="inline-flex items-center gap-2 rounded-lg border border-[#d1d1cf] bg-white px-3 py-2 text-sm text-[#333] hover:border-[#999]"><RefreshCw size={14} />刷新</button><button onClick={() => void handleExport()} disabled={!canDownload || records.length === 0 || downloading} title={canDownload ? '导出训练档案' : '管理员未授予下载权限'} className="inline-flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"><Download size={14} />{downloading ? '导出中…' : '导出 Excel'}</button></div></div>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-2xl border border-[#e5e5e5] bg-white p-4"><p className="text-xs text-[#777]">记录数</p><p className="mt-1 font-mono-data text-2xl font-semibold text-[#111]">{summary.total}</p></div><div className="rounded-2xl border border-[#e5e5e5] bg-white p-4"><p className="text-xs text-[#777]">项目数</p><p className="mt-1 font-mono-data text-2xl font-semibold text-[#111]">{summary.modules}</p></div><div className="rounded-2xl border border-[#e5e5e5] bg-white p-4"><p className="text-xs text-[#777]">累计时长</p><p className="mt-1 font-mono-data text-2xl font-semibold text-[#111]">{summary.totalDuration}s</p></div><div className="rounded-2xl border border-[#e5e5e5] bg-white p-4"><p className="text-xs text-[#777]">最近质量</p><p className="mt-1 text-lg font-semibold text-[#111]">{summary.latest ? qualityOf(summary.latest) : '--'}</p></div></div>

        <section className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white"><div className="flex items-center justify-between border-b border-[#f0efed] px-5 py-4"><div><h2 className="font-medium text-[#111]">训练记录</h2><p className="mt-1 text-xs text-[#777]">记录不可由学生删除；如需处理异常数据，请联系管理员。</p></div><span className="text-xs text-[#999]">{records.length} 条</span></div>{loading ? <div className="p-10 text-center text-sm text-[#777]">加载中…</div> : records.length === 0 ? <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center"><FileText size={40} className="mb-3 text-[#b0b0aa]" /><p className="font-medium text-[#111]">还没有训练记录</p><p className="mt-2 max-w-md text-sm leading-6 text-[#777]">先在有权限的姿态分析模块完成一次检测，生成的指标会自动同步到这里。</p><button onClick={() => navigate('/pose-analysis')} className="mt-5 rounded-lg bg-[#134A34] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3626]">去做一次检测</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-[#f7f7f5] text-xs text-[#666]"><tr><th className="px-5 py-3 font-medium">时间</th><th className="px-5 py-3 font-medium">项目</th><th className="px-5 py-3 font-medium">质量</th><th className="px-5 py-3 font-medium">肩/髋偏差</th><th className="px-5 py-3 font-medium">采样</th><th className="px-5 py-3 font-medium">报告</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-t border-[#f0efed]"><td className="px-5 py-3 font-mono-data text-xs text-[#555]">{formatDate(record.occurredAt)}</td><td className="px-5 py-3"><div className="font-medium text-[#111]">{record.functionCode}</div><div className="text-xs text-[#777]">{record.moduleTitle}</div></td><td className="px-5 py-3 text-[#134A34]">{qualityOf(record)}</td><td className="px-5 py-3 font-mono-data text-xs text-[#555]">{summaryValue(record, 'avgShoulderSymmetry')}% / {summaryValue(record, 'avgHipSymmetry')}%</td><td className="px-5 py-3 font-mono-data text-xs text-[#555]">{sampleCount(record)} 点 · {record.duration}s</td><td className="px-5 py-3"><button disabled={!canDownload} onClick={() => void handleReportDownload(record)} className="inline-flex items-center gap-1 rounded-md border border-[#d1d1cf] px-2 py-1 text-xs text-[#333] hover:border-[#999] disabled:cursor-not-allowed disabled:opacity-40"><Download size={12} />下载</button></td></tr>)}</tbody></table></div>}</section>
      </main>
    </div>
  )
}
