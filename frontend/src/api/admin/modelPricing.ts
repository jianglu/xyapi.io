import { apiClient } from '@/api/client'

/**
 * Aggregated pricing entry for a single model.
 * All price fields are USD **per single token** (LiteLLM convention).
 * Frontend formats to /1K or /1M for display.
 */
export interface ModelPricingEntry {
  model: string
  provider?: string
  /** Source of this entry: OpenRouter overlay, dynamic LiteLLM catalog, or hard-coded fallback. */
  source: 'openrouter' | 'litellm' | 'fallback'
  /** LiteLLM-reported mode: chat / embedding / image_generation / ... */
  mode?: string

  input_price_per_token: number
  input_price_per_token_priority?: number
  output_price_per_token: number
  output_price_per_token_priority?: number

  cache_creation_price_per_token?: number
  cache_read_price_per_token?: number
  cache_creation_5m_price?: number
  cache_creation_1h_price?: number

  image_input_price_per_token?: number
  image_output_price_per_token?: number
  output_price_per_image?: number

  long_context_input_threshold?: number
  long_context_input_multiplier?: number
  long_context_output_multiplier?: number

  supports_prompt_caching?: boolean
  supports_service_tier?: boolean
  supports_cache_breakdown?: boolean
  token_pricing_absent?: boolean
}

export interface ModelPricingListResponse {
  total: number
  /** Per-source counts, e.g. { litellm: 215, fallback: 12 } */
  sources: Record<string, number>
  /** All entries, pre-sorted by (source, provider, model). */
  models: ModelPricingEntry[]
  /** PricingService.GetStatus() — { model_count, last_updated, local_hash } */
  status: {
    model_count?: number
    last_updated?: string
    local_hash?: string
  }
  /** Unique providers (for filter dropdown), sorted. */
  providers: string[]
}

export const modelPricingAPI = {
  async list(): Promise<ModelPricingListResponse> {
    const { data } = await apiClient.get<ModelPricingListResponse>('/admin/pricing/models')
    return data
  },

  async getOpenRouterSettings(): Promise<OpenRouterSettingsResponse> {
    const { data } = await apiClient.get<OpenRouterSettingsResponse>('/admin/pricing/openrouter/settings')
    return data
  },

  async updateOpenRouterSettings(
    payload: OpenRouterPricingSettings
  ): Promise<{ settings: OpenRouterPricingSettings }> {
    const { data } = await apiClient.put<{ settings: OpenRouterPricingSettings }>(
      '/admin/pricing/openrouter/settings',
      payload
    )
    return data
  },

  async refreshOpenRouter(): Promise<{ status: OpenRouterSyncStatus }> {
    const { data } = await apiClient.post<{ status: OpenRouterSyncStatus }>(
      '/admin/pricing/openrouter/refresh'
    )
    return data
  }
}

export interface OpenRouterPricingSettings {
  enabled: boolean
  interval_minutes: number
  remote_url: string
}

export interface OpenRouterSyncStatus {
  model_count?: number
  last_updated?: string
  last_error?: string
}

export interface OpenRouterSettingsResponse {
  settings: OpenRouterPricingSettings
  status: OpenRouterSyncStatus
}

export default modelPricingAPI
