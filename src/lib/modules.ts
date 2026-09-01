export const MODULE_KEYS = [
  'information-processing',
  'sensory-proprioception',
  'attention-allocation',
  'motor-coordination',
  'feedback-motor-learning',
  'data-center',
  'training-archive',
] as const

export type ModuleKey = (typeof MODULE_KEYS)[number]

export const MODULE_LABELS: Record<ModuleKey, string> = {
  'information-processing': '信息加工',
  'sensory-proprioception': '感觉系统与本体感觉',
  'attention-allocation': '注意力分配',
  'motor-coordination': '动作协调与控制',
  'feedback-motor-learning': '反馈与运动学习',
  'data-center': '数据中心',
  'training-archive': '我的训练档案',
}

export const FUNCTION_MODULES: Record<string, ModuleKey> = {
  'F1.1': 'information-processing',
  'F1.2': 'information-processing',
  'F2.1': 'sensory-proprioception',
  'F2.2': 'sensory-proprioception',
  'F2.3': 'sensory-proprioception',
  'F3.1': 'attention-allocation',
  'F4.1': 'motor-coordination',
  'F4.2': 'motor-coordination',
  'F5.1': 'feedback-motor-learning',
  'F5.2': 'feedback-motor-learning',
  'F5.3': 'feedback-motor-learning',
}

export function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value)
}

export function moduleForFunction(functionCode: string | null | undefined) {
  return functionCode ? FUNCTION_MODULES[functionCode] ?? null : null
}

export function moduleForLesson(lessonCode: string | null | undefined): ModuleKey | null {
  if (!lessonCode) return null
  return moduleForFunction(lessonCode) ?? null
}
