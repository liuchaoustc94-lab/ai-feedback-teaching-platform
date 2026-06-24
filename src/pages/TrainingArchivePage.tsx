import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeft,
  Download,
  FileText,
  RotateCcw,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react'
import {
  clearArchiveRecords,
  readArchiveIdentity,
  readArchiveRecords,
  saveArchiveIdentity,
  type ArchiveIdentity,
  type TrainingArchiveRecord,
} from '../lib/trainingArchive'

const qualityLabel = {
  excellent: '优秀',
  good: '良好',
  fair: '一般',
  needs_improvement: '需改善',
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toCsv(records: TrainingArchiveRecord[]) {
  const rows = [
    ['匿名编号', '时间', '模块', '名称', '时长(s)', '肩部偏差(%)', '髋部偏差(%)', '质量', '采样点'],
    ...records.map((record) => [
      record.anonymousId,
      new Date(record.timestamp).toLocaleString('zh-CN'),
      record.moduleCode,
      record.moduleTitle,
      String(record.duration),
      String(record.avgShoulderSymmetry),
      String(record.avgHipSymmetry),
      qualityLabel[record.postureQuality],
      String(record.sampleCount),
    ]),
  ]

  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export default function TrainingArchivePage() {
  const navigate = useNavigate()
  const [identity, setIdentity] = useState<ArchiveIdentity | null>(() => readArchiveIdentity())
  const [className, setClassName] = useState(identity?.className ?? '体教2401')
  const [studentNo, setStudentNo] = useState(identity?.studentNo ?? '01')
  const [records, setRecords] = useState<TrainingArchiveRecord[]>(() => readArchiveRecords())

  const myRecords = useMemo(() => {
    if (!identity) return []
    return records.filter((record) => record.anonymousId === identity.anonymousId)
  }, [identity, records])

  const summary = useMemo(() => {
    const latest = myRecords[0]
    const modules = new Set(myRecords.map((record) => record.moduleCode))
    return {
      latest,
      total: myRecords.length,
      modules: modules.size,
      totalDuration: myRecords.reduce((sum, record) => sum + record.duration, 0),
    }
  }, [myRecords])

  const handleSaveIdentity = () => {
    const nextIdentity = saveArchiveIdentity(className, studentNo)
    setIdentity(nextIdentity)
  }

  const handleExport = () => {
    if (myRecords.length === 0) return

    const blob = new Blob([toCsv(myRecords)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `训练档案_${identity?.anonymousId}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    clearArchiveRecords()
    setRecords([])
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-[#555] transition-colors hover:text-[#111]"
            >
              <ArrowLeft size={16} />
              返回
            </button>
            <div className="h-5 w-px bg-[#e5e5e5]" />
            <span className="font-serif-cn text-sm text-[#111]">我的训练档案</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-700">
            <ShieldCheck size={13} />
            本地保存 · 不上传 · 不排名
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <User size={16} className="text-[#134A34]" />
                <h2 className="text-sm font-medium text-[#111]">匿名身份</h2>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-[#666]">班级</span>
                  <input
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    className="w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm outline-none focus:border-[#134A34]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-[#666]">学号</span>
                  <input
                    value={studentNo}
                    onChange={(event) => setStudentNo(event.target.value)}
                    className="w-full rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm outline-none focus:border-[#134A34]"
                  />
                </label>
                <button
                  onClick={handleSaveIdentity}
                  className="w-full rounded-lg bg-[#134A34] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0d3626]"
                >
                  生成并进入档案
                </button>
              </div>

              {identity && (
                <div className="mt-4 rounded-xl bg-[#DBEDE2] p-4">
                  <p className="text-xs text-[#456255]">匿名编号</p>
                  <p className="mt-1 font-mono-data text-xl font-semibold text-[#134A34]">
                    {identity.anonymousId}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
              <h2 className="mb-4 text-sm font-medium text-[#111]">档案概览</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f7f7f5] p-3">
                  <p className="text-xs text-[#777]">记录数</p>
                  <p className="mt-1 font-mono-data text-2xl font-semibold text-[#111]">{summary.total}</p>
                </div>
                <div className="rounded-xl bg-[#f7f7f5] p-3">
                  <p className="text-xs text-[#777]">项目数</p>
                  <p className="mt-1 font-mono-data text-2xl font-semibold text-[#111]">{summary.modules}</p>
                </div>
                <div className="rounded-xl bg-[#f7f7f5] p-3">
                  <p className="text-xs text-[#777]">累计时长</p>
                  <p className="mt-1 font-mono-data text-2xl font-semibold text-[#111]">{summary.totalDuration}s</p>
                </div>
                <div className="rounded-xl bg-[#f7f7f5] p-3">
                  <p className="text-xs text-[#777]">最近质量</p>
                  <p className="mt-1 text-lg font-semibold text-[#111]">
                    {summary.latest ? qualityLabel[summary.latest.postureQuality] : '--'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={myRecords.length === 0}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download size={14} />
                  导出 CSV
                </button>
                <button
                  onClick={handleClear}
                  disabled={records.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d1d1cf] px-3 py-2 text-xs text-[#555] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={14} />
                  清空
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-[#111]">跨课堂历史记录</h1>
                <p className="mt-1 text-sm text-[#777]">
                  姿态识别页生成报告后，会自动追加到当前匿名编号的本地档案。
                </p>
              </div>
              <button
                onClick={() => navigate('/pose-analysis')}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d1d1cf] px-3 py-2 text-sm text-[#333] hover:border-[#999]"
              >
                <RotateCcw size={14} />
                去做一次检测
              </button>
            </div>

            {myRecords.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d8d6] bg-[#fbfbfa] p-8 text-center">
                <FileText size={40} className="mb-3 text-[#b0b0aa]" />
                <p className="font-medium text-[#111]">还没有本地训练记录</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#777]">
                  先在姿态识别页完成一次检测并生成报告，记录会自动出现在这里。
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#e5e5e5]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f7f7f5] text-xs text-[#666]">
                    <tr>
                      <th className="px-4 py-3 font-medium">时间</th>
                      <th className="px-4 py-3 font-medium">项目</th>
                      <th className="px-4 py-3 font-medium">质量</th>
                      <th className="px-4 py-3 font-medium">肩/髋偏差</th>
                      <th className="px-4 py-3 font-medium">采样</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRecords.map((record) => (
                      <tr key={record.id} className="border-t border-[#f0efed]">
                        <td className="px-4 py-3 font-mono-data text-xs text-[#555]">
                          {formatDate(record.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#111]">{record.moduleCode}</div>
                          <div className="text-xs text-[#777]">{record.moduleTitle}</div>
                        </td>
                        <td className="px-4 py-3 text-[#134A34]">
                          {qualityLabel[record.postureQuality]}
                        </td>
                        <td className="px-4 py-3 font-mono-data text-xs text-[#555]">
                          {record.avgShoulderSymmetry}% / {record.avgHipSymmetry}%
                        </td>
                        <td className="px-4 py-3 font-mono-data text-xs text-[#555]">
                          {record.sampleCount} 点 · {record.duration}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
