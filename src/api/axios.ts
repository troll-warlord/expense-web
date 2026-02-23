import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

// Keys for storage
export const REFRESH_TOKEN_KEY = 'expense_refresh_token'

// In-memory access token (never stored in localStorage)
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

// Track if a refresh is already in-progress to avoid concurrent retries
let _isRefreshing = false
let _failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  _failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token as string)
    }
  })
  _failedQueue = []
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = _accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshToken) {
        // No refresh token → force logout
        _triggerLogout()
        return Promise.reject(error)
      }

      if (_isRefreshing) {
        // Queue subsequent requests until refresh is complete
        return new Promise<string>((resolve, reject) => {
          _failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              ;(originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      _isRefreshing = true

      try {
        const { data } = await api.post('/auth/refresh', {
          refresh_token: refreshToken,
        })

        const newAccessToken: string = data.data.access_token
        const newRefreshToken: string = data.data.refresh_token

        setAccessToken(newAccessToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
        processQueue(null, newAccessToken)

        if (originalRequest.headers) {
          ;(originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${newAccessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        _triggerLogout()
        return Promise.reject(refreshError)
      } finally {
        _isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// Lazy-imported to avoid circular deps
function _triggerLogout() {
  import('@/stores/auth').then(({ useAuthStore }) => {
    const store = useAuthStore()
    store.logout()
  })
}

export default api
