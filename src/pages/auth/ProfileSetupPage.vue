<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { extractErrorMessage } from '@/utils'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const schema = toTypedSchema(
  z.object({
    first_name: z.string().min(1, 'First name is required').max(100, 'Max 100 characters'),
    last_name: z.string().min(1, 'Last name is required').max(100, 'Max 100 characters'),
    phone_number: z.string().max(20, 'Too long').regex(/^\d*$/, 'Digits only').optional(),
  }),
)

const form = useForm({ validationSchema: schema })
const { value: firstNameVal, errorMessage: firstNameErr } = useField<string>('first_name')
const { value: lastNameVal, errorMessage: lastNameErr } = useField<string>('last_name')
const { value: phoneVal, errorMessage: phoneErr } = useField<string>('phone_number')
const loading = ref(false)

const submit = form.handleSubmit(async (values) => {
  loading.value = true
  try {
    await auth.updateProfile({
      first_name: values.first_name,
      last_name: values.last_name,
      phone_number: values.phone_number || null,
    })
    toast.success('Welcome! Your profile is all set.')
    router.push('/')
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left Panel -->
    <div
      class="hidden lg:flex lg:w-2/5 xl:w-1/3 bg-linear-to-br from-primary-700 via-primary-600 to-primary-500 flex-col justify-between p-12 relative overflow-hidden"
    >
      <div
        class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none"
      />
      <div
        class="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none"
      />

      <!-- Branding -->
      <div class="relative z-10 flex items-center gap-3">
        <div
          class="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"
        >
          <svg
            class="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <span class="text-white font-bold text-lg">Expense Tracker</span>
      </div>

      <!-- Content -->
      <div class="relative z-10 space-y-6">
        <div class="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
          <svg
            class="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-3xl font-bold text-white leading-tight">One last step</h2>
          <p class="mt-3 text-primary-100 text-base">
            Tell us a bit about yourself so we can personalise your experience.
          </p>
        </div>

        <!-- Steps -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg
                class="h-3.5 w-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-primary-100 text-sm line-through">Verify email address</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 rounded-full bg-white flex items-center justify-center shrink-0">
              <span class="text-primary-600 text-xs font-bold">2</span>
            </div>
            <span class="text-white text-sm font-medium">Complete your profile</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span class="text-primary-200 text-xs font-bold">3</span>
            </div>
            <span class="text-primary-200 text-sm">Start tracking</span>
          </div>
        </div>
      </div>

      <p class="relative z-10 text-primary-200 text-xs">Secure · Private · Always in sync</p>
    </div>

    <!-- Right Panel (form) -->
    <div class="flex-1 flex items-center justify-center p-6 bg-white">
      <div class="w-full max-w-sm space-y-8">
        <!-- Mobile logo -->
        <div class="flex lg:hidden items-center gap-2">
          <div class="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <svg
              class="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="font-bold text-surface-900">Expense Tracker</span>
        </div>

        <div class="space-y-1">
          <h1 class="text-2xl font-bold text-surface-900">Complete your profile</h1>
          <p class="text-sm text-surface-500">
            Signed in as
            <span class="font-medium text-surface-700">{{ auth.user?.email }}</span>
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="submit">
          <div class="grid grid-cols-2 gap-4">
            <AppInput
              v-model="firstNameVal"
              label="First Name"
              placeholder="Demo"
              required
              :error="firstNameErr"
            />
            <AppInput
              v-model="lastNameVal"
              label="Last Name"
              placeholder="User"
              required
              :error="lastNameErr"
            />
          </div>
          <AppInput
            v-model="phoneVal"
            label="Phone Number (optional)"
            placeholder="9876543210"
            type="tel"
            inputmode="numeric"
            autocomplete="tel-national"
            :error="phoneErr"
          />
          <AppButton type="submit" :loading="loading" full size="lg">
            Save &amp; Continue
          </AppButton>
        </form>
      </div>
    </div>
  </div>
</template>
