<script setup lang="ts">
import { ref } from 'vue'
import type { ApiEndpoint } from '@/types/api'

const props = defineProps<{
  api: ApiEndpoint
}>()

const emit = defineEmits<{
  close: []
}>()

const activeTab = ref<'schema' | 'examples'>('schema')
const selectedStatusCode = ref(props.api.responses[0]?.statusCode || 200)

const selectedResponse = props.api.responses.find(
  (r) => r.statusCode === selectedStatusCode.value,
) || props.api.responses[0]

const statusCodeClass = (code: number) => {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'redirect'
  if (code >= 400 && code < 500) return 'client-error'
  if (code >= 500) return 'server-error'
  return 'default'
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">
          <h2>返回信息</h2>
          <span class="api-path">{{ api.method }} {{ api.path }}</span>
        </div>
        <button class="btn-close" @click="emit('close')">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 状态码选择 -->
        <div class="status-tabs">
          <button
            v-for="response in api.responses"
            :key="response.statusCode"
            class="status-tab"
            :class="[
              statusCodeClass(response.statusCode),
              { active: selectedStatusCode === response.statusCode },
            ]"
            @click="selectedStatusCode = response.statusCode"
          >
            <span class="status-code">{{ response.statusCode }}</span>
            <span class="status-desc">{{ response.description }}</span>
          </button>
        </div>

        <!-- 内容标签 -->
        <div class="content-tabs">
          <button
            class="content-tab"
            :class="{ active: activeTab === 'schema' }"
            @click="activeTab = 'schema'"
          >
            响应结构
          </button>
          <button
            class="content-tab"
            :class="{ active: activeTab === 'examples' }"
            @click="activeTab = 'examples'"
          >
            响应示例
          </button>
        </div>

        <!-- 响应结构 -->
        <div v-if="activeTab === 'schema'" class="tab-content">
          <div v-if="selectedResponse?.schema && selectedResponse.schema.length > 0" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>类型</th>
                  <th>必填</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in selectedResponse.schema" :key="field.field">
                  <td class="field-name">{{ field.field }}</td>
                  <td><code>{{ field.type }}</code></td>
                  <td>
                    <span class="badge" :class="field.required ? 'required' : 'optional'">
                      {{ field.required ? '是' : '否' }}
                    </span>
                  </td>
                  <td>{{ field.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            该状态码无响应体结构定义
          </div>
        </div>

        <!-- 响应示例 -->
        <div v-if="activeTab === 'examples'" class="tab-content">
          <div v-if="selectedResponse?.examples && selectedResponse.examples.length > 0">
            <div
              v-for="(example, index) in selectedResponse.examples"
              :key="index"
              class="example-block"
            >
              <div class="example-meta">
                <span class="meta-label">Content-Type:</span>
                <code>{{ example.contentType }}</code>
              </div>
              <pre class="example-code"><code>{{ example.body || '(空响应体)' }}</code></pre>
            </div>
          </div>
          <div v-else class="empty-state">
            该状态码无响应示例
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-title h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.api-path {
  font-size: 13px;
  color: #888;
  font-family: 'SF Mono', Monaco, monospace;
}

.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.status-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.status-tab:hover {
  border-color: #bbb;
}

.status-tab.active {
  border-width: 2px;
  font-weight: 600;
}

.status-tab.active.success {
  border-color: #4caf50;
  background: #e8f5e9;
}

.status-tab.active.redirect {
  border-color: #ff9800;
  background: #fff3e0;
}

.status-tab.active.client-error {
  border-color: #f44336;
  background: #ffebee;
}

.status-tab.active.server-error {
  border-color: #9c27b0;
  background: #f3e5f5;
}

.status-code {
  font-weight: 700;
  font-family: 'SF Mono', Monaco, monospace;
}

.status-tab.success .status-code {
  color: #2e7d32;
}

.status-tab.redirect .status-code {
  color: #ef6c00;
}

.status-tab.client-error .status-code {
  color: #c62828;
}

.status-tab.server-error .status-code {
  color: #6a1b9a;
}

.status-desc {
  color: #666;
  font-size: 12px;
}

.content-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.content-tab {
  padding: 10px 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.content-tab:hover {
  color: #333;
}

.content-tab.active {
  color: #4a90d9;
  border-bottom-color: #4a90d9;
  font-weight: 600;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: #f8f9fa;
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #e8e8e8;
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
  vertical-align: top;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.field-name {
  font-weight: 600;
  color: #333;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge.required {
  background: #ffebee;
  color: #c62828;
}

.badge.optional {
  background: #e8f5e9;
  color: #2e7d32;
}

code {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 4px;
  color: #c62828;
}

.example-block {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.example-meta {
  padding: 10px 14px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.example-code {
  padding: 16px;
  margin: 0;
  background: #fafafa;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 14px;
  background: #fafafa;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-container {
    max-height: 90vh;
    border-radius: 12px;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .status-tabs {
    gap: 6px;
  }

  .status-tab {
    padding: 6px 10px;
    font-size: 12px;
  }

  .status-desc {
    display: none;
  }

  .data-table th,
  .data-table td {
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>
