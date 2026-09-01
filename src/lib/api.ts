import type { ModuleKey } from './modules'

export type Role = 'admin' | 'student'
export type UserStatus = 'active' | 'disabled'

export interface ApiUser {
  id: number
  username: string
  displayName: string
  role: Role
  status: UserStatus
  className: string | null
  studentNo: string | null
  mustChangePassword: boolean
  modules: ModuleKey[]
  canDownload: boolean
  createdAt: string
  lastLoginAt: string | null
  activeSessionCount: number
}

export interface AuthPayload {
  user: ApiUser
  modules: ModuleKey[]
  canDownload: boolean
  isAdmin: boolean
  mustChangePassword: boolean
  csrfToken: string
}

export interface ApiTrainingRecord {
  id: string
  clientId: string
  userId: number
  username: string | null
  displayName: string | null
  moduleKey: string
  moduleLabel: string
  functionCode: string
  moduleTitle: string
  className: string | null
  studentNo: string | null
  occurredAt: string
  stage: string
  condition: string
  result: string
  duration: number
  metrics: Record<string, unknown>
  report: Record<string, unknown>
}

export interface ApiRecordList {
  records: ApiTrainingRecord[]
  total: number
}

export interface DataCenterResponse extends ApiRecordList {
  filters: {
    classes: string[]
    stages: string[]
    functions: string[]
  }
}

export interface UserCreateInput {
  username: string
  displayName: string
  role: Role
  className?: string
  studentNo?: string
  password?: string
  modules?: ModuleKey[]
  canDownload?: boolean
}

export interface UserUpdateInput {
  displayName?: string
  role?: Role
  status?: UserStatus
  className?: string | null
  studentNo?: string | null
}

export interface AdminUserList {
  users: ApiUser[]
  activeAdminCount: number
}

export interface TrainingRecordInput {
  clientId: string
  moduleKey: ModuleKey
  functionCode: string
  moduleTitle: string
  occurredAt?: number
  stage?: string
  condition?: string
  result?: string
  duration?: number
  metrics?: Record<string, unknown>
  report?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

let csrfToken: string | null = null

export function setCsrfToken(value: string | null) {
  csrfToken = value
}

export function getCsrfToken() {
  return csrfToken
}

function isMutating(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

async function errorDetail(response: Response) {
  try {
    const data = (await response.clone().json()) as { detail?: string }
    return data.detail ?? `请求失败（${response.status}）`
  } catch {
    return `请求失败（${response.status}）`
  }
}

async function requestResponse(path: string, init: RequestInit = {}) {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (isMutating(method) && csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken)
  }
  const response = await fetch(path, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })
  if (response.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aift:unauthorized'))
  }
  return response
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await requestResponse(path, init)
  if (!response.ok) {
    throw new ApiError(response.status, await errorDetail(response))
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const value = search.toString()
  return value ? `?${value}` : ''
}

export async function login(username: string, password: string) {
  const payload = await apiRequest<AuthPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setCsrfToken(payload.csrfToken)
  return payload
}

export async function getMe() {
  const payload = await apiRequest<AuthPayload>('/api/auth/me')
  setCsrfToken(payload.csrfToken)
  return payload
}

export async function logout() {
  try {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  } finally {
    setCsrfToken(null)
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const payload = await apiRequest<AuthPayload>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  setCsrfToken(payload.csrfToken)
  return payload
}

export async function listUsers(params: { role?: Role; status?: UserStatus; q?: string } = {}) {
  return apiRequest<AdminUserList>(`/api/admin/users${queryString(params)}`)
}

export async function createUser(input: UserCreateInput) {
  return apiRequest<{ user: ApiUser; temporaryPassword: string | null }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      username: input.username,
      displayName: input.displayName,
      role: input.role,
      className: input.className || null,
      studentNo: input.studentNo || null,
      ...(input.password ? { password: input.password } : {}),
      modules: input.modules ?? [],
      canDownload: input.canDownload ?? false,
    }),
  })
}

export async function updateUser(userId: number, input: UserUpdateInput) {
  return apiRequest<{ user: ApiUser }>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function updateUserPermissions(
  userId: number,
  modules: ModuleKey[],
  canDownload: boolean,
) {
  return apiRequest<{ user: ApiUser }>(`/api/admin/users/${userId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ modules, canDownload }),
  })
}

export async function resetUserPassword(userId: number) {
  return apiRequest<{
    user: ApiUser
    temporaryPassword: string
    revokedSessionCount: number
  }>(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
}

export async function revokeUserSessions(userId: number) {
  return apiRequest<{ revokedSessionCount: number }>(
    `/api/admin/users/${userId}/revoke-sessions`,
    { method: 'POST' },
  )
}

export async function listTrainingRecords(params: {
  fromDate?: string
  toDate?: string
  functionCode?: string
  stage?: string
} = {}) {
  return apiRequest<ApiRecordList>(`/api/training-records${queryString(params)}`)
}

export async function createTrainingRecord(input: TrainingRecordInput) {
  return apiRequest<{ record: ApiTrainingRecord; created: boolean }>('/api/training-records', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getDataCenter(params: {
  fromDate?: string
  toDate?: string
  className?: string
  functionCode?: string
  stage?: string
} = {}) {
  return apiRequest<DataCenterResponse>(`/api/data-center${queryString(params)}`)
}

export async function downloadFile(path: string) {
  const response = await requestResponse(path, { method: 'GET' })
  if (!response.ok) throw new ApiError(response.status, await errorDetail(response))
  return response.blob()
}

export function buildTrainingExportPath(params: {
  fromDate?: string
  toDate?: string
  functionCode?: string
  stage?: string
} = {}) {
  return `/api/training-records/export${queryString(params)}`
}

export function buildDataCenterExportPath(params: {
  fromDate?: string
  toDate?: string
  className?: string
  functionCode?: string
  stage?: string
} = {}) {
  return `/api/data-center/export${queryString(params)}`
}

export function buildReportDownloadPath(recordId: string) {
  return `/api/training-records/${encodeURIComponent(recordId)}/download`
}
