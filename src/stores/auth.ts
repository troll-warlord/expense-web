import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { usersApi } from '@/api/users'
import { setAccessToken, REFRESH_TOKEN_KEY } from '@/api/axios'
import type { User, UpdateProfilePayload } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // State — access token is memory-only (never localStorage)
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)
  const isProfileComplete = computed(() => user.value?.is_profile_complete ?? false)

  // ─── Actions ──────────────────────────────────────────────────────────────

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    setAccessToken(access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }

  function clearTokens() {
    accessToken.value = null
    setAccessToken(null)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  async function login(country_code: string, phone_number: string, otp: string) {
    const { data: res } = await authApi.verifyOtp({ country_code, phone_number, otp })
    if (!res.success) throw new Error(res.message)
    setTokens(res.data.access_token, res.data.refresh_token)
    await fetchUser()
    return { is_new_user: res.data.is_new_user }
  }

  async function logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      try {
        await authApi.logout({ refresh_token: refreshToken })
      } catch {
        // Best-effort — clear regardless
      }
    }
    clearTokens()
    user.value = null
    router.push('/login')
  }

  async function refresh() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) throw new Error('No refresh token')
    const { data: res } = await authApi.refresh({ refresh_token: refreshToken })
    if (!res.success) throw new Error(res.message)
    setTokens(res.data.access_token, res.data.refresh_token)
  }

  async function fetchUser() {
    const { data: res } = await usersApi.getMe()
    if (res.success) {
      user.value = res.data
    }
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    const { data: res } = await usersApi.updateMe(payload)
    if (!res.success) throw new Error(res.message)
    user.value = res.data
  }

  async function initFromStorage() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return false
    try {
      await refresh()
      await fetchUser()
      return true
    } catch {
      clearTokens()
      return false
    }
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isProfileComplete,
    login,
    logout,
    refresh,
    fetchUser,
    updateProfile,
    initFromStorage,
    clearTokens,
  }
})
