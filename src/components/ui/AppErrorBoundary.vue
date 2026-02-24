<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  // Return false to stop the error from propagating further
  return false
})

function reload() {
  window.location.reload()
}
</script>

<template>
  <div
    v-if="error"
    class="min-h-screen flex items-center justify-center bg-surface-50 p-6"
  >
    <div class="text-center max-w-sm space-y-4">
      <div
        class="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center"
      >
        <svg
          class="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div class="space-y-1">
        <h1 class="text-lg font-bold text-surface-900">Something went wrong</h1>
        <p class="text-sm text-surface-500">
          An unexpected error occurred. Try reloading the page.
        </p>
      </div>
      <p class="text-xs text-surface-400 font-mono break-all bg-surface-100 rounded-lg px-3 py-2">
        {{ error.message }}
      </p>
      <button
        class="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        @click="reload"
      >
        Reload Page
      </button>
    </div>
  </div>
  <slot v-else />
</template>
