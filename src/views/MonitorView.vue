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
    cpuChart.data.datasets[0].data = data
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
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
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
    memChart.data.datasets[0].data = data
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
          borderColor: '#43a047',
          backgroundColor: 'rgba(67, 160, 71, 0.1)',
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
    netChart.data.datasets[0].data = upload
    netChart.data.datasets[1].data = download
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
          borderColor: '#f57c00',
          backgroundColor: 'rgba(245, 124, 0, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: '下行 (MB/s)',
          data: download,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
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
    <div class="monitor-header">
      <h1>系统资源监控</h1>
      <div class="header-info">
        <span v-if="lastUpdate" class="update-time">最后更新: {{ lastUpdate }}</span>
        <span v-if="loading" class="loading-indicator">更新中...</span>
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div class="metrics-grid">
      <div class="metric-card" :class="{ alert: cpuAlert }">
        <div class="metric-header">
          <h3>CPU 使用率</h3>
          <span v-if="cpuAlert" class="alert-badge">告警</span>
        </div>
        <div class="metric-value">
          <span class="value">{{ currentMetrics?.cpu.total_percent.toFixed(1) ?? '--' }}</span>
          <span class="unit">%</span>
        </div>
        <div class="metric-detail">
          <div class="cores-info">
            <span>核心数: {{ currentMetrics?.cpu.core_count ?? '--' }}</span>
          </div>
          <div class="cores-grid">
            <div
              v-for="(percent, index) in currentMetrics?.cpu.core_percents ?? []"
              :key="index"
              class="core-bar"
            >
              <div class="core-label">{{ index + 1 }}</div>
              <div class="core-progress">
                <div
                  class="core-fill"
                  :style="{ width: percent + '%', background: percent > cpuThreshold ? '#e53935' : '#667eea' }"
                ></div>
              </div>
              <div class="core-percent">{{ percent.toFixed(0) }}%</div>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="cpuChart"></canvas>
        </div>
      </div>

      <div class="metric-card" :class="{ alert: memAlert }">
        <div class="metric-header">
          <h3>内存占用</h3>
          <span v-if="memAlert" class="alert-badge">告警</span>
        </div>
        <div class="metric-value">
          <span class="value">{{ currentMetrics?.memory.used_percent.toFixed(1) ?? '--' }}</span>
          <span class="unit">%</span>
        </div>
        <div class="metric-detail">
          <div class="mem-info">
            <div class="mem-item">
              <span class="mem-label">总内存</span>
              <span class="mem-num">{{ formatBytes(currentMetrics?.memory.total ?? 0) }}</span>
            </div>
            <div class="mem-item">
              <span class="mem-label">已用</span>
              <span class="mem-num">{{ formatBytes(currentMetrics?.memory.used ?? 0) }}</span>
            </div>
            <div class="mem-item">
              <span class="mem-label">可用</span>
              <span class="mem-num">{{ formatBytes(currentMetrics?.memory.free ?? 0) }}</span>
            </div>
          </div>
          <div class="mem-progress-bar">
            <div
              class="mem-progress-fill"
              :style="{
                width: (currentMetrics?.memory.used_percent ?? 0) + '%',
                background: (currentMetrics?.memory.used_percent ?? 0) > memThreshold ? '#e53935' : '#43a047',
              }"
            ></div>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="memChart"></canvas>
        </div>
      </div>

      <div class="metric-card" :class="{ alert: netAlert }">
        <div class="metric-header">
          <h3>网络流量</h3>
          <span v-if="netAlert" class="alert-badge">告警</span>
        </div>
        <div class="net-values">
          <div class="net-item">
            <span class="net-label">上行</span>
            <span class="net-value">{{ formatSpeed(currentMetrics?.network.upload_speed ?? 0) }}</span>
          </div>
          <div class="net-item">
            <span class="net-label">下行</span>
            <span class="net-value">{{ formatSpeed(currentMetrics?.network.download_speed ?? 0) }}</span>
          </div>
        </div>
        <div class="metric-detail">
          <div class="net-total">
            <span>总发送: {{ formatBytes(currentMetrics?.network.total_sent ?? 0) }}</span>
            <span>总接收: {{ formatBytes(currentMetrics?.network.total_recv ?? 0) }}</span>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="netChart"></canvas>
        </div>
      </div>
    </div>

    <div class="threshold-panel">
      <h3>告警阈值设置</h3>
      <div class="threshold-grid">
        <div class="threshold-item">
          <label>CPU 阈值 (%)</label>
          <input v-model.number="cpuThreshold" type="number" min="1" max="100" />
        </div>
        <div class="threshold-item">
          <label>内存 阈值 (%)</label>
          <input v-model.number="memThreshold" type="number" min="1" max="100" />
        </div>
        <div class="threshold-item">
          <label>网络 阈值 (MB/s)</label>
          <input v-model.number="netThreshold" type="number" min="1" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.monitor-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 13px;
  color: #888;
}

.loading-indicator {
  font-size: 13px;
  color: #667eea;
}

.error-banner {
  padding: 12px 16px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.metric-card.alert {
  border-color: #e53935;
  box-shadow: 0 0 0 1px #e53935, 0 4px 12px rgba(229, 57, 53, 0.15);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.metric-header h3 {
  font-size: 16px;
  color: #555;
  margin: 0;
  font-weight: 500;
}

.alert-badge {
  padding: 2px 8px;
  background: #e53935;
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
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
  margin-bottom: 16px;
}

.metric-value .value {
  font-size: 36px;
  font-weight: 700;
  color: #333;
}

.metric-value .unit {
  font-size: 16px;
  color: #888;
}

.metric-detail {
  margin-bottom: 16px;
}

.cores-info {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.cores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.core-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.core-label {
  width: 16px;
  color: #888;
  text-align: center;
}

.core-progress {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.core-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.core-percent {
  width: 32px;
  color: #666;
  text-align: right;
}

.mem-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.mem-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mem-label {
  font-size: 12px;
  color: #888;
}

.mem-num {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.mem-progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.mem-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.net-values {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.net-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.net-label {
  font-size: 12px;
  color: #888;
}

.net-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.net-total {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.chart-container {
  height: 160px;
  position: relative;
}

.threshold-panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e8e8e8;
}

.threshold-panel h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px;
}

.threshold-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.threshold-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.threshold-item label {
  font-size: 13px;
  color: #555;
}

.threshold-item input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

.threshold-item input:focus {
  outline: none;
  border-color: #667eea;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .monitor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .net-values {
    flex-direction: column;
    gap: 12px;
  }

  .mem-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
