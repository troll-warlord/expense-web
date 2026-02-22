<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import AppButton from './AppButton.vue'

const { visible, options, accept, cancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-9998 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cancel" />
        <div class="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 space-y-4">
          <h3 class="text-base font-semibold text-surface-900">
            {{ options.title || 'Confirm' }}
          </h3>
          <p class="text-sm text-surface-600">{{ options.message }}</p>
          <div class="flex justify-end gap-3 pt-2">
            <AppButton variant="ghost" @click="cancel">
              {{ options.cancelLabel || 'Cancel' }}
            </AppButton>
            <AppButton :variant="options.danger ? 'danger' : 'primary'" @click="accept">
              {{ options.confirmLabel || 'Confirm' }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
