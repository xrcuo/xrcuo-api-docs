<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('')
const error = ref('')
const loading = ref(false)
const passwordFocused = ref(false)

async function handleLogin() {
  error.value = ''
  if (!password.value) {
    error.value = '请输入密码'
    return
  }

  loading.value = true
  try {
    await authStore.login(username.value, password.value)
    router.push('/admin')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#1a1a2e" />
              <path
                d="M12 20C12 15.5817 15.5817 12 20 12C24.4183 12 28 15.5817 28 20"
                stroke="white"
                stroke-width="2.5"
                stroke-linecap="round"
              />
              <path
                d="M28 20C28 24.4183 24.4183 28 20 28C15.5817 28 12 24.4183 12 20"
                stroke="white"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-dasharray="2 4"
              />
              <circle cx="20" cy="20" r="3" fill="white" />
            </svg>
          </div>
          <h1 class="login-title">管理后台</h1>
          <p class="login-subtitle">管理员登录</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">
              <svg class="label-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.3333 14V12.6667C13.3333 11.9594 13.0524 11.2811 12.5523 10.781C12.0522 10.281 11.3739 10 10.6667 10H5.33333C4.62609 10 3.94781 10.281 3.44772 10.781C2.94762 11.2811 2.66667 11.9594 2.66667 12.6667V14"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M8 7.33333C9.47276 7.33333 10.6667 6.13943 10.6667 4.66667C10.6667 3.19391 9.47276 2 8 2C6.52724 2 5.33333 3.19391 5.33333 4.66667C5.33333 6.13943 6.52724 7.33333 8 7.33333Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              用户名
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              class ="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              <svg class="label-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.33333C6.93913 1.33333 5.92172 1.75476 5.17157 2.50491C4.42143 3.25505 4 4.27247 4 5.33333V7.33333H3.33333C2.96514 7.33333 2.66667 7.63181 2.66667 8V13.3333C2.66667 13.7015 2.96514 14 3.33333 14H12.6667C13.0349 14 13.3333 13.7015 13.3333 13.3333V8C13.3333 7.63181 13.0349 7.33333 12.6667 7.33333H12V5.33333C12 4.27247 11.5786 3.25505 10.8284 2.50491C10.0783 1.75476 9.06087 1.33333 8 1.33333Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M8 10.6667V11.3333"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              密码
            </label>
            <div class="input-wrapper" :class="{ focused: passwordFocused }">
              <input
                v-model="password"
                type="password"
                placeholder="请输入管理员密码"
                class="form-input password-input"
                @focus="passwordFocused = true"
                @blur="passwordFocused = false"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>

          <transition name="fade">
            <div v-if="error" class="error-msg">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 4.66667V7M7 9.33333H7.00583M1.66667 7C1.66667 4.05448 4.05448 1.66667 7 1.66667C9.94552 1.66667 12.3333 4.05448 12.3333 7C12.3333 9.94552 9.94552 12.3333 7 12.3333C4.05448 12.3333 1.66667 9.94552 1.66667 7Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ error }}
            </div>
          </transition>

          <button
            type="submit"
            class="btn-login"
            :disabled="loading || !password"
            :class="{ 'btn-active': password && !loading }"
          >
            <span v-if="loading" class="spinner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.33333V4M8 12V14.6667M3.28667 3.28667L5.17333 5.17333M10.8267 10.8267L12.7133 12.7133M1.33333 8H4M12 8H14.6667M3.28667 12.7133L5.17333 10.8267M10.8267 5.17333L12.7133 3.28667"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span v-else>登录</span>
          </button>
        </form>
      </div>

      <p class="login-footer">API 文档管理系统 · 仅限管理员访问</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.login-card {
  background: #ffffff;
  padding: 48px 40px;
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 10px 40px rgba(0, 0, 0, 0.06);
  width: 100%;
  border: 1px solid #f0f0f0;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  gap: 12px;
}

.logo {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #444;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-icon {
  color: #999;
}

.input-wrapper {
  position: relative;
  border-radius: 10px;
  transition: box-shadow 0.2s ease;
}

.input-wrapper.focused {
  box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.08);
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  background: #fafafa;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #bbb;
}

.form-input:focus {
  outline: none;
  border-color: #1a1a2e;
  background: #ffffff;
}

.form-input:disabled {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.password-input {
  background: #ffffff;
  border-color: #e0e0e0;
}

.password-input:focus {
  border-color: #1a1a2e;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

.btn-login {
  width: 100%;
  padding: 13px;
  background: #e8e8e8;
  color: #999;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: not-allowed;
  transition: all 0.25s ease;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-login.btn-active {
  background: #1a1a2e;
  color: #ffffff;
  cursor: pointer;
}

.btn-login.btn-active:hover {
  background: #2d2d44;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 26, 46, 0.2);
}

.btn-login.btn-active:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(26, 26, 46, 0.15);
}

.btn-login:disabled {
  opacity: 0.7;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  font-size: 12px;
  color: #bbb;
  margin: 0;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 480px) {
  .login-page {
    padding: 16px;
    align-items: flex-start;
    padding-top: 60px;
  }

  .login-card {
    padding: 32px 24px;
  }

  .login-title {
    font-size: 20px;
  }
}
</style>
