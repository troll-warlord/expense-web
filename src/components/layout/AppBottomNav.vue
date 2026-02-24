<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const leftItems = [
  {
    to: '/transactions',
    label: 'Transactions',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    to: '/budgets',
    label: 'Budgets',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

const rightItems = [
  {
    to: '/settings/payment-methods',
    label: 'Payments',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-surface-100"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="flex items-end h-16 relative">
      <!-- Left two items -->
      <div class="flex flex-1 items-center justify-around">
        <RouterLink
          v-for="item in leftItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2 px-3 min-w-14 transition-colors"
          :class="isActive(item.to) ? 'text-primary-600' : 'text-surface-400'"
        >
          <svg
            class="h-5 w-5 transition-transform"
            :class="isActive(item.to) ? 'scale-110' : ''"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <span class="text-[10px] font-medium leading-none">{{ item.label }}</span>
        </RouterLink>
      </div>

      <!-- Center Dashboard button (raised) -->
      <div class="flex flex-col items-center justify-end pb-1 px-2 shrink-0">
        <RouterLink to="/" class="flex flex-col items-center gap-0.5 -mt-5">
          <div
            class="h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-primary-300/50 transition-transform active:scale-95"
            :class="isActive('/') ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-primary-600'"
          >
            <svg
              class="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <span
            class="text-[10px] font-medium leading-none"
            :class="isActive('/') ? 'text-primary-600' : 'text-surface-400'"
          >
            Home
          </span>
        </RouterLink>
      </div>

      <!-- Right two items -->
      <div class="flex flex-1 items-center justify-around">
        <RouterLink
          v-for="item in rightItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2 px-3 min-w-14 transition-colors"
          :class="isActive(item.to) ? 'text-primary-600' : 'text-surface-400'"
        >
          <svg
            class="h-5 w-5 transition-transform"
            :class="isActive(item.to) ? 'scale-110' : ''"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <span class="text-[10px] font-medium leading-none">{{ item.label }}</span>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
