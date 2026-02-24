<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBudgetStore } from '@/stores/budgets'
import { useMasterDataStore } from '@/stores/masterData'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { extractErrorMessage } from '@/utils'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { Budget } from '@/types'

const budgetStore = useBudgetStore()
const masterData = useMasterDataStore()
const { confirm } = useConfirm()
const toast = useToast()

// ─── Data ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!budgetStore.loaded) await budgetStore.fetchBudgets()
})

// Only expense categories make sense for budgets (income has no "limit")
const expenseCategories = computed(() =>
  masterData.categories.filter((c) => c.type === 'expense'),
)

// ─── Modal state ──────────────────────────────────────────────────────────────
const showModal = ref(false)
const editingBudget = ref<Budget | null>(null)

function openCreate() {
  editingBudget.value = null
  resetForm({
    values: { category_id: '', amount: '' },
  })
  showModal.value = true
}

function openEdit(budget: Budget) {
  editingBudget.value = budget
  resetForm({
    values: {
      category_id: budget.category_id ?? '',
      amount: String(budget.amount),
    },
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingBudget.value = null
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const formSchema = toTypedSchema(
  z.object({
    category_id: z.string(), // '' = overall budget
    amount: z.coerce
      .number({ invalid_type_error: 'Enter a valid amount' })
      .positive('Amount must be positive')
      .refine((v) => Math.round(v * 100) / 100 === v, 'At most 2 decimal places'),
  }),
)

const { handleSubmit, isSubmitting, resetForm } = useForm({ validationSchema: formSchema })
const { value: categoryIdVal, errorMessage: categoryIdErr } = useField<string>('category_id')
const { value: amountVal, errorMessage: amountErr } = useField<string>('amount')

const submitBudget = handleSubmit(async (values) => {
  try {
    const payload = {
      category_id: values.category_id === '' ? null : values.category_id,
      amount: values.amount,
      period: 'monthly',
    }

    if (editingBudget.value) {
      await budgetStore.updateBudget(editingBudget.value.id, { amount: values.amount })
      toast.success('Budget updated')
    } else {
      await budgetStore.createBudget(payload)
      toast.success('Budget created')
    }
    closeModal()
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
})

// ─── Delete ───────────────────────────────────────────────────────────────────

async function handleDelete(budget: Budget) {
  const label = budget.category ? budget.category.name : 'Overall Spending'
  const ok = await confirm({
    title: 'Delete Budget',
    message: `Delete the budget for "${label}"?`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  try {
    await budgetStore.deleteBudget(budget.id)
    toast.success('Budget deleted')
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
}

// ─── Progress bar colour ──────────────────────────────────────────────────────

function progressColor(percent: number): string {
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 80) return 'bg-yellow-400'
  return 'bg-emerald-500'
}

function progressTrack(percent: number): string {
  if (percent >= 100) return 'bg-red-100'
  if (percent >= 80) return 'bg-yellow-100'
  return 'bg-emerald-100'
}

function statusLabel(percent: number): string {
  if (percent >= 100) return 'Over budget'
  if (percent >= 80) return 'Almost full'
  return 'On track'
}

function statusClass(percent: number): string {
  if (percent >= 100) return 'text-red-600'
  if (percent >= 80) return 'text-yellow-600'
  return 'text-emerald-600'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// IDs already budgeted (excluding the one being edited) — used to grey out options
const budgetedCategoryIds = computed(() => {
  return new Set(
    budgetStore.budgets
      .filter((b) => b.id !== editingBudget.value?.id)
      .map((b) => b.category_id ?? '__overall__'),
  )
})
</script>

<template>
  <AppShell>
    <div class="max-w-4xl space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-surface-900">Budgets</h2>
          <p class="text-xs text-surface-400 mt-0.5">
            Set monthly spending limits per category. We'll track actual spend from your
            transactions.
          </p>
        </div>
        <AppButton size="sm" @click="openCreate">
          <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Budget
        </AppButton>
      </div>

      <!-- Skeleton -->
      <div v-if="budgetStore.loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-surface-100 shadow-sm p-5 space-y-3">
          <AppSkeleton class="h-4 w-32" />
          <AppSkeleton class="h-2.5 w-full rounded-full" />
          <div class="flex justify-between">
            <AppSkeleton class="h-3 w-20" />
            <AppSkeleton class="h-3 w-20" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="budgetStore.budgets.length === 0"
        class="bg-white rounded-xl border border-surface-100 shadow-sm px-6 py-14 text-center"
      >
        <div class="mx-auto mb-3 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
          <svg class="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-surface-700">No budgets yet</p>
        <p class="text-xs text-surface-400 mt-1">Create a budget to start tracking your spending</p>
        <AppButton class="mt-4" size="sm" @click="openCreate">Add your first budget</AppButton>
      </div>

      <!-- Budget cards -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="budget in budgetStore.budgets"
          :key="budget.id"
          class="bg-white rounded-xl border border-surface-100 shadow-sm p-5 space-y-4"
        >
          <!-- Card header -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-sm font-semibold text-surface-900">
                {{ budget.category ? budget.category.name : 'Overall Spending' }}
              </p>
              <p class="text-xs text-surface-400 mt-0.5">Monthly Budget</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                class="rounded-lg p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Edit budget"
                @click="openEdit(budget)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                class="rounded-lg p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete budget"
                @click="handleDelete(budget)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Progress bar -->
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span :class="statusClass(budget.percent)" class="font-medium">
                {{ statusLabel(budget.percent) }}
              </span>
              <span class="text-surface-500">{{ Math.min(budget.percent, 999).toFixed(0) }}%</span>
            </div>
            <div class="relative h-2 rounded-full overflow-hidden" :class="progressTrack(budget.percent)">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="progressColor(budget.percent)"
                :style="{ width: `${Math.min(budget.percent, 100)}%` }"
              />
            </div>
          </div>

          <!-- Amounts -->
          <div class="flex justify-between text-xs">
            <div>
              <p class="text-surface-400">Spent</p>
              <p class="font-semibold text-surface-900 mt-0.5">{{ fmt(budget.spent) }}</p>
            </div>
            <div class="text-right">
              <p class="text-surface-400">{{ budget.remaining >= 0 ? 'Remaining' : 'Over by' }}</p>
              <p
                class="font-semibold mt-0.5"
                :class="budget.remaining >= 0 ? 'text-surface-900' : 'text-red-600'"
              >
                {{ fmt(Math.abs(budget.remaining)) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-surface-400">Limit</p>
              <p class="font-semibold text-surface-900 mt-0.5">{{ fmt(budget.amount) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <AppModal
      v-if="showModal"
      :title="editingBudget ? 'Edit Budget' : 'Add Budget'"
      size="sm"
      @close="closeModal"
    >
      <form class="p-6 space-y-4" @submit.prevent="submitBudget">
        <!-- Category selector (disabled when editing — can't change category) -->
        <AppSelect
          v-model="categoryIdVal"
          label="Category"
          :disabled="!!editingBudget"
          :error="categoryIdErr"
        >
          <option value="">Overall Spending</option>
          <option
            v-for="cat in expenseCategories"
            :key="cat.id"
            :value="cat.id"
            :disabled="budgetedCategoryIds.has(cat.id)"
          >
            {{ cat.name }}{{ budgetedCategoryIds.has(cat.id) ? ' (already budgeted)' : '' }}
          </option>
        </AppSelect>

        <AppInput
          v-model="amountVal"
          type="number"
          label="Monthly limit"
          placeholder="e.g. 5000"
          step="0.01"
          min="0.01"
          :error="amountErr"
        />

        <div class="flex gap-2 pt-1">
          <AppButton type="submit" class="flex-1" :loading="isSubmitting">
            {{ editingBudget ? 'Save Changes' : 'Create Budget' }}
          </AppButton>
          <AppButton type="button" variant="ghost" class="flex-1" @click="closeModal">
            Cancel
          </AppButton>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
