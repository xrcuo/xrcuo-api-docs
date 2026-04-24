import type { ApiEndpoint, ApiDocForm } from '@/types/api'

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

export const apiDocApi = {
  list: (params?: { category?: string; method?: string; keyword?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.method) searchParams.append('method', params.method)
    if (params?.keyword) searchParams.append('keyword', params.keyword)
    return request<ApiEndpoint[]>(`/admin/api-docs?${searchParams.toString()}`)
  },

  get: (id: number) => request<ApiEndpoint>(`/admin/api-docs/${id}`),

  create: (data: ApiDocForm) =>
    request<ApiEndpoint>('/admin/api-docs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (data: ApiDocForm) =>
    request<ApiEndpoint>('/admin/api-docs', {
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
