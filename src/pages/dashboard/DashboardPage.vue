<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { transactionsApi } from '@/api/transactions'
import { useMasterDataStore } from '@/stores/masterData'
import AppShell from '@/components/layout/AppShell.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { formatCurrency, formatDate, extractErrorMessage } from '@/utils'
import type { Transaction } from '@/types'
import { RouterLink } from 'vue-router'

const toast = useToast()
const masterData = useMasterDataStore()

// ─── Period filter ─────────────────────────────────────────────────────────────
type PeriodKey =
  | 'this_month'
  | 'last_month'
  | '3_months'
  | '6_months'
  | 'this_year'
  | 'this_fy'
  | 'last_fy'

const PERIODS: { key: PeriodKey; label: string; shortLabel: string }[] = [
  { key: 'this_month', label: 'This Month', shortLabel: 'This Mo.' },
  { key: 'last_month', label: 'Last Month', shortLabel: 'Last Mo.' },
  { key: '3_months', label: 'Last 3 Months', shortLabel: '3 Mo.' },
  { key: '6_months', label: 'Last 6 Months', shortLabel: '6 Mo.' },
  { key: 'this_year', label: 'This Year', shortLabel: 'YTD' },
  { key: 'this_fy', label: 'This FY', shortLabel: 'This FY' },
  { key: 'last_fy', label: 'Last FY', shortLabel: 'Last FY' },
]

const selectedPeriod = ref<PeriodKey>('this_month')
const selectedPeriodLabel = computed(
  () => PERIODS.find((p) => p.key === selectedPeriod.value)?.label ?? '',
)

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateRange(key: PeriodKey): { from: string; to: string } {
  const today = new Date()
  const todayStr = fmtDate(today)

  switch (key) {
    case 'this_month':
      return { from: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: todayStr }
    case 'last_month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: fmtDate(from), to: fmtDate(to) }
    }
    case '3_months':
      return {
        from: fmtDate(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
        to: todayStr,
      }
    case '6_months':
      return {
        from: fmtDate(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
        to: todayStr,
      }
    case 'this_year':
      return { from: `${today.getFullYear()}-01-01`, to: todayStr }
    case 'this_fy': {
      // Indian FY: April 1 – March 31
      const fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
      return { from: fmtDate(new Date(fyYear, 3, 1)), to: todayStr }
    }
    case 'last_fy': {
      const fyYear = (today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1) - 1
      return {
        from: fmtDate(new Date(fyYear, 3, 1)),
        to: fmtDate(new Date(fyYear + 1, 2, 31)),
      }
    }
  }
}

/** Returns monthly buckets [{from, to, label}] covering the range */
function getMonthBuckets(from: string, to: string) {
  const buckets: { from: string; to: string; label: string }[] = []
  const end = new Date(to + 'T00:00:00')
  let cursor = new Date(from + 'T00:00:00')
  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1)

  while (cursor <= end) {
    const mStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    buckets.push({
      from: fmtDate(mStart < new Date(from + 'T00:00:00') ? new Date(from + 'T00:00:00') : mStart),
      to: fmtDate(mEnd > end ? end : mEnd),
      label: cursor.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
    })
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }
  return buckets
}

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const chartsLoading = ref(false)
const chartTransactions = ref<Transaction[]>([])
const recentTransactions = ref<Transaction[]>([])
const barData = ref<{ months: string[]; income: number[]; expense: number[] }>({
  months: [],
  income: [],
  expense: [],
})

// ─── Summary Computeds ─────────────────────────────────────────────────────────
const totalIncome = computed(() =>
  chartTransactions.value
    .filter((t) => masterData.getCategoryById(t.category_id)?.type === 'income')
    .reduce((s, t) => s + t.amount, 0),
)
const totalExpense = computed(() =>
  chartTransactions.value
    .filter((t) => masterData.getCategoryById(t.category_id)?.type === 'expense')
    .reduce((s, t) => s + t.amount, 0),
)
const netBalance = computed(() => totalIncome.value - totalExpense.value)

const savingsRate = computed(() =>
  totalIncome.value > 0
    ? Math.round(((totalIncome.value - totalExpense.value) / totalIncome.value) * 100)
    : null,
)

const topExpenseCategories = computed(() => {
  const grouped: Record<string, { name: string; amount: number }> = {}
  for (const t of chartTransactions.value) {
    const cat = masterData.getCategoryById(t.category_id)
    if (cat?.type === 'expense') {
      if (!grouped[cat.id]) grouped[cat.id] = { name: cat.name, amount: 0 }
      grouped[cat.id]!.amount += t.amount
    }
  }
  return Object.values(grouped)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((e) => ({ ...e, pct: totalExpense.value > 0 ? (e.amount / totalExpense.value) * 100 : 0 }))
})

const topIncomeCategories = computed(() => {
  const grouped: Record<string, { name: string; amount: number }> = {}
  for (const t of chartTransactions.value) {
    const cat = masterData.getCategoryById(t.category_id)
    if (cat?.type === 'income') {
      if (!grouped[cat.id]) grouped[cat.id] = { name: cat.name, amount: 0 }
      grouped[cat.id]!.amount += t.amount
    }
  }
  return Object.values(grouped)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((e) => ({ ...e, pct: totalIncome.value > 0 ? (e.amount / totalIncome.value) * 100 : 0 }))
})

// ─── Chart Options ─────────────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
]
const PM_COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
]

const pieOptions = computed(() => {
  const grouped: Record<string, number> = {}
  for (const t of chartTransactions.value) {
    const cat = masterData.getCategoryById(t.category_id)
    if (cat?.type === 'expense') grouped[cat.name] = (grouped[cat.name] || 0) + t.amount
  }
  return {
    labels: Object.keys(grouped),
    series: Object.values(grouped),
    chart: { type: 'donut' as const, height: 300, toolbar: { show: false } },
    legend: { position: 'bottom' as const },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '65%' } } },
    colors: CATEGORY_COLORS,
    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
  }
})

const pmPieOptions = computed(() => {
  const grouped: Record<string, number> = {}
  for (const t of chartTransactions.value) {
    const cat = masterData.getCategoryById(t.category_id)
    if (cat?.type === 'expense') {
      const pmName = masterData.getPaymentMethodById(t.payment_method_id)?.name ?? 'Unknown'
      grouped[pmName] = (grouped[pmName] || 0) + t.amount
    }
  }
  return {
    labels: Object.keys(grouped),
    series: Object.values(grouped),
    chart: { type: 'donut' as const, height: 300, toolbar: { show: false } },
    legend: { position: 'bottom' as const },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '65%' } } },
    colors: PM_COLORS,
    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
  }
})

const barOptions = computed(() => ({
  chart: { type: 'bar' as const, height: 280, toolbar: { show: false } },
  series: [
    { name: 'Income', data: barData.value.income, color: '#10b981' },
    { name: 'Expense', data: barData.value.expense, color: '#ef4444' },
  ],
  xaxis: { categories: barData.value.months },
  yaxis: {
    labels: { formatter: (v: number) => formatCurrency(v, 'INR', 'en-IN').replace('₹', '₹') },
  },
  dataLabels: { enabled: false },
  plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
  legend: { position: 'top' as const },
  tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
}))

// ─── Data loading ──────────────────────────────────────────────────────────────
function toTransaction(raw: unknown): Transaction {
  return { ...(raw as Transaction), amount: Number((raw as Transaction).amount) }
}

async function loadCharts() {
  chartsLoading.value = true
  try {
    const { from, to } = getDateRange(selectedPeriod.value)
    const buckets = getMonthBuckets(from, to)

    // One request per month bucket — reuse results for both bar chart and aggregate donuts
    const bucketResults = await Promise.all(
      buckets.map((b) =>
        transactionsApi.list({ date_from: b.from, date_to: b.to, page_size: 500 }),
      ),
    )

    const months: string[] = []
    const income: number[] = []
    const expense: number[] = []
    const allTxns: Transaction[] = []

    buckets.forEach((b, i) => {
      const res = bucketResults[i]
      if (res?.data.success) {
        const txns = (res.data.data as unknown as Transaction[]).map(toTransaction)
        allTxns.push(...txns)
        months.push(b.label)
        income.push(
          txns
            .filter((t) => masterData.getCategoryById(t.category_id)?.type === 'income')
            .reduce((s, t) => s + t.amount, 0),
        )
        expense.push(
          txns
            .filter((t) => masterData.getCategoryById(t.category_id)?.type === 'expense')
            .reduce((s, t) => s + t.amount, 0),
        )
      }
    })

    // Donuts and summary cards use the merged set of all bucket transactions
    chartTransactions.value = allTxns
    barData.value = { months, income, expense }
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    chartsLoading.value = false
  }
}

async function loadDashboard() {
  loading.value = true
  try {
    const recentRes = await transactionsApi.list({ page: 1, page_size: 10 })
    if (recentRes.data.success)
      recentTransactions.value = (recentRes.data.data as unknown as Transaction[]).map(
        toTransaction,
      )
    await loadCharts()
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

watch(selectedPeriod, loadCharts)
onMounted(loadDashboard)
</script>

<template>
  <AppShell>
    <!-- ─── Skeleton (initial load) ──────────────────────────────────────── -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <!-- Period picker -->
      <div class="flex flex-wrap gap-1.5">
        <AppSkeleton v-for="i in 7" :key="i" h="h-7" w="w-20" pill />
      </div>
      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm space-y-3"
        >
          <AppSkeleton h="h-3" w="w-28" />
          <AppSkeleton h="h-7" w="w-36" />
        </div>
      </div>
      <!-- Charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm space-y-3"
        >
          <AppSkeleton h="h-4" w="w-40" />
          <AppSkeleton h="h-3" w="w-28" />
          <AppSkeleton h="h-56" />
        </div>
      </div>
      <!-- Top categories -->
      <div class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm">
        <AppSkeleton h="h-4" w="w-40" class="mb-5" />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div v-for="col in 2" :key="col" class="space-y-3">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3">
              <AppSkeleton h="h-3" w="w-24" />
              <AppSkeleton h="h-2" class="flex-1" pill />
              <AppSkeleton h="h-3" w="w-16" />
            </div>
          </div>
        </div>
      </div>
      <!-- Recent transactions -->
      <div class="bg-white rounded-xl border border-surface-100 shadow-sm">
        <div class="px-5 py-4 border-b border-surface-100">
          <AppSkeleton h="h-4" w="w-40" />
        </div>
        <div class="divide-y divide-surface-50">
          <div v-for="i in 5" :key="i" class="px-5 py-3.5 flex items-center gap-4">
            <div class="flex-1 space-y-2">
              <AppSkeleton h="h-3.5" w="w-48" />
              <AppSkeleton h="h-3" w="w-32" />
            </div>
            <AppSkeleton h="h-4" w="w-20" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- Period Picker -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in PERIODS"
          :key="p.key"
          class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
          :class="
            selectedPeriod === p.key
              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
              : 'bg-white text-surface-600 border-surface-200 hover:border-primary-400 hover:text-primary-600'
          "
          @click="selectedPeriod = p.key"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Income -->
        <div class="bg-white rounded-xl border border-surface-100 p-5 space-y-1 shadow-sm">
          <p class="text-xs font-medium text-surface-500 uppercase tracking-wide">
            Total Income
            <span class="normal-case font-normal text-surface-400"
              >— {{ selectedPeriodLabel }}</span
            >
          </p>
          <p class="text-2xl font-bold text-income">{{ formatCurrency(totalIncome) }}</p>
        </div>
        <!-- Expense -->
        <div class="bg-white rounded-xl border border-surface-100 p-5 space-y-1 shadow-sm">
          <p class="text-xs font-medium text-surface-500 uppercase tracking-wide">
            Total Expense
            <span class="normal-case font-normal text-surface-400"
              >— {{ selectedPeriodLabel }}</span
            >
          </p>
          <p class="text-2xl font-bold text-expense">{{ formatCurrency(totalExpense) }}</p>
        </div>
        <!-- Net Balance -->
        <div class="bg-white rounded-xl border border-surface-100 p-5 space-y-1 shadow-sm">
          <p class="text-xs font-medium text-surface-500 uppercase tracking-wide">
            Net Balance
            <span class="normal-case font-normal text-surface-400"
              >— {{ selectedPeriodLabel }}</span
            >
          </p>
          <p class="text-2xl font-bold" :class="netBalance >= 0 ? 'text-income' : 'text-expense'">
            {{ netBalance >= 0 ? '+' : '' }}{{ formatCurrency(netBalance) }}
          </p>
        </div>
        <!-- Savings Rate -->
        <div class="bg-white rounded-xl border border-surface-100 p-5 space-y-1 shadow-sm">
          <p class="text-xs font-medium text-surface-500 uppercase tracking-wide">
            Savings Rate
            <span class="normal-case font-normal text-surface-400"
              >— {{ selectedPeriodLabel }}</span
            >
          </p>
          <p
            class="text-2xl font-bold"
            :class="
              savingsRate === null
                ? 'text-surface-400'
                : savingsRate >= 20
                  ? 'text-income'
                  : savingsRate >= 0
                    ? 'text-amber-500'
                    : 'text-expense'
            "
          >
            {{ savingsRate === null ? '—' : `${savingsRate}%` }}
          </p>
        </div>
      </div>

      <!-- Charts -->
      <div class="relative">
        <!-- loading overlay on period switch -->
        <div
          v-if="chartsLoading"
          class="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-xl backdrop-blur-[2px]"
        >
          <AppSpinner size="lg" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <!-- Expense Donut -->
          <div class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm">
            <h2 class="text-sm font-semibold text-surface-700 mb-1">Expense by Category</h2>
            <p class="text-xs text-surface-400 mb-4">{{ selectedPeriodLabel }}</p>
            <template v-if="pieOptions.series.length > 0">
              <VueApexCharts
                type="donut"
                height="300"
                :options="pieOptions"
                :series="pieOptions.series"
              />
            </template>
            <div v-else class="flex items-center justify-center h-48 text-surface-400 text-sm">
              No expense data for this period
            </div>
          </div>

          <!-- Income vs Expense Bar -->
          <div class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm">
            <h2 class="text-sm font-semibold text-surface-700 mb-1">Income vs Expense</h2>
            <p class="text-xs text-surface-400 mb-4">
              {{ selectedPeriodLabel }} · monthly breakdown
            </p>
            <VueApexCharts
              type="bar"
              height="280"
              :options="barOptions"
              :series="barOptions.series"
            />
          </div>

          <!-- Expense by Payment Method Donut -->
          <div class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm">
            <h2 class="text-sm font-semibold text-surface-700 mb-1">Expense by Payment Method</h2>
            <p class="text-xs text-surface-400 mb-4">{{ selectedPeriodLabel }}</p>
            <template v-if="pmPieOptions.series.length > 0">
              <VueApexCharts
                type="donut"
                height="300"
                :options="pmPieOptions"
                :series="pmPieOptions.series"
              />
            </template>
            <div v-else class="flex items-center justify-center h-48 text-surface-400 text-sm">
              No expense data for this period
            </div>
          </div>
        </div>
      </div>

      <!-- Top Categories -->
      <div class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-sm font-semibold text-surface-700">Top Categories</h2>
          <span class="text-xs text-surface-400">{{ selectedPeriodLabel }}</span>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          <!-- Top Expense -->
          <div>
            <p class="text-xs font-medium text-surface-500 uppercase tracking-wide mb-3">Expense</p>
            <div
              v-if="topExpenseCategories.length === 0"
              class="text-sm text-surface-400 py-4 text-center"
            >
              No expense data
            </div>
            <ul v-else class="space-y-3">
              <li v-for="cat in topExpenseCategories" :key="cat.name" class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium text-surface-800 truncate max-w-[60%]">{{
                    cat.name
                  }}</span>
                  <span class="text-surface-500 shrink-0">
                    {{ formatCurrency(cat.amount) }}
                    <span class="text-surface-400 ml-1">{{ Math.round(cat.pct) }}%</span>
                  </span>
                </div>
                <div class="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    class="h-1.5 bg-expense rounded-full transition-all duration-500"
                    :style="{ width: `${cat.pct}%` }"
                  />
                </div>
              </li>
            </ul>
          </div>
          <!-- Top Income -->
          <div>
            <p class="text-xs font-medium text-surface-500 uppercase tracking-wide mb-3">Income</p>
            <div
              v-if="topIncomeCategories.length === 0"
              class="text-sm text-surface-400 py-4 text-center"
            >
              No income data
            </div>
            <ul v-else class="space-y-3">
              <li v-for="cat in topIncomeCategories" :key="cat.name" class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium text-surface-800 truncate max-w-[60%]">{{
                    cat.name
                  }}</span>
                  <span class="text-surface-500 shrink-0">
                    {{ formatCurrency(cat.amount) }}
                    <span class="text-surface-400 ml-1">{{ Math.round(cat.pct) }}%</span>
                  </span>
                </div>
                <div class="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    class="h-1.5 bg-income rounded-full transition-all duration-500"
                    :style="{ width: `${cat.pct}%` }"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white rounded-xl border border-surface-100 shadow-sm">
        <div class="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-surface-700">Recent Transactions</h2>
          <RouterLink
            to="/transactions"
            class="text-xs text-primary-600 hover:underline font-medium"
          >
            View all
          </RouterLink>
        </div>

        <div
          v-if="recentTransactions.length === 0"
          class="px-5 py-10 text-center text-sm text-surface-400"
        >
          No transactions yet.
        </div>

        <ul v-else class="divide-y divide-surface-50">
          <li
            v-for="txn in recentTransactions"
            :key="txn.id"
            class="flex items-center gap-4 px-5 py-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900 truncate">
                {{ txn.description || masterData.getCategoryById(txn.category_id)?.name }}
              </p>
              <p class="text-xs text-surface-400">
                {{ formatDate(txn.date) }} ·
                {{ masterData.getCategoryById(txn.category_id)?.name }} ·
                {{ masterData.getPaymentMethodById(txn.payment_method_id)?.name }}
              </p>
            </div>
            <span
              class="text-sm font-semibold shrink-0"
              :class="
                masterData.getCategoryById(txn.category_id)?.type === 'income'
                  ? 'text-income'
                  : 'text-expense'
              "
            >
              {{ masterData.getCategoryById(txn.category_id)?.type === 'income' ? '+' : '-'
              }}{{ formatCurrency(txn.amount) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>
