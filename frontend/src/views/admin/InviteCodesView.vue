<template>
  <AppLayout>
    <TablePageLayout>
      <template #filters>
        <div class="flex flex-wrap items-center gap-3">
          <!-- Left: Search + Filters -->
          <div class="flex-1 sm:max-w-64">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('admin.invite.searchCodes')"
              class="input"
              @input="handleSearch"
            />
          </div>
          <Select
            v-model="filters.status"
            :options="filterStatusOptions"
            class="w-36"
            @change="loadCodes"
          />

          <!-- Right: Action buttons -->
          <div class="flex flex-1 flex-wrap items-center justify-end gap-2">
            <button
              @click="loadCodes"
              :disabled="loading"
              class="btn btn-secondary"
              :title="t('common.refresh')"
            >
              <Icon name="refresh" size="md" :class="loading ? 'animate-spin' : ''" />
            </button>
            <button @click="handleExportCodes" class="btn btn-secondary">
              {{ t('admin.invite.exportCsv') }}
            </button>
            <button
              data-test="batch-update-open"
              @click="openBatchUpdateDialog"
              :disabled="selectedCount === 0 || batchUpdating"
              class="btn btn-secondary"
            >
              <Icon name="edit" size="md" class="mr-2" />
              {{ t('admin.invite.batchUpdate') }}
            </button>
            <button @click="showGenerateDialog = true" class="btn btn-primary">
              {{ t('admin.invite.generateCodes') }}
            </button>
          </div>
        </div>
      </template>

      <template #table>
        <DataTable
          :columns="columns"
          :data="codes"
          :loading="loading"
          :server-side-sort="true"
          default-sort-key="id"
          default-sort-order="desc"
          @sort="handleSort"
        >
          <template #header-select>
            <input
              data-test="select-all-codes"
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              :checked="allVisibleSelected"
              @click.stop
              @change="toggleSelectAllVisible($event)"
            />
          </template>

          <template #cell-select="{ row }">
            <input
              data-test="select-code"
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              :checked="selectedCodeIds.has(row.id)"
              @click.stop
              @change="toggleSelectRow(row.id, $event)"
            />
          </template>

          <template #cell-code="{ value }">
            <div class="flex items-center space-x-2">
              <code class="font-mono text-sm text-gray-900 dark:text-gray-100">{{ value }}</code>
              <button
                @click="copyToClipboard(value)"
                :class="[
                  'flex items-center transition-colors',
                  copiedCode === value
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                ]"
                :title="copiedCode === value ? t('admin.invite.copied') : t('keys.copyToClipboard')"
              >
                <Icon v-if="copiedCode !== value" name="copy" size="sm" :stroke-width="2" />
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          </template>

          <template #cell-status="{ value }">
            <span
              :class="[
                'badge',
                value === 'unused'
                  ? 'badge-success'
                  : value === 'used'
                    ? 'badge-gray'
                    : 'badge-danger'
              ]"
            >
              {{ t('admin.invite.status.' + value) }}
            </span>
          </template>

          <template #cell-used_by="{ value, row }">
            <span class="text-sm text-gray-500 dark:text-dark-400">
              {{ row.user?.email || (value ? t('admin.invite.userPrefix', { id: value }) : '-') }}
            </span>
          </template>

          <template #cell-used_at="{ value }">
            <span class="text-sm text-gray-500 dark:text-dark-400">{{
              value ? formatDateTime(value) : '-'
            }}</span>
          </template>

          <template #cell-expires_at="{ value, row }">
            <span
              :class="[
                'text-sm',
                row.status === 'expired'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-dark-400'
              ]"
            >
              {{ value ? formatDateTime(value) : t('admin.invite.neverExpires') }}
            </span>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center space-x-2">
              <button
                v-if="row.status === 'unused'"
                @click="handleDelete(row)"
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span class="text-xs">{{ t('common.delete') }}</span>
              </button>
              <span v-else class="text-gray-400 dark:text-dark-500">-</span>
            </div>
          </template>
        </DataTable>
      </template>

      <template #pagination>
        <div
          v-if="selectedCount > 0"
          class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20"
        >
          <span class="text-sm font-medium text-primary-900 dark:text-primary-100">
            {{ t('admin.invite.selectedCount', { count: selectedCount }) }}
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="text-xs font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
              @click="clearSelectedCodes"
            >
              {{ t('admin.invite.clearSelection') }}
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              @click="openBatchUpdateDialog"
            >
              {{ t('admin.invite.batchUpdate') }}
            </button>
          </div>
        </div>

        <Pagination
          v-if="pagination.total > 0"
          :page="pagination.page"
          :total="pagination.total"
          :page-size="pagination.page_size"
          @update:page="handlePageChange"
          @update:pageSize="handlePageSizeChange"
        />

        <!-- Batch Actions -->
        <div v-if="filters.status === 'unused'" class="flex justify-end">
          <button @click="showDeleteUnusedDialog = true" class="btn btn-danger">
            {{ t('admin.invite.deleteAllUnused') }}
          </button>
        </div>
      </template>
    </TablePageLayout>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('admin.invite.deleteCode')"
      :message="t('admin.invite.deleteCodeConfirm')"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      danger
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    />

    <!-- Delete Unused Codes Dialog -->
    <ConfirmDialog
      :show="showDeleteUnusedDialog"
      :title="t('admin.invite.deleteAllUnused')"
      :message="t('admin.invite.deleteAllUnusedConfirm')"
      :confirm-text="t('admin.invite.deleteAll')"
      :cancel-text="t('common.cancel')"
      danger
      @confirm="confirmDeleteUnused"
      @cancel="showDeleteUnusedDialog = false"
    />

    <!-- Generate Codes Dialog -->
    <Teleport to="body">
      <div v-if="showGenerateDialog" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showGenerateDialog = false"></div>
        <div
          class="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-dark-800"
        >
          <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('admin.invite.generateCodesTitle') }}
          </h2>
          <form @submit.prevent="handleGenerateCodes" class="space-y-4">
            <!-- Invitation type info -->
            <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p class="text-sm text-blue-700 dark:text-blue-300">
                {{ t('admin.invite.invitationHint') }}
              </p>
            </div>
            <div>
              <label class="input-label">{{ t('admin.invite.codeExpiry') }}</label>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <button
                  v-for="option in inviteCodeExpiryOptions"
                  :key="option.value"
                  type="button"
                  @click="generateForm.expiry_option = option.value"
                  :class="[
                    'rounded-lg border px-3 py-2 text-sm transition-colors',
                    generateForm.expiry_option === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
              <input
                v-if="generateForm.expiry_option === 'custom'"
                v-model.number="generateForm.custom_expiry_days"
                type="number"
                min="1"
                max="3650"
                required
                class="input mt-2"
                :placeholder="t('admin.invite.customExpiryDays')"
              />
            </div>
            <div>
              <label class="input-label">{{ t('admin.invite.count') }}</label>
              <input
                v-model.number="generateForm.count"
                type="number"
                min="1"
                max="100"
                required
                class="input"
              />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showGenerateDialog = false" class="btn btn-secondary">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" :disabled="generating" class="btn btn-primary">
                {{ generating ? t('admin.invite.generating') : t('admin.invite.generate') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Batch Update Dialog -->
    <Teleport to="body">
      <div
        v-if="showBatchUpdateDialog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="fixed inset-0 bg-black/50" @click="closeBatchUpdateDialog"></div>
        <div
          class="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-dark-800"
        >
          <h2 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('admin.invite.batchUpdateTitle') }}
          </h2>
          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {{ t('admin.invite.selectedCount', { count: selectedCount }) }}
          </p>

          <form data-test="batch-update-form" class="space-y-4" @submit.prevent="handleBatchUpdate">
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  data-test="batch-field-status"
                  v-model="batchUpdateForm.update_status"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {{ t('admin.invite.batchFields.status') }}
              </label>
              <Select
                v-if="batchUpdateForm.update_status"
                v-model="batchUpdateForm.status"
                data-test="batch-status-select"
                :options="batchStatusOptions"
              />
            </div>

            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  v-model="batchUpdateForm.update_expires_at"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {{ t('admin.invite.batchFields.expiresAt') }}
              </label>
              <template v-if="batchUpdateForm.update_expires_at">
                <Select v-model="batchUpdateForm.expires_mode" :options="batchExpiryModeOptions" />
                <input
                  v-if="batchUpdateForm.expires_mode === 'custom'"
                  v-model="batchUpdateForm.expires_at_local"
                  type="datetime-local"
                  class="input"
                />
              </template>
            </div>

            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  data-test="batch-field-notes"
                  v-model="batchUpdateForm.update_notes"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {{ t('admin.invite.batchFields.notes') }}
              </label>
              <textarea
                v-if="batchUpdateForm.update_notes"
                data-test="batch-notes-input"
                v-model="batchUpdateForm.notes"
                rows="3"
                class="input"
                :placeholder="t('admin.invite.batchNotesPlaceholder')"
              ></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="closeBatchUpdateDialog" class="btn btn-secondary">
                {{ t('common.cancel') }}
              </button>
              <button
                data-test="batch-update-submit"
                type="submit"
                :disabled="batchUpdating"
                class="btn btn-primary"
              >
                {{ batchUpdating ? t('common.submitting') : t('admin.invite.batchUpdate') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Generated Codes Result Dialog -->
    <Teleport to="body">
      <div v-if="showResultDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="closeResultDialog"></div>
        <div class="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-dark-800">
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-600"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
              >
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ t('admin.invite.generatedSuccessfully') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('admin.invite.codesCreated', { count: generatedCodes.length }) }}
                </p>
              </div>
            </div>
            <button
              @click="closeResultDialog"
              class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700 dark:hover:text-gray-300"
            >
              <Icon name="x" size="md" :stroke-width="2" />
            </button>
          </div>
          <!-- Content -->
          <div class="p-5">
            <div class="relative">
              <textarea
                readonly
                :value="generatedCodesText"
                :style="{ height: textareaHeight }"
                class="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-800 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200"
              ></textarea>
            </div>
          </div>
          <!-- Footer -->
          <div
            class="flex justify-end gap-2 rounded-b-xl border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-dark-600 dark:bg-dark-700/50"
          >
            <button
              @click="copyGeneratedCodes"
              :class="[
                'btn flex items-center gap-2 transition-all',
                copiedAll ? 'btn-success' : 'btn-secondary'
              ]"
            >
              <Icon v-if="!copiedAll" name="copy" size="sm" :stroke-width="2" />
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {{ copiedAll ? t('admin.invite.copied') : t('admin.invite.copyAll') }}
            </button>
            <button @click="downloadGeneratedCodes" class="btn btn-primary flex items-center gap-2">
              <Icon name="download" size="sm" :stroke-width="2" />
              {{ t('admin.invite.download') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useClipboard } from '@/composables/useClipboard'
import { useTableSelection } from '@/composables/useTableSelection'
import { getPersistedPageSize } from '@/composables/usePersistedPageSize'
import { adminAPI } from '@/api/admin'
import { formatDateTime } from '@/utils/format'
import type { RedeemCode } from '@/types'
import type { Column } from '@/components/common/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Select from '@/components/common/Select.vue'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const appStore = useAppStore()
const { copyToClipboard: clipboardCopy } = useClipboard()

const showGenerateDialog = ref(false)
const showResultDialog = ref(false)
const generatedCodes = ref<RedeemCode[]>([])

const generatedCodesText = computed(() => {
  return generatedCodes.value.map((code) => code.code).join('\n')
})

const textareaHeight = computed(() => {
  const lineCount = generatedCodes.value.length
  const lineHeight = 24 // approximate line height in px
  const padding = 24 // top + bottom padding
  const minHeight = 60
  const maxHeight = 240
  const calculatedHeight = Math.min(
    Math.max(lineCount * lineHeight + padding, minHeight),
    maxHeight
  )
  return `${calculatedHeight}px`
})

const copiedAll = ref(false)

const closeResultDialog = () => {
  showResultDialog.value = false
  generatedCodes.value = []
  copiedAll.value = false
}

const copyGeneratedCodes = async () => {
  const success = await clipboardCopy(generatedCodesText.value, t('admin.invite.copied'))
  if (success) {
    copiedAll.value = true
    setTimeout(() => {
      copiedAll.value = false
    }, 2000)
  }
}

const downloadGeneratedCodes = () => {
  const blob = new Blob([generatedCodesText.value], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `invite-codes-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const columns = computed<Column[]>(() => [
  { key: 'select', label: '' },
  { key: 'code', label: t('admin.invite.columns.code') },
  { key: 'status', label: t('admin.invite.columns.status'), sortable: true },
  { key: 'used_by', label: t('admin.invite.columns.usedBy') },
  { key: 'used_at', label: t('admin.invite.columns.usedAt'), sortable: true },
  { key: 'expires_at', label: t('admin.invite.columns.expiresAt'), sortable: true },
  { key: 'actions', label: t('admin.invite.columns.actions') }
])

const filterStatusOptions = computed(() => [
  { value: '', label: t('admin.invite.allStatus') },
  { value: 'unused', label: t('admin.invite.unused') },
  { value: 'used', label: t('admin.invite.used') },
  { value: 'expired', label: t('admin.invite.status.expired') },
  { value: 'disabled', label: t('admin.invite.status.disabled') }
])

const batchStatusOptions = computed(() => [
  { value: 'unused', label: t('admin.invite.status.unused') },
  { value: 'disabled', label: t('admin.invite.status.disabled') }
])

const batchExpiryModeOptions = computed(() => [
  { value: 'clear', label: t('admin.invite.neverExpires') },
  { value: 'custom', label: t('admin.invite.customExpiry') }
])

const inviteCodeExpiryOptions = computed<{ value: InviteCodeExpiryOption; label: string }[]>(() => [
  { value: 'never', label: t('admin.invite.neverExpires') },
  { value: '1', label: t('admin.invite.expiryPresetDays', { days: 1 }) },
  { value: '3', label: t('admin.invite.expiryPresetDays', { days: 3 }) },
  { value: '7', label: t('admin.invite.expiryPresetDays', { days: 7 }) },
  { value: 'custom', label: t('admin.invite.customExpiry') }
])

const codes = ref<RedeemCode[]>([])
const loading = ref(false)
const generating = ref(false)
const batchUpdating = ref(false)
const searchQuery = ref('')
const filters = reactive({
  status: ''
})
const pagination = reactive({
  page: 1,
  page_size: getPersistedPageSize(),
  total: 0,
  pages: 0
})
const sortState = reactive({
  sort_by: 'id',
  sort_order: 'desc' as 'asc' | 'desc'
})

let abortController: AbortController | null = null

const showDeleteDialog = ref(false)
const showDeleteUnusedDialog = ref(false)
const showBatchUpdateDialog = ref(false)
const deletingCode = ref<RedeemCode | null>(null)
const copiedCode = ref<string | null>(null)

const {
  selectedSet: selectedCodeIds,
  selectedCount,
  allVisibleSelected,
  select,
  deselect,
  clear: clearSelectedCodes,
  toggleVisible
} = useTableSelection<RedeemCode>({
  rows: codes,
  getId: (code) => code.id
})

const batchUpdateForm = reactive({
  update_status: false,
  status: 'disabled' as 'unused' | 'disabled',
  update_expires_at: false,
  expires_mode: 'clear' as 'clear' | 'custom',
  expires_at_local: '',
  update_notes: false,
  notes: ''
})

type InviteCodeExpiryOption = 'never' | '1' | '3' | '7' | 'custom'

const generateForm = reactive({
  count: 1,
  expiry_option: 'never' as InviteCodeExpiryOption,
  custom_expiry_days: 7
})

const buildInviteQueryFilters = () => ({
  type: 'invitation' as const, // Always filter by invitation type
  status: (filters.status || undefined) as 'used' | 'expired' | 'unused' | 'disabled' | undefined,
  search: searchQuery.value || undefined,
  sort_by: sortState.sort_by,
  sort_order: sortState.sort_order
})

const loadCodes = async () => {
  if (abortController) {
    abortController.abort()
  }
  const currentController = new AbortController()
  abortController = currentController
  loading.value = true
  try {
    const response = await adminAPI.redeem.list(
      pagination.page,
      pagination.page_size,
      buildInviteQueryFilters(),
      {
        signal: currentController.signal
      }
    )
    if (currentController.signal.aborted) {
      return
    }
    codes.value = response.items
    pagination.total = response.total
    pagination.pages = response.pages
  } catch (error: any) {
    if (
      currentController.signal.aborted ||
      error?.name === 'AbortError' ||
      error?.code === 'ERR_CANCELED'
    ) {
      return
    }
    appStore.showError(t('admin.invite.failedToLoad'))
    console.error('Error loading invite codes:', error)
  } finally {
    if (abortController === currentController && !currentController.signal.aborted) {
      loading.value = false
      abortController = null
    }
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadCodes()
  }, 300)
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadCodes()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize
  pagination.page = 1
  loadCodes()
}

const handleSort = (key: string, order: 'asc' | 'desc') => {
  sortState.sort_by = key
  sortState.sort_order = order
  pagination.page = 1
  loadCodes()
}

const toggleSelectRow = (id: number, event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    select(id)
    return
  }
  deselect(id)
}

const toggleSelectAllVisible = (event: Event) => {
  const target = event.target as HTMLInputElement
  toggleVisible(target.checked)
}

const getInviteCodeExpiresInDays = () => {
  if (generateForm.expiry_option === 'never') {
    return undefined
  }
  if (generateForm.expiry_option === 'custom') {
    if (
      !Number.isFinite(generateForm.custom_expiry_days) ||
      generateForm.custom_expiry_days < 1
    ) {
      return null
    }
    return Math.floor(generateForm.custom_expiry_days)
  }
  return Number(generateForm.expiry_option)
}

const toDatetimeLocalInputValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

const resetBatchUpdateForm = () => {
  batchUpdateForm.update_status = false
  batchUpdateForm.status = 'disabled'
  batchUpdateForm.update_expires_at = false
  batchUpdateForm.expires_mode = 'clear'
  batchUpdateForm.expires_at_local = toDatetimeLocalInputValue(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  )
  batchUpdateForm.update_notes = false
  batchUpdateForm.notes = ''
}

const openBatchUpdateDialog = () => {
  if (selectedCount.value === 0) {
    appStore.showInfo(t('admin.invite.selectCodesFirst'))
    return
  }
  resetBatchUpdateForm()
  showBatchUpdateDialog.value = true
}

const closeBatchUpdateDialog = () => {
  showBatchUpdateDialog.value = false
}

const buildBatchUpdateFields = (): { status?: 'disabled' | 'unused'; expires_at?: string | null; notes?: string } | null => {
  const fields: { status?: 'disabled' | 'unused'; expires_at?: string | null; notes?: string } = {}

  if (batchUpdateForm.update_status) {
    fields.status = batchUpdateForm.status
  }
  if (batchUpdateForm.update_expires_at) {
    if (batchUpdateForm.expires_mode === 'clear') {
      fields.expires_at = null
    } else {
      const expiresAt = new Date(batchUpdateForm.expires_at_local)
      if (!batchUpdateForm.expires_at_local || Number.isNaN(expiresAt.getTime())) {
        appStore.showError(t('admin.invite.expiryDaysRequired'))
        return null
      }
      fields.expires_at = expiresAt.toISOString()
    }
  }
  if (batchUpdateForm.update_notes) {
    fields.notes = batchUpdateForm.notes
  }

  return Object.keys(fields).length > 0 ? fields : null
}

const handleGenerateCodes = async () => {
  const expiresInDays = getInviteCodeExpiresInDays()
  if (expiresInDays === null) {
    appStore.showError(t('admin.invite.expiryDaysRequired'))
    return
  }

  generating.value = true
  try {
    const result = await adminAPI.redeem.generate(
      generateForm.count,
      'invitation',
      0, // Value is always 0 for invitation codes
      undefined, // No group for invitation codes
      undefined, // No validity days for invitation codes
      expiresInDays
    )
    showGenerateDialog.value = false
    generatedCodes.value = result
    showResultDialog.value = true
    loadCodes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || t('admin.invite.failedToGenerate'))
    console.error('Error generating invite codes:', error)
  } finally {
    generating.value = false
  }
}

const copyToClipboard = async (text: string) => {
  const success = await clipboardCopy(text, t('admin.invite.copied'))
  if (success) {
    copiedCode.value = text
    setTimeout(() => {
      copiedCode.value = null
    }, 2000)
  }
}

const handleExportCodes = async () => {
  try {
    const blob = await adminAPI.redeem.exportCodes(buildInviteQueryFilters())

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invite-codes-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    appStore.showSuccess(t('admin.invite.codesExported'))
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || t('admin.invite.failedToExport'))
    console.error('Error exporting invite codes:', error)
  }
}

const handleDelete = (code: RedeemCode) => {
  deletingCode.value = code
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!deletingCode.value) return

  try {
    await adminAPI.redeem.delete(deletingCode.value.id)
    appStore.showSuccess(t('admin.invite.codeDeleted'))
    showDeleteDialog.value = false
    deletingCode.value = null
    loadCodes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || t('admin.invite.failedToDelete'))
    console.error('Error deleting code:', error)
  }
}

const confirmDeleteUnused = async () => {
  try {
    // Get all unused invitation codes and delete them
    const unusedCodesResponse = await adminAPI.redeem.list(1, 1000, { status: 'unused', type: 'invitation' })
    const unusedCodeIds = unusedCodesResponse.items.map((code) => code.id)

    if (unusedCodeIds.length === 0) {
      appStore.showInfo(t('admin.invite.noUnusedCodes'))
      showDeleteUnusedDialog.value = false
      return
    }

    const result = await adminAPI.redeem.batchDelete(unusedCodeIds)
    appStore.showSuccess(t('admin.invite.codesDeleted', { count: result.deleted }))
    showDeleteUnusedDialog.value = false
    loadCodes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || t('admin.invite.failedToDeleteUnused'))
    console.error('Error deleting unused invite codes:', error)
  }
}

const handleBatchUpdate = async () => {
  const ids = Array.from(selectedCodeIds.value)
  if (ids.length === 0) {
    appStore.showInfo(t('admin.invite.selectCodesFirst'))
    return
  }

  const hasSelectedFields =
    batchUpdateForm.update_status ||
    batchUpdateForm.update_expires_at ||
    batchUpdateForm.update_notes

  if (!hasSelectedFields) {
    appStore.showError(t('admin.invite.noBatchFieldsSelected'))
    return
  }

  const fields = buildBatchUpdateFields()
  if (!fields) {
    return
  }

  batchUpdating.value = true
  try {
    const result = await adminAPI.redeem.batchUpdate(ids, fields)
    appStore.showSuccess(t('admin.invite.batchUpdateSuccess', { count: result.updated }))
    showBatchUpdateDialog.value = false
    clearSelectedCodes()
    loadCodes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || t('admin.invite.failedToBatchUpdate'))
    console.error('Error batch updating codes:', error)
  } finally {
    batchUpdating.value = false
  }
}

onMounted(() => {
  loadCodes()
})

onUnmounted(() => {
  clearTimeout(searchTimeout)
  abortController?.abort()
})
</script>
