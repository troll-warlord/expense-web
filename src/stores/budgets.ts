import { defineStore } from 'pinia'
import { ref } from 'vue'
import { budgetsApi } from '@/api/budgets'
import type { Budget, CreateBudgetPayload, UpdateBudgetPayload } from '@/types'

export const useBudgetStore = defineStore('budgets', () => {
  const budgets = ref<Budget[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function fetchBudgets() {
    loading.value = true
    try {
      const { data: res } = await budgetsApi.list()
      if (res.success) {
        budgets.value = res.data
        loaded.value = true
      }
    } finally {
      loading.value = false
    }
  }

  async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
    const { data: res } = await budgetsApi.create(payload)
    if (!res.success) throw new Error(res.message)
    budgets.value.push(res.data)
    return res.data
  }

  async function updateBudget(id: string, payload: UpdateBudgetPayload): Promise<Budget> {
    const { data: res } = await budgetsApi.update(id, payload)
    if (!res.success) throw new Error(res.message)
    const idx = budgets.value.findIndex((b) => b.id === id)
    if (idx !== -1) budgets.value[idx] = res.data
    return res.data
  }

  async function deleteBudget(id: string): Promise<void> {
    const { data: res } = await budgetsApi.remove(id)
    if (!res.success) throw new Error(res.message)
    budgets.value = budgets.value.filter((b) => b.id !== id)
  }

  return { budgets, loading, loaded, fetchBudgets, createBudget, updateBudget, deleteBudget }
})
