<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiDocApi, icpApi } from '@/api/client'
import ApiDocEditor from '@/components/ApiDocEditor.vue'
import SystemMonitor from '@/components/SystemMonitor.vue'
import type { ApiDocForm, ApiEndpoint } from '@/types/api'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'docs' | 'monitor' | 'icp' | 'password'>('docs')
const docs = ref<ApiEndpoint[]>([])
const loading = ref(false)
const error = ref('')

const showEditor = ref(false)
const editingDoc = ref<ApiDocForm>(createEmptyDoc())

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

const icpValue = ref('')
const icpLoading = ref(false)
const icpError = ref('')
const icpSuccess = ref('')

// ICP 表单验证常量
const ICP_MIN_LENGTH = 5
const ICP_MAX_LENGTH = 100

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await loadDocs()
  await loadICP()
})

function createEmptyDoc(): ApiDocForm {
  return {
    name: '',
    path: '',
    method: 'GET',
    description: '',
    category: '',
    tags: [],
    parameters: [],
    headers: [],
    requestBody: {
      contentType: 'application/json',
      description: '',
      schema: [],
      example: '',
    },
    responses: [],
  }
}

async function loadDocs() {
  loading.value = true
  error.value = ''
  try {
    const data = await apiDocApi.list()
    docs.value = data.map((item) => ({
      id: String(item.id),
      name: item.name,
      path: item.path,
      method: item.method as ApiEndpoint['method'],
      description: item.description,
      category: item.category,
      tags: safeParse(item.tags, []),
      parameters: safeParse(item.parameters, []),
      headers: safeParse(item.headers, []),
      requestBody: item.request_body ? safeParse(item.request_body, undefined) : undefined,
      responses: safeParse(item.responses, []),
    }))
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: number }).code === 401
    ) {
      authStore.logout()
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

async function loadICP() {
  try {
    const data = await icpApi.get()
    icpValue.value = data.value || ''
  } catch (e: unknown) {
    console.error('加载备案号失败:', e)
  }
}

function safeParse<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

function openCreate() {
  editingDoc.value = createEmptyDoc()
  showEditor.value = true
}

function openEdit(doc: ApiEndpoint) {
  editingDoc.value = {
    id: Number(doc.id),
    name: doc.name,
    path: doc.path,
    method: doc.method,
    description: doc.description,
    category: doc.category,
    tags: [...doc.tags],
    parameters: doc.parameters ? JSON.parse(JSON.stringify(doc.parameters)) : [],
    headers: doc.headers ? JSON.parse(JSON.stringify(doc.headers)) : [],
    requestBody: doc.requestBody ? JSON.parse(JSON.stringify(doc.requestBody)) : undefined,
    responses: doc.responses ? JSON.parse(JSON.stringify(doc.responses)) : [],
  }
  showEditor.value = true
}

async function handleSave() {
  try {
    const payload = {
      id: editingDoc.value.id,
      name: editingDoc.value.name,
      path: editingDoc.value.path,
      method: editingDoc.value.method,
      description: editingDoc.value.description,
      category: editingDoc.value.category,
      tags: editingDoc.value.tags,
      parameters: editingDoc.value.parameters,
      headers: editingDoc.value.headers,
      requestBody: editingDoc.value.requestBody,
      responses: editingDoc.value.responses,
    }
    if (editingDoc.value.id) {
      await apiDocApi.update(payload)
    } else {
      await apiDocApi.create(payload)
    }
    showEditor.value = false
    await loadDocs()
  } catch (e: unknown) {
    alert('保存失败: ' + (e instanceof Error ? e.message : '未知错误'))
  }
}

async function handleDelete(id: string) {
  if (!confirm('确定要删除该文档吗？')) return
  try {
    await apiDocApi.delete(Number(id))
    await loadDocs()
  } catch (e: unknown) {
    alert('删除失败: ' + (e instanceof Error ? e.message : '未知错误'))
  }
}

async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!oldPassword.value || !newPassword.value) {
    passwordError.value = '请填写完整'
    return
  }
  if (newPassword.value.length < 6) {
    passwordError.value = '新密码至少6位'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '两次输入不一致'
    return
  }

  try {
    await authStore.changePassword(oldPassword.value, newPassword.value)
    passwordSuccess.value = '密码修改成功'
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: unknown) {
    passwordError.value = e instanceof Error ? e.message : '修改失败'
  }
}

function validateICP(value: string): { valid: boolean; message?: string } {
  const trimmed = value.trim()
  
  if (!trimmed) {
    return { valid: false, message: '备案号不能为空' }
  }
  
  const length = Array.from(trimmed).length
  if (length < ICP_MIN_LENGTH) {
    return { valid: false, message: `备案号长度不能少于 ${ICP_MIN_LENGTH} 个字符` }
  }
  if (length > ICP_MAX_LENGTH) {
    return { valid: false, message: `备案号长度不能超过 ${ICP_MAX_LENGTH} 个字符` }
  }
  
  return { valid: true }
}

async function handleSaveICP() {
  icpError.value = ''
  icpSuccess.value = ''
  
  // 客户端验证
  const validation = validateICP(icpValue.value)
  if (!validation.valid) {
    icpError.value = validation.message || '验证失败'
    return
  }
  
  icpLoading.value = true

  try {
    const result = await icpApi.set(icpValue.value.trim())
    icpValue.value = result.value
    icpSuccess.value = '备案号保存成功'
    
    // 3秒后清除成功提示
    setTimeout(() => {
      icpSuccess.value = ''
    }, 3000)
  } catch (e: unknown) {
    icpError.value = e instanceof Error ? e.message : '保存失败，请稍后重试'
  } finally {
    icpLoading.value = false
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-page">
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="brand-text">
          <h2>管理后台</h2>
          <span>{{ authStore.username }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'docs' }"
          @click="activeTab = 'docs'"
        >
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </span>
          <span class="nav-label">API 文档管理</span>
          <span class="nav-badge">{{ docs.length }}</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'monitor' }"
          @click="activeTab = 'monitor'"
        >
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </span>
          <span class="nav-label">系统监控</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'icp' }"
          @click="activeTab = 'icp'"
        >
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </span>
          <span class="nav-label">备案号管理</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'password' }"
          @click="activeTab = 'password'"
        >
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <span class="nav-label">修改密码</span>
        </button>
      </nav>

      <button class="btn-logout" @click="logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        退出登录
      </button>
    </aside>

    <main class="admin-main">
      <div v-if="activeTab === 'docs'" class="tab-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">API 文档列表</h1>
            <p class="page-desc">管理系统 API 接口文档</p>
          </div>
          <button class="btn-primary" @click="openCreate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新建文档
          </button>
        </div>

        <div v-if="loading" class="state-loading">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-else-if="error" class="state-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>
        <div v-else class="doc-table-wrapper">
          <table class="doc-table">
            <thead>
              <tr>
                <th>方法</th>
                <th>路径</th>
                <th>名称</th>
                <th>分类</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in docs" :key="doc.id" class="doc-row">
                <td>
                  <span class="method-tag" :class="doc.method.toLowerCase()">{{ doc.method }}</span>
                </td>
                <td class="cell-path">{{ doc.path }}</td>
                <td class="cell-name">{{ doc.name }}</td>
                <td>
                  <span class="category-tag">{{ doc.category }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button class="btn-icon edit" @click="openEdit(doc)" title="编辑">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="btn-icon delete" @click="handleDelete(doc.id)" title="删除">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="docs.length === 0" class="table-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>暂无文档，点击右上角按钮创建</p>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'monitor'" class="tab-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">系统监控</h1>
            <p class="page-desc">实时监控系统资源使用情况</p>
          </div>
        </div>
        <SystemMonitor />
      </div>

      <div v-if="activeTab === 'icp'" class="tab-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">备案号管理</h1>
            <p class="page-desc">设置网站底部展示的备案号信息</p>
          </div>
        </div>
        <div class="form-card">
          <form class="form-stack" @submit.prevent="handleSaveICP">
            <div class="form-field">
              <label>备案号</label>
              <input
                v-model="icpValue"
                type="text"
                :maxlength="ICP_MAX_LENGTH"
                placeholder="例如：京ICP备12345678号"
              />
              <span class="field-hint">
                长度限制：{{ ICP_MIN_LENGTH }}-{{ ICP_MAX_LENGTH }} 个字符
              </span>
            </div>
            <div v-if="icpError" class="alert alert-error">{{ icpError }}</div>
            <div v-if="icpSuccess" class="alert alert-success">{{ icpSuccess }}</div>
            <button type="submit" class="btn-primary btn-full" :disabled="icpLoading">
              {{ icpLoading ? '保存中...' : '保存备案号' }}
            </button>
          </form>
        </div>
      </div>

      <div v-if="activeTab === 'password'" class="tab-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">修改密码</h1>
            <p class="page-desc">更新您的登录密码</p>
          </div>
        </div>
        <div class="form-card">
          <form class="form-stack" @submit.prevent="handleChangePassword">
            <div class="form-field">
              <label>原密码</label>
              <input v-model="oldPassword" type="password" placeholder="请输入原密码" />
            </div>
            <div class="form-field">
              <label>新密码</label>
              <input v-model="newPassword" type="password" placeholder="请输入新密码（至少6位）" />
            </div>
            <div class="form-field">
              <label>确认新密码</label>
              <input v-model="confirmPassword" type="password" placeholder="请再次输入新密码" />
            </div>
            <div v-if="passwordError" class="alert alert-error">{{ passwordError }}</div>
            <div v-if="passwordSuccess" class="alert alert-success">{{ passwordSuccess }}</div>
            <button type="submit" class="btn-primary btn-full">修改密码</button>
          </form>
        </div>
      </div>
    </main>

    <ApiDocEditor
      v-if="showEditor"
      v-model="editingDoc"
      @submit="handleSave"
      @cancel="showEditor = false"
    />
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.admin-sidebar {
  width: var(--sidebar-width);
  background: var(--gray-900);
  color: var(--gray-300);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 24px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--gray-800);
}

.brand-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-600);
  border-radius: var(--radius);
  color: #ffffff;
}

.brand-icon svg {
  width: 20px;
  height: 20px;
}

.brand-text h2 {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.brand-text span {
  font-size: 12px;
  color: var(--gray-500);
}

.sidebar-nav {
  flex: 1;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--gray-400);
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  border-radius: var(--radius);
  transition: all var(--transition-fast);
  position: relative;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.nav-icon svg {
  width: 18px;
  height: 18px;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  padding: 2px 8px;
  background: var(--gray-700);
  color: var(--gray-300);
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-full);
}

.nav-item:hover {
  background: var(--gray-800);
  color: var(--gray-200);
}

.nav-item.active {
  background: var(--primary-600);
  color: #ffffff;
}

.nav-item.active .nav-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.btn-logout {
  margin: 0 12px 12px;
  padding: 10px;
  background: transparent;
  color: var(--gray-500);
  border: 1px solid var(--gray-800);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all var(--transition-fast);
}

.btn-logout svg {
  width: 16px;
  height: 16px;
}

.btn-logout:hover {
  background: var(--gray-800);
  color: var(--gray-300);
  border-color: var(--gray-700);
}

/* Main Content */
.admin-main {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: 32px;
  background: var(--gray-50);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 4px;
  letter-spacing: -0.025em;
}

.page-desc {
  font-size: 14px;
  color: var(--gray-500);
  margin: 0;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--primary-600);
  color: #ffffff;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 3px rgba(79, 70, 229, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary svg {
  width: 16px;
  height: 16px;
}

.btn-full {
  width: 100%;
  justify-content: center;
}

/* Table */
.doc-table-wrapper {
  background: #ffffff;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.doc-table th {
  padding: 14px 20px;
  text-align: left;
  font-weight: 600;
  color: var(--gray-600);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}

.doc-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--gray-100);
  color: var(--gray-700);
}

.doc-row {
  transition: background var(--transition-fast);
}

.doc-row:hover {
  background: var(--gray-50);
}

.doc-row:last-child td {
  border-bottom: none;
}

.cell-path {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  color: var(--gray-800);
  font-weight: 500;
}

.cell-name {
  color: var(--gray-600);
}

.method-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  font-family: 'SF Mono', Monaco, monospace;
}

.method-tag.get {
  background: var(--method-get-bg);
  color: var(--method-get);
}

.method-tag.post {
  background: var(--method-post-bg);
  color: var(--method-post);
}

.method-tag.put {
  background: var(--method-put-bg);
  color: var(--method-put);
}

.method-tag.delete {
  background: var(--method-delete-bg);
  color: var(--method-delete);
}

.method-tag.patch {
  background: var(--method-patch-bg);
  color: var(--method-patch);
}

.category-tag {
  padding: 4px 12px;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-full);
}

.row-actions {
  display: flex;
  gap: 6px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--gray-500);
  background: transparent;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn-icon:hover {
  background: var(--gray-100);
}

.btn-icon.edit:hover {
  color: var(--info-600);
  background: var(--info-50);
}

.btn-icon.delete:hover {
  color: var(--error-600);
  background: var(--error-50);
}

/* States */
.state-loading,
.state-error {
  padding: 60px;
  text-align: center;
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.state-error {
  color: var(--error-600);
  background: var(--error-50);
  border-color: var(--error-100);
}

.table-empty {
  padding: 60px;
  text-align: center;
  color: var(--gray-400);
}

.table-empty svg {
  margin-bottom: 12px;
  color: var(--gray-300);
}

/* Form Card */
.form-card {
  background: #ffffff;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 480px;
  box-shadow: var(--shadow-sm);
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
}

.form-field input {
  padding: 12px 14px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius);
  font-size: 14px;
  color: var(--gray-800);
  background: var(--gray-50);
  transition: all var(--transition-fast);
}

.form-field input:focus {
  outline: none;
  border-color: var(--primary-400);
  background: #ffffff;
  box-shadow: 0 0 0 3px var(--primary-100);
}

.form-field input::placeholder {
  color: var(--gray-400);
}

.field-hint {
  font-size: 12px;
  color: var(--gray-400);
  margin-top: 2px;
}

.alert {
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
}

.alert-error {
  color: var(--error-600);
  background: var(--error-50);
  border: 1px solid var(--error-100);
}

.alert-success {
  color: var(--success-600);
  background: var(--success-50);
  border: 1px solid var(--success-100);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    position: relative;
    height: auto;
  }

  .admin-main {
    margin-left: 0;
  }

  .admin-page {
    flex-direction: column;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .doc-table th,
  .doc-table td {
    padding: 10px 12px;
  }

  .cell-name {
    display: none;
  }
}
</style>
