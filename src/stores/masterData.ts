import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoriesApi } from '@/api/categories'
import { paymentMethodsApi } from '@/api/paymentMethods'
import type {
  Category,
  PaymentMethod,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from '@/types'

export const useMasterDataStore = defineStore('masterData', () => {
  const categories = ref<Category[]>([])
  const paymentMethods = ref<PaymentMethod[]>([])
  const loaded = ref(false)

  // ─── Computed ─────────────────────────────────────────────────────────────
  const incomeCategories = computed(() => categories.value.filter((c) => c.type === 'income'))
  const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'))
  const systemCategories = computed(() => categories.value.filter((c) => c.is_default))
  const customCategories = computed(() => categories.value.filter((c) => !c.is_default))

  const systemPaymentMethods = computed(() => paymentMethods.value.filter((p) => p.is_default))
  const customPaymentMethods = computed(() => paymentMethods.value.filter((p) => !p.is_default))

  function getCategoryById(id: string) {
    return categories.value.find((c) => c.id === id)
  }

  function getPaymentMethodById(id: string) {
    return paymentMethods.value.find((p) => p.id === id)
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function loadAll() {
    const [catRes, pmRes] = await Promise.all([categoriesApi.list(), paymentMethodsApi.list()])
    if (catRes.data.success) categories.value = catRes.data.data
    if (pmRes.data.success) paymentMethods.value = pmRes.data.data
    loaded.value = true
  }

  async function createCategory(payload: CreateCategoryPayload) {
    const { data: res } = await categoriesApi.create(payload)
    if (!res.success) throw new Error(res.message)
    categories.value.push(res.data)
    return res.data
  }

  async function updateCategory(id: string, payload: UpdateCategoryPayload) {
    const { data: res } = await categoriesApi.update(id, payload)
    if (!res.success) throw new Error(res.message)
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx !== -1) categories.value[idx] = res.data
    return res.data
  }

  async function deleteCategory(id: string) {
    const { data: res } = await categoriesApi.remove(id)
    if (!res.success) throw new Error(res.message)
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  async function createPaymentMethod(payload: CreatePaymentMethodPayload) {
    const { data: res } = await paymentMethodsApi.create(payload)
    if (!res.success) throw new Error(res.message)
    paymentMethods.value.push(res.data)
    return res.data
  }

  async function updatePaymentMethod(id: string, payload: UpdatePaymentMethodPayload) {
    const { data: res } = await paymentMethodsApi.update(id, payload)
    if (!res.success) throw new Error(res.message)
    const idx = paymentMethods.value.findIndex((p) => p.id === id)
    if (idx !== -1) paymentMethods.value[idx] = res.data
    return res.data
  }

  async function deletePaymentMethod(id: string) {
    const { data: res } = await paymentMethodsApi.remove(id)
    if (!res.success) throw new Error(res.message)
    paymentMethods.value = paymentMethods.value.filter((p) => p.id !== id)
  }

  function reset() {
    categories.value = []
    paymentMethods.value = []
    loaded.value = false
  }

  return {
    categories,
    paymentMethods,
    loaded,
    incomeCategories,
    expenseCategories,
    systemCategories,
    customCategories,
    systemPaymentMethods,
    customPaymentMethods,
    loadAll,
    createCategory,
    updateCategory,
    deleteCategory,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getCategoryById,
    getPaymentMethodById,
    reset,
  }
})
