<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header + status cards -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="card p-4">
          <p class="text-xs font-medium text-muted-foreground">
            {{ t('admin.modelPricing.total') }}
          </p>
          <p class="mt-1 text-2xl font-bold">{{ data?.total ?? '—' }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-medium text-muted-foreground">
            {{ t('admin.modelPricing.fromLitellm') }}
          </p>
          <p class="mt-1 text-2xl font-bold">{{ data?.sources.litellm ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-medium text-muted-foreground">
            {{ t('admin.modelPricing.fromFallback') }}
          </p>
          <p class="mt-1 text-2xl font-bold">{{ data?.sources.fallback ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-medium text-muted-foreground">
            {{ t('admin.modelPricing.lastSync') }}
          </p>
          <p class="mt-1 text-sm">
            {{
              data?.status?.last_updated
                ? formatDateTime(data.status.last_updated)
                : '—'
            }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground font-mono">
            {{ data?.status?.local_hash || '' }}
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card p-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="relative min-w-[220px] flex-1">
            <input
              v-model="query"
              type="text"
              :placeholder="t('admin.modelPricing.searchPlaceholder')"
              class="input pl-9"
            />
            <svg
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <!-- Source filter -->
          <select v-model="sourceFilter" class="input w-32">
            <option value="">{{ t('admin.modelPricing.allSources') }}</option>
            <option value="litellm">LiteLLM</option>
            <option value="fallback">Fallback</option>
          </select>

          <!-- Provider filter -->
          <select v-model="providerFilter" class="input w-44">
            <option value="">{{ t('admin.modelPricing.allProviders') }}</option>
            <option
              v-for="p in data?.providers || []"
              :key="p"
              :value="p"
            >
              {{ p }}
            </option>
          </select>

          <!-- Unit toggle -->
          <div class="ml-auto flex items-center gap-2 text-sm">
            <span class="text-muted-foreground">{{ t('admin.modelPricing.unit') }}:</span>
            <button
              type="button"
              class="rounded px-2 py-1 text-xs font-medium"
              :class="unit === '1M' ? 'bg-primary-500 text-white' : 'text-muted-foreground hover:bg-secondary'"
              @click="unit = '1M'"
            >
              USD / 1M tokens
            </button>
            <button
              type="button"
              class="rounded px-2 py-1 text-xs font-medium"
              :class="unit === '1K' ? 'bg-primary-500 text-white' : 'text-muted-foreground hover:bg-secondary'"
              @click="unit = '1K'"
            >
              USD / 1K tokens
            </button>
          </div>
        </div>

        <div class="mt-2 text-xs text-muted-foreground">
          {{
            t('admin.modelPricing.showingCount', {
              filtered: filtered.length,
              total: data?.total ?? 0,
            })
          }}
        </div>
      </div>

      <!-- Loading / error / empty -->
      <div v-if="loading" class="card p-6 text-center text-muted-foreground">
        {{ t('common.loading') }}
      </div>
      <div v-else-if="loadError" class="card p-6 text-center text-red-500">
        {{ loadError }}
      </div>

      <!-- Table -->
      <div v-else class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-secondary/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th class="px-4 py-3">{{ t('admin.modelPricing.col.model') }}</th>
                <th class="px-4 py-3">{{ t('admin.modelPricing.col.provider') }}</th>
                <th class="px-4 py-3">{{ t('admin.modelPricing.col.source') }}</th>
                <th class="px-4 py-3">{{ t('admin.modelPricing.col.mode') }}</th>
                <th class="px-4 py-3 text-right">{{ t('admin.modelPricing.col.input') }}</th>
                <th class="px-4 py-3 text-right">{{ t('admin.modelPricing.col.output') }}</th>
                <th class="px-4 py-3 text-right">{{ t('admin.modelPricing.col.cacheRead') }}</th>
                <th class="px-4 py-3 text-right">{{ t('admin.modelPricing.col.cacheWrite') }}</th>
                <th class="px-4 py-3 text-right">{{ t('admin.modelPricing.col.longCtx') }}</th>
                <th class="px-4 py-3">{{ t('admin.modelPricing.col.flags') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="m in paged"
                :key="m.model + ':' + m.source"
                class="border-b last:border-b-0 hover:bg-secondary/30"
              >
                <td class="px-4 py-2 font-mono text-xs">{{ m.model }}</td>
                <td class="px-4 py-2 text-xs">{{ m.provider || '—' }}</td>
                <td class="px-4 py-2">
                  <span
                    class="rounded px-2 py-0.5 text-xs font-medium"
                    :class="
                      m.source === 'litellm'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    "
                  >
                    {{ m.source }}
                  </span>
                </td>
                <td class="px-4 py-2 text-xs">{{ m.mode || '—' }}</td>
                <td class="px-4 py-2 text-right font-mono text-xs">
                  {{ formatPrice(m.input_price_per_token) }}
                  <span v-if="m.input_price_per_token_priority" class="block text-[10px] text-muted-foreground">
                    ({{ t('admin.modelPricing.priority') }}: {{ formatPrice(m.input_price_per_token_priority) }})
                  </span>
                </td>
                <td class="px-4 py-2 text-right font-mono text-xs">
                  {{ formatPrice(m.output_price_per_token) }}
                  <span v-if="m.output_price_per_token_priority" class="block text-[10px] text-muted-foreground">
                    ({{ t('admin.modelPricing.priority') }}: {{ formatPrice(m.output_price_per_token_priority) }})
                  </span>
                </td>
                <td class="px-4 py-2 text-right font-mono text-xs">
                  {{ formatPrice(m.cache_read_price_per_token) }}
                </td>
                <td class="px-4 py-2 text-right font-mono text-xs">
                  {{ formatPrice(m.cache_creation_price_per_token) }}
                </td>
                <td class="px-4 py-2 text-right text-xs">
                  <span v-if="m.long_context_input_threshold">
                    {{ (m.long_context_input_threshold / 1000).toFixed(0) }}K
                    <span class="text-[10px] text-muted-foreground">
                      ({{ m.long_context_input_multiplier?.toFixed(1) }}×/{{
                        m.long_context_output_multiplier?.toFixed(1)
                      }}×)
                    </span>
                  </span>
                  <span v-else class="text-muted-foreground">—</span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-if="m.supports_prompt_caching"
                      class="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    >
                      cache
                    </span>
                    <span
                      v-if="m.supports_service_tier"
                      class="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      tier
                    </span>
                    <span
                      v-if="m.token_pricing_absent"
                      class="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      image-only
                    </span>
                    <span
                      v-if="m.output_price_per_image"
                      class="rounded bg-pink-100 px-1.5 py-0.5 text-[10px] font-medium text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                    >
                      image
                    </span>
                  </div>
                </td>
              </tr>
              <tr v-if="paged.length === 0">
                <td colspan="10" class="px-4 py-8 text-center text-muted-foreground">
                  {{ t('admin.modelPricing.empty') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="filtered.length > pageSize"
          class="flex items-center justify-between border-t px-4 py-3 text-sm"
        >
          <div class="text-xs text-muted-foreground">
            {{
              t('admin.modelPricing.pageInfo', {
                from: (page - 1) * pageSize + 1,
                to: Math.min(page * pageSize, filtered.length),
                total: filtered.length,
              })
            }}
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded border px-3 py-1 text-xs disabled:opacity-50"
              :disabled="page <= 1"
              @click="page--"
            >
              ← {{ t('admin.modelPricing.prev') }}
            </button>
            <span class="text-xs">{{ page }} / {{ totalPages }}</span>
            <button
              type="button"
              class="rounded border px-3 py-1 text-xs disabled:opacity-50"
              :disabled="page >= totalPages"
              @click="page++"
            >
              {{ t('admin.modelPricing.next') }} →
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import { adminAPI } from '@/api/admin'
import type {
  ModelPricingEntry,
  ModelPricingListResponse
} from '@/api/admin/modelPricing'

const { t } = useI18n()

const loading = ref(true)
const loadError = ref<string | null>(null)
const data = ref<ModelPricingListResponse | null>(null)

// filter state
const query = ref('')
const sourceFilter = ref('') // '' | 'litellm' | 'fallback'
const providerFilter = ref('')
const unit = ref<'1M' | '1K'>('1M')

// pagination
const page = ref(1)
const pageSize = 50

const filtered = computed<ModelPricingEntry[]>(() => {
  if (!data.value) return []
  const q = query.value.trim().toLowerCase()
  return data.value.models.filter((m) => {
    if (sourceFilter.value && m.source !== sourceFilter.value) return false
    if (providerFilter.value && m.provider !== providerFilter.value) return false
    if (q) {
      const hay = `${m.model} ${m.provider ?? ''} ${m.mode ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize))
)

const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

// reset page when filters change
watch([query, sourceFilter, providerFilter], () => {
  page.value = 1
})

function formatPrice(v: number | undefined | null): string {
  if (!v || v === 0) return '—'
  const factor = unit.value === '1M' ? 1e6 : 1e3
  const value = v * factor
  // Adaptive precision: small numbers get more digits
  if (value >= 100) return '$' + value.toFixed(2)
  if (value >= 1) return '$' + value.toFixed(3)
  if (value >= 0.01) return '$' + value.toFixed(4)
  return '$' + value.toFixed(6)
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    data.value = await adminAPI.modelPricing.list()
  } catch (err: any) {
    loadError.value = err?.message || String(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
