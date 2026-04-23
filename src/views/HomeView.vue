<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiEndpoints, categories } from '@/data/apiData'
import ApiCard from '@/components/ApiCard.vue'

const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedMethod = ref('全部')

const methods = ['全部', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const filteredApis = computed(() => {
  return apiEndpoints.filter((api) => {
    const matchCategory = selectedCategory.value === '全部' || api.category === selectedCategory.value
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
  const groups: Record<string, typeof apiEndpoints> = {}
  filteredApis.value.forEach((api) => {
    if (!groups[api.category]) {
      groups[api.category] = []
    }
    groups[api.category].push(api)
  })
  return groups
})
</script>

<template>
  <div class="home-view">
    <header class="page-header">
      <h1 class="page-title">API 接口文档</h1>
      <p class="page-subtitle">完整的接口参考与使用指南</p>
    </header>

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

      <div class="filter-row">
        <div class="filter-group">
          <label>分类</label>
          <div class="filter-options">
            <button
              v-for="cat in ['全部', ...categories]"
              :key="cat"
              class="filter-btn"
              :class="{ active: selectedCategory === cat }"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>方法</label>
          <div class="filter-options">
            <button
              v-for="method in methods"
              :key="method"
              class="filter-btn"
              :class="{ active: selectedMethod === method }"
              @click="selectedMethod = method"
            >
              {{ method }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="results-info">
      共 <strong>{{ filteredApis.length }}</strong> 个接口
    </div>

    <div class="api-list">
      <template v-if="Object.keys(groupedApis).length > 0">
        <div v-for="(apis, category) in groupedApis" :key="category" class="category-group">
          <h2 class="category-title">{{ category }}</h2>
          <ApiCard v-for="api in apis" :key="api.id" :api="api" />
        </div>
      </template>
      <div v-else class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>未找到匹配的接口</p>
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
  padding: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #888;
}

.filters {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  background: #fafafa;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4a90d9;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
}

.search-input::placeholder {
  color: #aaa;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #ffffff;
  color: #555;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #bbb;
  background: #f8f8f8;
}

.filter-btn.active {
  background: #4a90d9;
  color: #ffffff;
  border-color: #4a90d9;
}

.results-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.results-info strong {
  color: #4a90d9;
}

.category-group {
  margin-bottom: 24px;
}

.category-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-left: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 16px;
}

.btn-reset {
  padding: 8px 20px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-reset:hover {
  background: #357abd;
}

@media (max-width: 768px) {
  .home-view {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .filters {
    padding: 16px;
  }

  .filter-options {
    gap: 6px;
  }

  .filter-btn {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>
