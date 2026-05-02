import type { ApiDocForm } from '@/types/api'

const BASE_URL = ''

// 请求配置常量
const REQUEST_TIMEOUT = 10000 // 10秒超时
const MAX_RETRIES = 2       // 最大重试次数

interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

interface ApiError extends Error {
  code: number
}

// 安全地解析JSON响应
async function safeParseJSON(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`无效的JSON响应: ${text.slice(0, 200)}`)
  }
}

// 带超时的fetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接')
    }
    throw error
  }
}

// 核心请求函数，带重试机制
async function requestWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries = MAX_RETRIES
): Promise<T> {
  const token = localStorage.getItem('admin_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let lastError: Error | undefined

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${url}`, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        },
      })

      const data = (await safeParseJSON(response)) as ApiResponse<T>

      if (!response.ok || data.code !== 200) {
        const error = new Error(data.msg || `请求失败 (HTTP ${response.status})`) as ApiError
        error.code = data.code || response.status
        throw error
      }

      return data.data
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误')
      
      // 如果是认证错误，不重试
      if (error instanceof Error && 'code' in error && (error as ApiError).code === 401) {
        throw error
      }
      
      // 最后一次重试失败，抛出错误
      if (i === retries) {
        throw lastError
      }
      
      // 等待后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }

  throw lastError || new Error('请求失败')
}

// 对外暴露的请求函数
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  return requestWithRetry<T>(url, options)
}

export { request }

// ==================== API 模块 ====================

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
  get: (key: string) => request<ConfigItem>(`/admin/config?key=${encodeURIComponent(key)}`),

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
  getHistory: (limit?: number) => 
    request<SystemMetrics[]>(`/admin/metrics/history${limit ? `?limit=${limit}` : ''}`),
}

export interface ICPResponse {
  value: string
}

export const icpApi = {
  get: () => request<ICPResponse>('/admin/icp'),
  set: (value: string) =>
    request<ICPResponse>('/admin/icp', {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
}
