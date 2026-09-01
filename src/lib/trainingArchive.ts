import type { PoseReport } from './poseMetrics'
import { createTrainingRecord, type ApiTrainingRecord } from './api'
import { moduleForFunction } from './modules'

/** Backend-backed archive record. Browser localStorage is intentionally not used. */
export type TrainingArchiveRecord = ApiTrainingRecord

export async function savePoseReportToArchive(
  report: PoseReport,
  moduleCode: string,
  moduleTitle: string,
): Promise<TrainingArchiveRecord | null> {
  if (report.metrics.length === 0) return null

  // The default route is the motor-coordination pose workflow. Lesson-specific
  // routes retain their exact function code for permission checks and auditing.
  const functionCode = moduleCode === 'POSE' ? 'F4.1' : moduleCode
  const moduleKey = moduleForFunction(functionCode)
  if (!moduleKey) return null

  const result = await createTrainingRecord({
    clientId: `pose-${functionCode}-${report.endTime}`,
    moduleKey,
    functionCode,
    moduleTitle,
    occurredAt: report.endTime,
    duration: report.duration,
    result: `姿态质量：${report.summary.postureQuality}`,
    metrics: {
      samples: report.metrics,
      avgShoulderSymmetry: report.summary.avgShoulderSymmetry,
      avgHipSymmetry: report.summary.avgHipSymmetry,
    },
    report: report as unknown as Record<string, unknown>,
  })
  return result.record
}
