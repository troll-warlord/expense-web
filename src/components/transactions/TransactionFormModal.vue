<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useMasterDataStore } from '@/stores/masterData'
import { useTransactionStore } from '@/stores/transactions'
import { useToast } from '@/composables/useToast'
import { extractErrorMessage, todayISO } from '@/utils'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { Transaction } from '@/types'

const props = defineProps<{
  editTarget?: Transaction | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const masterData = useMasterDataStore()
const txnStore = useTransactionStore()
const toast = useToast()

const isEdit = computed(() => !!props.editTarget)
const title = computed(() => (isEdit.value ? 'Edit Transaction' : 'Add Transaction'))

const schema = toTypedSchema(
  z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    date: z.string().min(1, 'Date is required'),
    category_id: z.string().min(1, 'Category is required'),
    payment_method_id: z.string().min(1, 'Payment method is required'),
    description: z.string().optional(),
    source: z.string().optional(),
  }),
)

const { handleSubmit, resetForm, isSubmitting, setValues } = useForm({
  validationSchema: schema,
  initialValues: {
    amount: undefined as unknown as number,
    date: todayISO(),
    category_id: '',
    payment_method_id: '',
    description: '',
    source: '',
  },
})

const { value: amount, errorMessage: amountErr } = useField<number>('amount')
const { value: date, errorMessage: dateErr } = useField<string>('date')
const { value: categoryId, errorMessage: categoryErr } = useField<string>('category_id')
const { value: paymentMethodId, errorMessage: pmErr } = useField<string>('payment_method_id')
const { value: description } = useField<string>('description')
const { value: source } = useField<string>('source')

// Populate form when editing
watch(
  () => props.editTarget,
  (t) => {
    if (t) {
      setValues({
        amount: t.amount,
        date: t.date.split('T')[0],
        category_id: t.category_id,
        payment_method_id: t.payment_method_id,
        description: t.description || '',
        source: t.source || '',
      })
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  try {
    if (isEdit.value && props.editTarget) {
      await txnStore.updateTransaction(props.editTarget.id, values)
      toast.success('Transaction updated')
    } else {
      await txnStore.createTransaction(values)
      toast.success('Transaction added')
    }
    emit('saved')
    emit('close')
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
})
</script>

<template>
  <AppModal :title="title" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppInput
          v-model.number="amount"
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          :error="amountErr"
        />
        <AppInput v-model="date" label="Date" type="date" required :error="dateErr" />
      </div>

      <AppSelect v-model="categoryId" label="Category" required :error="categoryErr">
        <option value="" disabled>Select category</option>
        <optgroup label="Income">
          <option v-for="c in masterData.incomeCategories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </optgroup>
        <optgroup label="Expense">
          <option v-for="c in masterData.expenseCategories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </optgroup>
      </AppSelect>

      <AppSelect v-model="paymentMethodId" label="Payment Method" required :error="pmErr">
        <option value="" disabled>Select payment method</option>
        <option v-for="pm in masterData.paymentMethods" :key="pm.id" :value="pm.id">
          {{ pm.name }}
        </option>
      </AppSelect>

      <AppInput v-model="description" label="Description" placeholder="Optional note" />

      <AppInput v-model="source" label="Source" placeholder="e.g. Salary, Amazon" />
    </form>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">Cancel</AppButton>
      <AppButton :loading="isSubmitting" @click="onSubmit">
        {{ isEdit ? 'Save Changes' : 'Add Transaction' }}
      </AppButton>
    </template>
  </AppModal>
</template>
