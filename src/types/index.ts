// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  data: ValidationError[] | null
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface RequestOtpPayload {
  country_code: string
  phone_number: string
}

export interface VerifyOtpPayload {
  country_code: string
  phone_number: string
  otp: string
  device_hint?: string
}

export interface VerifyOtpResponse extends TokenPair {
  is_new_user: boolean
}

export interface RefreshPayload {
  refresh_token: string
}

export interface LogoutPayload {
  refresh_token: string
}

// ─── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  country_code: string
  phone_number: string
  first_name: string | null
  last_name: string | null
  email: string | null
  is_profile_complete: boolean
  display_name: string
  created_at: string
  updated_at: string
}

export interface UpdateProfilePayload {
  first_name: string
  last_name: string
  email: string
}

// ─── Category ──────────────────────────────────────────────────────────────────

export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CreateCategoryPayload {
  name: string
  type: CategoryType
}

export interface UpdateCategoryPayload {
  name?: string
  type?: CategoryType
}

// ─── Payment Method ────────────────────────────────────────────────────────────

export interface PaymentMethod {
  id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CreatePaymentMethodPayload {
  name: string
}

export interface UpdatePaymentMethodPayload {
  name?: string
}

// ─── Transaction ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  amount: number
  date: string
  description?: string
  source?: string
  category_id: string
  payment_method_id: string
  created_at: string
  updated_at: string
}

export interface CreateTransactionPayload {
  amount: number
  date: string
  category_id: string
  payment_method_id: string
  description?: string
  source?: string
}

export interface UpdateTransactionPayload {
  amount?: number
  date?: string
  category_id?: string
  payment_method_id?: string
  description?: string
  source?: string
}

export interface TransactionFilters {
  page?: number
  page_size?: number
  date_from?: string
  date_to?: string
  category_id?: string
  payment_method_id?: string
  type?: CategoryType
}
