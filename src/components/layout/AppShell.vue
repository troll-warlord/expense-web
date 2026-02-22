<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import AppBottomNav from './AppBottomNav.vue'

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-surface-50">
    <!-- Desktop Sidebar -->
    <div class="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 shrink-0">
      <AppSidebar />
    </div>

    <!-- Mobile Sidebar Overlay (still used on md screens without bottom nav) -->
    <Transition name="fade">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 lg:hidden">
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="mobileMenuOpen = false"
        />
        <div class="absolute left-0 top-0 bottom-0 w-64 z-50 shadow-2xl">
          <AppSidebar @close="mobileMenuOpen = false" />
        </div>
      </div>
    </Transition>

    <!-- Main content area -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <AppTopbar @toggle-menu="mobileMenuOpen = !mobileMenuOpen" />

      <!-- Extra bottom padding on mobile for the bottom nav bar -->
      <main class="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
        <slot />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <AppBottomNav />
  </div>
</template>
