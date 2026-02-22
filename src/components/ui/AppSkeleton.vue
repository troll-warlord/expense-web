<script setup lang="ts">
defineProps<{
  /** Tailwind height class, e.g. "h-4" */
  h?: string
  /** Tailwind width class, e.g. "w-32" */
  w?: string
  /** rounded-full for pill shapes */
  pill?: boolean
}>()
</script>

<template>
  <div
    class="animate-pulse bg-surface-100"
    :class="[h ?? 'h-4', w ?? 'w-full', pill ? 'rounded-full' : 'rounded']"
  />
</template>
