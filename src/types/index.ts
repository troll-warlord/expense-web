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

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: PaginationMeta
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  is_new_user: boolean
  user: User
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

/** Alias kept for API compatibility — same shape as TokenPair */
export type VerifyOtpResponse = TokenPair

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
  icon?: string
  color?: string
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
  user_id: string
  amount: number
  date: string
  description?: string
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
}

export interface UpdateTransactionPayload {
  amount?: number
  date?: string
  category_id?: string
  payment_method_id?: string
  description?: string
}

export interface TransactionFilters {
  page?: number
  page_size?: number
  date_from?: string
  date_to?: string
  category_id?: string
  payment_method_id?: string
  type?: CategoryType
  q?: string
}

export interface CategorySummary {
  category_id: string
  name: string
  type: CategoryType
  total: number
  count: number
}

export interface TransactionSummary {
  total_income: number
  total_expense: number
  net: number
  transaction_count: number
  category_breakdown: CategorySummary[]
}

export interface SummaryFilters {
  date_from?: string
  date_to?: string
}

// ─── Budget ────────────────────────────────────────────────────────────────────

export interface BudgetCategory {
  id: string
  name: string
  type: string
}

export interface Budget {
  id: string
  category_id: string | null
  category: BudgetCategory | null
  amount: number
  period: string
  spent: number
  percent: number
  remaining: number
  created_at: string
  updated_at: string
}

export interface CreateBudgetPayload {
  category_id?: string | null
  amount: number
  period?: string
}

export interface UpdateBudgetPayload {
  amount?: number
  period?: string
}
