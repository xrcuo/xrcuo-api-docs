<script setup lang="ts">
const props = defineProps<{
  method: string
}>()

const methodColors: Record<string, string> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
  PATCH: 'patch',
}

const colorClass = methodColors[props.method] || 'default'
</script>

<template>
  <span class="method-badge" :class="colorClass">
    {{ method }}
  </span>
</template>

<style scoped>
.method-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  min-width: 52px;
  text-transform: uppercase;
  font-family: 'SF Mono', Monaco, monospace;
}

.get {
  background-color: var(--method-get-bg);
  color: var(--method-get);
}

.post {
  background-color: var(--method-post-bg);
  color: var(--method-post);
}

.put {
  background-color: var(--method-put-bg);
  color: var(--method-put);
}

.delete {
  background-color: var(--method-delete-bg);
  color: var(--method-delete);
}

.patch {
  background-color: var(--method-patch-bg);
  color: var(--method-patch);
}

.default {
  background-color: var(--gray-100);
  color: var(--gray-500);
}
</style>
