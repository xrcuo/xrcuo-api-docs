const BASE_URL = ''

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
      ...(options?.headers || {}),
    },
  })

  const data = await response.json()

  if (!response.ok || data.code !== 200) {
    const error = new Error(data.msg || '请求失败')
    ;(error as any).code = data.code
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
    return request<any[]>(`/admin/api-docs?${searchParams.toString()}`)
  },

  get: (id: number) => request<any>(`/admin/api-docs/${id}`),

  create: (data: any) =>
    request<any>('/admin/api-docs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (data: any) =>
    request<any>('/admin/api-docs', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<null>(`/admin/api-docs/${id}`, {
      method: 'DELETE',
    }),

  categories: () => request<string[]>('/admin/api-docs/categories'),
}

export const configApi = {
  get: (key: string) => request<{ key: string; value: string }>(`/admin/config?key=${key}`),

  set: (key: string, value: string) =>
    request<null>('/admin/config', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    }),

  list: () => request<any[]>('/admin/configs'),
}
