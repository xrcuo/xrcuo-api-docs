<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { monitorApi, type SystemMetrics } from '@/api/client'
import Chart from 'chart.js/auto'

const router = useRouter()
const authStore = useAuthStore()

const currentMetrics = ref<SystemMetrics | null>(null)
const historyData = ref<SystemMetrics[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdate = ref('')

const cpuThreshold = ref(80)
const memThreshold = ref(85)
const netThreshold = ref(100)

let refreshTimer: ReturnType<typeof setInterval> | null = null

let cpuChart: Chart | null = null
let memChart: Chart | null = null
let netChart: Chart | null = null

const cpuAlert = computed(() => {
  if (!currentMetrics.value) return false
  return currentMetrics.value.cpu.total_percent > cpuThreshold.value
})

const memAlert = computed(() => {
  if (!currentMetrics.value) return false
  return currentMetrics.value.memory.used_percent > memThreshold.value
})

const netAlert = computed(() => {
  if (!currentMetrics.value) return false
  const total = currentMetrics.value.network.upload_speed + currentMetrics.value.network.download_speed
  return total > netThreshold.value
})

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSec: number) => {
  return (bytesPerSec / 1024 / 1024).toFixed(2) + ' MB/s'
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('zh-CN')
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await loadData()
  refreshTimer = setInterval(loadData, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  destroyCharts()
})

function destroyCharts() {
  cpuChart?.destroy()
  memChart?.destroy()
  netChart?.destroy()
  cpuChart = null
  memChart = null
  netChart = null
}

async function loadData() {
  try {
    loading.value = true
    error.value = ''
    const [current, history] = await Promise.all([
      monitorApi.getCurrent(),
      monitorApi.getHistory(),
    ])
    currentMetrics.value = current
    historyData.value = history
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
    updateCharts()
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

function updateCharts() {
  if (!historyData.value.length) return

  const labels = historyData.value.map((m) => formatTime(m.timestamp))
  const cpuData = historyData.value.map((m) => m.cpu.total_percent)
  const memData = historyData.value.map((m) => m.memory.used_percent)
  const uploadData = historyData.value.map((m) => m.network.upload_speed / 1024 / 1024)
  const downloadData = historyData.value.map((m) => m.network.download_speed / 1024 / 1024)

  initCpuChart(labels, cpuData)
  initMemChart(labels, memData)
  initNetChart(labels, uploadData, downloadData)
}

function initCpuChart(labels: string[], data: number[]) {
  const ctx = document.getElementById('cpuChart') as HTMLCanvasElement
  if (!ctx) return
  if (cpuChart) {
    cpuChart.data.labels = labels
    const dataset = cpuChart.data.datasets[0]
    if (dataset) dataset.data = data
    cpuChart.update('none')
    return
  }
  cpuChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'CPU使用率 (%)',
          data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  })
}

function initMemChart(labels: string[], data: number[]) {
  const ctx = document.getElementById('memChart') as HTMLCanvasElement
  if (!ctx) return
  if (memChart) {
    memChart.data.labels = labels
    const dataset = memChart.data.datasets[0]
    if (dataset) dataset.data = data
    memChart.update('none')
    return
  }
  memChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '内存使用率 (%)',
          data,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  })
}

function initNetChart(labels: string[], upload: number[], download: number[]) {
  const ctx = document.getElementById('netChart') as HTMLCanvasElement
  if (!ctx) return
  if (netChart) {
    netChart.data.labels = labels
    const ds0 = netChart.data.datasets[0]
    const ds1 = netChart.data.datasets[1]
    if (ds0) ds0.data = upload
    if (ds1) ds1.data = download
    netChart.update('none')
    return
  }
  netChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '上行 (MB/s)',
          data: upload,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: '下行 (MB/s)',
          data: download,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, font: { size: 11 } },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  })
}
</script>

<template>
  <div class="monitor-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统资源监控</h1>
        <p class="page-desc">实时监控系统资源使用情况</p>
      </div>
      <div class="header-meta">
        <span v-if="lastUpdate" class="meta-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          最后更新: {{ lastUpdate }}
        </span>
        <span v-if="loading" class="meta-loading">更新中...</span>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="metrics-grid">
      <!-- CPU Card -->
      <div class="metric-card" :class="{ 'card-alert': cpuAlert }">
        <div class="card-header">
          <div class="card-icon cpu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <rect x="9" y="9" width="6" height="6"/>
              <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
            </svg>
          </div>
          <div class="card-info">
            <h3>CPU 使用率</h3>
            <span v-if="cpuAlert" class="alert-label">告警</span>
          </div>
        </div>
        <div class="metric-value">
          <span class="value">{{ currentMetrics?.cpu.total_percent.toFixed(1) ?? '--' }}</span>
          <span class="unit">%</span>
        </div>
        <div class="metric-bar">
          <div
            class="bar-fill"
            :style="{
              width: (currentMetrics?.cpu.total_percent ?? 0) + '%',
              background: cpuAlert ? 'var(--error-500)' : 'var(--primary-500)',
            }"
          ></div>
        </div>
        <div class="metric-detail">
          <span>{{ currentMetrics?.cpu.core_count ?? '--' }} 核心</span>
        </div>
        <div class="chart-wrap">
          <canvas id="cpuChart"></canvas>
        </div>
      </div>

      <!-- Memory Card -->
      <div class="metric-card" :class="{ 'card-alert': memAlert }">
        <div class="card-header">
          <div class="card-icon memory">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12h20M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/>
            </svg>
          </div>
          <div class="card-info">
            <h3>内存占用</h3>
            <span v-if="memAlert" class="alert-label">告警</span>
          </div>
        </div>
        <div class="metric-value">
          <span class="value">{{ currentMetrics?.memory.used_percent.toFixed(1) ?? '--' }}</span>
          <span class="unit">%</span>
        </div>
        <div class="metric-bar">
          <div
            class="bar-fill"
            :style="{
              width: (currentMetrics?.memory.used_percent ?? 0) + '%',
              background: memAlert ? 'var(--error-500)' : 'var(--success-500)',
            }"
          ></div>
        </div>
        <div class="metric-detail memory-detail">
          <span>已用 {{ formatBytes(currentMetrics?.memory.used ?? 0) }}</span>
          <span>总共 {{ formatBytes(currentMetrics?.memory.total ?? 0) }}</span>
        </div>
        <div class="chart-wrap">
          <canvas id="memChart"></canvas>
        </div>
      </div>

      <!-- Network Card -->
      <div class="metric-card" :class="{ 'card-alert': netAlert }">
        <div class="card-header">
          <div class="card-icon network">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          </div>
          <div class="card-info">
            <h3>网络流量</h3>
            <span v-if="netAlert" class="alert-label">告警</span>
          </div>
        </div>
        <div class="net-stats">
          <div class="net-stat">
            <span class="net-label">上行</span>
            <span class="net-value">{{ formatSpeed(currentMetrics?.network.upload_speed ?? 0) }}</span>
          </div>
          <div class="net-stat">
            <span class="net-label">下行</span>
            <span class="net-value">{{ formatSpeed(currentMetrics?.network.download_speed ?? 0) }}</span>
          </div>
        </div>
        <div class="metric-detail">
          <span>发送 {{ formatBytes(currentMetrics?.network.total_sent ?? 0) }}</span>
          <span>接收 {{ formatBytes(currentMetrics?.network.total_recv ?? 0) }}</span>
        </div>
        <div class="chart-wrap">
          <canvas id="netChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Threshold Panel -->
    <div class="threshold-card">
      <h3 class="threshold-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        告警阈值设置
      </h3>
      <div class="threshold-grid">
        <div class="threshold-field">
          <label>CPU 阈值 (%)</label>
          <input v-model.number="cpuThreshold" type="number" min="1" max="100" />
        </div>
        <div class="threshold-field">
          <label>内存 阈值 (%)</label>
          <input v-model.number="memThreshold" type="number" min="1" max="100" />
        </div>
        <div class="threshold-field">
          <label>网络 阈值 (MB/s)</label>
          <input v-model.number="netThreshold" type="number" min="1" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-page {
  padding: 32px;
  background: var(--gray-50);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 4px;
  letter-spacing: -0.025em;
}

.page-desc {
  font-size: 14px;
  color: var(--gray-500);
  margin: 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gray-500);
}

.meta-loading {
  font-size: 13px;
  color: var(--primary-600);
  font-weight: 500;
}

.alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.alert-error {
  color: var(--error-600);
  background: var(--error-50);
  border: 1px solid var(--error-100);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition);
}

.metric-card:hover {
  box-shadow: var(--shadow-md);
}

.metric-card.card-alert {
  border-color: var(--error-200);
  box-shadow: 0 0 0 1px var(--error-200), var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  color: #ffffff;
}

.card-icon svg {
  width: 20px;
  height: 20px;
}

.card-icon.cpu {
  background: var(--primary-500);
}

.card-icon.memory {
  background: var(--success-500);
}

.card-icon.network {
  background: var(--warning-500);
}

.card-info {
  flex: 1;
}

.card-info h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-700);
  margin: 0;
}

.alert-label {
  display: inline-block;
  padding: 2px 8px;
  background: var(--error-500);
  color: #ffffff;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.metric-value .value {
  font-size: 36px;
  font-weight: 800;
  color: var(--gray-900);
  line-height: 1;
  letter-spacing: -0.025em;
}

.metric-value .unit {
  font-size: 16px;
  color: var(--gray-400);
  font-weight: 500;
}

.metric-bar {
  height: 6px;
  background: var(--gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 12px;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease, background 0.3s ease;
}

.metric-detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 16px;
}

.memory-detail {
  gap: 16px;
}

.net-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.net-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.net-label {
  font-size: 12px;
  color: var(--gray-400);
  font-weight: 500;
}

.net-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-800);
}

.chart-wrap {
  height: 140px;
  position: relative;
}

/* Threshold Card */
.threshold-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}

.threshold-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.threshold-title svg {
  color: var(--warning-500);
}

.threshold-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.threshold-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.threshold-field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-600);
}

.threshold-field input {
  padding: 10px 14px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius);
  font-size: 14px;
  color: var(--gray-800);
  background: var(--gray-50);
  transition: all var(--transition-fast);
  width: 100%;
  box-sizing: border-box;
}

.threshold-field input:focus {
  outline: none;
  border-color: var(--primary-400);
  background: #ffffff;
  box-shadow: 0 0 0 3px var(--primary-100);
}

@media (max-width: 768px) {
  .monitor-page {
    padding: 16px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .net-stats {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
