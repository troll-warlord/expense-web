import api from './axios'
import type {
  ApiResponse,
  PaymentMethod,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from '@/types'

export const paymentMethodsApi = {
  list() {
    return api.get<ApiResponse<PaymentMethod[]>>('/payment-methods')
  },

  create(payload: CreatePaymentMethodPayload) {
    return api.post<ApiResponse<PaymentMethod>>('/payment-methods', payload)
  },

  update(id: string, payload: UpdatePaymentMethodPayload) {
    return api.patch<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, payload)
  },

  remove(id: string) {
    return api.delete<ApiResponse<null>>(`/payment-methods/${id}`)
  },
}
