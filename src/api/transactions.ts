import api from './axios'
import type {
  ApiResponse,
  PaginatedResponse,
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  TransactionFilters,
} from '@/types'

export const transactionsApi = {
  list(filters: TransactionFilters = {}) {
    return api.get<ApiResponse<PaginatedResponse<Transaction>>>('/transactions', {
      params: filters,
    })
  },

  get(id: string) {
    return api.get<ApiResponse<Transaction>>(`/transactions/${id}`)
  },

  create(payload: CreateTransactionPayload) {
    return api.post<ApiResponse<Transaction>>('/transactions', payload)
  },

  update(id: string, payload: UpdateTransactionPayload) {
    return api.patch<ApiResponse<Transaction>>(`/transactions/${id}`, payload)
  },

  remove(id: string) {
    return api.delete<ApiResponse<null>>(`/transactions/${id}`)
  },
}
