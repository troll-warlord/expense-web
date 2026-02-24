<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    full?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
    full: false,
  },
)

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const variants: Record<string, string> = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500',
    secondary:
      'bg-surface-100 text-surface-800 hover:bg-surface-200 active:bg-surface-300 focus-visible:ring-surface-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
    ghost:
      'text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-200 active:bg-surface-200 focus-visible:ring-surface-400',
    outline:
      'border border-surface-300 text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-200 active:bg-surface-200 focus-visible:ring-surface-400',
  }

  return [base, sizes[props.size], variants[props.variant], props.full ? 'w-full' : '']
})
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <svg
      v-if="loading"
      class="animate-spin -ml-1 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
