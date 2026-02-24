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

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const COUNTRY_CODE = '+91'

type Step = 'phone' | 'otp'
const step = ref<Step>('phone')
const phoneNumber = ref('')

const resendCooldown = ref(0)
let _timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  resendCooldown.value = 60
  _timer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && _timer) { clearInterval(_timer); _timer = null }
  }, 1000)
}
onBeforeUnmount(() => { if (_timer) clearInterval(_timer) })

const phoneSchema = toTypedSchema(z.object({
  phone_number: z.string().min(6, 'Enter a valid phone number').max(15, 'Too long').regex(/^\d+$/, 'Digits only'),
}))
const phoneForm = useForm({ validationSchema: phoneSchema })
const { value: phoneVal, errorMessage: phoneErr } = useField<string>('phone_number')
const phoneLoading = ref(false)

const submitPhone = phoneForm.handleSubmit(async (values) => {
  phoneLoading.value = true
  try {
    await authApi.requestOtp({ country_code: COUNTRY_CODE, phone_number: values.phone_number })
    phoneNumber.value = values.phone_number
    step.value = 'otp'
    startTimer()
    toast.success(`OTP sent to ${COUNTRY_CODE} ${values.phone_number}`)
  } catch (e) { toast.error(extractErrorMessage(e)) }
  finally { phoneLoading.value = false }
})

const otpSchema = toTypedSchema(z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'Digits only'),
}))
const otpForm = useForm({ validationSchema: otpSchema })
const { value: otpVal, errorMessage: otpErr } = useField<string>('otp')
const otpLoading = ref(false)

const submitOtp = otpForm.handleSubmit(async (values) => {
  otpLoading.value = true
  try {
    const { is_new_user } = await auth.login(COUNTRY_CODE, phoneNumber.value, values.otp)
    if (is_new_user) { router.push('/profile-setup') }
    else { router.push((route.query.redirect as string) || '/') }
  } catch (e) { toast.error(extractErrorMessage(e)) }
  finally { otpLoading.value = false }
})

async function resendOtp() {
  if (resendCooldown.value > 0) return
  try {
    await authApi.requestOtp({ country_code: COUNTRY_CODE, phone_number: phoneNumber.value })
    startTimer()
    toast.success('OTP resent!')
  } catch (e) { toast.error(extractErrorMessage(e)) }
}

function goBack() {
  step.value = 'phone'
  if (_timer) { clearInterval(_timer); _timer = null }
  resendCooldown.value = 0
  otpForm.resetForm()
}

const mockBars = [38, 56, 42, 70, 50, 64, 48]
</script>

<template>
  <!-- Full-screen dark canvas -->
  <div
    class="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
    style="background: linear-gradient(135deg, #07050f 0%, #130d3a 50%, #0e1a3a 100%)"
  >
    <!-- Glow blobs -->
    <div class="absolute -top-40 -left-40 w-150 h-150 rounded-full pointer-events-none"
      style="background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)" />
    <div class="absolute -bottom-40 -right-40 w-150 h-150 rounded-full pointer-events-none"
      style="background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 65%)" />
    <div class="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
      style="background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" />

    <!-- Dot grid -->
    <div class="absolute inset-0 pointer-events-none"
      style="background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 32px 32px;" />

    <!-- ── Decorative corner cards (desktop only) ── -->

    <!-- Top-left: spending summary + mini bar chart -->
    <div class="absolute top-8 left-8 hidden xl:block rounded-2xl p-4 w-56 select-none pointer-events-none"
      style="background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); transform: rotate(-3deg)">
      <p class="text-[10px] font-semibold uppercase tracking-widest mb-2" style="color:rgba(255,255,255,0.4)">February 2026</p>
      <div class="flex justify-between mb-3">
        <div>
          <p class="text-[10px]" style="color:rgba(255,255,255,0.35)">Spent</p>
          <p class="text-white font-bold text-lg leading-none">₹78,400</p>
        </div>
        <div class="text-right">
          <p class="text-[10px]" style="color:rgba(255,255,255,0.35)">Saved</p>
          <p class="font-bold text-lg leading-none" style="color:#34d399">₹44,600</p>
        </div>
      </div>
      <div class="flex items-end gap-1 h-8">
        <div
          v-for="(h, i) in mockBars"
          :key="i"
          class="flex-1 rounded-sm"
          :style="{ height: (h / 70 * 32) + 'px', background: i === 5 ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.18)' }"
        />
      </div>
    </div>

    <!-- Top-right: budget progress -->
    <div class="absolute top-10 right-8 hidden xl:block rounded-2xl p-4 w-52 select-none pointer-events-none"
      style="background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); transform: rotate(2.5deg)">
      <p class="text-[10px] font-semibold uppercase tracking-widest mb-3" style="color:rgba(255,255,255,0.4)">Budget Status</p>
      <div
        v-for="b in [{ name: 'Groceries', pct: 72, c: '#34d399' }, { name: 'Dining', pct: 91, c: '#fbbf24' }, { name: 'Transport', pct: 45, c: '#34d399' }]"
        :key="b.name"
        class="mb-2.5"
      >
        <div class="flex justify-between text-[10px] mb-1">
          <span style="color:rgba(255,255,255,0.5)">{{ b.name }}</span>
          <span :style="{ color: b.c }">{{ b.pct }}%</span>
        </div>
        <div class="h-1 rounded-full" style="background:rgba(255,255,255,0.12)">
          <div class="h-1 rounded-full" :style="{ width: b.pct + '%', background: b.c }" />
        </div>
      </div>
    </div>

    <!-- Bottom-left: recent transactions -->
    <div class="absolute bottom-10 left-8 hidden xl:block rounded-2xl p-4 w-60 select-none pointer-events-none"
      style="background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); transform: rotate(2deg)">
      <p class="text-[10px] font-semibold uppercase tracking-widest mb-3" style="color:rgba(255,255,255,0.4)">Recent</p>
      <div
        v-for="t in [{ icon:'🛒', name:'Grocery Store', amt:'−₹2,400', c:'#f87171'}, { icon:'💼', name:'Salary Credit', amt:'+₹85,000', c:'#34d399'}, { icon:'☕', name:'Cafe Latte', amt:'−₹320', c:'#f87171'}]"
        :key="t.name"
        class="flex items-center justify-between mb-2.5 last:mb-0"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm">{{ t.icon }}</span>
          <span class="text-xs" style="color:rgba(255,255,255,0.5)">{{ t.name }}</span>
        </div>
        <span class="text-xs font-semibold" :style="{ color: t.c }">{{ t.amt }}</span>
      </div>
    </div>

    <!-- Bottom-right: savings rate -->
    <div class="absolute bottom-12 right-8 hidden xl:block rounded-2xl p-4 w-44 select-none pointer-events-none"
      style="background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); transform: rotate(-2deg)">
      <p class="text-[10px] font-semibold uppercase tracking-widest mb-2" style="color:rgba(255,255,255,0.4)">Savings Rate</p>
      <p class="text-4xl font-black" style="color:#34d399">36%</p>
      <p class="text-[10px] mt-1" style="color:rgba(255,255,255,0.35)">↑ 4pts vs last month</p>
      <div class="mt-3 h-1.5 rounded-full" style="background:rgba(255,255,255,0.12)">
        <div class="h-1.5 rounded-full w-[36%]" style="background: linear-gradient(90deg, #34d399, #6ee7b7)" />
      </div>
    </div>

    <!-- ── Centered login card ── -->
    <div class="relative z-10 w-full max-w-md">

      <!-- Logo + brand -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div
          class="h-11 w-11 rounded-xl flex items-center justify-center text-2xl leading-none select-none"
          style="background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15)"
        >&#9889;</div>
        <span class="text-white font-bold text-xl tracking-tight">Expense Tracker</span>
      </div>

      <!-- Glass card -->
      <div
        class="rounded-3xl p-8"
        style="background: rgba(255,255,255,0.07); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 25px 60px rgba(0,0,0,0.5)"
      >
        <!-- Headline -->
        <div class="text-center mb-7">
          <h1 class="text-2xl font-extrabold text-white mb-1.5">
            {{ step === 'phone' ? 'Welcome back' : 'Check your phone' }}
          </h1>
          <p class="text-sm" style="color: rgba(255,255,255,0.5)">
            {{
              step === 'phone'
                ? 'Sign in with your phone number to continue.'
                : `Code sent to ${COUNTRY_CODE} ${phoneNumber}`
            }}
          </p>
        </div>

        <!-- Step progress dots -->
        <div class="flex items-center gap-2 mb-7">
          <div class="flex-1 h-0.5 rounded-full" style="background: rgba(167,139,250,0.8)" />
          <div
            class="flex-1 h-0.5 rounded-full transition-all duration-500"
            :style="step === 'otp' ? 'background: rgba(167,139,250,0.8)' : 'background: rgba(255,255,255,0.15)'"
          />
        </div>

        <!-- Phone step -->
        <Transition name="slide-up" mode="out-in">
          <form v-if="step === 'phone'" key="phone" class="space-y-4" @submit.prevent="submitPhone">
            <div>
              <label class="block text-xs font-semibold mb-2 uppercase tracking-wide" style="color:rgba(255,255,255,0.5)">
                Phone Number
              </label>
              <div class="flex gap-2">
                <div
                  class="shrink-0 h-11 rounded-xl border px-3 flex items-center text-sm font-medium"
                  style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.5)"
                >
                  🇮🇳 +91
                </div>
                <input
                  v-model="phoneVal"
                  type="tel"
                  inputmode="numeric"
                  placeholder="9876543210"
                  autocomplete="tel-national"
                  class="flex-1 h-11 rounded-xl border px-4 text-sm focus:outline-none transition-all text-white"
                  :style="phoneErr
                    ? 'background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.5)'
                    : 'background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15)'"
                />
              </div>
              <p v-if="phoneErr" class="mt-1.5 text-xs text-red-400">{{ phoneErr }}</p>
            </div>

            <button
              type="submit"
              class="w-full h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-white"
              style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); box-shadow: 0 4px 20px rgba(124,58,237,0.4)"
              :disabled="phoneLoading"
            >
              <svg v-if="phoneLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ phoneLoading ? 'Sending...' : 'Send OTP' }}
            </button>
          </form>

          <!-- OTP step -->
          <form v-else key="otp" class="space-y-4" @submit.prevent="submitOtp">
            <div
              class="flex items-center justify-between rounded-xl px-4 py-3"
              style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3)"
            >
              <p class="text-sm text-white font-medium">{{ COUNTRY_CODE }} {{ phoneNumber }}</p>
              <button
                type="button"
                class="text-xs font-semibold"
                style="color: #a78bfa"
                @click="goBack"
              >
                Change
              </button>
            </div>

            <div>
              <label class="block text-xs font-semibold mb-2 uppercase tracking-wide" style="color:rgba(255,255,255,0.5)">
                One-Time Password
              </label>
              <input
                v-model="otpVal"
                type="text"
                inputmode="numeric"
                placeholder="• • • • • •"
                maxlength="6"
                autocomplete="one-time-code"
                class="w-full h-12 rounded-xl border px-4 focus:outline-none transition-all text-white text-center font-bold text-xl placeholder:tracking-normal placeholder:text-base"
                style="letter-spacing: 0.4em"
                :style="otpErr
                  ? 'background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.5)'
                  : 'background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15)'"
              />
              <p v-if="otpErr" class="mt-1.5 text-xs text-red-400">{{ otpErr }}</p>
            </div>

            <button
              type="submit"
              class="w-full h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-white"
              style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); box-shadow: 0 4px 20px rgba(124,58,237,0.4)"
              :disabled="otpLoading"
            >
              <svg v-if="otpLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ otpLoading ? 'Verifying...' : 'Verify and Sign In' }}
            </button>

            <p class="text-center text-sm" style="color:rgba(255,255,255,0.4)">
              Didn't receive it?
              <button
                type="button"
                class="font-semibold ml-1 transition-colors"
                :style="resendCooldown > 0 ? 'color:rgba(255,255,255,0.25); cursor:not-allowed' : 'color:#a78bfa'"
                :disabled="resendCooldown > 0"
                @click="resendOtp"
              >
                {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
              </button>
            </p>
          </form>
        </Transition>
      </div>

      <!-- Footer -->
      <p class="text-center text-xs mt-5" style="color:rgba(255,255,255,0.2)">
        Secure &nbsp;·&nbsp; Private &nbsp;·&nbsp; Always in sync
      </p>
    </div>
  </div>
</template>
