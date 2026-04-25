<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiDocApi } from '@/api/client'
import ApiCard from '@/components/ApiCard.vue'
import type { ApiEndpoint } from '@/types/api'

const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedMethod = ref('全部')
const apiEndpoints = ref<ApiEndpoint[]>([])
const loading = ref(false)

const methods = ['全部', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']

onMounted(async () => {
  await loadApiDocs()
})

async function loadApiDocs() {
  loading.value = true
  try {
    const data = await apiDocApi.list()
    apiEndpoints.value = data.map((item) => ({
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
  } catch (e) {
    console.error('加载API文档失败', e)
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

const categories = computed(() => {
  const cats = [...new Set(apiEndpoints.value.map((api) => api.category))]
  return cats
})

const filteredApis = computed(() => {
  return apiEndpoints.value.filter((api) => {
    const matchCategory =
      selectedCategory.value === '全部' || api.category === selectedCategory.value
    const matchMethod = selectedMethod.value === '全部' || api.method === selectedMethod.value
    const matchSearch =
      searchQuery.value === '' ||
      api.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      api.path.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      api.tags.some((tag) => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))

    return matchCategory && matchMethod && matchSearch
  })
})

const groupedApis = computed(() => {
  const groups: Record<string, ApiEndpoint[]> = {}
  filteredApis.value.forEach((api) => {
    const category = api.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(api)
  })
  return groups
})

const stats = computed(() => {
  const total = apiEndpoints.value.length
  const categories = new Set(apiEndpoints.value.map((a) => a.category)).size
  const methods = new Set(apiEndpoints.value.map((a) => a.method)).size
  return { total, categories, methods }
})
</script>

<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">API 接口文档</h1>
        <p class="hero-subtitle">完整的接口参考与使用指南，助力开发效率提升</p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">接口总数</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.categories }}</span>
            <span class="stat-label">分类模块</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.methods }}</span>
            <span class="stat-label">请求方法</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <div class="filters">
      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M15.75 15.75L12.4875 12.4875"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索接口名称、路径、描述或标签..."
          class="search-input"
        />
      </div>

      <div class="filter-groups">
        <div class="filter-group">
          <label>分类筛选</label>
          <div class="filter-chips">
            <button
              class="chip"
              :class="{ active: selectedCategory === '全部' }"
              @click="selectedCategory = '全部'"
            >
              全部
            </button>
            <button
              v-for="cat in categories"
              :key="cat"
              class="chip"
              :class="{ active: selectedCategory === cat }"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>HTTP 方法</label>
          <div class="filter-chips">
            <button
              v-for="method in methods"
              :key="method"
              class="chip"
              :class="{ active: selectedMethod === method }"
              @click="selectedMethod = method"
            >
              {{ method }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="results-bar">
      <span class="results-count">
        共 <strong>{{ filteredApis.length }}</strong> 个接口
      </span>
      <span v-if="loading" class="loading-indicator">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        加载中
      </span>
    </div>

    <div class="api-list">
      <template v-if="Object.keys(groupedApis).length > 0">
        <div v-for="(apis, category) in groupedApis" :key="category" class="category-section">
          <div class="category-header">
            <h2 class="category-title">{{ category }}</h2>
            <span class="category-count">{{ apis.length }} 个接口</span>
          </div>
          <div class="category-cards">
            <ApiCard v-for="api in apis" :key="api.id" :api="api" />
          </div>
        </div>
      </template>
      <div v-else-if="loading" class="empty-state">
        <div class="empty-spinner"></div>
        <p>正在加载 API 文档...</p>
      </div>
      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" class="empty-icon">
          <circle cx="28" cy="28" r="18" stroke="currentColor" stroke-width="2" />
          <path d="M40 40L56 56" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p class="empty-title">未找到匹配的接口</p>
        <p class="empty-desc">尝试调整搜索关键词或筛选条件</p>
        <button
          class="btn-reset"
          @click="
            () => {
              searchQuery = ''
              selectedCategory = '全部'
              selectedMethod = '全部'
            }
          "
        >
          重置筛选条件
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

/* Hero */
.hero {
  padding: 48px 0 32px;
  text-align: center;
}

.hero-title {
  font-size: 40px;
  font-weight: 800;
  color: var(--gray-900);
  margin-bottom: 12px;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 16px;
  color: var(--gray-500);
  margin-bottom: 32px;
}

.hero-stats {
  display: inline-flex;
  align-items: center;
  gap: 24px;
  padding: 16px 32px;
  background: #ffffff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--gray-200);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--primary-600);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--gray-500);
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--gray-200);
}

/* Filters */
.filters {
  background: #ffffff;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 15px;
  color: var(--gray-800);
  background: var(--gray-50);
  transition: all var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-400);
  background: #ffffff;
  box-shadow: 0 0 0 4px var(--primary-100);
}

.search-input::placeholder {
  color: var(--gray-400);
}

.filter-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  display: block;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 8px 16px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-full);
  background: #ffffff;
  color: var(--gray-600);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chip:hover {
  border-color: var(--gray-300);
  background: var(--gray-50);
}

.chip.active {
  background: var(--primary-600);
  color: #ffffff;
  border-color: var(--primary-600);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

/* Results Bar */
.results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.results-count {
  font-size: 14px;
  color: var(--gray-600);
}

.results-count strong {
  color: var(--primary-600);
  font-weight: 700;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--primary-600);
}

.loading-dot {
  width: 6px;
  height: 6px;
  background: var(--primary-600);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Category Section */
.category-section {
  margin-bottom: 32px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.category-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-800);
}

.category-count {
  font-size: 13px;
  color: var(--gray-400);
  font-weight: 500;
  padding: 2px 10px;
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--gray-400);
}

.empty-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

.empty-icon {
  color: var(--gray-300);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--gray-500);
  margin-bottom: 24px;
}

.btn-reset {
  padding: 10px 24px;
  background: var(--primary-600);
  color: #ffffff;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.btn-reset:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .home-view {
    padding: 0 16px 32px;
  }

  .hero {
    padding: 32px 0 24px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-stats {
    gap: 16px;
    padding: 12px 20px;
  }

  .stat-value {
    font-size: 22px;
  }

  .filters {
    padding: 16px;
  }

  .chip {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>
