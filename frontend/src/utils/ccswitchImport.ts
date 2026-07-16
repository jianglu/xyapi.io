import type { GroupPlatform } from '@/types'

export const OPENAI_CC_SWITCH_CODEX_MODEL = 'gpt-5.5'

export type CcSwitchClientType =
  | 'claude'
  | 'claude-desktop'
  | 'codex'
  | 'gemini'
  | 'openclaw'
  | 'opencode'
  | 'hermes'

export interface CcSwitchImportConfig {
  app: string
  endpoint: string
  model?: string
}

export interface CcSwitchImportDeeplinkInput {
  baseUrl: string
  platform?: GroupPlatform | null
  clientType: CcSwitchClientType
  providerName: string
  apiKey: string
  usageScript: string
}

function appForClient(clientType: CcSwitchClientType): string {
  switch (clientType) {
    case 'claude':
      return 'claude'
    case 'claude-desktop':
      return 'claude-desktop'
    case 'codex':
      return 'codex'
    case 'gemini':
      return 'gemini'
    case 'openclaw':
      return 'openclaw'
    case 'opencode':
      return 'opencode'
    case 'hermes':
      return 'hermes'
    default:
      return clientType
  }
}

export function resolveCcSwitchImportConfig(
  platform: GroupPlatform | undefined | null,
  clientType: CcSwitchClientType,
  baseUrl: string
): CcSwitchImportConfig {
  const app = appForClient(clientType)

  switch (platform || 'anthropic') {
    case 'antigravity':
      return {
        app,
        endpoint: `${baseUrl}/antigravity`
      }
    case 'openai':
      return {
        app,
        endpoint: baseUrl,
        model: clientType === 'codex' ? OPENAI_CC_SWITCH_CODEX_MODEL : undefined
      }
    case 'gemini':
      return {
        app,
        endpoint: baseUrl
      }
    case 'grok':
      return {
        app,
        endpoint: baseUrl,
        model: clientType === 'codex' ? 'grok-4.5' : undefined
      }
    default:
      return {
        app,
        endpoint: baseUrl
      }
  }
}

export function buildCcSwitchImportDeeplink(input: CcSwitchImportDeeplinkInput): string {
  const config = resolveCcSwitchImportConfig(input.platform, input.clientType, input.baseUrl)
  const entries: [string, string][] = [
    ['resource', 'provider'],
    ['app', config.app],
    ['name', input.providerName],
    ['homepage', input.baseUrl],
    ['endpoint', config.endpoint],
    ['apiKey', input.apiKey],
    ['configFormat', 'json'],
    ['usageEnabled', 'true'],
    ['usageScript', btoa(input.usageScript)],
    ['usageAutoInterval', '30']
  ]

  if (config.model) {
    entries.splice(2, 0, ['model', config.model])
  }

  return `ccswitch://v1/import?${new URLSearchParams(entries).toString()}`
}
