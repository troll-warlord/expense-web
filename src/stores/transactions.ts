import { defineStore } from 'pinia'
import { ref } from 'vue'
import { transactionsApi } from '@/api/transactions'
import type {
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  TransactionFilters,
} from '@/types'

export const useTransactionStore = defineStore('transactions', () => {
  const items = ref<Transaction[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const pages = ref(1)
  const loading = ref(false)
  const filters = ref<TransactionFilters>({})

  async function fetchTransactions(newFilters?: TransactionFilters) {
    loading.value = true
    if (newFilters !== undefined) {
      filters.value = { ...newFilters }
      page.value = 1
    }
    try {
      const { data: res } = await transactionsApi.list({
        ...filters.value,
        page: page.value,
        page_size: pageSize.value,
      })
      if (res.success) {
        // API returns a flat array, not a paginated envelope
        const raw = res.data as unknown as Transaction[]
        items.value = raw.map((t) => ({ ...t, amount: Number(t.amount) }))
        // Infer whether more pages exist from whether we got a full page
        pages.value = items.value.length >= pageSize.value ? page.value + 1 : page.value
        total.value = (page.value - 1) * pageSize.value + items.value.length
      }
    } finally {
      loading.value = false
    }
  }

  async function goToPage(p: number) {
    page.value = p
    await fetchTransactions()
  }

  async function createTransaction(payload: CreateTransactionPayload) {
    const { data: res } = await transactionsApi.create(payload)
    if (!res.success) throw new Error(res.message)
    await fetchTransactions()
    return res.data
  }

  async function updateTransaction(id: string, payload: UpdateTransactionPayload) {
    const { data: res } = await transactionsApi.update(id, payload)
    if (!res.success) throw new Error(res.message)
    const idx = items.value.findIndex((t) => t.id === id)
    if (idx !== -1) items.value[idx] = res.data
    return res.data
  }

  async function deleteTransaction(id: string) {
    const { data: res } = await transactionsApi.remove(id)
    if (!res.success) throw new Error(res.message)
    items.value = items.value.filter((t) => t.id !== id)
    total.value = Math.max(0, total.value - 1)
  }

  function reset() {
    items.value = []
    total.value = 0
    page.value = 1
    pages.value = 1
    filters.value = {}
  }

  return {
    items,
    total,
    page,
    pageSize,
    pages,
    loading,
    filters,
    fetchTransactions,
    goToPage,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    reset,
  }
})
