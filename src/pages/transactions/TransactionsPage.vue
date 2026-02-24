<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBreakpoints, breakpointsTailwind, useDebounceFn } from '@vueuse/core'
import { useTransactionStore } from '@/stores/transactions'
import { useMasterDataStore } from '@/stores/masterData'
import { transactionsApi } from '@/api/transactions'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { formatCurrency, formatDate, extractErrorMessage } from '@/utils'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import TransactionFormModal from '@/components/transactions/TransactionFormModal.vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { Transaction, TransactionFilters } from '@/types'

const txnStore = useTransactionStore()
const masterData = useMasterDataStore()
const { confirm } = useConfirm()
const toast = useToast()

// ─── Filters ─────────────────────────────────────────────────────────────────
const showFilters = ref(false)
const bp = useBreakpoints(breakpointsTailwind)
const isSm = bp.greaterOrEqual('sm')
const filtersVisible = computed(() => isSm.value || showFilters.value)
const filterSearch = ref('')
const filterType = ref('')
const filterCategory = ref('')
const filterPaymentMethod = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')

function buildFilters(): TransactionFilters {
  const f: TransactionFilters = {}
  if (filterSearch.value) f.q = filterSearch.value
  if (filterType.value) f.type = filterType.value as 'income' | 'expense'
  if (filterCategory.value) f.category_id = filterCategory.value
  if (filterPaymentMethod.value) f.payment_method_id = filterPaymentMethod.value
  if (filterDateFrom.value) f.date_from = filterDateFrom.value
  if (filterDateTo.value) f.date_to = filterDateTo.value
  return f
}

async function applyFilters() {
  await txnStore.fetchTransactions(buildFilters())
}

function resetFilters() {
  filterSearch.value = ''
  filterType.value = ''
  filterCategory.value = ''
  filterPaymentMethod.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  txnStore.fetchTransactions({})
}

// Debounced live search — fires 400 ms after the user stops typing
const debouncedSearch = useDebounceFn(() => applyFilters(), 400)
watch(filterSearch, () => debouncedSearch())

// Count active filters for the badge
const activeFilterCount = computed(() => {
  let n = 0
  if (filterSearch.value) n++
  if (filterType.value) n++
  if (filterCategory.value) n++
  if (filterPaymentMethod.value) n++
  if (filterDateFrom.value) n++
  if (filterDateTo.value) n++
  return n
})

// ─── Modal ────────────────────────────────────────────────────────────────────
const showModal = ref(false)
const editTarget = ref<Transaction | null>(null)

function openAdd() {
  editTarget.value = null
  showModal.value = true
}

function openEdit(txn: Transaction) {
  editTarget.value = txn
  showModal.value = true
}

function onSaved() {
  showModal.value = false
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function handleDelete(txn: Transaction) {
  const ok = await confirm({
    title: 'Delete Transaction',
    message: `Are you sure you want to delete this transaction of ${formatCurrency(txn.amount)}? This cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  try {
    await txnStore.deleteTransaction(txn.id)
    toast.success('Transaction deleted')
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
const exportLoading = ref(false)
const showExportModal = ref(false)
const exportDateFrom = ref('')
const exportDateTo = ref('')

function openExportModal() {
  exportDateFrom.value = ''
  exportDateTo.value = ''
  showExportModal.value = true
}

function setExportPreset(preset: 'this_month' | 'last_month' | 'last_3_months' | 'all') {
  const now = new Date()
  if (preset === 'this_month') {
    exportDateFrom.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    exportDateTo.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  } else if (preset === 'last_month') {
    exportDateFrom.value = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    exportDateTo.value = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
  } else if (preset === 'last_3_months') {
    exportDateFrom.value = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10)
    exportDateTo.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  } else {
    exportDateFrom.value = ''
    exportDateTo.value = ''
  }
}

async function exportCSV() {
  exportLoading.value = true
  try {
    const filters: TransactionFilters = {}
    if (exportDateFrom.value) filters.date_from = exportDateFrom.value
    if (exportDateTo.value) filters.date_to = exportDateTo.value
    const res = await transactionsApi.export(filters)
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
    showExportModal.value = false
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => txnStore.fetchTransactions({}))
</script>

<template>
  <AppShell>
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-surface-900">All Transactions</h2>
          <p class="text-xs text-surface-400 mt-0.5">{{ txnStore.total }} total records</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Export button (mobile only) -->
          <button
            class="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-200 text-sm font-medium text-surface-600 bg-white hover:bg-surface-50 transition-colors"
            @click="openExportModal"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <!-- Filter toggle (mobile only) -->
          <button
            class="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-200 text-sm font-medium text-surface-600 bg-white hover:bg-surface-50 transition-colors"
            @click="showFilters = !showFilters"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            Filters
            <span
              v-if="activeFilterCount > 0"
              class="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary-600 text-white text-[10px] font-bold"
              >{{ activeFilterCount }}</span
            >
          </button>
          <!-- Add + Export buttons (desktop) -->
          <AppButton
            variant="outline"
            class="hidden sm:flex"
            @click="openExportModal"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </AppButton>
          <AppButton class="hidden sm:flex" @click="openAdd">
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </AppButton>
        </div>
      </div>

      <!-- Filters: always visible on sm+, toggle on mobile -->
      <Transition name="sheet">
        <div
          v-show="filtersVisible"
          class="bg-white rounded-xl border border-surface-100 p-4 shadow-sm"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <!-- Search spans full width on mobile, 2 cols on sm, 3 cols on lg -->
            <AppInput
              v-model="filterSearch"
              placeholder="Search description…"
              class="sm:col-span-2 lg:col-span-3"
              @keydown.enter="applyFilters"
            />
            <AppSelect v-model="filterType">
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </AppSelect>

            <AppSelect v-model="filterCategory">
              <option value="">All Categories</option>
              <option v-for="c in masterData.categories" :key="c.id" :value="c.id">
                {{ c.icon ? c.icon + ' ' : '' }}{{ c.name }}
              </option>
            </AppSelect>

            <AppSelect v-model="filterPaymentMethod">
              <option value="">All Methods</option>
              <option v-for="pm in masterData.paymentMethods" :key="pm.id" :value="pm.id">
                {{ pm.name }}
              </option>
            </AppSelect>

            <AppInput v-model="filterDateFrom" type="date" placeholder="From date" />
            <AppInput v-model="filterDateTo" type="date" placeholder="To date" />
          </div>
          <div class="flex gap-2 mt-3">
            <AppButton variant="primary" size="sm" @click="applyFilters">Apply Filters</AppButton>
            <AppButton variant="ghost" size="sm" @click="resetFilters">Reset</AppButton>
          </div>
        </div>
      </Transition>

      <!-- Table + Pagination wrapped in page-fade transition -->
      <Transition name="page-fade" mode="out-in">
        <div :key="`${txnStore.page}-${txnStore.loading}`" class="space-y-4">
          <!-- Table/List -->
          <div class="bg-white rounded-xl border border-surface-100 shadow-sm overflow-hidden">
            <div v-if="txnStore.loading">
              <!-- Desktop skeleton -->
              <div class="hidden sm:block animate-pulse">
                <div
                  v-for="i in 8"
                  :key="i"
                  class="flex items-center gap-4 px-5 py-3.5 border-b border-surface-50 last:border-0"
                >
                  <AppSkeleton h="h-3" w="w-20" />
                  <AppSkeleton h="h-3" w="w-44" />
                  <AppSkeleton h="h-5" w="w-24" pill />
                  <AppSkeleton h="h-3" w="w-24" />
                  <AppSkeleton h="h-3" w="w-16" class="ml-auto" />
                  <AppSkeleton h="h-3" w="w-14" />
                </div>
              </div>
              <!-- Mobile skeleton -->
              <div class="sm:hidden animate-pulse divide-y divide-surface-50">
                <div v-for="i in 6" :key="i" class="px-4 py-3.5 flex items-start gap-3">
                  <div class="flex-1 space-y-2">
                    <AppSkeleton h="h-3.5" w="w-40" />
                    <AppSkeleton h="h-3" w="w-28" />
                    <AppSkeleton h="h-5" w="w-20" pill />
                  </div>
                  <AppSkeleton h="h-4" w="w-16" />
                </div>
              </div>
            </div>

            <div v-else-if="txnStore.items.length === 0">
              <AppEmptyState
                v-if="activeFilterCount === 0"
                title="No transactions yet"
                description="Start tracking your income and expenses by adding your first transaction."
              >
                <AppButton @click="openAdd">Add Transaction</AppButton>
              </AppEmptyState>
              <AppEmptyState
                v-else
                title="No results"
                description="No transactions match your current filters."
              >
                <AppButton variant="ghost" size="sm" @click="resetFilters">Clear Filters</AppButton>
              </AppEmptyState>
            </div>

            <template v-else>
              <!-- Desktop table -->
              <div class="hidden sm:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="border-b border-surface-100">
                    <tr class="text-xs font-medium text-surface-500 uppercase tracking-wide">
                      <th class="px-5 py-3 text-left">Date</th>
                      <th class="px-5 py-3 text-left">Description</th>
                      <th class="px-5 py-3 text-left">Category</th>
                      <th class="px-5 py-3 text-left">Method</th>
                      <th class="px-5 py-3 text-right">Amount</th>
                      <th class="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-surface-50">
                    <tr
                      v-for="txn in txnStore.items"
                      :key="txn.id"
                      class="hover:bg-surface-50 transition-colors"
                    >
                      <td class="px-5 py-3 text-surface-500 whitespace-nowrap">
                        {{ formatDate(txn.date) }}
                      </td>
                      <td class="px-5 py-3 text-surface-900 max-w-50 truncate">
                        {{ txn.description || '—' }}
                      </td>
                      <td class="px-5 py-3">
                        <AppBadge
                          :variant="
                            masterData.getCategoryById(txn.category_id)?.type === 'income'
                              ? 'income'
                              : 'expense'
                          "
                        >
                          {{ masterData.getCategoryById(txn.category_id)?.name }}
                        </AppBadge>
                      </td>
                      <td class="px-5 py-3 text-surface-500">
                        {{ masterData.getPaymentMethodById(txn.payment_method_id)?.name }}
                      </td>
                      <td
                        class="px-5 py-3 text-right font-semibold whitespace-nowrap"
                        :class="
                          masterData.getCategoryById(txn.category_id)?.type === 'income'
                            ? 'text-income'
                            : 'text-expense'
                        "
                      >
                        {{
                          masterData.getCategoryById(txn.category_id)?.type === 'income'
                            ? '+'
                            : '-'
                        }}{{ formatCurrency(txn.amount) }}
                      </td>
                      <td class="px-5 py-3">
                        <div class="flex items-center justify-end gap-1">
                          <AppIconButton icon="edit" title="Edit" @click="openEdit(txn)" />
                          <AppIconButton icon="delete" title="Delete" @click="handleDelete(txn)" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile card list -->
              <ul class="sm:hidden divide-y divide-surface-50">
                <li
                  v-for="txn in txnStore.items"
                  :key="txn.id"
                  class="px-4 py-3 flex items-start gap-3"
                >
                  <div class="flex-1 min-w-0 space-y-0.5">
                    <p class="text-sm font-medium text-surface-900 truncate">
                      {{ txn.description || masterData.getCategoryById(txn.category_id)?.name }}
                    </p>
                    <p class="text-xs text-surface-400">
                      {{ formatDate(txn.date) }} ·
                      {{ masterData.getPaymentMethodById(txn.payment_method_id)?.name }}
                    </p>
                    <AppBadge
                      :variant="
                        masterData.getCategoryById(txn.category_id)?.type === 'income'
                          ? 'income'
                          : 'expense'
                      "
                      size="sm"
                    >
                      {{ masterData.getCategoryById(txn.category_id)?.name }}
                    </AppBadge>
                  </div>
                  <div class="flex flex-col items-end gap-2 shrink-0">
                    <span
                      class="text-sm font-semibold"
                      :class="
                        masterData.getCategoryById(txn.category_id)?.type === 'income'
                          ? 'text-income'
                          : 'text-expense'
                      "
                    >
                      {{ masterData.getCategoryById(txn.category_id)?.type === 'income' ? '+' : '-'
                      }}{{ formatCurrency(txn.amount) }}
                    </span>
                    <div class="flex gap-1">
                      <AppIconButton icon="edit" size="sm" @click="openEdit(txn)" />
                      <AppIconButton icon="delete" size="sm" @click="handleDelete(txn)" />
                    </div>
                  </div>
                </li>
              </ul>
            </template>
          </div>

          <!-- Pagination -->
          <AppPagination
            v-if="txnStore.pages > 1"
            :current-page="txnStore.page"
            :total-pages="txnStore.pages"
            @change="txnStore.goToPage"
          />
        </div>
      </Transition>
    </div>

    <!-- Mobile FAB: Add Transaction -->
    <button
      class="fixed bottom-20 right-4 z-30 lg:hidden h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-300/50 flex items-center justify-center active:scale-95 transition-transform hover:bg-primary-700"
      aria-label="Add Transaction"
      @click="openAdd"
    >
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Export CSV Modal -->
    <AppModal v-if="showExportModal" title="Export Transactions" size="sm" @close="showExportModal = false">
      <div class="px-6 py-5 space-y-5">
        <!-- Quick presets -->
        <div>
          <p class="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2">Quick Range</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in [
                { key: 'this_month', label: 'This Month' },
                { key: 'last_month', label: 'Last Month' },
                { key: 'last_3_months', label: 'Last 3 Months' },
                { key: 'all', label: 'All Time' },
              ]"
              :key="preset.key"
              class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              :class="
                (preset.key === 'all' && exportDateFrom === '' && exportDateTo === '') ||
                (preset.key === 'this_month' &&
                  exportDateFrom === new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]) ||
                (preset.key === 'last_month' &&
                  exportDateFrom === new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0] &&
                  exportDateTo === new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]) ||
                (preset.key === 'last_3_months' &&
                  exportDateFrom === new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0])
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
              "
              @click="setExportPreset(preset.key as 'this_month' | 'last_month' | 'last_3_months' | 'all')"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Custom date range -->
        <div>
          <p class="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2">Custom Range (optional)</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-surface-500 mb-1">From</label>
              <AppInput v-model="exportDateFrom" type="date" />
            </div>
            <div>
              <label class="block text-xs text-surface-500 mb-1">To</label>
              <AppInput v-model="exportDateTo" type="date" />
            </div>
          </div>
        </div>

        <p class="text-xs text-surface-400">
          Leave blank to export all transactions.
        </p>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 px-6 py-4 border-t border-surface-100">
        <AppButton variant="ghost" @click="showExportModal = false">Cancel</AppButton>
        <AppButton variant="primary" :loading="exportLoading" @click="exportCSV">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </AppButton>
      </div>
    </AppModal>

    <!-- Transaction Modal -->
    <TransactionFormModal
      v-if="showModal"
      :edit-target="editTarget"
      @close="showModal = false"
      @saved="onSaved"
    />
  </AppShell>
</template>
