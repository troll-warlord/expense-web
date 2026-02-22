import api from './axios'
import type { ApiResponse, Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types'

export const categoriesApi = {
  list() {
    return api.get<ApiResponse<Category[]>>('/categories')
  },

  create(payload: CreateCategoryPayload) {
    return api.post<ApiResponse<Category>>('/categories', payload)
  },

  update(id: string, payload: UpdateCategoryPayload) {
    return api.patch<ApiResponse<Category>>(`/categories/${id}`, payload)
  },

  remove(id: string) {
    return api.delete<ApiResponse<null>>(`/categories/${id}`)
  },
}
