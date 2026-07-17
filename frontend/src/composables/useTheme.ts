/**
 * Theme composable - manages primary color theme via CSS custom properties.
 *
 * Preset themes replace the `primary` color palette at runtime by setting
 * CSS variables on `:root`. The admin-configured theme is fetched from
 * public settings; if unavailable, defaults to "teal".
 *
 * Inspired by shadcn/ui's theming system, each preset also defines a set
 * of semantic color variables (background, foreground, card, muted, etc.)
 * in both light and dark modes.
 */

export type ThemePreset =
  | 'teal' | 'blue' | 'indigo' | 'violet' | 'purple'
  | 'fuchsia' | 'pink' | 'rose' | 'red' | 'orange'
  | 'amber' | 'green' | 'emerald' | 'cyan'

export interface ThemeOption {
  id: ThemePreset
  label: string
  /** The 500-shade hex color, used as the swatch in the picker */
  color: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'teal',    label: 'Teal',    color: '#14b8a6' },
  { id: 'blue',    label: 'Blue',    color: '#3b82f6' },
  { id: 'indigo',  label: 'Indigo',  color: '#6366f1' },
  { id: 'violet',  label: 'Violet',  color: '#8b5cf6' },
  { id: 'purple',  label: 'Purple',  color: '#a855f7' },
  { id: 'fuchsia', label: 'Fuchsia', color: '#d946ef' },
  { id: 'pink',    label: 'Pink',    color: '#ec4899' },
  { id: 'rose',    label: 'Rose',    color: '#f43f5e' },
  { id: 'red',     label: 'Red',     color: '#ef4444' },
  { id: 'orange',  label: 'Orange',  color: '#f97316' },
  { id: 'amber',   label: 'Amber',   color: '#f59e0b' },
  { id: 'green',   label: 'Green',   color: '#22c55e' },
  { id: 'emerald', label: 'Emerald', color: '#10b981' },
  { id: 'cyan',    label: 'Cyan',    color: '#06b6d4' },
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
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
  },
  violet: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
    400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
    800: '#6b21a8', 900: '#581c87', 950: '#3b0764'
  },
  fuchsia: {
    50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc',
    400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf',
    800: '#86198f', 900: '#701a75', 950: '#4a044e'
  },
  pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
    400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
    800: '#9d174d', 900: '#831843', 950: '#500724'
  },
  rose: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
    400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
    800: '#9f1239', 900: '#881337', 950: '#4c0519'
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a'
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12', 950: '#431407'
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03'
  },
  green: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
    400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
    800: '#166534', 900: '#14532d', 950: '#052e16'
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22'
  },
  cyan: {
    50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
    400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
    800: '#155e75', 900: '#164e63', 950: '#083344'
  },
}

/** RGB components for glow/gradient effects (derived from 500 shade) */
const THEME_RGB: Record<ThemePreset, { r: number; g: number; b: number }> = {
  teal:    { r: 20,  g: 184, b: 166 },
  blue:    { r: 59,  g: 130, b: 246 },
  indigo:  { r: 99,  g: 102, b: 241 },
  violet:  { r: 139, g: 92,  b: 246 },
  purple:  { r: 168, g: 85,  b: 247 },
  fuchsia: { r: 217, g: 70,  b: 239 },
  pink:    { r: 236, g: 72,  b: 153 },
  rose:    { r: 244, g: 63,  b: 94 },
  red:     { r: 239, g: 68,  b: 68 },
  orange:  { r: 249, g: 115, b: 22 },
  amber:   { r: 245, g: 158, b: 11 },
  green:   { r: 34,  g: 197, b: 94 },
  emerald: { r: 16,  g: 185, b: 129 },
  cyan:    { r: 6,   g: 182, b: 212 },
}

/**
 * Semantic color tokens for each preset, in both light and dark modes.
 * Values are HSL channel strings (e.g. "0 0% 100%") used with
 * `hsl(var(--token) / <alpha-value>)`.
 *
 * The base (background/foreground/card/etc.) follows the shadcn Zinc theme.
 * The `--primary-foreground` is always near-white/near-black for contrast.
 */
interface SemanticColors {
  /** Light mode HSL values */
  light: Record<string, string>
  /** Dark mode HSL values */
  dark: Record<string, string>
}

const THEME_SEMANTIC: Record<ThemePreset, SemanticColors> = {
  teal: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%',
      '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '172 76% 36%',
    },
    dark: {
      '--background': '240 10% 3.9%',
      '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%',
      '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%',
      '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%',
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%',
      '--input': '240 3.7% 15.9%',
      '--ring': '172 76% 36%',
    },
  },
  blue: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '221 83% 53%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '221 83% 53%',
    },
  },
  indigo: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '239 84% 67%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '239 84% 67%',
    },
  },
  violet: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '258 90% 66%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '258 90% 66%',
    },
  },
  purple: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '271 91% 65%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '271 91% 65%',
    },
  },
  fuchsia: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '292 84% 61%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '292 84% 61%',
    },
  },
  pink: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '330 81% 60%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '330 81% 60%',
    },
  },
  rose: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '347 77% 60%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '347 77% 60%',
    },
  },
  red: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '0 84% 60%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '0 84% 60%',
    },
  },
  orange: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '25 95% 53%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '25 95% 53%',
    },
  },
  amber: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 10%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '38 92% 50%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 10%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '38 92% 50%',
    },
  },
  green: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '142 71% 45%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '142 71% 45%',
    },
  },
  emerald: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '152 76% 40%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '152 76% 40%',
    },
  },
  cyan: {
    light: {
      '--background': '0 0% 100%', '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%', '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%', '--popover-foreground': '240 10% 3.9%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 4.8% 95.9%', '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%', '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%', '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%', '--input': '240 5.9% 90%',
      '--ring': '189 94% 43%',
    },
    dark: {
      '--background': '240 10% 3.9%', '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%', '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%', '--popover-foreground': '0 0% 98%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 3.7% 15.9%', '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%', '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%', '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%', '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%', '--input': '240 3.7% 15.9%',
      '--ring': '189 94% 43%',
    },
  },
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
 * Both the primary color scale and the semantic color tokens (light/dark)
 * are set. Dark semantic variables are stored under a `--dark-*` prefix
 * and swapped into their canonical names when `.dark` is active on `<html>`.
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

  // Set semantic color tokens (shadcn-style)
  // Light values go on :root, dark values are stored under --dark-* prefix
  // and applied via a <style> rule that swaps them when .dark is active.
  const semantic = THEME_SEMANTIC[preset]
  for (const [key, value] of Object.entries(semantic.light)) {
    root.style.setProperty(key, value)
  }
  for (const [key, value] of Object.entries(semantic.dark)) {
    root.style.setProperty(`--dark${key}`, value)
  }

  // Store current theme for reference
  root.setAttribute('data-theme', preset)
}

/**
 * Initialize theme from a preset name (typically from server public settings).
 * Falls back to "teal" if the preset is invalid.
 * Also applies radius, base color, density, and font family appearance settings.
 */
export function initTheme(
  preset?: string,
  radius?: string,
  baseColor?: string,
  density?: string,
  fontFamily?: string,
) {
  const valid = THEME_OPTIONS.find(o => o.id === preset)
  applyTheme((valid?.id ?? 'teal') as ThemePreset)
  applyRadius(radius || 'md')
  applyBaseColor(baseColor || 'zinc')
  applyDensity(density || 'comfortable')
  applyFontFamily(fontFamily || 'system')
}

// ===== Appearance: Border Radius =====

export type RadiusScale = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export const RADIUS_OPTIONS: { id: RadiusScale; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'sm', label: 'Small' },
  { id: 'md', label: 'Medium' },
  { id: 'lg', label: 'Large' },
  { id: 'xl', label: 'Extra Large' },
]

/** Each scale defines 5 radius levels mapped to --radius-sm/md/lg/xl/2xl */
const RADIUS_SCALES: Record<RadiusScale, [string, string, string, string, string]> = {
  none: ['0rem', '0rem', '0rem', '0rem', '0rem'],
  sm:   ['0.125rem', '0.25rem', '0.375rem', '0.5rem', '0.75rem'],
  md:   ['0.375rem', '0.5rem', '0.75rem', '1rem', '1.5rem'],
  lg:   ['0.5rem', '0.75rem', '1rem', '1.5rem', '2rem'],
  xl:   ['0.75rem', '1rem', '1.5rem', '2rem', '2.5rem'],
}

export function applyRadius(scale: string) {
  const root = document.documentElement
  const s = RADIUS_SCALES[(scale as RadiusScale) || 'md'] || RADIUS_SCALES.md
  root.style.setProperty('--radius-sm', s[0])
  root.style.setProperty('--radius-md', s[1])
  root.style.setProperty('--radius-lg', s[2])
  root.style.setProperty('--radius-xl', s[3])
  root.style.setProperty('--radius-2xl', s[4])
}

// ===== Appearance: Base Color =====

export type BaseColor = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'

export const BASE_COLOR_OPTIONS: { id: BaseColor; label: string; color: string }[] = [
  { id: 'slate',   label: 'Slate',   color: '#64748b' },
  { id: 'gray',    label: 'Gray',    color: '#6b7280' },
  { id: 'zinc',    label: 'Zinc',    color: '#71717a' },
  { id: 'neutral', label: 'Neutral', color: '#737373' },
  { id: 'stone',   label: 'Stone',   color: '#78716c' },
]

/** Full 50-950 scales for each base color (Tailwind palettes) */
const BASE_COLOR_SCALES: Record<BaseColor, Record<string, string>> = {
  slate: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a', 950: '#020617'
  },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712'
  },
  zinc: {
    50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
    400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46',
    800: '#27272a', 900: '#18181b', 950: '#09090b'
  },
  neutral: {
    50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
    400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
    800: '#262626', 900: '#171717', 950: '#0a0a0a'
  },
  stone: {
    50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
    400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
    800: '#292524', 900: '#1c1917', 950: '#0c0a09'
  },
}

export function applyBaseColor(color: string) {
  const root = document.documentElement
  const scale = BASE_COLOR_SCALES[(color as BaseColor) || 'zinc'] || BASE_COLOR_SCALES.zinc
  for (const [shade, hex] of Object.entries(scale)) {
    root.style.setProperty(`--color-dark-${shade}`, hex)
    root.style.setProperty(`--color-dark-rgb-${shade}`, hexToRgbSpace(hex))
  }
}

// ===== Appearance: Content Density =====

export type DensityMode = 'comfortable' | 'compact'

export const DENSITY_OPTIONS: { id: DensityMode; label: string }[] = [
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'compact', label: 'Compact' },
]

const DENSITY_VALUES: Record<DensityMode, Record<string, string>> = {
  comfortable: {
    '--spacing-btn-y': '0.625rem',
    '--spacing-btn-x': '1rem',
    '--spacing-input-y': '0.625rem',
    '--spacing-input-x': '1rem',
    '--spacing-card': '1.25rem',
    '--spacing-gap': '1.25rem',
  },
  compact: {
    '--spacing-btn-y': '0.375rem',
    '--spacing-btn-x': '0.75rem',
    '--spacing-input-y': '0.375rem',
    '--spacing-input-x': '0.75rem',
    '--spacing-card': '0.75rem',
    '--spacing-gap': '0.75rem',
  },
}

export function applyDensity(density: string) {
  const root = document.documentElement
  const values = DENSITY_VALUES[(density as DensityMode) || 'comfortable'] || DENSITY_VALUES.comfortable
  for (const [key, value] of Object.entries(values)) {
    root.style.setProperty(key, value)
  }
}

// ===== Appearance: Font Family =====

export type FontFamilyPreset = 'system' | 'inter' | 'geist' | 'jetbrains'

export const FONT_FAMILY_OPTIONS: { id: FontFamilyPreset; label: string }[] = [
  { id: 'system', label: 'System UI' },
  { id: 'inter', label: 'Inter' },
  { id: 'geist', label: 'Geist' },
  { id: 'jetbrains', label: 'JetBrains Mono' },
]

const FONT_FAMILIES: Record<FontFamilyPreset, { sans: string; mono: string }> = {
  system: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  inter: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  geist: {
    sans: "'Geist', system-ui, -apple-system, sans-serif",
    mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  jetbrains: {
    sans: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
}

export function applyFontFamily(font: string) {
  const root = document.documentElement
  const ff = FONT_FAMILIES[(font as FontFamilyPreset) || 'system'] || FONT_FAMILIES.system
  root.style.setProperty('--font-sans', ff.sans)
  root.style.setProperty('--font-mono', ff.mono)
}
