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
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  min-width: 56px;
  text-transform: uppercase;
}

.get {
  background-color: #e3f2fd;
  color: #1976d2;
}

.post {
  background-color: #e8f5e9;
  color: #388e3c;
}

.put {
  background-color: #fff3e0;
  color: #f57c00;
}

.delete {
  background-color: #ffebee;
  color: #d32f2f;
}

.patch {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.default {
  background-color: #f5f5f5;
  color: #616161;
}
</style>
