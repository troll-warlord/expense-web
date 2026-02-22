<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    error?: string
    required?: boolean
  }>(),
  { required: false },
)

const model = defineModel<string>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-surface-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <select
      v-bind="$attrs"
      v-model="model"
      class="w-full rounded-lg border px-3 py-2 text-sm text-surface-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      :class="error ? 'border-red-400 bg-red-50' : 'border-surface-300 bg-white'"
    >
      <slot />
    </select>
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
