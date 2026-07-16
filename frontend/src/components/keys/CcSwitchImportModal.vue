<template>
  <BaseDialog
    :show="show"
    :title="t('keys.ccSwitchImport.title')"
    width="wide"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <!-- Client Selection Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="client in clientList"
          :key="client.id"
          @click="activeClient = client.id"
          :class="[
            'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
            activeClient === client.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
          ]"
        >
          <component :is="client.icon" class="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <span class="font-medium text-sm text-gray-900 dark:text-white">{{ client.label }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{{ client.desc }}</span>
        </button>
      </div>

      <!-- OS/Shell Tabs -->
      <div v-if="showShellTabs" class="overflow-x-auto border-b border-gray-200 dark:border-dark-700">
        <nav class="-mb-px flex min-w-max gap-4 sm:gap-6" aria-label="OS">
          <button
            v-for="tab in shellTabs"
            :key="tab.id"
            type="button"
            @click="activeTab = tab.id"
            :class="[
              'whitespace-nowrap py-2.5 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            <span class="flex items-center gap-2">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Config Content -->
      <div class="space-y-4">
        <div
          v-for="(file, index) in currentFiles"
          :key="index"
          class="relative"
        >
          <p v-if="file.hint" class="text-xs text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {{ file.hint }}
          </p>
          <div class="bg-gray-900 dark:bg-dark-900 rounded-xl overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-dark-800 border-b border-gray-700 dark:border-dark-700">
              <span class="min-w-0 truncate text-xs text-gray-400 font-mono">{{ file.path }}</span>
              <button
                type="button"
                @click="copyContent(file.content, index)"
                class="flex flex-shrink-0 items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
                :class="copiedIndex === index
                  ? 'text-green-400 bg-green-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'"
              >
                <svg v-if="copiedIndex === index" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                {{ copiedIndex === index ? t('keys.copied') : t('keys.copyToClipboard') }}
              </button>
            </div>
            <pre class="p-4 text-sm text-gray-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all"><code v-html="file.highlighted || escapeHtml(file.content)" /></pre>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button @click="emit('close')" class="btn btn-secondary">
          {{ t('common.cancel') }}
        </button>
        <button
          @click="handleImport"
          class="btn btn-primary flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {{ t('keys.ccSwitchImport.importButton') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@vueuse/core'
import { useAppStore } from '@/stores/app'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { buildCcSwitchImportDeeplink, type CcSwitchClientType } from '@/utils/ccswitchImport'
import type { GroupPlatform } from '@/types'

interface Props {
  show: boolean
  apiKey: string
  baseUrl: string
  platform: GroupPlatform | null
}

interface Emits {
  (e: 'close'): void
}

interface FileConfig {
  path: string
  content: string
  hint?: string
  highlighted?: string
}

interface ClientItem {
  id: CcSwitchClientType
  label: string
  desc: string
  icon: Component
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const { copy: clipboardCopy } = useClipboard()
const appStore = useAppStore()

const copiedIndex = ref<number | null>(null)
const activeClient = ref<CcSwitchClientType>('claude')
const activeTab = ref<string>('unix')

// --- Icon components ---
const TerminalIcon = {
  render() {
    return h('svg', {
      fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      'stroke-width': '1.5', class: 'w-6 h-6'
    }, [
      h('path', {
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        d: 'm6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 17.25V6.75A2.25 2.25 0 0 0 18.75 4.5H5.25A2.25 2.25 0 0 0 3 6.75v10.5A2.25 2.25 0 0 0 5.25 20.25Z'
      })
    ])
  }
}

const DesktopIcon = {
  render() {
    return h('svg', {
      fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      'stroke-width': '1.5', class: 'w-6 h-6'
    }, [
      h('path', {
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        d: 'M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z'
      })
    ])
  }
}

const CodexIcon = {
  render() {
    return h('svg', {
      fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      'stroke-width': '1.5', class: 'w-6 h-6'
    }, [
      h('path', {
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        d: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5'
      })
    ])
  }
}

const SparkleIcon = {
  render() {
    return h('svg', {
      fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      'stroke-width': '1.5', class: 'w-6 h-6'
    }, [
      h('path', {
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        d: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z'
      })
    ])
  }
}

const CodeIcon = {
  render() {
    return h('svg', {
      fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      'stroke-width': '1.5', class: 'w-6 h-6'
    }, [
      h('path', {
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        d: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5'
      })
    ])
  }
}

const OpenCodeIcon = {
  render() {
    return h('svg', {
      fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      'stroke-width': '1.5', class: 'w-6 h-6'
    }, [
      h('path', {
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        d: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 17.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z'
      })
    ])
  }
}

const BoltIcon = {
  render() {
    return h('svg', {
      fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
      'stroke-width': '1.5', class: 'w-6 h-6'
    }, [
      h('path', {
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        d: 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z'
      })
    ])
  }
}

const AppleIcon = {
  render() {
    return h('svg', {
      fill: 'currentColor', viewBox: '0 0 24 24', class: 'w-4 h-4'
    }, [
      h('path', { d: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z' })
    ])
  }
}

const WindowsIcon = {
  render() {
    return h('svg', {
      fill: 'currentColor', viewBox: '0 0 24 24', class: 'w-4 h-4'
    }, [
      h('path', { d: 'M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .25l10 .15V21l-10-1.91v-5.84z' })
    ])
  }
}

// --- Client list ---
const clientList = computed((): ClientItem[] => [
  { id: 'claude', label: t('keys.ccSwitchImport.clients.claudeCode'), desc: t('keys.ccSwitchImport.clients.claudeCodeDesc'), icon: TerminalIcon },
  { id: 'claude-desktop', label: t('keys.ccSwitchImport.clients.claudeDesktop'), desc: t('keys.ccSwitchImport.clients.claudeDesktopDesc'), icon: DesktopIcon },
  { id: 'codex', label: t('keys.ccSwitchImport.clients.codex'), desc: t('keys.ccSwitchImport.clients.codexDesc'), icon: CodexIcon },
  { id: 'gemini', label: t('keys.ccSwitchImport.clients.gemini'), desc: t('keys.ccSwitchImport.clients.geminiDesc'), icon: SparkleIcon },
  { id: 'openclaw', label: t('keys.ccSwitchImport.clients.openclaw'), desc: t('keys.ccSwitchImport.clients.openclawDesc'), icon: CodeIcon },
  { id: 'opencode', label: t('keys.ccSwitchImport.clients.opencode'), desc: t('keys.ccSwitchImport.clients.opencodeDesc'), icon: OpenCodeIcon },
  { id: 'hermes', label: t('keys.ccSwitchImport.clients.hermes'), desc: t('keys.ccSwitchImport.clients.hermesDesc'), icon: BoltIcon },
])

// --- Shell tabs ---
const shellTabs = [
  { id: 'unix', label: 'macOS / Linux', icon: AppleIcon },
  { id: 'cmd', label: 'Windows CMD', icon: WindowsIcon },
  { id: 'powershell', label: 'PowerShell', icon: WindowsIcon }
]

const showShellTabs = computed(() => activeClient.value !== 'opencode')

// --- Reset ---
watch(() => props.show, (show) => {
  if (show) {
    activeClient.value = 'claude'
    activeTab.value = 'unix'
  }
})

watch(activeClient, () => {
  activeTab.value = 'unix'
})

// --- Syntax highlighting helpers ---
const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const wrapToken = (className: string, value: string) =>
  `<span class="${className}">${escapeHtml(value)}</span>`

const kw = (value: string) => wrapToken('text-emerald-300', value)
const vr = (value: string) => wrapToken('text-sky-200', value)
const op = (value: string) => wrapToken('text-slate-400', value)
const st = (value: string) => wrapToken('text-amber-200', value)

// --- Base URL helpers ---
function getResolvedUrls() {
  const baseUrl = props.baseUrl || window.location.origin
  const baseRoot = baseUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '')
  const ensureV1 = (value: string) => {
    const trimmed = value.replace(/\/+$/, '')
    return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
  }
  const apiBase = ensureV1(baseRoot)
  const antigravityBase = ensureV1(`${baseRoot}/antigravity`)
  const geminiBase = (() => {
    const trimmed = baseRoot.replace(/\/+$/, '')
    return trimmed.endsWith('/v1beta') ? trimmed : `${trimmed}/v1beta`
  })()
  const antigravityGeminiBase = (() => {
    const trimmed = `${baseRoot}/antigravity`.replace(/\/+$/, '')
    return trimmed.endsWith('/v1beta') ? trimmed : `${trimmed}/v1beta`
  })()

  // Determine the effective base URL for the current platform
  const platform = props.platform || 'anthropic'
  let effectiveBase = apiBase
  let effectiveGeminiBase = geminiBase
  if (platform === 'antigravity') {
    effectiveBase = antigravityBase
    effectiveGeminiBase = antigravityGeminiBase
  }

  return { baseRoot, apiBase, antigravityBase, geminiBase, antigravityGeminiBase, effectiveBase, effectiveGeminiBase, platform }
}

// --- Config generators ---

function generateClaudeCodeFiles(): FileConfig[] {
  const { effectiveBase } = getResolvedUrls()
  const apiKey = props.apiKey
  const platform = props.platform || 'anthropic'

  // For grok platform, use model overrides
  if (platform === 'grok') {
    return generateGrokClaudeFiles()
  }

  let path: string
  let content: string
  let highlighted: string

  switch (activeTab.value) {
    case 'unix':
      path = 'Terminal'
      content = `export ANTHROPIC_BASE_URL="${effectiveBase}"
export ANTHROPIC_AUTH_TOKEN="${apiKey}"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export CLAUDE_CODE_ATTRIBUTION_HEADER=0`
      highlighted = [
        `${kw('export')} ${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
        `${kw('export')} ${vr('ANTHROPIC_AUTH_TOKEN')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('export')} ${vr('CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC')}${op('=')}${st('"1"')}`,
        `${kw('export')} ${vr('CLAUDE_CODE_ATTRIBUTION_HEADER')}${op('=')}${st('"0"')}`,
      ].join('\n')
      break
    case 'cmd':
      path = 'Command Prompt'
      content = `set ANTHROPIC_BASE_URL=${effectiveBase}
set ANTHROPIC_AUTH_TOKEN=${apiKey}
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
set CLAUDE_CODE_ATTRIBUTION_HEADER=0`
      highlighted = [
        `${kw('set')} ${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(effectiveBase)}`,
        `${kw('set')} ${vr('ANTHROPIC_AUTH_TOKEN')}${op('=')}${st(apiKey)}`,
        `${kw('set')} ${vr('CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC')}${op('=')}${st('1')}`,
        `${kw('set')} ${vr('CLAUDE_CODE_ATTRIBUTION_HEADER')}${op('=')}${st('0')}`,
      ].join('\n')
      break
    case 'powershell':
      path = 'PowerShell'
      content = `$env:ANTHROPIC_BASE_URL="${effectiveBase}"
$env:ANTHROPIC_AUTH_TOKEN="${apiKey}"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
$env:CLAUDE_CODE_ATTRIBUTION_HEADER=0`
      highlighted = [
        `${kw('$env:')}${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
        `${kw('$env:')}${vr('ANTHROPIC_AUTH_TOKEN')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('$env:')}${vr('CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC')}${op('=')}${st('"1"')}`,
        `${kw('$env:')}${vr('CLAUDE_CODE_ATTRIBUTION_HEADER')}${op('=')}${st('"0"')}`,
      ].join('\n')
      break
    default:
      path = 'Terminal'
      content = ''
      highlighted = ''
  }

  const settingsPath = activeTab.value === 'unix'
    ? '~/.claude/settings.json'
    : '%USERPROFILE%\\.claude\\settings.json'

  const settingsContent = `{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {
    "ANTHROPIC_BASE_URL": "${effectiveBase}",
    "ANTHROPIC_AUTH_TOKEN": "${apiKey}",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0"
  }
}`

  return [
    { path, content, highlighted },
    { path: settingsPath, content: settingsContent }
  ]
}

function generateGrokClaudeFiles(): FileConfig[] {
  const { apiBase } = getResolvedUrls()
  const apiKey = props.apiKey

  const environment: Record<string, string> = {
    ANTHROPIC_BASE_URL: apiBase,
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_MODEL: 'grok-4.5',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'grok-4.5',
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'grok-4.5',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'grok-4.5',
    ANTHROPIC_DEFAULT_FABLE_MODEL: 'grok-4.5',
    CLAUDE_CODE_SUBAGENT_MODEL: 'grok-4.5',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    CLAUDE_CODE_ATTRIBUTION_HEADER: '0'
  }

  let path: string
  let content: string
  let highlighted: string

  switch (activeTab.value) {
    case 'unix':
      path = 'Terminal'
      content = Object.entries(environment).map(([k, v]) => `export ${k}="${v}"`).join('\n')
      highlighted = Object.entries(environment).map(([k, v]) => `${kw('export')} ${vr(k)}${op('=')}${st(`"${v}"`)}`).join('\n')
      break
    case 'cmd':
      path = 'Command Prompt'
      content = Object.entries(environment).map(([k, v]) => `set ${k}=${v}`).join('\n')
      highlighted = Object.entries(environment).map(([k, v]) => `${kw('set')} ${vr(k)}${op('=')}${st(v)}`).join('\n')
      break
    case 'powershell':
      path = 'PowerShell'
      content = Object.entries(environment).map(([k, v]) => `$env:${k}="${v}"`).join('\n')
      highlighted = Object.entries(environment).map(([k, v]) => `${kw('$env:')}${vr(k)}${op('=')}${st(`"${v}"`)}`).join('\n')
      break
    default:
      path = 'Terminal'
      content = ''
      highlighted = ''
  }

  const settingsPath = activeTab.value === 'unix'
    ? '~/.claude/settings.json'
    : '%USERPROFILE%\\.claude\\settings.json'

  return [
    { path, content, highlighted },
    {
      path: settingsPath,
      content: JSON.stringify({ $schema: 'https://json.schemastore.org/claude-code-settings.json', env: environment }, null, 2)
    }
  ]
}

function generateClaudeDesktopFiles(): FileConfig[] {
  const { effectiveBase } = getResolvedUrls()
  const apiKey = props.apiKey

  let path: string
  let content: string
  let highlighted: string

  switch (activeTab.value) {
    case 'unix':
      path = 'Terminal'
      content = `export ANTHROPIC_API_KEY="${apiKey}"
export ANTHROPIC_BASE_URL="${effectiveBase}"`
      highlighted = [
        `${kw('export')} ${vr('ANTHROPIC_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('export')} ${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
      ].join('\n')
      break
    case 'cmd':
      path = 'Command Prompt'
      content = `set ANTHROPIC_API_KEY=${apiKey}
set ANTHROPIC_BASE_URL=${effectiveBase}`
      highlighted = [
        `${kw('set')} ${vr('ANTHROPIC_API_KEY')}${op('=')}${st(apiKey)}`,
        `${kw('set')} ${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(effectiveBase)}`,
      ].join('\n')
      break
    case 'powershell':
      path = 'PowerShell'
      content = `$env:ANTHROPIC_API_KEY="${apiKey}"
$env:ANTHROPIC_BASE_URL="${effectiveBase}"`
      highlighted = [
        `${kw('$env:')}${vr('ANTHROPIC_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('$env:')}${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
      ].join('\n')
      break
    default:
      path = 'Terminal'
      content = ''
      highlighted = ''
  }

  const configPath = activeTab.value === 'unix'
    ? '~/Library/Application Support/Claude/claude_desktop_config.json'
    : '%APPDATA%\\Claude\\claude_desktop_config.json'

  const configContent = `{
  "mcpServers": {},
  "env": {
    "ANTHROPIC_API_KEY": "${apiKey}",
    "ANTHROPIC_BASE_URL": "${effectiveBase}"
  }
}`

  return [
    { path, content, highlighted },
    { path: configPath, content: configContent }
  ]
}

function generateCodexFiles(): FileConfig[] {
  const { effectiveBase, platform } = getResolvedUrls()
  const apiKey = props.apiKey
  const isWindows = activeTab.value === 'windows' || activeTab.value === 'cmd' || activeTab.value === 'powershell'
  const configDir = isWindows ? '%userprofile%\\.codex' : '~/.codex'

  const isGrok = platform === 'grok'

  let configContent: string
  let authFile: FileConfig | null = null

  if (isGrok) {
    configContent = `model_provider = "sub2api_grok"
model = "grok-4.5"
review_model = "grok-4.5"
model_reasoning_effort = "xhigh"
model_context_window = 1000000

[model_providers.sub2api_grok]
name = "Sub2API Grok"
base_url = "${effectiveBase}"
env_key = "SUB2API_API_KEY"
wire_api = "responses"`

    const envContent = isWindows
      ? `$env:SUB2API_API_KEY="${apiKey}"`
      : `export SUB2API_API_KEY="${apiKey}"`

    authFile = {
      path: isWindows ? 'PowerShell' : 'Terminal',
      content: envContent
    }
  } else {
    configContent = `model_provider = "OpenAI"
model = "gpt-5.5"
review_model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
network_access = "enabled"
windows_wsl_setup_acknowledged = true

[model_providers.OpenAI]
name = "OpenAI"
base_url = "${effectiveBase}"
wire_api = "responses"
requires_openai_auth = true

[features]
goals = true`

    authFile = {
      path: `${configDir}/auth.json`,
      content: `{
  "OPENAI_API_KEY": "${apiKey}"
}`
    }
  }

  const files: FileConfig[] = [{ path: `${configDir}/config.toml`, content: configContent }]
  if (authFile) files.push(authFile)
  return files
}

function generateGeminiFiles(): FileConfig[] {
  const { effectiveGeminiBase } = getResolvedUrls()
  const apiKey = props.apiKey
  const model = 'gemini-2.0-flash'

  let path: string
  let content: string
  let highlighted: string

  switch (activeTab.value) {
    case 'unix':
      path = 'Terminal'
      content = `export GOOGLE_GEMINI_BASE_URL="${effectiveGeminiBase}"
export GEMINI_API_KEY="${apiKey}"
export GEMINI_MODEL="${model}"`
      highlighted = [
        `${kw('export')} ${vr('GOOGLE_GEMINI_BASE_URL')}${op('=')}${st(`"${effectiveGeminiBase}"`)}`,
        `${kw('export')} ${vr('GEMINI_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('export')} ${vr('GEMINI_MODEL')}${op('=')}${st(`"${model}"`)}`,
      ].join('\n')
      break
    case 'cmd':
      path = 'Command Prompt'
      content = `set GOOGLE_GEMINI_BASE_URL=${effectiveGeminiBase}
set GEMINI_API_KEY=${apiKey}
set GEMINI_MODEL=${model}`
      highlighted = [
        `${kw('set')} ${vr('GOOGLE_GEMINI_BASE_URL')}${op('=')}${st(effectiveGeminiBase)}`,
        `${kw('set')} ${vr('GEMINI_API_KEY')}${op('=')}${st(apiKey)}`,
        `${kw('set')} ${vr('GEMINI_MODEL')}${op('=')}${st(model)}`,
      ].join('\n')
      break
    case 'powershell':
      path = 'PowerShell'
      content = `$env:GOOGLE_GEMINI_BASE_URL="${effectiveGeminiBase}"
$env:GEMINI_API_KEY="${apiKey}"
$env:GEMINI_MODEL="${model}"`
      highlighted = [
        `${kw('$env:')}${vr('GOOGLE_GEMINI_BASE_URL')}${op('=')}${st(`"${effectiveGeminiBase}"`)}`,
        `${kw('$env:')}${vr('GEMINI_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('$env:')}${vr('GEMINI_MODEL')}${op('=')}${st(`"${model}"`)}`,
      ].join('\n')
      break
    default:
      path = 'Terminal'
      content = ''
      highlighted = ''
  }

  return [{ path, content, highlighted }]
}

function generateOpenClawFiles(): FileConfig[] {
  const { effectiveBase } = getResolvedUrls()
  const apiKey = props.apiKey

  let path: string
  let content: string
  let highlighted: string

  switch (activeTab.value) {
    case 'unix':
      path = 'Terminal'
      content = `export OPENAI_API_KEY="${apiKey}"
export OPENAI_BASE_URL="${effectiveBase}"`
      highlighted = [
        `${kw('export')} ${vr('OPENAI_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('export')} ${vr('OPENAI_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
      ].join('\n')
      break
    case 'cmd':
      path = 'Command Prompt'
      content = `set OPENAI_API_KEY=${apiKey}
set OPENAI_BASE_URL=${effectiveBase}`
      highlighted = [
        `${kw('set')} ${vr('OPENAI_API_KEY')}${op('=')}${st(apiKey)}`,
        `${kw('set')} ${vr('OPENAI_BASE_URL')}${op('=')}${st(effectiveBase)}`,
      ].join('\n')
      break
    case 'powershell':
      path = 'PowerShell'
      content = `$env:OPENAI_API_KEY="${apiKey}"
$env:OPENAI_BASE_URL="${effectiveBase}"`
      highlighted = [
        `${kw('$env:')}${vr('OPENAI_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('$env:')}${vr('OPENAI_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
      ].join('\n')
      break
    default:
      path = 'Terminal'
      content = ''
      highlighted = ''
  }

  return [{ path, content, highlighted }]
}

function generateOpenCodeFiles(): FileConfig[] {
  const { effectiveBase, effectiveGeminiBase, platform } = getResolvedUrls()
  const apiKey = props.apiKey

  const opencodePlatform = platform === 'antigravity' ? 'antigravity-claude' : platform || 'anthropic'

  if (platform === 'antigravity') {
    // Two configs for antigravity
    return [
      generateSingleOpenCodeConfig('antigravity-claude', effectiveBase, apiKey, 'opencode.json (Claude)'),
      generateSingleOpenCodeConfig('antigravity-gemini', effectiveGeminiBase, apiKey, 'opencode.json (Gemini)')
    ]
  }

  const baseForPlatform = platform === 'gemini' ? effectiveGeminiBase : effectiveBase
  return [generateSingleOpenCodeConfig(opencodePlatform, baseForPlatform, apiKey)]
}

function generateSingleOpenCodeConfig(opencodePlatform: string, baseUrl: string, apiKey: string, pathLabel?: string): FileConfig {
  const provider: Record<string, any> = {
    [opencodePlatform]: {
      options: {
        baseURL: baseUrl,
        apiKey
      }
    }
  }

  const openaiModels = {
    'gpt-5.2': { name: 'GPT-5.2', limit: { context: 400000, output: 128000 }, options: { store: false }, variants: { low: {}, medium: {}, high: {} } },
    'o3': { name: 'o3', limit: { context: 200000, output: 100000 }, options: { store: false }, variants: { low: {}, medium: {}, high: {} } },
    'gpt-4o': { name: 'GPT-4o', limit: { context: 128000, output: 16384 }, options: { store: false }, variants: { low: {}, medium: {}, high: {} } },
    'gpt-4o-mini': { name: 'GPT-4o Mini', limit: { context: 128000, output: 16384 }, options: { store: false }, variants: { low: {}, medium: {}, high: {} } }
  }
  const geminiModels = {
    'gemini-2.5-pro': { name: 'Gemini 2.5 Pro', limit: { context: 1048576, output: 65536 } },
    'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', limit: { context: 1048576, output: 65536 } },
    'gemini-2.0-flash': { name: 'Gemini 2.0 Flash', limit: { context: 1048576, output: 8192 } }
  }
  const claudeModels = {
    'claude-sonnet-4-20250514': { name: 'Claude Sonnet 4' },
    'claude-3-7-sonnet-20250219': { name: 'Claude 3.7 Sonnet' },
    'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet' }
  }
  const grokModels = {
    'grok-4.5': { name: 'Grok 4.5' },
    'grok-3': { name: 'Grok 3' },
    'grok-3-mini': { name: 'Grok 3 Mini' }
  }

  switch (opencodePlatform) {
    case 'anthropic':
      provider[opencodePlatform].npm = '@ai-sdk/anthropic'
      break
    case 'openai':
      provider[opencodePlatform].models = openaiModels
      provider[opencodePlatform].agent = { build: { model: 'gpt-5.2' }, plan: { model: 'o3' } }
      break
    case 'gemini':
      provider[opencodePlatform].npm = '@ai-sdk/google'
      provider[opencodePlatform].models = geminiModels
      break
    case 'antigravity-claude':
      provider[opencodePlatform].npm = '@ai-sdk/anthropic'
      provider[opencodePlatform].name = 'Antigravity (Claude)'
      provider[opencodePlatform].models = claudeModels
      break
    case 'antigravity-gemini':
      provider[opencodePlatform].npm = '@ai-sdk/google'
      provider[opencodePlatform].name = 'Antigravity (Gemini)'
      provider[opencodePlatform].models = geminiModels
      break
    case 'grok':
      provider[opencodePlatform].npm = '@ai-sdk/openai'
      provider[opencodePlatform].name = 'Grok'
      provider[opencodePlatform].models = grokModels
      break
  }

  const config = { $schema: 'https://opencode.ai/config.json', provider }
  const content = JSON.stringify(config, null, 2)

  return {
    path: pathLabel || 'opencode.json',
    content
  }
}

function generateHermesFiles(): FileConfig[] {
  const { effectiveBase } = getResolvedUrls()
  const apiKey = props.apiKey

  let path: string
  let content: string
  let highlighted: string

  switch (activeTab.value) {
    case 'unix':
      path = 'Terminal'
      content = `export ANTHROPIC_API_KEY="${apiKey}"
export ANTHROPIC_BASE_URL="${effectiveBase}"`
      highlighted = [
        `${kw('export')} ${vr('ANTHROPIC_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('export')} ${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
      ].join('\n')
      break
    case 'cmd':
      path = 'Command Prompt'
      content = `set ANTHROPIC_API_KEY=${apiKey}
set ANTHROPIC_BASE_URL=${effectiveBase}`
      highlighted = [
        `${kw('set')} ${vr('ANTHROPIC_API_KEY')}${op('=')}${st(apiKey)}`,
        `${kw('set')} ${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(effectiveBase)}`,
      ].join('\n')
      break
    case 'powershell':
      path = 'PowerShell'
      content = `$env:ANTHROPIC_API_KEY="${apiKey}"
$env:ANTHROPIC_BASE_URL="${effectiveBase}"`
      highlighted = [
        `${kw('$env:')}${vr('ANTHROPIC_API_KEY')}${op('=')}${st(`"${apiKey}"`)}`,
        `${kw('$env:')}${vr('ANTHROPIC_BASE_URL')}${op('=')}${st(`"${effectiveBase}"`)}`,
      ].join('\n')
      break
    default:
      path = 'Terminal'
      content = ''
      highlighted = ''
  }

  return [{ path, content, highlighted }]
}

// --- Current files computed ---
const currentFiles = computed((): FileConfig[] => {
  if (!props.platform) return []

  switch (activeClient.value) {
    case 'claude':
      return generateClaudeCodeFiles()
    case 'claude-desktop':
      return generateClaudeDesktopFiles()
    case 'codex':
      return generateCodexFiles()
    case 'gemini':
      return generateGeminiFiles()
    case 'openclaw':
      return generateOpenClawFiles()
    case 'opencode':
      return generateOpenCodeFiles()
    case 'hermes':
      return generateHermesFiles()
    default:
      return []
  }
})

// --- Copy ---
const copyContent = async (content: string, index: number) => {
  await clipboardCopy(content)
  copiedIndex.value = index
  setTimeout(() => {
    copiedIndex.value = null
  }, 2000)
}

// --- Import ---
const handleImport = () => {
  const baseUrl = props.baseUrl || window.location.origin
  const platform = props.platform || 'anthropic'

  const usageScript = `({
    request: {
      url: "{{baseUrl}}/v1/usage",
      method: "GET",
      headers: { "Authorization": "Bearer {{apiKey}}" }
    },
    extractor: function(response) {
      const remaining = response?.remaining ?? response?.quota?.remaining ?? response?.balance;
      const unit = response?.unit ?? response?.quota?.unit ?? "USD";
      return {
        isValid: response?.is_active ?? response?.isValid ?? true,
        remaining,
        unit
      };
    }
  })`

  const providerName = (appStore.cachedPublicSettings?.site_name || 'sub2api').trim() || 'sub2api'
  const deeplink = buildCcSwitchImportDeeplink({
    baseUrl,
    platform,
    clientType: activeClient.value,
    providerName,
    apiKey: props.apiKey,
    usageScript
  })

  try {
    window.open(deeplink, '_self')
    setTimeout(() => {
      if (document.hasFocus()) {
        appStore.showError(t('keys.ccSwitchNotInstalled'))
      }
    }, 100)
  } catch {
    appStore.showError(t('keys.ccSwitchNotInstalled'))
  }
}
</script>
