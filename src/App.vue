<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import { checkHealth } from '@/api/health'

const toast = useToast()

onMounted(async () => {
  try {
    const { status } = await checkHealth()
    if (status !== 'ok') {
      toast.error('Server is degraded — some features may not work correctly.')
    }
  } catch {
    toast.error('Unable to reach the server. Please check your connection.')
  }
})
</script>

<template>
  <RouterView />
  <ToastContainer />
  <ConfirmDialog />
</template>
