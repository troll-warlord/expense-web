import api from './axios'
import type {
  ApiResponse,
  VerifyOtpResponse,
  RequestOtpPayload,
  VerifyOtpPayload,
  RefreshPayload,
  LogoutPayload,
  TokenPair,
} from '@/types'

export const authApi = {
  requestOtp(payload: RequestOtpPayload) {
    return api.post<ApiResponse<null>>('/auth/request-otp', payload)
  },

  verifyOtp(payload: VerifyOtpPayload) {
    return api.post<ApiResponse<VerifyOtpResponse>>('/auth/verify-otp', payload)
  },

  refresh(payload: RefreshPayload) {
    return api.post<ApiResponse<TokenPair>>('/auth/refresh', payload)
  },

  logout(payload: LogoutPayload) {
    return api.post<ApiResponse<null>>('/auth/logout', payload)
  },
}
