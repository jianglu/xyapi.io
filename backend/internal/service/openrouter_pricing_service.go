package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/pkg/logger"
	"github.com/Wei-Shaw/sub2api/internal/util/urlvalidator"
)

// ============================================================================
// OpenRouter 定价同步服务
//
// 从 https://openrouter.ai/api/v1/models 拉取全部模型定价，作为一个独立的
// 定价来源（PricingSourceOpenRouter），在 ModelPricingResolver 中优先于
// LiteLLM 目录。OpenRouter 的模型 ID 形如 "openai/gpt-4o"、
// "anthropic/claude-3.5-sonnet"，与用户经 OpenRouter 兼容端点请求的模型名
// 一致，因此按其原生 ID（小写）建索引即可命中。
//
// 该功能默认关闭，由管理员在后台开启并配置刷新间隔；关闭时不产生任何外部
// 请求，且解析器会自然回退到 LiteLLM / fallback。
// ============================================================================

const (
	openRouterDefaultRemoteURL       = "https://openrouter.ai/api/v1/models"
	openRouterDefaultIntervalMinutes = 360 // 6 小时
	openRouterMinIntervalMinutes     = 30
	openRouterMaxIntervalMinutes     = 10080 // 一周
	openRouterFetchTimeout           = 30 * time.Second
)

// OpenRouterPricingSettings 控制 OpenRouter 定价同步器。
type OpenRouterPricingSettings struct {
	Enabled         bool   `json:"enabled"`
	IntervalMinutes int    `json:"interval_minutes"`
	RemoteURL       string `json:"remote_url,omitempty"`
}

func defaultOpenRouterPricingSettings() *OpenRouterPricingSettings {
	return &OpenRouterPricingSettings{
		Enabled:         false,
		IntervalMinutes: openRouterDefaultIntervalMinutes,
		RemoteURL:       openRouterDefaultRemoteURL,
	}
}

func normalizeOpenRouterPricingSettings(s *OpenRouterPricingSettings) {
	if s.IntervalMinutes < openRouterMinIntervalMinutes {
		s.IntervalMinutes = openRouterMinIntervalMinutes
	}
	if s.IntervalMinutes > openRouterMaxIntervalMinutes {
		s.IntervalMinutes = openRouterMaxIntervalMinutes
	}
	if strings.TrimSpace(s.RemoteURL) == "" {
		s.RemoteURL = openRouterDefaultRemoteURL
	}
}

// ---- SettingService getter / setter（镜像 UpstreamBillingProbe 模式）----

// GetOpenRouterPricingSettings 读取设置，缺失时返回默认值。
func (s *SettingService) GetOpenRouterPricingSettings(ctx context.Context) (*OpenRouterPricingSettings, error) {
	defaults := defaultOpenRouterPricingSettings()
	if s == nil || s.settingRepo == nil {
		return defaults, nil
	}
	value, err := s.settingRepo.GetValue(ctx, SettingKeyOpenRouterPricingSettings)
	if err != nil {
		if errors.Is(err, ErrSettingNotFound) {
			return defaults, nil
		}
		return nil, fmt.Errorf("get openrouter pricing settings: %w", err)
	}
	if strings.TrimSpace(value) == "" {
		return defaults, nil
	}
	settings := *defaults
	if err := json.Unmarshal([]byte(value), &settings); err != nil {
		return nil, fmt.Errorf("parse openrouter pricing settings: %w", err)
	}
	normalizeOpenRouterPricingSettings(&settings)
	return &settings, nil
}

// SetOpenRouterPricingSettings 校验并持久化设置。
func (s *SettingService) SetOpenRouterPricingSettings(ctx context.Context, settings *OpenRouterPricingSettings) error {
	if s == nil || s.settingRepo == nil {
		return fmt.Errorf("setting repository is unavailable")
	}
	if settings == nil {
		return infraerrors.BadRequest("INVALID_OPENROUTER_PRICING_SETTINGS", "settings cannot be nil")
	}
	if settings.IntervalMinutes < openRouterMinIntervalMinutes || settings.IntervalMinutes > openRouterMaxIntervalMinutes {
		return infraerrors.BadRequest(
			"INVALID_OPENROUTER_PRICING_INTERVAL",
			fmt.Sprintf("interval_minutes must be between %d and %d", openRouterMinIntervalMinutes, openRouterMaxIntervalMinutes),
		)
	}
	normalizeOpenRouterPricingSettings(settings)
	data, err := json.Marshal(settings)
	if err != nil {
		return fmt.Errorf("marshal openrouter pricing settings: %w", err)
	}
	return s.settingRepo.Set(ctx, SettingKeyOpenRouterPricingSettings, string(data))
}

// ---- OpenRouter API 响应结构 ----

type openRouterModelsResponse struct {
	Data []openRouterModel `json:"data"`
}

type openRouterModel struct {
	ID      string            `json:"id"`
	Name    string            `json:"name"`
	Pricing openRouterPricing `json:"pricing"`
}

// openRouterPricing 各字段均为字符串（USD/单位），"-1" 表示动态定价需跳过。
type openRouterPricing struct {
	Prompt          string `json:"prompt"`
	Completion      string `json:"completion"`
	Request         string `json:"request"`
	Image           string `json:"image"`
	InputCacheRead  string `json:"input_cache_read"`
	InputCacheWrite string `json:"input_cache_write"`
}

// parseORPrice 把 OpenRouter 的字符串价格转为 float64；空串 / "-1" / 非法 → 0。
func parseORPrice(v string) float64 {
	v = strings.TrimSpace(v)
	if v == "" || v == "-1" {
		return 0
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil || f < 0 {
		return 0
	}
	return f
}

// OpenRouterPricingService 从 OpenRouter 拉取并缓存模型定价。
type OpenRouterPricingService struct {
	cfg            *config.Config
	remoteClient   PricingRemoteClient
	settingService *SettingService

	mu          sync.RWMutex
	pricingData map[string]*ModelPricing // key: 小写模型 ID
	lastUpdated time.Time
	lastError   string

	stopCh chan struct{}
	wg     sync.WaitGroup
}

// NewOpenRouterPricingService 创建服务实例。
func NewOpenRouterPricingService(cfg *config.Config, remoteClient PricingRemoteClient, settingService *SettingService) *OpenRouterPricingService {
	return &OpenRouterPricingService{
		cfg:            cfg,
		remoteClient:   remoteClient,
		settingService: settingService,
		pricingData:    make(map[string]*ModelPricing),
		stopCh:         make(chan struct{}),
	}
}

// Initialize 启动时若已启用则做一次初始拉取，并开启后台定时刷新。
func (s *OpenRouterPricingService) Initialize() {
	settings, err := s.settingService.GetOpenRouterPricingSettings(context.Background())
	if err != nil {
		logger.LegacyPrintf("service.openrouter_pricing", "[OpenRouter] read settings failed: %v", err)
		settings = defaultOpenRouterPricingSettings()
	}
	if settings.Enabled {
		if err := s.refresh(settings.RemoteURL); err != nil {
			logger.LegacyPrintf("service.openrouter_pricing", "[OpenRouter] initial fetch failed: %v", err)
		}
	}
	s.startScheduler()
}

// Stop 停止后台调度。
func (s *OpenRouterPricingService) Stop() {
	select {
	case <-s.stopCh:
		// already closed
	default:
		close(s.stopCh)
	}
	s.wg.Wait()
}

// startScheduler 每分钟检查一次是否到达刷新周期（读取最新设置，可运行时调整）。
func (s *OpenRouterPricingService) startScheduler() {
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-s.stopCh:
				return
			case <-ticker.C:
				settings, err := s.settingService.GetOpenRouterPricingSettings(context.Background())
				if err != nil || !settings.Enabled {
					continue
				}
				s.mu.RLock()
				last := s.lastUpdated
				s.mu.RUnlock()
				interval := time.Duration(settings.IntervalMinutes) * time.Minute
				if last.IsZero() || time.Since(last) >= interval {
					if err := s.refresh(settings.RemoteURL); err != nil {
						logger.LegacyPrintf("service.openrouter_pricing", "[OpenRouter] scheduled fetch failed: %v", err)
					}
				}
			}
		}
	}()
}

// ForceUpdate 立即拉取一次（管理员手动触发，忽略 enabled 开关）。
func (s *OpenRouterPricingService) ForceUpdate(ctx context.Context) error {
	settings, err := s.settingService.GetOpenRouterPricingSettings(ctx)
	if err != nil {
		settings = defaultOpenRouterPricingSettings()
	}
	return s.refresh(settings.RemoteURL)
}

// refresh 执行一次拉取 + 解析 + 写入缓存。
func (s *OpenRouterPricingService) refresh(remoteURL string) error {
	url, err := s.validateURL(remoteURL)
	if err != nil {
		s.setError(err)
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), openRouterFetchTimeout)
	defer cancel()

	body, err := s.remoteClient.FetchPricingJSON(ctx, url)
	if err != nil {
		s.setError(err)
		return fmt.Errorf("fetch openrouter models: %w", err)
	}
	var resp openRouterModelsResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		s.setError(err)
		return fmt.Errorf("parse openrouter models: %w", err)
	}

	data := make(map[string]*ModelPricing, len(resp.Data))
	for _, m := range resp.Data {
		id := strings.ToLower(strings.TrimSpace(m.ID))
		if id == "" {
			continue
		}
		input := parseORPrice(m.Pricing.Prompt)
		output := parseORPrice(m.Pricing.Completion)
		// 仅有图片/请求价而无 token 价的条目跳过（token 计费会误判为 $0）。
		if input == 0 && output == 0 {
			continue
		}
		data[id] = &ModelPricing{
			InputPricePerToken:         input,
			OutputPricePerToken:        output,
			CacheReadPricePerToken:     parseORPrice(m.Pricing.InputCacheRead),
			CacheCreationPricePerToken: parseORPrice(m.Pricing.InputCacheWrite),
		}
	}

	s.mu.Lock()
	s.pricingData = data
	s.lastUpdated = time.Now()
	s.lastError = ""
	s.mu.Unlock()

	logger.LegacyPrintf("service.openrouter_pricing", "[OpenRouter] loaded %d models", len(data))
	return nil
}

func (s *OpenRouterPricingService) setError(err error) {
	s.mu.Lock()
	s.lastError = err.Error()
	s.mu.Unlock()
}

// GetModelPricing 返回指定模型的 OpenRouter 定价，未命中返回 nil。
func (s *OpenRouterPricingService) GetModelPricing(model string) *ModelPricing {
	if s == nil {
		return nil
	}
	key := strings.ToLower(strings.TrimSpace(model))
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.pricingData[key]
}

// ListAll 返回缓存副本，供管理端模型价格总览页展示。
func (s *OpenRouterPricingService) ListAll() map[string]*ModelPricing {
	if s == nil {
		return nil
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[string]*ModelPricing, len(s.pricingData))
	for k, v := range s.pricingData {
		out[k] = v
	}
	return out
}

// GetStatus 返回同步状态。
func (s *OpenRouterPricingService) GetStatus() map[string]any {
	if s == nil {
		return map[string]any{"model_count": 0}
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return map[string]any{
		"model_count":  len(s.pricingData),
		"last_updated": s.lastUpdated,
		"last_error":   s.lastError,
	}
}

// validateURL 复用 pricing 白名单（关闭白名单时仅校验 https 格式）。
func (s *OpenRouterPricingService) validateURL(raw string) (string, error) {
	if strings.TrimSpace(raw) == "" {
		raw = openRouterDefaultRemoteURL
	}
	if s.cfg != nil && !s.cfg.Security.URLAllowlist.Enabled {
		normalized, err := urlvalidator.ValidateURLFormat(raw, s.cfg.Security.URLAllowlist.AllowInsecureHTTP)
		if err != nil {
			return "", fmt.Errorf("invalid openrouter url: %w", err)
		}
		return normalized, nil
	}
	normalized, err := urlvalidator.ValidateHTTPSURL(raw, urlvalidator.ValidationOptions{
		AllowedHosts:     s.cfg.Security.URLAllowlist.PricingHosts,
		RequireAllowlist: true,
		AllowPrivate:     s.cfg.Security.URLAllowlist.AllowPrivateHosts,
	})
	if err != nil {
		return "", fmt.Errorf("invalid openrouter url: %w", err)
	}
	return normalized, nil
}
