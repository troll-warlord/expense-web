<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const moreOpen = ref(false)

// Close sheet on navigation
watch(() => route.path, () => { moreOpen.value = false })

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
    to: '/profile',
    label: 'Profile',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
]

const moreItems = [
  {
    to: '/settings/categories',
    label: 'Categories',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  },
  {
    to: '/settings/payment-methods',
    label: 'Payment Methods',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    to: '/help',
    label: 'Help & Support',
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

// "More" is considered active when current route matches any more-item
const moreIsActive = () => moreItems.some(i => route.path.startsWith(i.to))

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function navigateTo(to: string) {
  moreOpen.value = false
  router.push(to)
}
</script>

<template>
  <!-- More sheet backdrop -->
  <Transition name="fade">
    <div
      v-if="moreOpen"
      class="fixed inset-0 z-40 bg-black/40 lg:hidden"
      @click="moreOpen = false"
    />
  </Transition>

  <!-- More slide-up sheet -->
  <Transition name="slide-up-sheet">
    <div
      v-if="moreOpen"
      class="fixed bottom-16 inset-x-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl pb-safe"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <!-- Handle -->
      <div class="flex justify-center pt-3 pb-1">
        <div class="w-10 h-1 rounded-full bg-surface-200" />
      </div>
      <p class="text-[11px] font-semibold text-surface-400 uppercase tracking-wider px-5 pt-2 pb-3">More</p>
      <div class="divide-y divide-surface-100">
        <button
          v-for="item in moreItems"
          :key="item.to"
          class="flex items-center gap-4 w-full px-5 py-4 transition-colors active:bg-surface-50"
          :class="isActive(item.to) ? 'text-primary-600' : 'text-surface-700'"
          @click="navigateTo(item.to)"
        >
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <span class="text-sm font-medium">{{ item.label }}</span>
          <svg class="h-4 w-4 ml-auto text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>

  <!-- Bottom nav bar -->
  <nav
    class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-surface-100"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="flex items-end h-16 relative">
      <!-- Left items -->
      <div class="flex flex-1 items-center justify-around">
        <RouterLink
          v-for="item in leftItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2 px-3 min-w-14 transition-colors"
          :class="isActive(item.to) ? 'text-primary-600' : 'text-surface-400'"
        >
          <svg class="h-5 w-5 transition-transform" :class="isActive(item.to) ? 'scale-110' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
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
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span class="text-[10px] font-medium leading-none" :class="isActive('/') ? 'text-primary-600' : 'text-surface-400'">Home</span>
        </RouterLink>
      </div>

      <!-- Right items + More -->
      <div class="flex flex-1 items-center justify-around">
        <RouterLink
          v-for="item in rightItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2 px-3 min-w-14 transition-colors"
          :class="isActive(item.to) ? 'text-primary-600' : 'text-surface-400'"
        >
          <svg class="h-5 w-5 transition-transform" :class="isActive(item.to) ? 'scale-110' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <span class="text-[10px] font-medium leading-none">{{ item.label }}</span>
        </RouterLink>

        <!-- More button -->
        <button
          class="flex flex-col items-center gap-0.5 py-2 px-3 min-w-14 transition-colors"
          :class="moreOpen || moreIsActive() ? 'text-primary-600' : 'text-surface-400'"
          @click="moreOpen = !moreOpen"
        >
          <svg class="h-5 w-5 transition-transform" :class="moreOpen ? 'scale-110' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span class="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-sheet-enter-active, .slide-up-sheet-leave-active { transition: transform 0.25s ease; }
.slide-up-sheet-enter-from, .slide-up-sheet-leave-to { transform: translateY(100%); }
</style>
