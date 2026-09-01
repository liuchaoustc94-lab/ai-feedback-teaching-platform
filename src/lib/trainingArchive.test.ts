import type { PoseReport } from './poseMetrics'
import { savePoseReportToArchive } from './trainingArchive'

const apiMocks = vi.hoisted(() => ({
  createTrainingRecord: vi.fn(),
}))

vi.mock('./api', () => ({
  createTrainingRecord: apiMocks.createTrainingRecord,
}))

const validReport: PoseReport = {
  metrics: [{
    shoulderSymmetry: 2,
    hipSymmetry: 3,
    kneeAngle: { name: '膝关节角度', left: 170, right: 171, unit: '°' },
    elbowAngle: { name: '肘关节角度', left: null, right: null, unit: '°' },
    ankleAngle: { name: '踝关节角度', left: null, right: null, unit: '°' },
    hipAngle: { name: '髋关节角度', left: null, right: null, unit: '°' },
    centerOfGravity: { x: 0.5, y: 0.5 },
    headPosition: { x: 0.5, y: 0.1 },
    timestamp: 1_000,
  }],
  summary: {
    avgShoulderSymmetry: 2,
    avgHipSymmetry: 3,
    postureQuality: 'good',
    recommendations: ['保持训练'],
    keyFindings: ['对称性良好'],
  },
  duration: 8,
  startTime: 1_000,
  endTime: 9_000,
}

const backendRecord = {
  id: 'u1-record',
} as Awaited<ReturnType<typeof savePoseReportToArchive>>

describe('trainingArchive backend adapter', () => {
  beforeEach(() => {
    apiMocks.createTrainingRecord.mockReset()
  })

  it('does not submit an empty pose report', async () => {
    const result = await savePoseReportToArchive({ ...validReport, metrics: [] }, 'F2.1', '平衡测试')

    expect(result).toBeNull()
    expect(apiMocks.createTrainingRecord).not.toHaveBeenCalled()
  })

  it('submits posture indicators and report data to the backend', async () => {
    apiMocks.createTrainingRecord.mockResolvedValue({ record: backendRecord, created: true })

    const result = await savePoseReportToArchive(validReport, 'F4.1', '关节点轨迹分析')

    expect(result).toBe(backendRecord)
    expect(apiMocks.createTrainingRecord).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'pose-F4.1-9000',
      moduleKey: 'motor-coordination',
      functionCode: 'F4.1',
      moduleTitle: '关节点轨迹分析',
      duration: 8,
    }))
    expect(localStorage.getItem('ai-feedback-training-records')).toBeNull()
  })

  it('maps the default pose route to a protected motor function', async () => {
    apiMocks.createTrainingRecord.mockResolvedValue({ record: backendRecord, created: true })

    await savePoseReportToArchive(validReport, 'POSE', '姿态识别与分析')

    expect(apiMocks.createTrainingRecord).toHaveBeenCalledWith(expect.objectContaining({
      moduleKey: 'motor-coordination',
      functionCode: 'F4.1',
    }))
  })
})
