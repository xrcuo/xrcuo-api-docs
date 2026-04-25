import type { ApiDocForm } from '@/types/api'

const BASE_URL = ''

interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

interface ApiError extends Error {
  code: number
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('admin_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  })

  const data = (await response.json()) as ApiResponse<T>

  if (!response.ok || data.code !== 200) {
    const error = new Error(data.msg || '请求失败') as ApiError
    error.code = data.code
    throw error
  }

  return data.data
}

export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getUser: () => request<{ username: string }>('/admin/user'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<null>('/admin/password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),
}

export interface ApiDocRaw {
  id: number
  name: string
  path: string
  method: string
  description: string
  category: string
  tags: string
  parameters: string
  headers: string
  request_body: string
  responses: string
}

export const apiDocApi = {
  list: (params?: { category?: string; method?: string; keyword?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.method) searchParams.append('method', params.method)
    if (params?.keyword) searchParams.append('keyword', params.keyword)
    return request<ApiDocRaw[]>(`/admin/api-docs?${searchParams.toString()}`)
  },

  get: (id: number) => request<ApiDocRaw>(`/admin/api-docs/${id}`),

  create: (data: ApiDocForm) =>
    request<ApiDocRaw>('/admin/api-docs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (data: ApiDocForm) =>
    request<ApiDocRaw>('/admin/api-docs', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<null>(`/admin/api-docs/${id}`, {
      method: 'DELETE',
    }),

  categories: () => request<string[]>('/admin/api-docs/categories'),
}

interface ConfigItem {
  key: string
  value: string
}

export const configApi = {
  get: (key: string) => request<ConfigItem>(`/admin/config?key=${key}`),

  set: (key: string, value: string) =>
    request<null>('/admin/config', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    }),

  list: () => request<ConfigItem[]>('/admin/configs'),
}

export interface SystemMetrics {
  timestamp: number
  cpu: {
    total_percent: number
    core_percents: number[]
    core_count: number
  }
  memory: {
    total: number
    used: number
    free: number
    used_percent: number
  }
  network: {
    upload_speed: number
    download_speed: number
    total_sent: number
    total_recv: number
  }
}

export const monitorApi = {
  getCurrent: () => request<SystemMetrics>('/admin/metrics'),
  getHistory: () => request<SystemMetrics[]>('/admin/metrics/history'),
}
