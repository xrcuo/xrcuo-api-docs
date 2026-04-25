<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiDocApi } from '@/api/client'
import type { ApiDocRaw } from '@/api/client'
import ApiDocEditor from '@/components/ApiDocEditor.vue'
import SystemMonitor from '@/components/SystemMonitor.vue'
import type { ApiDocForm, ApiEndpoint } from '@/types/api'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'docs' | 'monitor' | 'password'>('docs')
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

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await loadDocs()
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

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-page">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <h2>管理后台</h2>
        </div>
        <span class="user-info">{{ authStore.username }}</span>
      </div>
      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'docs' }"
          @click="activeTab = 'docs'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          API 文档管理
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'monitor' }"
          @click="activeTab = 'monitor'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          系统监控
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'password' }"
          @click="activeTab = 'password'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          修改密码
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
        <div class="tab-header">
          <div class="header-title">
            <h2>API 文档列表</h2>
            <p class="header-desc">管理系统 API 接口文档</p>
          </div>
          <button class="btn-create" @click="openCreate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新建文档
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else class="doc-list">
          <div v-for="doc in docs" :key="doc.id" class="doc-item">
            <div class="doc-main">
              <span class="method-badge" :class="doc.method.toLowerCase()">{{ doc.method }}</span>
              <span class="doc-path">{{ doc.path }}</span>
              <span class="doc-name">{{ doc.name }}</span>
              <span class="doc-category">{{ doc.category }}</span>
            </div>
            <div class="doc-actions">
              <button class="btn-action edit" @click="openEdit(doc)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                编辑
              </button>
              <button class="btn-action delete" @click="handleDelete(doc.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'monitor'" class="tab-content">
        <div class="tab-header">
          <div class="header-title">
            <h2>系统监控</h2>
            <p class="header-desc">实时监控系统资源使用情况</p>
          </div>
        </div>
        <SystemMonitor />
      </div>

      <div v-if="activeTab === 'password'" class="tab-content">
        <div class="tab-header">
          <div class="header-title">
            <h2>修改密码</h2>
            <p class="header-desc">更新您的登录密码</p>
          </div>
        </div>
        <div class="password-card">
          <form class="password-form" @submit.prevent="handleChangePassword">
            <div class="form-group">
              <label>原密码</label>
              <input v-model="oldPassword" type="password" class="form-input" placeholder="请输入原密码" />
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input v-model="newPassword" type="password" class="form-input" placeholder="请输入新密码（至少6位）" />
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="confirmPassword" type="password" class="form-input" placeholder="请再次输入新密码" />
            </div>
            <div v-if="passwordError" class="error-msg">{{ passwordError }}</div>
            <div v-if="passwordSuccess" class="success-msg">{{ passwordSuccess }}</div>
            <button type="submit" class="btn-submit">修改密码</button>
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

.admin-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo svg {
  width: 28px;
  height: 28px;
  color: #667eea;
}

.logo h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-info {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  padding-left: 40px;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  border-radius: 10px;
  transition: all 0.2s;
}

.nav-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
}

.btn-logout {
  margin: 0 20px 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-logout svg {
  width: 16px;
  height: 16px;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.admin-main {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-title h2 {
  font-size: 22px;
  margin: 0 0 4px;
  color: #1a1a2e;
}

.header-desc {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-create svg {
  width: 16px;
  height: 16px;
}

.btn-create:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.loading-state,
.error-state {
  padding: 60px;
  text-align: center;
  color: #888;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #e53935;
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
}

.doc-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.doc-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.method-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  min-width: 52px;
  text-align: center;
}

.get {
  background: #e3f2fd;
  color: #1976d2;
}

.post {
  background: #e8f5e9;
  color: #388e3c;
}

.put {
  background: #fff3e0;
  color: #f57c00;
}

.delete {
  background: #ffebee;
  color: #d32f2f;
}

.patch {
  background: #f3e5f5;
  color: #7b1fa2;
}

.doc-path {
  font-family: 'SF Mono', monospace;
  font-size: 13px;
  color: #555;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 6px;
}

.doc-name {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.doc-category {
  font-size: 12px;
  color: #888;
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 20px;
  white-space: nowrap;
}

.doc-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-action svg {
  width: 14px;
  height: 14px;
}

.btn-action.edit {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-action.edit:hover {
  background: #bbdefb;
}

.btn-action.delete {
  background: #ffebee;
  color: #c62828;
}

.btn-action.delete:hover {
  background: #ffcdd2;
}

.password-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #e8e8e8;
  max-width: 480px;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-msg {
  color: #e53935;
  font-size: 13px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 8px;
}

.success-msg {
  color: #43a047;
  font-size: 13px;
  padding: 8px 12px;
  background: #e8f5e9;
  border-radius: 8px;
}

.btn-submit {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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

  .doc-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .doc-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
