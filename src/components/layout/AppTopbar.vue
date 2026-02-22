<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { useDarkMode } from '@/composables/useDarkMode'

const emit = defineEmits<{ 'toggle-menu': [] }>()

const route = useRoute()
const auth = useAuthStore()
const { isDark, toggle: toggleDark } = useDarkMode()

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/settings/categories': 'Categories',
  '/settings/payment-methods': 'Payment Methods',
  '/profile': 'Profile',
}

const title = computed(() => routeTitles[route.path] || 'Expense Tracker')

// ─── Initials ────────────────────────────────────────────────────────────────
const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  if (u.first_name) return u.first_name.charAt(0).toUpperCase()
  return u.phone_number.charAt(0)
})

// ─── User dropdown ───────────────────────────────────────────────────────────
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => {
  dropdownOpen.value = false
})

async function signOut() {
  dropdownOpen.value = false
  await auth.logout()
}
</script>

<template>
  <header
    class="flex items-center justify-between px-4 sm:px-6 h-16 bg-white border-b border-surface-100 shrink-0"
  >
    <!-- Mobile menu toggle — only shown on medium screens; mobile uses bottom nav -->
    <button
      class="hidden md:block lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
      @click="emit('toggle-menu')"
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Spacer on mobile where hamburger is hidden -->
    <div class="md:hidden w-9" />

    <h1 class="text-base font-semibold text-surface-900 lg:text-lg">{{ title }}</h1>

    <!-- Right controls -->
    <div class="flex items-center gap-1">
      <!-- Dark mode toggle -->
      <button
        class="p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleDark"
      >
        <!-- Sun (shown in dark mode) -->
        <svg
          v-if="isDark"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <!-- Moon (shown in light mode) -->
        <svg
          v-else
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>

      <!-- User chip with dropdown -->
      <div class="relative" ref="dropdownRef">
        <button
          class="hidden sm:flex items-center gap-2 text-sm text-surface-600 px-3 py-1.5 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer select-none"
          @click="dropdownOpen = !dropdownOpen"
        >
          <div
            class="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center shrink-0"
          >
            <span class="text-white text-xs font-bold select-none">{{ initials }}</span>
          </div>
          <span class="font-medium">{{ auth.user?.display_name }}</span>
          <svg
            class="h-3.5 w-3.5 text-surface-400 transition-transform"
            :class="{ 'rotate-180': dropdownOpen }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown menu -->
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="dropdownOpen"
            class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-surface-100 shadow-lg py-1 z-50 origin-top-right"
          >
            <div class="px-4 py-2.5 border-b border-surface-100">
              <p class="text-xs text-surface-400 font-medium uppercase tracking-wide">
                Signed in as
              </p>
              <p class="text-sm font-semibold text-surface-900 truncate mt-0.5">
                {{ auth.user?.display_name }}
              </p>
              <p class="text-xs text-surface-400 truncate mt-0.5">
                {{ auth.user?.country_code }} {{ auth.user?.phone_number }}
              </p>
            </div>
            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              @click="signOut"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </Transition>
      </div>
    </div>
    <!-- /right controls -->
  </header>
</template>
