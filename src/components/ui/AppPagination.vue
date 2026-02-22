<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

function pages(): (number | '...')[] {
  const total = props.totalPages
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = props.currentPage
  if (cur <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', cur - 1, cur, cur + 1, '...', total]
}
</script>

<template>
  <nav class="flex items-center justify-center gap-1" aria-label="Pagination">
    <button
      class="px-2 py-1.5 rounded-lg text-sm text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none"
      :disabled="currentPage === 1"
      @click="emit('change', currentPage - 1)"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <template v-for="(p, i) in pages()" :key="i">
      <span v-if="p === '...'" class="px-2 py-1.5 text-sm text-surface-400">…</span>
      <button
        v-else
        class="min-w-8 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
        :class="
          p === currentPage ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
        "
        @click="emit('change', p as number)"
      >
        {{ p }}
      </button>
    </template>

    <button
      class="px-2 py-1.5 rounded-lg text-sm text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none"
      :disabled="currentPage === totalPages"
      @click="emit('change', currentPage + 1)"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </nav>
</template>
