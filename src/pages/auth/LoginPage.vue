<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { extractErrorMessage } from '@/utils'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

// ─── Country codes ───────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
]

const selectedCode = ref('+91')

// ─── Step Machine ─────────────────────────────────────────────────────────────
type Step = 'phone' | 'otp'
const step = ref<Step>('phone')
const phoneNumber = ref('')

// ─── OTP resend timer ─────────────────────────────────────────────────────────
const resendCooldown = ref(0)
let _timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  resendCooldown.value = 60
  _timer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && _timer) {
      clearInterval(_timer)
      _timer = null
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (_timer) clearInterval(_timer)
})

// ─── Phone Form ───────────────────────────────────────────────────────────────
const phoneSchema = toTypedSchema(
  z.object({
    phone_number: z
      .string()
      .min(6, 'Enter a valid phone number')
      .max(15, 'Phone number too long')
      .regex(/^\d+$/, 'Digits only — no spaces or dashes'),
  }),
)

const phoneForm = useForm({ validationSchema: phoneSchema })
const { value: phoneVal, errorMessage: phoneErr } = useField<string>('phone_number')
const phoneLoading = ref(false)

const submitPhone = phoneForm.handleSubmit(async (values) => {
  phoneLoading.value = true
  try {
    await authApi.requestOtp({
      country_code: selectedCode.value,
      phone_number: values.phone_number,
    })
    phoneNumber.value = values.phone_number
    step.value = 'otp'
    startTimer()
    toast.success(`OTP sent to ${selectedCode.value} ${values.phone_number}`)
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    phoneLoading.value = false
  }
})

// ─── OTP Form ─────────────────────────────────────────────────────────────────
const otpSchema = toTypedSchema(
  z.object({
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Digits only'),
  }),
)

const otpForm = useForm({ validationSchema: otpSchema })
const { value: otpVal, errorMessage: otpErr } = useField<string>('otp')
const otpLoading = ref(false)

const submitOtp = otpForm.handleSubmit(async (values) => {
  otpLoading.value = true
  try {
    const { is_new_user } = await auth.login(selectedCode.value, phoneNumber.value, values.otp)
    if (is_new_user) {
      router.push('/profile-setup')
    } else {
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    }
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    otpLoading.value = false
  }
})

async function resendOtp() {
  if (resendCooldown.value > 0) return
  try {
    await authApi.requestOtp({ country_code: selectedCode.value, phone_number: phoneNumber.value })
    startTimer()
    toast.success('OTP resent!')
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
}

function goBack() {
  step.value = 'phone'
  if (_timer) {
    clearInterval(_timer)
    _timer = null
  }
  resendCooldown.value = 0
  otpForm.resetForm()
}

// ─── Mock bar chart data for left panel ──────────────────────────────────────
const mockBars = [
  { label: 'Sep', height: 48 },
  { label: 'Oct', height: 62 },
  { label: 'Nov', height: 40 },
  { label: 'Dec', height: 72 },
  { label: 'Jan', height: 55 },
  { label: 'Feb', height: 65 },
]
</script>

<template>
  <div class="min-h-screen flex">
    <!-- ── Left Panel (decorative) ── -->
    <div
      class="hidden lg:flex lg:w-3/5 xl:w-2/3 bg-linear-to-br from-primary-700 via-primary-600 to-primary-500 flex-col justify-between p-12 relative overflow-hidden"
    >
      <!-- Background circles -->
      <div
        class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none"
      />
      <div
        class="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none"
      />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-white/3 pointer-events-none"
      />

      <!-- Branding -->
      <div class="relative z-10">
        <div class="flex items-center gap-3">
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
      </div>

      <!-- Main content -->
      <div class="relative z-10 space-y-10">
        <div>
          <h2 class="text-4xl font-bold text-white leading-tight">
            Take control of<br />your finances
          </h2>
          <p class="mt-3 text-primary-100 text-base max-w-sm">
            Track income and expenses, visualise spending habits, and make smarter money decisions —
            all in one place.
          </p>
        </div>

        <!-- Stat cards -->
        <div class="grid grid-cols-2 gap-4 max-w-md">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 space-y-1">
            <p class="text-primary-100 text-xs font-medium uppercase tracking-wide">This Month</p>
            <p class="text-white text-2xl font-bold">₹1,24,500</p>
            <p class="text-green-300 text-xs flex items-center gap-1">
              <svg
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              12% vs last month
            </p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 space-y-1">
            <p class="text-primary-100 text-xs font-medium uppercase tracking-wide">Savings Rate</p>
            <p class="text-white text-2xl font-bold">34%</p>
            <p class="text-green-300 text-xs flex items-center gap-1">
              <svg
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              On track
            </p>
          </div>
        </div>

        <!-- Mini bar chart -->
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 max-w-md">
          <p class="text-primary-100 text-xs font-medium uppercase tracking-wide mb-4">
            Spending — Last 6 Months
          </p>
          <div class="flex items-end gap-3 h-20">
            <div
              class="flex flex-col items-center gap-1 flex-1"
              v-for="bar in mockBars"
              :key="bar.label"
            >
              <div class="w-full rounded-t-md bg-white/40" :style="{ height: bar.height + 'px' }" />
              <span class="text-primary-200 text-[10px]">{{ bar.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer tagline -->
      <p class="relative z-10 text-primary-200 text-xs">Secure · Private · Always in sync</p>
    </div>

    <!-- ── Right Panel (form) ── -->
    <div class="flex-1 flex items-center justify-center p-6 bg-white">
      <div class="w-full max-w-sm space-y-8">
        <!-- Mobile logo (visible only on small screens) -->
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

        <!-- Heading -->
        <div class="space-y-1">
          <h1 class="text-2xl font-bold text-surface-900">
            {{ step === 'phone' ? 'Sign in' : 'Verify OTP' }}
          </h1>
          <p class="text-sm text-surface-500">
            {{
              step === 'phone'
                ? 'Enter your phone number to continue.'
                : 'Enter the 6-digit code sent to your phone.'
            }}
          </p>
        </div>

        <!-- Step indicator -->
        <div class="flex items-center gap-2">
          <div
            class="flex-1 h-1 rounded-full"
            :class="step === 'phone' ? 'bg-primary-200' : 'bg-primary-600'"
          />
          <div
            class="flex-1 h-1 rounded-full"
            :class="step === 'otp' ? 'bg-primary-600' : 'bg-surface-200'"
          />
        </div>

        <!-- Phone Step -->
        <Transition name="slide-up" mode="out-in">
          <form v-if="step === 'phone'" key="phone" class="space-y-5" @submit.prevent="submitPhone">
            <!-- Country code + phone number -->
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1.5">Phone Number</label>
              <div class="flex gap-2">
                <select
                  v-model="selectedCode"
                  class="shrink-0 h-10 rounded-lg border border-surface-200 bg-white pl-2 pr-6 text-sm text-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option v-for="c in COUNTRY_CODES" :key="c.code" :value="c.code">
                    {{ c.flag }} {{ c.code }}
                  </option>
                </select>
                <input
                  v-model="phoneVal"
                  type="tel"
                  inputmode="numeric"
                  placeholder="9876543210"
                  autocomplete="tel-national"
                  class="flex-1 h-10 rounded-lg border px-3 text-sm text-surface-900 placeholder-surface-300 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  :class="
                    phoneErr
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-surface-200 focus:border-primary-500'
                  "
                />
              </div>
              <p v-if="phoneErr" class="mt-1 text-xs text-red-500">{{ phoneErr }}</p>
            </div>
            <AppButton type="submit" :loading="phoneLoading" full size="lg">Send OTP</AppButton>
          </form>

          <!-- OTP Step -->
          <form v-else key="otp" class="space-y-5" @submit.prevent="submitOtp">
            <div
              class="bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <p class="text-sm text-surface-600">
                Sent to
                <strong class="text-surface-900">{{ selectedCode }} {{ phoneNumber }}</strong>
              </p>
              <button
                type="button"
                class="text-xs text-primary-600 hover:underline font-medium"
                @click="goBack"
              >
                Change
              </button>
            </div>

            <AppInput
              v-model="otpVal"
              label="One-Time Password"
              placeholder="123456"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              required
              :error="otpErr"
            />

            <AppButton type="submit" :loading="otpLoading" full size="lg">
              Verify &amp; Sign In
            </AppButton>

            <div class="text-center">
              <p class="text-sm text-surface-500">
                Didn't receive it?
                <button
                  type="button"
                  class="font-medium ml-1"
                  :class="
                    resendCooldown > 0
                      ? 'text-surface-400 cursor-not-allowed'
                      : 'text-primary-600 hover:underline'
                  "
                  :disabled="resendCooldown > 0"
                  @click="resendOtp"
                >
                  {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
                </button>
              </p>
            </div>
          </form>
        </Transition>
      </div>
    </div>
  </div>
</template>
