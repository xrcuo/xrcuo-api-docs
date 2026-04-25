<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ApiDocForm } from '@/types/api'

const props = defineProps<{
  modelValue: ApiDocForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ApiDocForm]
  submit: []
  cancel: []
}>()

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const activeSection = ref<'basic' | 'params' | 'headers' | 'body' | 'responses'>('basic')

function addParameter() {
  form.value.parameters.push({
    name: '',
    type: 'string',
    required: true,
    description: '',
    example: '',
  })
}

function removeParameter(index: number) {
  form.value.parameters.splice(index, 1)
}

function addHeader() {
  form.value.headers.push({ name: '', required: false, description: '', example: '' })
}

function removeHeader(index: number) {
  form.value.headers.splice(index, 1)
}

function addResponse() {
  form.value.responses.push({
    statusCode: 200,
    description: '',
    schema: [],
    examples: [],
  })
}

function removeResponse(index: number) {
  form.value.responses.splice(index, 1)
}

function addResponseSchema(respIndex: number) {
  const resp = form.value.responses[respIndex]
  if (!resp) return
  resp.schema = resp.schema || []
  resp.schema.push({
    field: '',
    type: 'string',
    description: '',
    required: true,
  })
}

function removeResponseSchema(respIndex: number, schemaIndex: number) {
  const resp = form.value.responses[respIndex]
  if (!resp) return
  if (resp.schema) {
    resp.schema.splice(schemaIndex, 1)
  }
}

function addResponseExample(respIndex: number) {
  const resp = form.value.responses[respIndex]
  if (!resp) return
  resp.examples.push({
    statusCode: 200,
    description: '',
    contentType: 'application/json',
    body: '',
  })
}

function removeResponseExample(respIndex: number, exIndex: number) {
  const resp = form.value.responses[respIndex]
  if (!resp) return
  resp.examples.splice(exIndex, 1)
}

function addTag() {
  const tag = prompt('输入标签名称')
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
}

function removeTag(index: number) {
  form.value.tags.splice(index, 1)
}
</script>

<template>
  <div class="editor-overlay" @click.self="emit('cancel')">
    <div class="editor-container">
      <div class="editor-header">
        <h3>{{ form.id ? '编辑 API 文档' : '创建 API 文档' }}</h3>
        <button class="btn-close" @click="emit('cancel')">&times;</button>
      </div>

      <div class="editor-nav">
        <button
          v-for="section in ['basic', 'params', 'headers', 'body', 'responses'] as const"
          :key="section"
          class="nav-btn"
          :class="{ active: activeSection === section }"
          @click="activeSection = section"
        >
          {{
            {
              basic: '基本信息',
              params: '请求参数',
              headers: '请求头',
              body: '请求体',
              responses: '响应',
            }[section]
          }}
        </button>
      </div>

      <div class="editor-body">
        <!-- 基本信息 -->
        <div v-if="activeSection === 'basic'" class="section">
          <div class="form-row">
            <div class="form-group">
              <label>接口名称 <span class="required">*</span></label>
              <input v-model="form.name" class="form-input" placeholder="例如：获取用户信息" />
            </div>
            <div class="form-group">
              <label>请求方法 <span class="required">*</span></label>
              <select v-model="form.method" class="form-input">
                <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>接口路径 <span class="required">*</span></label>
            <input v-model="form.path" class="form-input" placeholder="例如：/api/v1/users" />
          </div>

          <div class="form-group">
            <label>分类</label>
            <input v-model="form.category" class="form-input" placeholder="例如：用户管理" />
          </div>

          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="form.description"
              class="form-input"
              rows="3"
              placeholder="接口功能描述..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>标签</label>
            <div class="tags-input">
              <span v-for="(tag, i) in form.tags" :key="i" class="tag">
                {{ tag }}
                <button class="tag-remove" @click="removeTag(i)">&times;</button>
              </span>
              <button class="btn-add-tag" @click="addTag">+ 添加标签</button>
            </div>
          </div>
        </div>

        <!-- 请求参数 -->
        <div v-if="activeSection === 'params'" class="section">
          <div class="section-header">
            <h4>请求参数</h4>
            <button class="btn-add" @click="addParameter">+ 添加参数</button>
          </div>
          <div v-for="(param, i) in form.parameters" :key="i" class="item-row">
            <input v-model="param.name" class="form-input small" placeholder="参数名" />
            <select v-model="param.type" class="form-input small">
              <option>string</option>
              <option>integer</option>
              <option>boolean</option>
              <option>number</option>
              <option>array</option>
              <option>object</option>
              <option>file</option>
            </select>
            <select v-model="param.required" class="form-input small">
              <option :value="true">必填</option>
              <option :value="false">可选</option>
            </select>
            <input v-model="param.description" class="form-input flex-1" placeholder="说明" />
            <input v-model="param.example" class="form-input small" placeholder="示例" />
            <button class="btn-remove" @click="removeParameter(i)">&times;</button>
          </div>
          <div v-if="form.parameters.length === 0" class="empty-hint">暂无参数</div>
        </div>

        <!-- 请求头 -->
        <div v-if="activeSection === 'headers'" class="section">
          <div class="section-header">
            <h4>请求头</h4>
            <button class="btn-add" @click="addHeader">+ 添加请求头</button>
          </div>
          <div v-for="(header, i) in form.headers" :key="i" class="item-row">
            <input v-model="header.name" class="form-input small" placeholder="Header 名称" />
            <select v-model="header.required" class="form-input small">
              <option :value="true">必填</option>
              <option :value="false">可选</option>
            </select>
            <input v-model="header.description" class="form-input flex-1" placeholder="说明" />
            <input v-model="header.example" class="form-input small" placeholder="示例" />
            <button class="btn-remove" @click="removeHeader(i)">&times;</button>
          </div>
          <div v-if="form.headers.length === 0" class="empty-hint">暂无请求头</div>
        </div>

        <!-- 请求体 -->
        <div v-if="activeSection === 'body'" class="section">
          <div class="form-group">
            <label>Content-Type</label>
            <input
              v-model="form.requestBody!.contentType"
              class="form-input"
              placeholder="application/json"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <input
              v-model="form.requestBody!.description"
              class="form-input"
              placeholder="请求体描述"
            />
          </div>
          <div class="form-group">
            <label>请求示例</label>
            <textarea
              v-model="form.requestBody!.example"
              class="form-input code"
              rows="6"
              placeholder="JSON 示例..."
            ></textarea>
          </div>
        </div>

        <!-- 响应 -->
        <div v-if="activeSection === 'responses'" class="section">
          <div class="section-header">
            <h4>响应定义</h4>
            <button class="btn-add" @click="addResponse">+ 添加响应</button>
          </div>
          <div v-for="(resp, ri) in form.responses" :key="ri" class="response-card">
            <div class="response-header">
              <input
                v-model.number="resp.statusCode"
                class="form-input tiny"
                placeholder="状态码"
              />
              <input v-model="resp.description" class="form-input flex-1" placeholder="描述" />
              <button class="btn-remove" @click="removeResponse(ri)">&times;</button>
            </div>

            <div class="response-section">
              <h5>响应结构</h5>
              <button class="btn-add small" @click="addResponseSchema(ri)">+ 添加字段</button>
              <div v-for="(schema, si) in resp.schema" :key="si" class="item-row">
                <input v-model="schema.field" class="form-input small" placeholder="字段名" />
                <select v-model="schema.type" class="form-input small">
                  <option>string</option>
                  <option>number</option>
                  <option>boolean</option>
                  <option>object</option>
                  <option>array</option>
                </select>
                <select v-model="schema.required" class="form-input small">
                  <option :value="true">必填</option>
                  <option :value="false">可选</option>
                </select>
                <input v-model="schema.description" class="form-input flex-1" placeholder="说明" />
                <button class="btn-remove" @click="removeResponseSchema(ri, si)">&times;</button>
              </div>
            </div>

            <div class="response-section">
              <h5>响应示例</h5>
              <button class="btn-add small" @click="addResponseExample(ri)">+ 添加示例</button>
              <div v-for="(ex, ei) in resp.examples" :key="ei" class="example-card">
                <div class="example-header">
                  <input
                    v-model="ex.statusCode"
                    class="form-input tiny"
                    placeholder="状态码"
                    disabled
                  />
                  <input v-model="ex.description" class="form-input small" placeholder="描述" />
                  <input
                    v-model="ex.contentType"
                    class="form-input small"
                    placeholder="Content-Type"
                  />
                  <button class="btn-remove" @click="removeResponseExample(ri, ei)">&times;</button>
                </div>
                <textarea
                  v-model="ex.body"
                  class="form-input code"
                  rows="4"
                  placeholder="响应体 JSON..."
                ></textarea>
              </div>
            </div>
          </div>
          <div v-if="form.responses.length === 0" class="empty-hint">暂无响应定义</div>
        </div>
      </div>

      <div class="editor-footer">
        <button class="btn-cancel" @click="emit('cancel')">取消</button>
        <button class="btn-submit" @click="emit('submit')">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-overlay {
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
}

.editor-container {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.editor-header h3 {
  font-size: 18px;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  color: #666;
}

.editor-nav {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.nav-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f0f0f0;
}

.nav-btn.active {
  background: #667eea;
  color: #fff;
}

.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.required {
  color: #e53935;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.small {
  width: 120px;
  min-width: 120px;
}

.form-input.tiny {
  width: 80px;
  min-width: 80px;
}

.form-input.flex-1 {
  flex: 1;
  min-width: 150px;
}

.form-input.code {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header h4 {
  font-size: 15px;
  margin: 0;
}

.btn-add {
  padding: 6px 12px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-add.small {
  padding: 4px 8px;
  font-size: 11px;
}

.item-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.empty-hint {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 13px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 12px;
}

.tag-remove {
  border: none;
  background: transparent;
  color: #1976d2;
  cursor: pointer;
  font-size: 14px;
}

.btn-add-tag {
  padding: 4px 10px;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
}

.response-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.response-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.response-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-section h5 {
  font-size: 13px;
  margin: 0;
  color: #555;
}

.example-card {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

.btn-submit {
  padding: 10px 24px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-submit:hover {
  background: #5a6fd6;
}
</style>
