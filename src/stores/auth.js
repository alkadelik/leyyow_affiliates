/**
 * src/stores/auth.js
 * Affiliate auth store.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { clearAuth } from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)   // { id, email, full_name, is_active }
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function init() {
    const token = localStorage.getItem('aff_access_token')
    if (!token) return
    try { await fetchMe() } catch { clearAuth() }
  }

  async function login(email, password) {
    loading.value = true
    try {
      const { data } = await api.post('/affiliate/auth/login/', { email, password })
      localStorage.setItem('aff_access_token',  data.access)
      localStorage.setItem('aff_refresh_token', data.refresh)
      user.value = data.user
      return { ok: true }
    } catch (err) {
      const msg = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Incorrect email or password.'
      return { ok: false, error: msg }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      const refresh = localStorage.getItem('aff_refresh_token')
      if (refresh) await api.post('/affiliate/auth/logout/', { refresh })
    } catch { /* ignore */ } finally {
      clearAuth()
      user.value = null
    }
  }

  async function fetchMe() {
    const { data } = await api.get('/affiliate/auth/me/')
    user.value = data
  }

  return { user, loading, isAuthenticated, init, login, logout, fetchMe }
})
