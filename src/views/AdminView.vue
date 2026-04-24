<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiDocApi } from '@/api/client'
import ApiDocEditor from '@/components/ApiDocEditor.vue'
import type { ApiDocForm, ApiEndpoint } from '@/types/api'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'docs' | 'password'>('docs')
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
      method: item.method,
      description: item.description,
      category: item.category,
      tags: safeParse(item.tags, []),
      parameters: safeParse(item.parameters, []),
      headers: safeParse(item.headers, []),
      requestBody: item.requestBody ? safeParse(item.requestBody, undefined) : undefined,
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

function safeParse<T>(json: string, fallback: T): T {
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

function goToMonitor() {
  router.push('/monitor')
}
</script>

<template>
  <div class="admin-page">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
        <span class="user-info">{{ authStore.username }}</span>
      </div>
      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'docs' }"
          @click="activeTab = 'docs'"
        >
          API 文档管理
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'password' }"
          @click="activeTab = 'password'"
        >
          修改密码
        </button>
        <button class="nav-item monitor" @click="goToMonitor">
          系统监控
        </button>
      </nav>
      <button class="btn-logout" @click="logout">退出登录</button>
    </aside>

    <main class="admin-main">
      <div v-if="activeTab === 'docs'" class="tab-content">
        <div class="tab-header">
          <h2>API 文档列表</h2>
          <button class="btn-create" @click="openCreate">+ 新建文档</button>
        </div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else class="doc-list">
          <div v-for="doc in docs" :key="doc.id" class="doc-item">
            <div class="doc-main">
              <span class="method-badge" :class="doc.method.toLowerCase()">{{ doc.method }}</span>
              <span class="doc-path">{{ doc.path }}</span>
              <span class="doc-name">{{ doc.name }}</span>
              <span class="doc-category">{{ doc.category }}</span>
            </div>
            <div class="doc-actions">
              <button class="btn-action edit" @click="openEdit(doc)">编辑</button>
              <button class="btn-action delete" @click="handleDelete(doc.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'password'" class="tab-content">
        <h2>修改密码</h2>
        <form class="password-form" @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label>原密码</label>
            <input v-model="oldPassword" type="password" class="form-input" />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="newPassword" type="password" class="form-input" />
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input v-model="confirmPassword" type="password" class="form-input" />
          </div>
          <div v-if="passwordError" class="error-msg">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="success-msg">{{ passwordSuccess }}</div>
          <button type="submit" class="btn-submit">修改密码</button>
        </form>
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
  width: 240px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  font-size: 18px;
  margin-bottom: 4px;
}

.user-info {
  font-size: 13px;
  color: #aaa;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
}

.nav-item {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #ccc;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  border-left: 3px solid #667eea;
}

.nav-item.monitor {
  color: #4caf50;
}

.nav-item.monitor:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #66bb6a;
}

.btn-logout {
  margin: 0 16px 16px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.15);
}

.admin-main {
  flex: 1;
  padding: 32px;
  background: #f5f7fa;
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tab-header h2 {
  font-size: 20px;
  margin: 0;
  color: #333;
}

.btn-create {
  padding: 8px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-create:hover {
  background: #5a6fd6;
}

.loading,
.error {
  padding: 40px;
  text-align: center;
  color: #888;
}

.error {
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
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: box-shadow 0.2s;
}

.doc-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.doc-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.method-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  min-width: 48px;
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
  font-family: monospace;
  font-size: 13px;
  color: #555;
}

.doc-name {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-category {
  font-size: 12px;
  color: #888;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  white-space: nowrap;
}

.doc-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-action.edit {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-action.delete {
  background: #ffebee;
  color: #c62828;
}

.password-form {
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.error-msg {
  color: #e53935;
  font-size: 13px;
}

.success-msg {
  color: #43a047;
  font-size: 13px;
}

.btn-submit {
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-submit:hover {
  background: #5a6fd6;
}
</style>
