<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'income' | 'expense' | 'system' | 'success' | 'warning' | 'danger'
    size?: 'sm' | 'md'
  }>(),
  { variant: 'default', size: 'md' },
)

const classes = computed(() => {
  const base = 'inline-flex items-center gap-1 rounded-full font-medium'
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs' }
  const variants: Record<string, string> = {
    default: 'bg-surface-100 text-surface-600',
    income: 'bg-income-light text-income',
    expense: 'bg-expense-light text-expense',
    system:  'bg-primary-50 text-primary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger:  'bg-red-100 text-red-700',
  }
  return [base, sizes[props.size], variants[props.variant]]
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
