<script setup lang="ts">
import type { ApiEndpoint } from '@/types/api'

const props = defineProps<{
  api: ApiEndpoint
}>()

const hasParameters = props.api.parameters && props.api.parameters.length > 0
const hasHeaders = props.api.headers && props.api.headers.length > 0
const hasRequestBody = props.api.requestBody && props.api.requestBody.schema.length > 0
</script>

<template>
  <div class="api-detail">
    <!-- 请求参数 -->
    <section v-if="hasParameters" class="detail-section">
      <h3 class="section-title">
        <span class="section-icon">🔧</span>
        请求参数
      </h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>参数名</th>
              <th>类型</th>
              <th>必填</th>
              <th>说明</th>
              <th>示例</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in api.parameters" :key="param.name">
              <td class="param-name">{{ param.name }}</td>
              <td><code>{{ param.type }}</code></td>
              <td>
                <span class="badge" :class="param.required ? 'required' : 'optional'">
                  {{ param.required ? '是' : '否' }}
                </span>
              </td>
              <td>{{ param.description }}</td>
              <td><code class="example">{{ param.example || param.defaultValue || '-' }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 请求头 -->
    <section v-if="hasHeaders" class="detail-section">
      <h3 class="section-title">
        <span class="section-icon">📋</span>
        请求头
      </h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Header</th>
              <th>必填</th>
              <th>说明</th>
              <th>示例</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="header in api.headers" :key="header.name">
              <td class="param-name">{{ header.name }}</td>
              <td>
                <span class="badge" :class="header.required ? 'required' : 'optional'">
                  {{ header.required ? '是' : '否' }}
                </span>
              </td>
              <td>{{ header.description }}</td>
              <td><code class="example">{{ header.example || '-' }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 请求体 -->
    <section v-if="hasRequestBody" class="detail-section">
      <h3 class="section-title">
        <span class="section-icon">📦</span>
        请求体
      </h3>
      <div class="request-body-info">
        <div class="content-type">
          <span class="label">Content-Type:</span>
          <code>{{ api.requestBody!.contentType }}</code>
        </div>
        <p class="body-description">{{ api.requestBody!.description }}</p>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>字段</th>
              <th>类型</th>
              <th>必填</th>
              <th>说明</th>
              <th>示例</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="field in api.requestBody!.schema" :key="field.name">
              <td class="param-name">{{ field.name }}</td>
              <td><code>{{ field.type }}</code></td>
              <td>
                <span class="badge" :class="field.required ? 'required' : 'optional'">
                  {{ field.required ? '是' : '否' }}
                </span>
              </td>
              <td>{{ field.description }}</td>
              <td><code class="example">{{ field.example || field.defaultValue || '-' }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="example-block">
        <div class="example-header">请求示例</div>
        <pre class="example-code"><code>{{ api.requestBody!.example }}</code></pre>
      </div>
    </section>

    <!-- 无详情提示 -->
    <div v-if="!hasParameters && !hasHeaders && !hasRequestBody" class="empty-detail">
      该接口无需额外参数
    </div>
  </div>
</template>

<style scoped>
.api-detail {
  padding: 20px;
  background: #ffffff;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-icon {
  font-size: 16px;
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
  white-space: nowrap;
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

.param-name {
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

code.example {
  color: #1565c0;
  background: #e3f2fd;
  word-break: break-all;
  white-space: pre-wrap;
}

.request-body-info {
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.content-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.body-description {
  font-size: 13px;
  color: #666;
}

.example-block {
  margin-top: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.example-header {
  padding: 8px 14px;
  background: #f8f9fa;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #e8e8e8;
}

.example-code {
  padding: 14px;
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

.empty-detail {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

@media (max-width: 768px) {
  .api-detail {
    padding: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>
