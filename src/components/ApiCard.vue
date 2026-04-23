<script setup lang="ts">
import { ref } from 'vue'
import type { ApiEndpoint } from '@/types/api'
import MethodBadge from './MethodBadge.vue'
import ApiDetail from './ApiDetail.vue'
import ResponseModal from './ResponseModal.vue'

const props = defineProps<{
  api: ApiEndpoint
}>()

const showDetail = ref(false)
const showResponse = ref(false)

const toggleDetail = () => {
  showDetail.value = !showDetail.value
}

const openResponse = () => {
  showResponse.value = true
}

const closeResponse = () => {
  showResponse.value = false
}
</script>

<template>
  <div class="api-card">
    <div class="api-header" @click="toggleDetail">
      <div class="api-main">
        <MethodBadge :method="api.method" />
        <span class="api-path">{{ api.path }}</span>
        <span class="api-name">{{ api.name }}</span>
      </div>
      <div class="api-actions">
        <button class="btn-response" @click.stop="openResponse">
          查看返回信息
        </button>
        <span class="toggle-icon" :class="{ expanded: showDetail }">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>

    <div class="api-summary">
      <p class="api-description">{{ api.description }}</p>
      <div class="api-tags">
        <span v-for="tag in api.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>

    <transition name="slide">
      <ApiDetail v-if="showDetail" :api="api" />
    </transition>

    <ResponseModal v-if="showResponse" :api="api" @close="closeResponse" />
  </div>
</template>

<style scoped>
.api-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.api-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.api-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: #fafafa;
  border-bottom: 1px solid transparent;
  transition: background 0.2s;
}

.api-header:hover {
  background: #f0f0f0;
}

.api-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.api-path {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-name {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-response {
  padding: 6px 14px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-response:hover {
  background: #357abd;
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: transform 0.3s ease;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.api-summary {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.api-description {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

.api-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  border-radius: 4px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  opacity: 1;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .api-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .api-main {
    flex-wrap: wrap;
    width: 100%;
  }

  .api-actions {
    width: 100%;
    justify-content: space-between;
  }

  .api-name {
    display: none;
  }
}
</style>
