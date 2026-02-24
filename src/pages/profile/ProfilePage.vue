<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { extractErrorMessage, formatDate } from '@/utils'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const auth = useAuthStore()
const { confirm } = useConfirm()
const toast = useToast()

// ─── Initials avatar ──────────────────────────────────────────────────────────
const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  if (u.first_name) return u.first_name.charAt(0).toUpperCase()
  return u.phone_number.charAt(0)
})

// ─── Edit profile form ────────────────────────────────────────────────────────
const editSchema = toTypedSchema(
  z.object({
    first_name: z.string().min(1, 'Required').max(100),
    last_name: z.string().min(1, 'Required').max(100),
    email: z.string().min(1, 'Required').email('Enter a valid email'),
  }),
)

const editForm = useForm({
  validationSchema: editSchema,
  initialValues: {
    first_name: auth.user?.first_name ?? '',
    last_name: auth.user?.last_name ?? '',
    email: auth.user?.email ?? '',
  },
})

const { value: firstNameVal, errorMessage: firstNameErr } = useField<string>('first_name')
const { value: lastNameVal, errorMessage: lastNameErr } = useField<string>('last_name')
const { value: emailVal, errorMessage: emailErr } = useField<string>('email')

const editLoading = ref(false)

const saveProfile = editForm.handleSubmit(async (values) => {
  editLoading.value = true
  try {
    await auth.updateProfile(values)
    toast.success('Profile updated')
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    editLoading.value = false
  }
})

// ─── Session / danger ─────────────────────────────────────────────────────────
const logoutLoading = ref(false)
const deleteLoading = ref(false)

async function handleLogout() {
  logoutLoading.value = true
  try {
    await auth.logout()
  } finally {
    logoutLoading.value = false
  }
}

async function handleDeactivate() {
  const ok = await confirm({
    title: 'Delete Account',
    message:
      'This will permanently delete your account and all your data including transactions, categories, and payment methods. This cannot be undone. Are you absolutely sure?',
    confirmLabel: 'Delete Account',
    danger: true,
  })
  if (!ok) return
  deleteLoading.value = true
  try {
    await usersApi.deleteMe()
    toast.success('Account deleted')
    await auth.logout()
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="max-w-6xl">
      <div class="space-y-6 lg:grid lg:grid-cols-[360px_1fr] lg:gap-8 lg:space-y-0 lg:items-start">
        <!-- Left column: profile card + session + danger zone -->
        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="bg-white rounded-xl border border-surface-100 shadow-sm p-6 space-y-5">
            <div class="flex items-center gap-4">
              <!-- Initials avatar -->
              <div
                class="h-14 w-14 rounded-full bg-primary-600 flex items-center justify-center shrink-0"
              >
                <span class="text-white text-xl font-bold select-none">{{ initials }}</span>
              </div>
              <div>
                <p class="text-base font-semibold text-surface-900">
                  {{ auth.user?.display_name }}
                </p>
                <p class="text-xs text-surface-400 mt-0.5">
                  Member since {{ auth.user?.created_at ? formatDate(auth.user.created_at) : '—' }}
                </p>
              </div>
            </div>

            <div class="border-t border-surface-100 pt-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-surface-500">Phone number</span>
                <span class="font-medium text-surface-900">
                  {{ auth.user?.country_code }} {{ auth.user?.phone_number }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-surface-500">Email</span>
                <span class="font-medium text-surface-900">{{ auth.user?.email || '—' }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-surface-500">Auth method</span>
                <span class="font-medium text-surface-900">OTP (Passwordless)</span>
              </div>
            </div>
          </div>

          <!-- Session -->
          <div class="bg-white rounded-xl border border-surface-100 shadow-sm p-6">
            <h3 class="text-sm font-semibold text-surface-700 mb-4">Session</h3>
            <AppButton variant="outline" :loading="logoutLoading" @click="handleLogout">
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </AppButton>
          </div>

          <!-- Danger Zone -->
          <div class="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-3">
            <h3 class="text-sm font-semibold text-red-600">Danger Zone</h3>
            <p class="text-xs text-surface-500">
              Permanently deletes your account and all data including transactions, categories, and
              payment methods. This cannot be undone.
            </p>
            <AppButton variant="danger" :loading="deleteLoading" @click="handleDeactivate">
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Delete Account
            </AppButton>
          </div>
        </div>
        <!-- end left column -->

        <!-- Right column: edit profile form -->
        <div>
          <div class="bg-white rounded-xl border border-surface-100 shadow-sm p-6 space-y-4">
            <h3 class="text-sm font-semibold text-surface-700">Edit Profile</h3>
            <form class="space-y-4" @submit.prevent="saveProfile">
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
                v-model="emailVal"
                label="Email"
                placeholder="demo@example.com"
                type="email"
                required
                :error="emailErr"
              />
              <AppButton type="submit" :loading="editLoading" variant="primary">
                Save Changes
              </AppButton>
            </form>
          </div>
        </div>
        <!-- end right column -->
      </div>
    </div>
  </AppShell>
</template>
