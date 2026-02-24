<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { transactionsApi } from '@/api/transactions'
import { useMasterDataStore } from '@/stores/masterData'
import AppShell from '@/components/layout/AppShell.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useToast } from '@/composables/useToast'
import { formatCurrency, formatDate, extractErrorMessage } from '@/utils'
import type { Transaction, TransactionSummary } from '@/types'
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
const periodSummary = ref<TransactionSummary | null>(null)
const prevSummary = ref<TransactionSummary | null>(null)
const pmTransactions = ref<Transaction[]>([])
const recentTransactions = ref<Transaction[]>([])
const barData = ref<{ months: string[]; income: number[]; expense: number[] }>({
  months: [],
  income: [],
  expense: [],
})

// ─── Summary Computeds ─────────────────────────────────────────────────────────
const totalIncome = computed(() => periodSummary.value?.total_income ?? 0)
const totalExpense = computed(() => periodSummary.value?.total_expense ?? 0)
const netBalance = computed(() => periodSummary.value?.net ?? 0)

const savingsRate = computed(() =>
  totalIncome.value > 0
    ? Math.round(((totalIncome.value - totalExpense.value) / totalIncome.value) * 100)
    : null,
)

// ─── MoM delta helpers ──────────────────────────────────────────────────────────
function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((cur - prev) / prev) * 100)
}
const incomeDelta = computed(() =>
  pctChange(totalIncome.value, prevSummary.value?.total_income ?? 0),
)
const expenseDelta = computed(() =>
  pctChange(totalExpense.value, prevSummary.value?.total_expense ?? 0),
)
const netDelta = computed(() => pctChange(netBalance.value, prevSummary.value?.net ?? 0))

/** Returns the previous equivalent date range for period-over-period comparison */
function getPrevDateRange(key: PeriodKey): { from: string; to: string } {
  const today = new Date()
  switch (key) {
    case 'this_month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: fmtDate(from), to: fmtDate(to) }
    }
    case 'last_month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      const to = new Date(today.getFullYear(), today.getMonth() - 1, 0)
      return { from: fmtDate(from), to: fmtDate(to) }
    }
    case '3_months':
      return {
        from: fmtDate(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
        to: fmtDate(new Date(today.getFullYear(), today.getMonth() - 3, 0)),
      }
    case '6_months':
      return {
        from: fmtDate(new Date(today.getFullYear(), today.getMonth() - 11, 1)),
        to: fmtDate(new Date(today.getFullYear(), today.getMonth() - 6, 0)),
      }
    case 'this_year':
      return { from: `${today.getFullYear() - 1}-01-01`, to: `${today.getFullYear() - 1}-12-31` }
    case 'this_fy': {
      const fyYear = (today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1) - 1
      return {
        from: fmtDate(new Date(fyYear, 3, 1)),
        to: fmtDate(new Date(fyYear + 1, 2, 31)),
      }
    }
    case 'last_fy': {
      const fyYear = (today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1) - 2
      return {
        from: fmtDate(new Date(fyYear, 3, 1)),
        to: fmtDate(new Date(fyYear + 1, 2, 31)),
      }
    }
  }
}

const topExpenseCategories = computed(() =>
  (periodSummary.value?.category_breakdown ?? [])
    .filter((c) => c.type === 'expense')
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      amount: c.total,
      pct: totalExpense.value > 0 ? (c.total / totalExpense.value) * 100 : 0,
    }))
)

const topIncomeCategories = computed(() =>
  (periodSummary.value?.category_breakdown ?? [])
    .filter((c) => c.type === 'income')
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      amount: c.total,
      pct: totalIncome.value > 0 ? (c.total / totalIncome.value) * 100 : 0,
    }))
)

// ─── Quick Stats ──────────────────────────────────────────────────────────────
const daysInPeriod = computed(() => {
  const { from, to } = getDateRange(selectedPeriod.value)
  return (
    Math.ceil(
      (new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()) /
        86_400_000,
    ) + 1
  )
})

const avgDailySpend = computed(() =>
  totalExpense.value > 0 ? totalExpense.value / daysInPeriod.value : 0,
)

const biggestExpense = computed(() =>
  pmTransactions.value
    .filter((t) => masterData.getCategoryById(t.category_id)?.type === 'expense')
    .reduce((max, t) => (t.amount > max ? t.amount : max), 0),
)

const txCount = computed(() => periodSummary.value?.transaction_count ?? 0)

const topExpenseCategoryName = computed(
  () =>
    (periodSummary.value?.category_breakdown ?? [])
      .filter((c) => c.type === 'expense')
      .sort((a, b) => b.total - a.total)[0]?.name ?? '—',
)

// ─── Daily Cashflow area chart ────────────────────────────────────────────────
const dailyCashflowData = computed(() => {
  const expByDay: Record<string, number> = {}
  const incByDay: Record<string, number> = {}
  for (const t of pmTransactions.value) {
    const day = (t.date as string).split('T')[0]
    const type = masterData.getCategoryById(t.category_id)?.type
    if (type === 'expense') expByDay[day] = (expByDay[day] ?? 0) + t.amount
    if (type === 'income') incByDay[day] = (incByDay[day] ?? 0) + t.amount
  }
  const days = [...new Set([...Object.keys(expByDay), ...Object.keys(incByDay)])].sort()
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const fmt = (d: string): string => {
    const [, mon = '1', day = ''] = d.split('-')
    return `${day} ${monthNames[Number(mon) - 1] ?? ''}`
  }
  return {
    labels: days.map(fmt),
    income: days.map((d) => incByDay[d] ?? 0),
    expense: days.map((d) => expByDay[d] ?? 0),
  }
})

const areaOptions = computed(() => ({
  chart: {
    type: 'area' as const,
    height: 260,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  series: [
    { name: 'Income', data: dailyCashflowData.value.income },
    { name: 'Expense', data: dailyCashflowData.value.expense },
  ],
  xaxis: {
    categories: dailyCashflowData.value.labels,
    tickAmount: Math.min(dailyCashflowData.value.labels.length, 10),
    labels: { rotate: -35, style: { fontSize: '11px' } },
  },
  yaxis: { labels: { formatter: (v: number) => formatCurrency(v) } },
  colors: ['#10b981', '#ef4444'],
  stroke: { curve: 'smooth' as const, width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
  dataLabels: { enabled: false },
  legend: { position: 'top' as const },
  tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
}))

// ─── Day-of-week spending pattern ─────────────────────────────────────────────
const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dowOptions = computed(() => {
  const totals: number[] = [0, 0, 0, 0, 0, 0, 0]
  const counts: number[] = [0, 0, 0, 0, 0, 0, 0]
  for (const t of pmTransactions.value) {
    const cat = masterData.getCategoryById(t.category_id)
    if (cat?.type === 'expense') {
      const dow = new Date((t.date as string).split('T')[0] + 'T00:00:00').getDay()
      totals[dow] = (totals[dow] ?? 0) + t.amount
      counts[dow] = (counts[dow] ?? 0) + 1
    }
  }
  const avgSpend = totals.map((total, i) => {
    const c = counts[i] ?? 0
    return c > 0 ? Math.round(total / c) : 0
  })
  return {
    chart: { type: 'bar' as const, height: 260, toolbar: { show: false } },
    series: [{ name: 'Avg Spend', data: avgSpend }],
    xaxis: { categories: DOW_LABELS },
    yaxis: { labels: { formatter: (v: number) => formatCurrency(v) } },
    colors: ['#f59e0b'],
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
  }
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
  const expCats = (periodSummary.value?.category_breakdown ?? []).filter(
    (c) => c.type === 'expense',
  )
  return {
    labels: expCats.map((c) => c.name),
    series: expCats.map((c) => c.total),
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
  for (const t of pmTransactions.value) {
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

    // Three parallel requests:
    //  1. Per-bucket summary calls → monthly bar chart data
    //  2. Full-period summary     → summary cards + category donut (server-aggregated, no row cap)
    //  3. Full-period list        → payment-method donut (capped at 1 000, backend max)
    //  4. Prev-period summary     → period-over-period delta badges
    const { from: prevFrom, to: prevTo } = getPrevDateRange(selectedPeriod.value)
    const [bucketResults, fullSummaryRes, pmRes, prevSummaryRes] = await Promise.all([
      Promise.all(
        buckets.map((b) => transactionsApi.summary({ date_from: b.from, date_to: b.to })),
      ),
      transactionsApi.summary({ date_from: from, date_to: to }),
      transactionsApi.list({ date_from: from, date_to: to, page_size: 1000 }),
      transactionsApi.summary({ date_from: prevFrom, date_to: prevTo }),
    ])

    // Bar chart
    const months: string[] = []
    const income: number[] = []
    const expense: number[] = []
    buckets.forEach((b, i) => {
      const data = bucketResults[i]?.data?.data
      if (data) {
        months.push(b.label)
        income.push(Number(data.total_income))
        expense.push(Number(data.total_expense))
      }
    })
    barData.value = { months, income, expense }

    // Full-period summary (summary cards + category donut)
    if (fullSummaryRes.data.success) {
      const raw = fullSummaryRes.data.data
      periodSummary.value = {
        ...raw,
        total_income: Number(raw.total_income),
        total_expense: Number(raw.total_expense),
        net: Number(raw.net),
        category_breakdown: raw.category_breakdown.map((c) => ({
          ...c,
          total: Number(c.total),
        })),
      }
    }

    // Payment-method transactions (PM donut)
    if (pmRes.data.success) {
      pmTransactions.value = (pmRes.data.data as unknown as Transaction[]).map(toTransaction)
    }

    // Previous period summary (delta badges)
    if (prevSummaryRes.data.success) {
      const raw = prevSummaryRes.data.data
      prevSummary.value = {
        ...raw,
        total_income: Number(raw.total_income),
        total_expense: Number(raw.total_expense),
        net: Number(raw.net),
        category_breakdown: raw.category_breakdown.map((c) => ({ ...c, total: Number(c.total) })),
      }
    }
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
      <!-- Quick stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-white rounded-xl border border-surface-100 p-4 shadow-sm space-y-2"
        >
          <AppSkeleton h="h-3" w="w-24" />
          <AppSkeleton h="h-6" w="w-32" />
          <AppSkeleton h="h-3" w="w-20" />
        </div>
      </div>
      <!-- Cashflow + DoW -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-white rounded-xl border border-surface-100 p-5 shadow-sm space-y-3">
          <AppSkeleton h="h-4" w="w-40" />
          <AppSkeleton h="h-3" w="w-28" />
          <AppSkeleton h="h-56" />
        </div>
        <div class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm space-y-3">
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
          <p
            v-if="incomeDelta !== null"
            class="text-xs"
            :class="incomeDelta >= 0 ? 'text-income' : 'text-expense'"
          >
            {{ incomeDelta >= 0 ? '↑' : '↓' }} {{ Math.abs(incomeDelta) }}%
            <span class="text-surface-400">vs prev period</span>
          </p>
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
          <p
            v-if="expenseDelta !== null"
            class="text-xs"
            :class="expenseDelta <= 0 ? 'text-income' : 'text-expense'"
          >
            {{ expenseDelta >= 0 ? '↑' : '↓' }} {{ Math.abs(expenseDelta) }}%
            <span class="text-surface-400">vs prev period</span>
          </p>
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
          <p
            v-if="netDelta !== null"
            class="text-xs"
            :class="netDelta >= 0 ? 'text-income' : 'text-expense'"
          >
            {{ netDelta >= 0 ? '↑' : '↓' }} {{ Math.abs(netDelta) }}%
            <span class="text-surface-400">vs prev period</span>
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

      <!-- Charts: empty state when no transaction data for this period -->
      <AppEmptyState
        v-if="!chartsLoading && periodSummary?.transaction_count === 0"
        title="No transactions for this period"
        :description="`There are no transactions recorded for ${selectedPeriodLabel}. Add some to see your spending breakdown.`"
      />
      <div v-else class="relative">
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

        <!-- Quick Stats -->
        <div class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl border border-surface-100 p-4 shadow-sm">
            <p class="text-[11px] font-medium text-surface-500 uppercase tracking-wide mb-1">Avg Daily Spend</p>
            <p class="text-xl font-bold text-surface-900">{{ formatCurrency(avgDailySpend) }}</p>
            <p class="text-xs text-surface-400 mt-0.5">over {{ daysInPeriod }} days</p>
          </div>
          <div class="bg-white rounded-xl border border-surface-100 p-4 shadow-sm">
            <p class="text-[11px] font-medium text-surface-500 uppercase tracking-wide mb-1">Transactions</p>
            <p class="text-xl font-bold text-surface-900">{{ txCount }}</p>
            <p class="text-xs text-surface-400 mt-0.5">{{ selectedPeriodLabel }}</p>
          </div>
          <div class="bg-white rounded-xl border border-surface-100 p-4 shadow-sm">
            <p class="text-[11px] font-medium text-surface-500 uppercase tracking-wide mb-1">Biggest Expense</p>
            <p class="text-xl font-bold text-expense">
              {{ biggestExpense > 0 ? formatCurrency(biggestExpense) : '—' }}
            </p>
            <p class="text-xs text-surface-400 mt-0.5">single transaction</p>
          </div>
          <div class="bg-white rounded-xl border border-surface-100 p-4 shadow-sm">
            <p class="text-[11px] font-medium text-surface-500 uppercase tracking-wide mb-1">Top Expense</p>
            <p class="text-xl font-bold text-surface-900 truncate">{{ topExpenseCategoryName }}</p>
            <p class="text-xs text-surface-400 mt-0.5">by category</p>
          </div>
        </div>

        <!-- Daily Cashflow + Day-of-week -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-2 bg-white rounded-xl border border-surface-100 p-5 shadow-sm">
            <h2 class="text-sm font-semibold text-surface-700 mb-1">Daily Cashflow</h2>
            <p class="text-xs text-surface-400 mb-4">{{ selectedPeriodLabel }} · income vs expense per day</p>
            <VueApexCharts
              type="area"
              height="260"
              :options="areaOptions"
              :series="areaOptions.series"
            />
          </div>
          <div class="bg-white rounded-xl border border-surface-100 p-5 shadow-sm">
            <h2 class="text-sm font-semibold text-surface-700 mb-1">Spending by Day</h2>
            <p class="text-xs text-surface-400 mb-4">avg expense per weekday</p>
            <VueApexCharts
              type="bar"
              height="260"
              :options="dowOptions"
              :series="dowOptions.series"
            />
          </div>
        </div>
      </div>
      <!-- /charts -->

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
