<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { monitorApi, type SystemMetrics } from '@/api/client'
import Chart from 'chart.js/auto'

const router = useRouter()
const authStore = useAuthStore()

const currentMetrics = ref<SystemMetrics | null>(null)
const historyData = ref<SystemMetrics[]>([])
const error = ref('')
const lastUpdate = ref('')
const isExpanded = ref(false)
const isRefreshing = ref(false)

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

const hasAlert = computed(() => cpuAlert.value || memAlert.value || netAlert.value)

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
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await loadData()
  refreshTimer = setInterval(loadData, 2000)
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
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    error.value = ''
    const [current, history] = await Promise.all([
      monitorApi.getCurrent(),
      monitorApi.getHistory(),
    ])
    currentMetrics.value = current
    historyData.value = history
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
    if (isExpanded.value) {
      await nextTick()
      updateCharts()
    }
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
    isRefreshing.value = false
  }
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    nextTick(() => updateCharts())
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
  const ctx = document.getElementById('cpuChartInline') as HTMLCanvasElement
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
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 11 },
          bodyFont: { size: 11 },
          padding: 8,
          cornerRadius: 6,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 6 },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 25, font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.04)' },
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
  const ctx = document.getElementById('memChartInline') as HTMLCanvasElement
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
          borderColor: '#43a047',
          backgroundColor: 'rgba(67, 160, 71, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 11 },
          bodyFont: { size: 11 },
          padding: 8,
          cornerRadius: 6,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 6 },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 25, font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.04)' },
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
  const ctx = document.getElementById('netChartInline') as HTMLCanvasElement
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
          label: '上行',
          data: upload,
          borderColor: '#f57c00',
          backgroundColor: 'rgba(245, 124, 0, 0.04)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '下行',
          data: download,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.04)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { boxWidth: 10, font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 11 },
          bodyFont: { size: 11 },
          padding: 8,
          cornerRadius: 6,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 6 },
        },
        y: {
          beginAtZero: true,
          ticks: { font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.04)' },
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
  <div class="monitor-widget" :class="{ expanded: isExpanded, 'has-alert': hasAlert }">
    <div class="monitor-header-bar" @click="toggleExpand">
      <div class="header-left">
        <div class="monitor-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div class="header-title">
          <span class="title-text">系统监控</span>
          <span v-if="hasAlert" class="alert-dot"></span>
        </div>
      </div>
      <div class="header-right">
        <div v-if="currentMetrics && !isExpanded" class="mini-stats">
          <span class="mini-stat" :class="{ warning: cpuAlert }">CPU {{ currentMetrics.cpu.total_percent.toFixed(0) }}%</span>
          <span class="mini-stat" :class="{ warning: memAlert }">内存 {{ currentMetrics.memory.used_percent.toFixed(0) }}%</span>
          <span class="mini-stat" :class="{ warning: netAlert }">网络 {{ formatSpeed(currentMetrics.network.upload_speed + currentMetrics.network.download_speed) }}</span>
        </div>
        <span v-if="lastUpdate && !isExpanded" class="update-time">{{ lastUpdate }}</span>
        <div class="expand-icon" :class="{ rotated: isExpanded }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </div>

    <div v-show="isExpanded" class="monitor-content">
      <div v-if="error" class="error-banner">{{ error }}</div>

      <div class="metrics-overview">
        <div class="overview-card cpu" :class="{ alert: cpuAlert }">
          <div class="overview-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
              <rect x="9" y="9" width="6" height="6"/>
              <line x1="9" y1="1" x2="9" y2="4"/>
              <line x1="15" y1="1" x2="15" y2="4"/>
              <line x1="9" y1="20" x2="9" y2="23"/>
              <line x1="15" y1="20" x2="15" y2="23"/>
              <line x1="20" y1="9" x2="23" y2="9"/>
              <line x1="20" y1="14" x2="23" y2="14"/>
              <line x1="1" y1="9" x2="4" y2="9"/>
              <line x1="1" y1="14" x2="4" y2="14"/>
            </svg>
          </div>
          <div class="overview-info">
            <span class="overview-label">CPU 使用率</span>
            <span class="overview-value">{{ currentMetrics?.cpu.total_percent.toFixed(1) ?? '--' }}%</span>
          </div>
          <div v-if="cpuAlert" class="overview-alert">告警</div>
        </div>

        <div class="overview-card memory" :class="{ alert: memAlert }">
          <div class="overview-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div class="overview-info">
            <span class="overview-label">内存占用</span>
            <span class="overview-value">{{ currentMetrics?.memory.used_percent.toFixed(1) ?? '--' }}%</span>
          </div>
          <div v-if="memAlert" class="overview-alert">告警</div>
        </div>

        <div class="overview-card network" :class="{ alert: netAlert }">
          <div class="overview-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="overview-info">
            <span class="overview-label">网络流量</span>
            <span class="overview-value">{{ formatSpeed((currentMetrics?.network.upload_speed ?? 0) + (currentMetrics?.network.download_speed ?? 0)) }}</span>
          </div>
          <div v-if="netAlert" class="overview-alert">告警</div>
        </div>
      </div>

      <div class="metrics-detail">
        <div class="detail-card">
          <div class="detail-header">
            <h4>CPU 详情</h4>
            <span class="core-count">{{ currentMetrics?.cpu.core_count ?? '--' }} 核心</span>
          </div>
          <div class="cores-list">
            <div
              v-for="(percent, index) in currentMetrics?.cpu.core_percents ?? []"
              :key="index"
              class="core-item"
            >
              <span class="core-name">核心 {{ index + 1 }}</span>
              <div class="core-bar-bg">
                <div
                  class="core-bar-fill"
                  :style="{
                    width: percent + '%',
                    background: percent > cpuThreshold
                      ? 'linear-gradient(90deg, #ff6b6b, #ee5a5a)'
                      : 'linear-gradient(90deg, #667eea, #764ba2)'
                  }"
                ></div>
              </div>
              <span class="core-percent" :class="{ warning: percent > cpuThreshold }">{{ percent.toFixed(0) }}%</span>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas id="cpuChartInline"></canvas>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-header">
            <h4>内存详情</h4>
          </div>
          <div class="mem-stats">
            <div class="mem-stat-item">
              <span class="mem-stat-label">总容量</span>
              <span class="mem-stat-value">{{ formatBytes(currentMetrics?.memory.total ?? 0) }}</span>
            </div>
            <div class="mem-stat-item">
              <span class="mem-stat-label">已使用</span>
              <span class="mem-stat-value">{{ formatBytes(currentMetrics?.memory.used ?? 0) }}</span>
            </div>
            <div class="mem-stat-item">
              <span class="mem-stat-label">可用</span>
              <span class="mem-stat-value">{{ formatBytes(currentMetrics?.memory.free ?? 0) }}</span>
            </div>
          </div>
          <div class="mem-progress-wrap">
            <div class="mem-progress-bg">
              <div
                class="mem-progress-fill"
                :style="{
                  width: (currentMetrics?.memory.used_percent ?? 0) + '%',
                  background: (currentMetrics?.memory.used_percent ?? 0) > memThreshold
                    ? 'linear-gradient(90deg, #ff6b6b, #ee5a5a)'
                    : 'linear-gradient(90deg, #43a047, #2e7d32)'
                }"
              ></div>
            </div>
            <span class="mem-progress-text">{{ currentMetrics?.memory.used_percent.toFixed(1) ?? '--' }}%</span>
          </div>
          <div class="chart-wrap">
            <canvas id="memChartInline"></canvas>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-header">
            <h4>网络详情</h4>
          </div>
          <div class="net-stats">
            <div class="net-stat-row">
              <div class="net-stat-item">
                <span class="net-stat-label">
                  <span class="net-arrow up">↑</span> 上行
                </span>
                <span class="net-stat-value">{{ formatSpeed(currentMetrics?.network.upload_speed ?? 0) }}</span>
              </div>
              <div class="net-stat-item">
                <span class="net-stat-label">
                  <span class="net-arrow down">↓</span> 下行
                </span>
                <span class="net-stat-value">{{ formatSpeed(currentMetrics?.network.download_speed ?? 0) }}</span>
              </div>
            </div>
            <div class="net-total-row">
              <span>总发送: {{ formatBytes(currentMetrics?.network.total_sent ?? 0) }}</span>
              <span>总接收: {{ formatBytes(currentMetrics?.network.total_recv ?? 0) }}</span>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas id="netChartInline"></canvas>
          </div>
        </div>
      </div>

      <div class="threshold-section">
        <div class="threshold-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>告警阈值设置</span>
        </div>
        <div class="threshold-inputs">
          <div class="threshold-field">
            <label>CPU (%)</label>
            <input v-model.number="cpuThreshold" type="number" min="1" max="100" />
          </div>
          <div class="threshold-field">
            <label>内存 (%)</label>
            <input v-model.number="memThreshold" type="number" min="1" max="100" />
          </div>
          <div class="threshold-field">
            <label>网络 (MB/s)</label>
            <input v-model.number="netThreshold" type="number" min="1" />
          </div>
        </div>
      </div>

      <div class="refresh-indicator" :class="{ active: isRefreshing }">
        <div class="refresh-dot"></div>
        <span>实时更新中</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-widget {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  transition: all 0.3s ease;
}

.monitor-widget.has-alert {
  border-color: #ff6b6b;
  box-shadow: 0 0 0 1px rgba(255, 107, 107, 0.2);
}

.monitor-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}

.monitor-header-bar:hover {
  background: #f8f9fa;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monitor-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.monitor-icon svg {
  width: 18px;
  height: 18px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b6b;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mini-stats {
  display: flex;
  gap: 12px;
}

.mini-stat {
  font-size: 12px;
  color: #666;
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.mini-stat.warning {
  background: #ffebee;
  color: #c62828;
  font-weight: 500;
}

.update-time {
  font-size: 12px;
  color: #999;
}

.expand-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: transform 0.3s;
}

.expand-icon svg {
  width: 16px;
  height: 16px;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.monitor-content {
  padding: 0 20px 20px;
}

.error-banner {
  padding: 10px 14px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}

.metrics-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 1px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.overview-card.alert {
  background: #fff5f5;
  border-color: #ffcdd2;
}

.overview-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.overview-icon svg {
  width: 20px;
  height: 20px;
}

.overview-card.cpu .overview-icon {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.overview-card.memory .overview-icon {
  background: rgba(67, 160, 71, 0.1);
  color: #43a047;
}

.overview-card.network .overview-icon {
  background: rgba(245, 124, 0, 0.1);
  color: #f57c00;
}

.overview-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.overview-label {
  font-size: 12px;
  color: #888;
}

.overview-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.overview-alert {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  background: #ff6b6b;
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

.metrics-detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.detail-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin: 0;
}

.core-count {
  font-size: 12px;
  color: #999;
}

.cores-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.core-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.core-name {
  font-size: 11px;
  color: #888;
  width: 50px;
  flex-shrink: 0;
}

.core-bar-bg {
  flex: 1;
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.core-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.core-percent {
  font-size: 11px;
  color: #666;
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.core-percent.warning {
  color: #e53935;
  font-weight: 600;
}

.mem-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.mem-stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mem-stat-label {
  font-size: 11px;
  color: #888;
}

.mem-stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.mem-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.mem-progress-bg {
  flex: 1;
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.mem-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.mem-progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  width: 45px;
  text-align: right;
}

.net-stats {
  margin-bottom: 16px;
}

.net-stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.net-stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
}

.net-stat-label {
  font-size: 11px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
}

.net-arrow {
  font-size: 14px;
  font-weight: 700;
}

.net-arrow.up {
  color: #f57c00;
}

.net-arrow.down {
  color: #1976d2;
}

.net-stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.net-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #888;
  padding: 0 4px;
}

.chart-wrap {
  height: 140px;
  position: relative;
}

.threshold-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px;
}

.threshold-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.threshold-header svg {
  width: 16px;
  height: 16px;
  color: #f57c00;
}

.threshold-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.threshold-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.threshold-field label {
  font-size: 12px;
  color: #888;
}

.threshold-field input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  transition: all 0.2s;
}

.threshold-field input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.refresh-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 8px;
  font-size: 12px;
  color: #999;
  transition: opacity 0.3s;
  opacity: 0;
}

.refresh-indicator.active {
  opacity: 1;
}

.refresh-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #43a047;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (max-width: 768px) {
  .metrics-overview {
    grid-template-columns: 1fr;
  }

  .metrics-detail {
    grid-template-columns: 1fr;
  }

  .mini-stats {
    display: none;
  }

  .threshold-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
