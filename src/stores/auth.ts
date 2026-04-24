import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const username = ref('')
  const isLoggedIn = computed(() => !!token.value)

  async function login(user: string, pass: string) {
    const data = await authApi.login(user, pass)
    token.value = data.token
    username.value = data.username
    localStorage.setItem('admin_token', data.token)
    return data
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('admin_token')
  }

  async function fetchUser() {
    try {
      const data = await authApi.getUser()
      username.value = data.username
      return data
    } catch {
      logout()
      return null
    }
  }

  async function changePassword(oldPass: string, newPass: string) {
    return authApi.changePassword(oldPass, newPass)
  }

  return {
    token,
    username,
    isLoggedIn,
    login,
    logout,
    fetchUser,
    changePassword,
  }
})
