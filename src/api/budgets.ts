import api from './axios'
import type { ApiResponse, Budget, CreateBudgetPayload, UpdateBudgetPayload } from '@/types'

export const budgetsApi = {
  list() {
    return api.get<ApiResponse<Budget[]>>('/budgets')
  },

  create(payload: CreateBudgetPayload) {
    return api.post<ApiResponse<Budget>>('/budgets', payload)
  },

  update(id: string, payload: UpdateBudgetPayload) {
    return api.patch<ApiResponse<Budget>>(`/budgets/${id}`, payload)
  },

  remove(id: string) {
    return api.delete<ApiResponse<null>>(`/budgets/${id}`)
  },
}
