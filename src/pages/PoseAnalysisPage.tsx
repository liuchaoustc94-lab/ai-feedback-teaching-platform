import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  ArrowLeft, Camera, CameraOff, Play, Square, Download,
  Activity, AlertCircle, CheckCircle, Info, RotateCcw,
  ChevronRight, FileText, TrendingUp, AlertTriangle
} from 'lucide-react'
import { useMediaPipePose } from '../hooks/useMediaPipePose'
import { savePoseReportToArchive } from '../lib/trainingArchive'

const postureQualityMap = {
  excellent: { label: '优秀', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  good: { label: '良好', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  fair: { label: '一般', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  needs_improvement: { label: '需改善', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

const lessonMap = {
  'F2.1': {
    title: '单腿站立平衡测试',
    description: '单腿站立 30 秒，记录身体对称性、重心晃动趋势和稳定时长。',
    steps: [
      '点击"开启摄像头"，允许浏览器访问摄像头权限',
      '站在摄像头前 2-3 米处，确保全身可见',
      '单腿站立并保持目视前方，点击"开始检测"',
      '先完成睁眼条件，再重复一次闭眼条件',
      '点击"停止并生成报告"，导出课堂记录',
    ],
  },
  'F2.2': {
    title: '重心轨迹可视化',
    description: '实时跟踪肩髋关键点，观察站立过程中的动态平衡变化。',
    steps: [
      '点击"开启摄像头"，让全身进入画面',
      '保持单腿或双脚站立，避免身体被遮挡',
      '点击"开始检测"，观察实时对称性和角度数据',
      '让学生尝试睁眼/闭眼或不同支撑面条件',
      '停止检测后导出报告，作为重心轨迹分析记录',
    ],
  },
  'F2.3': {
    title: '姿态控制评估',
    description: '基于肩、髋、膝、肘等关节点数据评估姿态对称性和控制质量。',
    steps: [
      '点击"开启摄像头"，站到画面中央',
      '保持自然站立或指定姿势 5-10 秒',
      '点击"开始检测"，等待关键点稳定识别',
      '观察左右肩髋偏差和关节角度',
      '停止检测并生成姿态控制报告',
    ],
  },
  'F4.1': {
    title: '关节点轨迹分析',
    description: '实时识别人体骨架，观察动作过程中的关节角度和左右差异。',
    steps: [
      '点击"开启摄像头"，确保动作区域完整入镜',
      '完成深蹲、摆臂或投掷准备等指定动作',
      '点击"开始检测"，持续采集 5-10 秒',
      '观察膝、髋、肘角度以及左右对称性',
      '停止检测并导出动作分析报告',
    ],
  },
  'F4.2': {
    title: '动作稳定性分析',
    description: '重复同一动作，比较多次动作中的角度波动和姿态一致性。',
    steps: [
      '点击"开启摄像头"，让全身和主要动作关节入镜',
      '连续重复同一动作 3-5 次',
      '点击"开始检测"，保持动作节奏稳定',
      '观察实时角度变化和姿态对称性',
      '停止检测后导出报告，用于稳定性对比',
    ],
  },
} as const

type LessonCode = keyof typeof lessonMap

export default function PoseAnalysisPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lessonCode = searchParams.get('lesson') as LessonCode | null
  const lesson = lessonCode && lessonCode in lessonMap ? lessonMap[lessonCode] : null
  const {
    videoRef,
    canvasRef,
    isReady,
    isDetecting,
    currentMetrics,
    report,
    error,
    cameraActive,
    videoDevices,
    selectedDeviceId,
    previewInfo,
    setSelectedDeviceId,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  } = useMediaPipePose()

  const [countdown, setCountdown] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'camera' | 'detecting' | 'report'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const savedReportRef = useRef<string | null>(null)
  const moduleCode = lessonCode ?? 'POSE'
  const moduleTitle = lesson?.title ?? '姿态识别与分析'

  // Timer during detection
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isDetecting) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isDetecting])

  // Countdown before detection
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && phase === 'detecting') {
      const timer = setTimeout(() => {
        startDetection()
        setElapsed(0)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [countdown, phase, startDetection])

  useEffect(() => {
    if (phase !== 'report' || !report) return

    const reportId = `${moduleCode}-${report.endTime}`
    if (savedReportRef.current === reportId) return

    savePoseReportToArchive(report, moduleCode, moduleTitle)
    savedReportRef.current = reportId
  }, [moduleCode, moduleTitle, phase, report])

  const handleStartCamera = async () => {
    await startCamera()
    setPhase('camera')
  }

  const handleStopCamera = () => {
    stopCamera()
    setPhase('idle')
  }

  const handleReconnectCamera = async () => {
    stopCamera()
    if (isDetecting) {
      stopDetection()
    }
    setCountdown(0)
    setElapsed(0)
    await startCamera()
    setPhase('camera')
  }

  const handleStartDetect = () => {
    setCountdown(3)
    setPhase('detecting')
  }

  const handleStopDetect = () => {
    stopDetection()
    setPhase('report')
  }

  const handleReset = () => {
    setPhase('camera')
    setElapsed(0)
    setCountdown(0)
  }

  const handleExportReport = () => {
    if (!report) return

    const content = [
      'AI 反馈教学平台 - 姿态分析报告',
      '================================',
      '',
      `生成时间: ${new Date().toLocaleString('zh-CN')}`,
      `测试时长: ${report.duration} 秒`,
      '',
      '--- 姿态质量评估 ---',
      `整体姿态: ${postureQualityMap[report.summary.postureQuality].label}`,
      `双肩对称性偏差: ${report.summary.avgShoulderSymmetry}%`,
      `双髋对称性偏差: ${report.summary.avgHipSymmetry}%`,
      '',
      '--- 关键发现 ---',
      ...report.summary.keyFindings.map((f) => `• ${f}`),
      '',
      '--- 改进建议 ---',
      ...report.summary.recommendations.map((r) => `• ${r}`),
      '',
      '--- 实时数据记录 ---',
      '时间戳,双肩对称性(%),双髋对称性(%),左膝角度(°),右膝角度(°),左肘角度(°),右肘角度(°)',
      ...report.metrics.map((m) => {
        const ts = new Date(m.timestamp).toLocaleTimeString('zh-CN')
        const ss = m.shoulderSymmetry ?? '-'
        const hs = m.hipSymmetry ?? '-'
        const lk = m.kneeAngle.left ?? '-'
        const rk = m.kneeAngle.right ?? '-'
        const le = m.elbowAngle.left ?? '-'
        const re = m.elbowAngle.right ?? '-'
        return `${ts},${ss},${hs},${lk},${rk},${le},${re}`
      }),
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `姿态分析报告_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-[#555] hover:text-[#111] transition-colors"
            >
              <ArrowLeft size={16} />
              返回
            </button>
            <div className="w-px h-5 bg-[#e5e5e5]" />
            <span className="font-serif-cn text-sm text-[#111]">
              {lesson ? `${lessonCode} · ${moduleTitle}` : moduleTitle}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isReady && (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle size={12} />
                MediaPipe 就绪
              </span>
            )}
            {cameraActive && (
              <span className="flex items-center gap-1.5 text-xs text-[#0a4fff]">
                <Activity size={12} className="animate-pulse" />
                摄像头运行中
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">出错啦</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Camera + Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Container */}
            <div className="relative bg-[#111] rounded-2xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="absolute inset-0 z-10 h-full w-full object-cover bg-transparent"
                style={{ transform: 'scaleX(-1)' }}
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Overlay States */}
              {phase === 'idle' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#111]/80">
                  <Camera size={48} className="text-white/40 mb-4" />
                  <p className="text-white text-lg font-medium mb-2">
                    {moduleTitle}
                  </p>
                  <p className="text-white/50 text-sm mb-6 text-center max-w-md px-6">
                    {lesson?.description ?? '使用摄像头实时识别身体关节点，分析姿态对称性、关节角度，并生成分析报告'}
                  </p>
                  <button
                    onClick={handleStartCamera}
                    disabled={!isReady}
                    className="inline-flex items-center gap-2 bg-[#134A34] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#0d3626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera size={16} />
                    {isReady ? '开启摄像头' : '加载中...'}
                  </button>
                </div>
              )}

              {/* Countdown */}
              {countdown > 0 && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111]/60">
                  <div className="text-center">
                    <div className="text-8xl font-mono-data text-white font-bold animate-pulse">
                      {countdown}
                    </div>
                    <p className="text-white/60 text-sm mt-4">准备开始姿态检测...</p>
                  </div>
                </div>
              )}

              {/* Detecting Overlay */}
              {isDetecting && (
                <div className="absolute top-4 left-4 right-4 z-30 flex items-start justify-between">
                  <div className="bg-[#dc2f1b]/90 text-white text-xs font-mono-data px-3 py-1.5 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    检测中 · {elapsed}s
                  </div>
                </div>
              )}

              {/* Phase label - camera on but not detecting */}
              {phase === 'camera' && (
                <div className="absolute top-4 left-4 z-30 bg-[#0a4fff]/80 text-white text-xs font-mono-data px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  摄像头预览中
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {phase === 'camera' && (
                <>
                  <button
                    onClick={handleStartDetect}
                    className="inline-flex items-center gap-2 bg-[#dc2f1b] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b82514] transition-colors"
                  >
                    <Play size={15} />
                    开始检测
                  </button>
                  <button
                    onClick={handleStopCamera}
                    className="inline-flex items-center gap-2 border border-[#d1d1cf] text-[#555] px-5 py-2.5 rounded-lg text-sm hover:border-[#999] transition-colors"
                  >
                    <CameraOff size={15} />
                    关闭摄像头
                  </button>
                </>
              )}

              {isDetecting && (
                <button
                  onClick={handleStopDetect}
                  className="inline-flex items-center gap-2 bg-[#111] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
                >
                  <Square size={15} />
                  停止并生成报告
                </button>
              )}

              {phase === 'report' && (
                <>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 bg-[#134A34] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0d3626] transition-colors"
                  >
                    <RotateCcw size={15} />
                    重新检测
                  </button>
                  <button
                    onClick={handleExportReport}
                    className="inline-flex items-center gap-2 bg-[#111] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
                  >
                    <Download size={15} />
                    导出报告
                  </button>
                </>
              )}
            </div>

            {cameraActive && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-xs text-[#555]">
                <span className="font-medium text-[#111]">摄像头</span>
                <select
                  value={selectedDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  className="min-w-48 rounded-md border border-[#d1d1cf] bg-white px-2 py-1 text-xs text-[#333]"
                  aria-label="选择摄像头"
                >
                  <option value="">系统默认摄像头</option>
                  {videoDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `摄像头 ${index + 1}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleReconnectCamera}
                  className="rounded-md border border-[#d1d1cf] px-2 py-1 text-xs text-[#333] hover:border-[#999]"
                >
                  重新连接
                </button>
                {previewInfo && (
                  <span className="text-[#777]">
                    {previewInfo.deviceLabel} · {previewInfo.width}x{previewInfo.height}
                    {previewInfo.paused ? ' · 已暂停' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Real-time Data + Report */}
          <div className="space-y-4">
            {/* Real-time Metrics */}
            {currentMetrics && (phase === 'detecting' || phase === 'camera') && (
              <div className="bg-white rounded-2xl p-5 border border-[#e5e5e5]">
                <h3 className="text-sm font-medium text-[#111] mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-[#0a4fff]" />
                  实时数据
                </h3>

                <div className="space-y-3">
                  {/* Symmetry */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f7f7f5] rounded-lg p-3">
                      <p className="text-xs text-[#999] mb-1">双肩对称性</p>
                      <p className="text-lg font-mono-data text-[#111]">
                        {currentMetrics.shoulderSymmetry !== null
                          ? `${currentMetrics.shoulderSymmetry}%`
                          : '--'}
                      </p>
                    </div>
                    <div className="bg-[#f7f7f5] rounded-lg p-3">
                      <p className="text-xs text-[#999] mb-1">双髋对称性</p>
                      <p className="text-lg font-mono-data text-[#111]">
                        {currentMetrics.hipSymmetry !== null
                          ? `${currentMetrics.hipSymmetry}%`
                          : '--'}
                      </p>
                    </div>
                  </div>

                  {/* Joint Angles */}
                  <div className="space-y-2">
                    {[
                      currentMetrics.kneeAngle,
                      currentMetrics.elbowAngle,
                      currentMetrics.hipAngle,
                    ].map((angle) => (
                      <div
                        key={angle.name}
                        className="flex items-center justify-between py-2 border-b border-[#f0efed] last:border-0"
                      >
                        <span className="text-xs text-[#555]">{angle.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono-data text-[#0a4fff]">
                            L: {angle.left ?? '--'}°
                          </span>
                          <span className="text-xs font-mono-data text-[#dc2f1b]">
                            R: {angle.right ?? '--'}°
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status hint */}
                {!isDetecting && phase === 'camera' && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                    <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600">
                      摄像头已就绪，调整身体位置使全身出现在画面中，然后点击"开始检测"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Report */}
            {report && phase === 'report' && (
              <div className="bg-white rounded-2xl p-5 border border-[#e5e5e5] space-y-5">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#134A34]" />
                  <h3 className="text-sm font-medium text-[#111]">姿态分析报告</h3>
                </div>

                {/* Quality Badge */}
                <div className={`rounded-xl p-4 border ${postureQualityMap[report.summary.postureQuality].bg} ${postureQualityMap[report.summary.postureQuality].border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#666]">整体姿态质量</span>
                    <span className={`text-lg font-medium ${postureQualityMap[report.summary.postureQuality].color}`}>
                      {postureQualityMap[report.summary.postureQuality].label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-[#999]">双肩对称偏差</p>
                      <p className="text-base font-mono-data text-[#111]">{report.summary.avgShoulderSymmetry}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#999]">双髋对称偏差</p>
                      <p className="text-base font-mono-data text-[#111]">{report.summary.avgHipSymmetry}%</p>
                    </div>
                  </div>
                </div>

                {/* Key Findings */}
                <div>
                  <h4 className="text-xs font-medium text-[#111] mb-3 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-[#0a4fff]" />
                    关键发现
                  </h4>
                  <div className="space-y-2">
                    {report.summary.keyFindings.map((finding, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-[#555] bg-[#f7f7f5] rounded-lg p-3"
                      >
                        <ChevronRight size={12} className="text-[#0a4fff] flex-shrink-0 mt-0.5" />
                        {finding}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-medium text-[#111] mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-[#dc2f1b]" />
                    改进建议
                  </h4>
                  <div className="space-y-2">
                    {report.summary.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-[#555] bg-[#f7f7f5] rounded-lg p-3"
                      >
                        <span className="text-[#134A34] font-mono-data text-xs flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Info */}
                <div className="pt-3 border-t border-[#e5e5e5]">
                  <div className="flex items-center justify-between text-xs text-[#999]">
                    <span>测试时长</span>
                    <span className="font-mono-data">{report.duration} 秒</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#999] mt-1">
                    <span>数据采样点</span>
                    <span className="font-mono-data">{report.metrics.length} 个</span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {phase === 'idle' && !error && (
              <div className="bg-white rounded-2xl p-5 border border-[#e5e5e5]">
                <h3 className="text-sm font-medium text-[#111] mb-3">使用说明</h3>
                <div className="space-y-3">
                  {(lesson?.steps ?? [
                    '点击"开启摄像头"，允许浏览器访问摄像头权限',
                    '站在摄像头前 2-3 米处，确保全身可见',
                    '点击"开始检测"，保持自然站立姿势 5-10 秒',
                    '点击"停止并生成报告"，查看姿态分析结果',
                    '可导出报告为文本文件，用于学习档案或研究数据',
                  ]).map((text, index) => (
                    <div key={text} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#134A34] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-xs text-[#555] leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    所有处理均在本地浏览器完成，视频画面不上传服务器，充分保护隐私。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
