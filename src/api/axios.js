/**
 * src/api/axios.js
 *
 * Axios instance for the affiliate portal.
 * Uses the custom affiliate JWT (not Simple JWT standard).
 * On 401: attempts silent refresh, retries once, then redirects to /login.
 */
import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('aff_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — try refresh once
let isRefreshing = false
let failedQueue  = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (original.url?.includes('/auth/')) {
        clearAuth()
        router.push('/login')
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true
      const refresh = localStorage.getItem('aff_refresh_token')

      if (!refresh) {
        clearAuth()
        router.push('/login')
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/api/affiliate/auth/token/refresh/', { refresh })
        const newAccess = data.access
        localStorage.setItem('aff_access_token', newAccess)
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuth()
        router.push('/login')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function clearAuth() {
  localStorage.removeItem('aff_access_token')
  localStorage.removeItem('aff_refresh_token')
}

export default api
