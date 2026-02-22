import type { AxiosError } from 'axios'
import type { ApiErrorResponse, ValidationError } from '@/types'

/**
 * Extracts a human-readable error message from an Axios error.
 */
export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorResponse>
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message
  }
  if (axiosError.message) return axiosError.message
  return 'An unexpected error occurred.'
}

/**
 * Extracts field-level validation errors (422) from the API envelope.
 * Returns a map of { fieldName: errorMessage }.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const axiosError = error as AxiosError<ApiErrorResponse>
  const data = axiosError.response?.data?.data
  if (!Array.isArray(data)) return {}
  return Object.fromEntries((data as ValidationError[]).map((e) => [e.field, e.message]))
}

/**
 * Format a number as currency (INR by default).
 */
export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format an ISO date string as a readable date.
 */
export function formatDate(dateStr: string, locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/**
 * Returns today as YYYY-MM-DD for date input default.
 */
export function todayISO(): string | undefined {
  return new Date().toISOString().split('T')[0]
}

/**
 * Returns the first day of the current month as YYYY-MM-DD.
 */
export function startOfMonthISO(): string | undefined {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().split('T')[0]
}
