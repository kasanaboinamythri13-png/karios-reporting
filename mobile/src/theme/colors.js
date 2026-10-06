// mobile/src/theme/colors.js
// Matches Karios Web Application exact design tokens for Light and Dark modes

export const lightColors = {
  // Brand & Accents (Matches web --color-primary: #7c3aed)
  primary: '#7c3aed',
  primaryDark: '#6d28d9',
  primaryHover: '#6d28d9',
  primaryLight: '#ede9fe',
  primarySoft: '#f5f3ff',
  primarySurface: '#f5f3ff',

  // Backgrounds
  background: '#f0f0f7',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  card: '#ffffff',
  surfaceHover: '#f8fafc',
  surfaceBorder: '#e2e2ef',
  border: '#e2e2ef',
  borderStrong: '#cbd5e1',

  // Typography
  text: '#1f2937',
  textSecondary: '#475569',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  textInverse: '#ffffff',
  textOnPrimary: '#ffffff',

  // Status Tones
  approved: '#059669',
  approvedBg: '#d1fae5',
  approvedBorder: '#a7f3d0',
  approvedText: '#065f46',

  rejected: '#dc2626',
  rejectedBg: '#fee2e2',
  rejectedBorder: '#fecaca',
  rejectedText: '#991b1b',

  pending: '#d97706',
  pendingBg: '#fef3c7',
  pendingBorder: '#fde68a',
  pendingText: '#92400e',

  missing: '#6b7280',
  missingBg: '#f3f4f6',
  missingBorder: '#e5e7eb',
  missingText: '#374151',

  // Metric card accents
  finance: '#059669',
  sales: '#2563eb',
  marketing: '#d97706',
  growth: '#7c3aed',

  // Input & Action controls
  inputBg: '#ffffff',
  inputBorder: '#e2e2ef',
  inputFocus: '#7c3aed',
  divider: '#e2e2ef',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.5)',

  // Navigation & Toggle
  tabBarBg: '#ffffff',
  tabBarBorder: '#e2e2ef',
  tabActive: '#7c3aed',
  tabInactive: '#9ca3af',
  toggleBg: '#ede9fe',
  toggleIcon: '#6c5ce7',
  shadow: '#000000',
};

export const darkColors = {
  // Brand & Accents
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  primaryHover: '#7c3aed',
  primaryLight: '#2d1b69',
  primarySoft: '#232048',
  primarySurface: '#1f1b3c',

  // Backgrounds
  background: '#0d1117',
  surface: '#161b22',
  surfaceElevated: '#21262d',
  card: '#161b22',
  surfaceHover: '#1f242c',
  surfaceBorder: '#30363d',
  border: '#30363d',
  borderStrong: '#3a3a5c',

  // Typography
  text: '#f0f6fc',
  textSecondary: '#8b949e',
  textMuted: '#8b949e',
  textLight: '#6e7681',
  textInverse: '#0d1117',
  textOnPrimary: '#ffffff',

  // Status Tones
  approved: '#34d399',
  approvedBg: 'rgba(5, 150, 105, 0.22)',
  approvedBorder: 'rgba(5, 150, 105, 0.45)',
  approvedText: '#6ee7b7',

  rejected: '#f87171',
  rejectedBg: 'rgba(220, 38, 38, 0.22)',
  rejectedBorder: 'rgba(220, 38, 38, 0.45)',
  rejectedText: '#fca5a5',

  pending: '#fbbf24',
  pendingBg: 'rgba(217, 119, 6, 0.22)',
  pendingBorder: 'rgba(217, 119, 6, 0.45)',
  pendingText: '#fcd34d',

  missing: '#9ca3af',
  missingBg: 'rgba(156, 163, 175, 0.18)',
  missingBorder: 'rgba(156, 163, 175, 0.35)',
  missingText: '#cbd5e1',

  // Metric card accents
  finance: '#34d399',
  sales: '#60a5fa',
  marketing: '#fbbf24',
  growth: '#a78bfa',

  // Input & Action controls
  inputBg: '#090d13',
  inputBorder: '#30363d',
  inputFocus: '#8b5cf6',
  divider: '#30363d',
  error: '#f87171',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.7)',

  // Navigation & Toggle
  tabBarBg: '#161b22',
  tabBarBorder: '#30363d',
  tabActive: '#a78bfa',
  tabInactive: '#8b949e',
  toggleBg: '#21262d',
  toggleIcon: '#fbbf24',
  shadow: '#000000',
};

export const LightColors = lightColors;
export const DarkColors = darkColors;
export const colors = lightColors;
const Colors = lightColors;
export default Colors;
