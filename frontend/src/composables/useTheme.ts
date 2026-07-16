/**
 * Theme composable - manages primary color theme via CSS custom properties.
 *
 * Preset themes replace the `primary` color palette at runtime by setting
 * CSS variables on `:root`. The admin-configured theme is fetched from
 * public settings; if unavailable, defaults to "teal".
 */

export type ThemePreset = 'teal' | 'blue' | 'purple' | 'orange' | 'red'

export interface ThemeOption {
  id: ThemePreset
  label: string
  /** The 500-shade hex color, used as the swatch in the picker */
  color: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'teal', label: 'Teal', color: '#14b8a6' },
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'purple', label: 'Purple', color: '#8b5cf6' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'red', label: 'Red', color: '#ef4444' }
]

/**
 * Full 50-950 color scales for each preset.
 * These are the standard Tailwind color scales.
 */
const THEME_SCALES: Record<ThemePreset, Record<string, string>> = {
  teal: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
    400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
    800: '#115e59', 900: '#134e4a', 950: '#042f2e'
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
  },
  purple: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12', 950: '#431407'
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a'
  }
}

/** RGB components for glow/gradient effects (derived from 500 shade) */
const THEME_RGB: Record<ThemePreset, { r: number; g: number; b: number }> = {
  teal: { r: 20, g: 184, b: 166 },
  blue: { r: 59, g: 130, b: 246 },
  purple: { r: 139, g: 92, b: 246 },
  orange: { r: 249, g: 115, b: 22 },
  red: { r: 239, g: 68, b: 68 }
}

/**
 * Convert a hex color to space-separated RGB string (e.g. "20 184 166").
 * Used for Tailwind's `rgb(var(...) / <alpha-value>)` pattern.
 */
function hexToRgbSpace(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

/**
 * Apply a theme preset by setting CSS custom properties on `:root`.
 */
export function applyTheme(preset: ThemePreset) {
  const root = document.documentElement
  const scale = THEME_SCALES[preset]
  if (!scale) return

  // Set primary color CSS variables (hex values for direct use)
  for (const [shade, hex] of Object.entries(scale)) {
    root.style.setProperty(`--color-primary-${shade}`, hex)
    // Set space-separated RGB for Tailwind opacity modifier support
    root.style.setProperty(`--color-primary-rgb-${shade}`, hexToRgbSpace(hex))
  }

  // Set RGB components for glow/gradient
  const rgb = THEME_RGB[preset]
  root.style.setProperty('--color-primary-rgb-r', String(rgb.r))
  root.style.setProperty('--color-primary-rgb-g', String(rgb.g))
  root.style.setProperty('--color-primary-rgb-b', String(rgb.b))

  // Store current theme for reference
  root.setAttribute('data-theme', preset)
}

/**
 * Initialize theme from a preset name (typically from server public settings).
 * Falls back to "teal" if the preset is invalid.
 */
export function initTheme(preset?: string) {
  const valid = THEME_OPTIONS.find(o => o.id === preset)
  applyTheme((valid?.id ?? 'teal') as ThemePreset)
}
