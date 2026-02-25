<script setup lang="ts">
import { ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'

// ─── FAQ accordion ────────────────────────────────────────────────────────────
const openId = ref<string | null>(null)

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
}

const sections = [
  {
    heading: 'Getting Started',
    items: [
      {
        id: 'gs-1',
        q: 'How do I add a transaction?',
        a: 'Tap the "Add Transaction" button on the Transactions page, or use the + floating button on mobile. Fill in the amount, category, payment method, and an optional description.',
      },
      {
        id: 'gs-2',
        q: 'What are categories?',
        a: 'Categories let you group transactions (e.g. Groceries, Salary, Rent). You can create and manage your own categories from Settings → Categories. Each category is either Income or Expense type.',
      },
      {
        id: 'gs-3',
        q: 'What are payment methods?',
        a: 'Payment methods represent how you paid — cash, a specific bank account, credit card, UPI, etc. Add yours in Settings → Payment Methods so you can track spending per payment mode.',
      },
    ],
  },
  {
    heading: 'Transactions',
    items: [
      {
        id: 'tx-1',
        q: 'Can I edit or delete a transaction?',
        a: 'Yes. On the Transactions page find the transaction, then use the edit (pencil) or delete (trash) icon on its row. Deletion is permanent and cannot be undone.',
      },
      {
        id: 'tx-2',
        q: 'How do I filter transactions?',
        a: 'Use the Filters panel above the transaction list. You can filter by keyword, type (income/expense), category, payment method, and date range. On desktop the filters are always visible; on mobile tap "Filters" to expand them.',
      },
      {
        id: 'tx-3',
        q: 'How do I export my data to CSV?',
        a: 'Click "Export CSV" on the Transactions page. Choose a quick date preset (This Month, Last Month, etc.) or enter a custom date range, then click "Download CSV". Leave the range blank to export all transactions.',
      },
    ],
  },
  {
    heading: 'Budgets',
    items: [
      {
        id: 'bud-1',
        q: 'How do I set a budget?',
        a: 'Go to the Budgets page and click "Add Budget". Select a category (or leave blank for an overall budget), enter the monthly limit, and save.',
      },
      {
        id: 'bud-2',
        q: 'What does the budget progress bar show?',
        a: 'It shows how much of your monthly budget you have spent so far this month. The bar turns amber when you are over 80% and red when you exceed the limit.',
      },
    ],
  },
  {
    heading: 'Account & Security',
    items: [
      {
        id: 'acc-1',
        q: 'How do I update my profile?',
        a: 'Go to the Profile page (bottom nav or sidebar). You can update your name and email there. Your phone number is tied to your login and cannot be changed.',
      },
      {
        id: 'acc-2',
        q: 'How do I log out?',
        a: 'Scroll to the bottom of the Profile page and tap "Sign Out". Your session will be cleared from this device.',
      },
      {
        id: 'acc-3',
        q: 'Is my data private?',
        a: 'All your data is stored on the server associated with your phone number only. No data is shared with third parties.',
      },
    ],
  },
]
</script>

<template>
  <AppShell>
    <div class="max-w-2xl mx-auto space-y-8">

      <!-- Header -->
      <div>
        <h2 class="text-base font-semibold text-surface-900">Help &amp; Support</h2>
        <p class="text-xs text-surface-400 mt-0.5">Frequently asked questions and contact info</p>
      </div>

      <!-- FAQ sections -->
      <div v-for="section in sections" :key="section.heading" class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-widest text-surface-400 px-1">
          {{ section.heading }}
        </h3>
        <div class="bg-white rounded-xl border border-surface-100 shadow-sm divide-y divide-surface-50">
          <div v-for="item in section.items" :key="item.id">
            <button
              class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-50"
              @click="toggle(item.id)"
            >
              <span class="text-sm font-medium text-surface-900">{{ item.q }}</span>
              <svg
                class="h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200"
                :class="openId === item.id ? 'rotate-180' : ''"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div v-if="openId === item.id" class="px-5 pb-4">
                <p class="text-sm text-surface-500 leading-relaxed">{{ item.a }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-widest text-surface-400 px-1">Contact</h3>
        <div class="bg-white rounded-xl border border-surface-100 shadow-sm divide-y divide-surface-50">

          <a
            href="mailto:support@expensetracker.app"
            class="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 transition-colors group"
          >
            <div class="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900">Email Support</p>
              <p class="text-xs text-surface-400 truncate">support@expensetracker.app</p>
            </div>
            <svg class="h-4 w-4 text-surface-300 group-hover:text-surface-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href="https://github.com/tarun_pable/expense-web/issues"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 transition-colors group"
          >
            <div class="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
              <svg class="h-4 w-4 text-surface-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900">Report a Bug</p>
              <p class="text-xs text-surface-400">Open an issue on GitHub</p>
            </div>
            <svg class="h-4 w-4 text-surface-300 group-hover:text-surface-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

        </div>
      </div>

      <!-- App version -->
      <p class="text-center text-xs text-surface-300 pb-2">Expense Tracker v1.0.0</p>

    </div>
  </AppShell>
</template>
