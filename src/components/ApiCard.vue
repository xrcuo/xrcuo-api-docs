<script setup lang="ts">
import { ref } from 'vue'
import type { ApiEndpoint } from '@/types/api'
import MethodBadge from './MethodBadge.vue'
import ApiDetail from './ApiDetail.vue'
import ResponseModal from './ResponseModal.vue'

defineProps<{
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          响应
        </button>
        <span class="toggle-icon" :class="{ expanded: showDetail }">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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

    <transition name="expand">
      <ApiDetail v-if="showDetail" :api="api" />
    </transition>

    <ResponseModal v-if="showResponse" :api="api" @close="closeResponse" />
  </div>
</template>

<style scoped>
.api-card {
  background: #ffffff;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  overflow: hidden;
  transition: all var(--transition);
}

.api-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--gray-300);
}

.api-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: var(--gray-50);
  border-bottom: 1px solid transparent;
  transition: background var(--transition-fast);
}

.api-header:hover {
  background: var(--gray-100);
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
  font-size: 13px;
  color: var(--gray-700);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-name {
  font-size: 13px;
  color: var(--gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-response {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--primary-50);
  color: var(--primary-600);
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-response:hover {
  background: var(--primary-100);
  border-color: var(--primary-300);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--gray-400);
  transition: transform var(--transition-slow);
  border-radius: var(--radius-sm);
}

.toggle-icon:hover {
  background: var(--gray-200);
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.api-summary {
  padding: 12px 20px;
  border-bottom: 1px solid var(--gray-100);
}

.api-description {
  font-size: 13px;
  color: var(--gray-600);
  line-height: 1.6;
  margin-bottom: 8px;
}

.api-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-sm);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  opacity: 1;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
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
