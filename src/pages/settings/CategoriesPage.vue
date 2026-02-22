<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useMasterDataStore } from '@/stores/masterData'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { extractErrorMessage } from '@/utils'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import type { Category } from '@/types'

const masterData = useMasterDataStore()
const { confirm } = useConfirm()
const toast = useToast()

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'income' | 'expense'
const activeTab = ref<Tab>('expense')
const tabCategories = computed(() =>
  masterData.categories.filter((c) => c.type === activeTab.value),
)

// ─── Inline edit ─────────────────────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editName = ref('')
const editLoading = ref(false)

function startEdit(cat: Category) {
  editingId.value = cat.id
  editName.value = cat.name
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
}

async function saveEdit(cat: Category) {
  if (!editName.value.trim()) return
  editLoading.value = true
  try {
    await masterData.updateCategory(cat.id, { name: editName.value.trim() })
    toast.success('Category updated')
    cancelEdit()
  } catch (e) {
    toast.error(extractErrorMessage(e))
  } finally {
    editLoading.value = false
  }
}

async function handleDelete(cat: Category) {
  const ok = await confirm({
    title: 'Delete Category',
    message: `Delete "${cat.name}"? This may affect existing transactions.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  try {
    await masterData.deleteCategory(cat.id)
    toast.success('Category deleted')
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
}

// ─── Add Category Form ────────────────────────────────────────────────────────
const addSchema = toTypedSchema(z.object({ name: z.string().min(1, 'Name is required').max(50) }))
const { handleSubmit, isSubmitting, resetForm } = useForm({ validationSchema: addSchema })
const { value: newName, errorMessage: newNameErr } = useField<string>('name')

const submitAdd = handleSubmit(async (values) => {
  try {
    await masterData.createCategory({ name: values.name, type: activeTab.value })
    toast.success('Category created')
    resetForm()
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
})
</script>

<template>
  <AppShell>
    <div class="max-w-6xl">
      <div class="space-y-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:space-y-0 lg:items-start">
        <!-- Left column: header + tabs + list -->
        <div class="space-y-6">
          <div>
            <h2 class="text-base font-semibold text-surface-900">Categories</h2>
            <p class="text-xs text-surface-400 mt-0.5">
              System categories are read-only. You can add and manage your own.
            </p>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 bg-surface-100 p-1 rounded-lg w-fit">
            <button
              v-for="tab in ['expense', 'income'] as Tab[]"
              :key="tab"
              class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize"
              :class="
                activeTab === tab
                  ? 'bg-white shadow text-surface-900'
                  : 'text-surface-500 hover:text-surface-700'
              "
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Category List -->
          <div
            class="bg-white rounded-xl border border-surface-100 shadow-sm divide-y divide-surface-50"
          >
            <div
              v-if="tabCategories.length === 0"
              class="px-5 py-10 text-center text-sm text-surface-400"
            >
              No categories yet.
            </div>

            <div
              v-for="cat in tabCategories"
              :key="cat.id"
              class="flex items-center gap-3 px-4 py-3"
            >
              <!-- System lock icon -->
              <span
                v-if="cat.is_default"
                class="text-surface-300 shrink-0"
                title="System category (read-only)"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>

              <!-- Inline edit input or name -->
              <template v-if="editingId === cat.id">
                <input
                  v-model="editName"
                  class="flex-1 rounded-lg border border-primary-400 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @keydown.enter="saveEdit(cat)"
                  @keydown.escape="cancelEdit"
                />
                <AppButton size="sm" :loading="editLoading" @click="saveEdit(cat)">Save</AppButton>
                <AppButton size="sm" variant="ghost" @click="cancelEdit">Cancel</AppButton>
              </template>

              <template v-else>
                <span class="flex-1 text-sm text-surface-800">{{ cat.name }}</span>
                <AppBadge :variant="cat.type === 'income' ? 'income' : 'expense'" size="sm">
                  {{ cat.type }}
                </AppBadge>
                <AppBadge v-if="cat.is_default" variant="system" size="sm">System</AppBadge>

                <template v-if="!cat.is_default">
                  <AppIconButton icon="edit" title="Edit" @click="startEdit(cat)" />
                  <AppIconButton icon="delete" title="Delete" @click="handleDelete(cat)" />
                </template>
              </template>
            </div>
          </div>
        </div>
        <!-- end left column -->

        <!-- Right column: add form -->
        <div class="lg:sticky lg:top-6">
          <div class="bg-white rounded-xl border border-surface-100 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-surface-700 mb-3">
              Add {{ activeTab === 'income' ? 'Income' : 'Expense' }} Category
            </h3>
            <form class="space-y-3" @submit.prevent="submitAdd">
              <AppInput v-model="newName" placeholder="Category name" :error="newNameErr" />
              <AppButton class="w-full" type="submit" :loading="isSubmitting"
                >Add Category</AppButton
              >
            </form>
          </div>
        </div>
        <!-- end right column -->
      </div>
    </div>
  </AppShell>
</template>
