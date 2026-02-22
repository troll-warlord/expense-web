import api from './axios'
import type { ApiResponse, User, UpdateProfilePayload } from '@/types'

export const usersApi = {
  getMe() {
    return api.get<ApiResponse<User>>('/users/me')
  },

  updateMe(payload: UpdateProfilePayload) {
    return api.patch<ApiResponse<User>>('/users/me', payload)
  },

  deleteMe() {
    return api.delete<ApiResponse<null>>('/users/me')
  },
}
