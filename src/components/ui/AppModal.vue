<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
const props = withDefaults(
  defineProps<{
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{ close: [] }>()

const sizeMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

      <!-- Panel -->
      <div
        class="relative w-full rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
        :class="sizeMap[props.size]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 class="text-base font-semibold text-surface-900">{{ title }}</h2>
          <button
            class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
            @click="emit('close')"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1 px-6 py-4">
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="px-6 py-4 border-t border-surface-100 flex justify-end gap-3"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
