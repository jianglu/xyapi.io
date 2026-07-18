package admin

import (
	"sort"
	"strings"

	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/gin-gonic/gin"
)

// ModelPricingHandler exposes a read-only aggregated view of the model
// pricing catalog for admin UIs. It merges the fallback (hard-coded) and
// LiteLLM (dynamic remote) pricing sources into a single list, tagging
// each entry with its source. Channel-level per-model overrides
// (ChannelModelPricing) are managed elsewhere and are NOT included here —
// this view is intentionally the "global default" catalog.
type ModelPricingHandler struct {
	billingService *service.BillingService
	pricingService *service.PricingService
}

// NewModelPricingHandler creates a new admin model pricing handler.
func NewModelPricingHandler(
	billingService *service.BillingService,
	pricingService *service.PricingService,
) *ModelPricingHandler {
	return &ModelPricingHandler{
		billingService: billingService,
		pricingService: pricingService,
	}
}

// modelPricingEntry is the flattened, front-end-friendly representation
// of a single model's pricing record.
//
// Prices are USD per single token (LiteLLM convention). The frontend is
// expected to format these for display (e.g. multiply by 1e6 to show
// "USD / 1M tokens").
type modelPricingEntry struct {
	Model                       string  `json:"model"`
	Provider                    string  `json:"provider,omitempty"`
	Source                      string  `json:"source"` // "litellm" | "fallback"
	Mode                        string  `json:"mode,omitempty"`
	InputPricePerToken          float64 `json:"input_price_per_token"`
	InputPricePerTokenPriority  float64 `json:"input_price_per_token_priority,omitempty"`
	OutputPricePerToken         float64 `json:"output_price_per_token"`
	OutputPricePerTokenPriority float64 `json:"output_price_per_token_priority,omitempty"`
	CacheCreationPricePerToken  float64 `json:"cache_creation_price_per_token,omitempty"`
	CacheReadPricePerToken      float64 `json:"cache_read_price_per_token,omitempty"`
	CacheCreation5mPrice        float64 `json:"cache_creation_5m_price,omitempty"`
	CacheCreation1hPrice        float64 `json:"cache_creation_1h_price,omitempty"`
	ImageInputPricePerToken     float64 `json:"image_input_price_per_token,omitempty"`
	ImageOutputPricePerToken    float64 `json:"image_output_price_per_token,omitempty"`
	OutputPricePerImage         float64 `json:"output_price_per_image,omitempty"`
	LongContextInputThreshold   int     `json:"long_context_input_threshold,omitempty"`
	LongContextInputMultiplier  float64 `json:"long_context_input_multiplier,omitempty"`
	LongContextOutputMultiplier float64 `json:"long_context_output_multiplier,omitempty"`
	SupportsPromptCaching       bool    `json:"supports_prompt_caching,omitempty"`
	SupportsServiceTier         bool    `json:"supports_service_tier,omitempty"`
	SupportsCacheBreakdown      bool    `json:"supports_cache_breakdown,omitempty"`
	TokenPricingAbsent          bool    `json:"token_pricing_absent,omitempty"`
}

// modelPricingListResponse is the top-level JSON payload.
type modelPricingListResponse struct {
	Total    int                 `json:"total"`
	Sources  map[string]int      `json:"sources"`  // source -> count
	Models   []modelPricingEntry `json:"models"`   // sorted by (source, provider, model)
	Status   map[string]any      `json:"status"`   // PricingService.GetStatus()
	Providers []string           `json:"providers"` // sorted unique provider list (for filter dropdown)
}

// List returns the aggregated model pricing catalog.
//
// Precedence when a model name exists in both sources:
//   - "litellm" (dynamic, up-to-date remote data) wins over "fallback"
//     (hard-coded in-process defaults).
//
// The endpoint is intentionally unpaginated — the total is a few hundred
// rows at most and admins want to filter/search client-side.
func (h *ModelPricingHandler) List(c *gin.Context) {
	litellm := h.pricingService.ListAll()
	fallback := h.billingService.ListFallbackPricing()

	// Union of model names; when a model exists in both, "litellm" takes
	// precedence so we mark the entry with that source.
	entries := make([]modelPricingEntry, 0, len(litellm)+len(fallback))
	seen := make(map[string]bool, len(litellm))
	for name, p := range litellm {
		if p == nil {
			continue
		}
		entries = append(entries, litellmEntry(name, p))
		seen[name] = true
	}
	for name, p := range fallback {
		if p == nil || seen[name] {
			continue
		}
		entries = append(entries, fallbackEntry(name, p))
	}

	// Stable sort: (source asc, provider asc, model asc). This puts
	// LiteLLM entries first and groups by provider for easier scanning.
	sort.SliceStable(entries, func(i, j int) bool {
		a, b := entries[i], entries[j]
		if a.Source != b.Source {
			return a.Source < b.Source
		}
		if a.Provider != b.Provider {
			return strings.ToLower(a.Provider) < strings.ToLower(b.Provider)
		}
		return strings.ToLower(a.Model) < strings.ToLower(b.Model)
	})

	// Per-source counts + unique provider list for filter dropdowns.
	sources := make(map[string]int, 2)
	providerSet := make(map[string]struct{})
	for _, e := range entries {
		sources[e.Source]++
		if e.Provider != "" {
			providerSet[e.Provider] = struct{}{}
		}
	}
	providers := make([]string, 0, len(providerSet))
	for p := range providerSet {
		providers = append(providers, p)
	}
	sort.Strings(providers)

	response.Success(c, modelPricingListResponse{
		Total:     len(entries),
		Sources:   sources,
		Models:    entries,
		Status:    h.pricingService.GetStatus(),
		Providers: providers,
	})
}

// litellmEntry converts a LiteLLM catalog record into the flat response type.
func litellmEntry(name string, p *service.LiteLLMModelPricing) modelPricingEntry {
	return modelPricingEntry{
		Model:                       name,
		Provider:                    p.LiteLLMProvider,
		Source:                      service.PricingSourceLiteLLM,
		Mode:                        p.Mode,
		InputPricePerToken:          p.InputCostPerToken,
		InputPricePerTokenPriority:  p.InputCostPerTokenPriority,
		OutputPricePerToken:         p.OutputCostPerToken,
		OutputPricePerTokenPriority: p.OutputCostPerTokenPriority,
		CacheCreationPricePerToken:  p.CacheCreationInputTokenCost,
		CacheReadPricePerToken:      p.CacheReadInputTokenCost,
		CacheCreation1hPrice:        p.CacheCreationInputTokenCostAbove1hr,
		ImageInputPricePerToken:     p.InputCostPerImageToken,
		ImageOutputPricePerToken:    p.OutputCostPerImageToken,
		OutputPricePerImage:         p.OutputCostPerImage,
		LongContextInputThreshold:   p.LongContextInputTokenThreshold,
		LongContextInputMultiplier:  p.LongContextInputCostMultiplier,
		LongContextOutputMultiplier: p.LongContextOutputCostMultiplier,
		SupportsPromptCaching:       p.SupportsPromptCaching,
		SupportsServiceTier:         p.SupportsServiceTier,
		TokenPricingAbsent:          p.TokenPricingAbsent,
	}
}

// fallbackEntry converts a hard-coded ModelPricing record into the flat
// response type. Fallback entries don't carry provider/mode metadata
// (they're keyed only by model name), so those fields stay empty.
func fallbackEntry(name string, p *service.ModelPricing) modelPricingEntry {
	return modelPricingEntry{
		Model:                       name,
		Source:                      service.PricingSourceFallback,
		InputPricePerToken:          p.InputPricePerToken,
		InputPricePerTokenPriority:  p.InputPricePerTokenPriority,
		OutputPricePerToken:         p.OutputPricePerToken,
		OutputPricePerTokenPriority: p.OutputPricePerTokenPriority,
		CacheCreationPricePerToken:  p.CacheCreationPricePerToken,
		CacheReadPricePerToken:      p.CacheReadPricePerToken,
		CacheCreation5mPrice:        p.CacheCreation5mPrice,
		CacheCreation1hPrice:        p.CacheCreation1hPrice,
		ImageInputPricePerToken:     p.ImageInputPricePerToken,
		ImageOutputPricePerToken:    p.ImageOutputPricePerToken,
		LongContextInputThreshold:   p.LongContextInputThreshold,
		LongContextInputMultiplier:  p.LongContextInputMultiplier,
		LongContextOutputMultiplier: p.LongContextOutputMultiplier,
		SupportsCacheBreakdown:      p.SupportsCacheBreakdown,
	}
}
