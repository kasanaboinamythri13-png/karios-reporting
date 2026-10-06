// mobile/src/theme/colors.js
// Matches Karios Web Application exact design tokens for Light and Dark modes

export const lightColors = {
  // Brand & Accents (Matches web --color-primary: #7c3aed)
  primary: '#7c3aed',        // Vibrant Purple
  primaryHover: '#6d28d9',   // Deep Purple
  primaryLight: '#ede9fe',   // Light Lavender Accent
  primaryDark: '#5b21b6',
  primarySurface: '#f5f3ff', // Soft purple tint
  
  // Backgrounds (Matches web --color-bg: #f0f0f7)
  background: '#f0f0f7',    // Light lavender-gray
  surface: '#ffffff',       // Pure white card surfaces
  surfaceHover: '#f8fafc',
  surfaceBorder: '#e2e2ef', // Clean border matching web --color-border

  // Typography (Matches web --color-text: #1f2937)
  text: '#1f2937',          // Dark slate
  textMuted: '#6b7280',     // Gray muted text
  textLight: '#9ca3af',     // Lighter gray
  textInverse: '#ffffff',

  // Status Tones (Matches web status colors)
  approved: '#059669',      // Emerald 600
  approvedBg: '#d1fae5',    // Emerald 100
  approvedBorder: '#a7f3d0',

  rejected: '#dc2626',      // Red 600
  rejectedBg: '#fee2e2',    // Red 100
  rejectedBorder: '#fecaca',

  pending: '#d97706',       // Amber 600
  pendingBg: '#fef3c7',     // Amber 100
  pendingBorder: '#fde68a',

  missing: '#6b7280',       // Gray 500
  missingBg: '#f3f4f6',     // Gray 100
  missingBorder: '#e5e7eb',

  // Input & Action controls
  inputBg: '#ffffff',
  inputBorder: '#e2e2ef',
  inputFocus: '#7c3aed',
  divider: '#e2e2ef',

  // Shadows
  shadow: '#000000',
};

export const darkColors = {
  // Brand & Accents
  primary: '#8b5cf6',        // Bright Purple for high contrast on dark
  primaryHover: '#7c3aed',
  primaryLight: '#2d1b69',   // Deep purple tint matching web --color-primary-light
  primaryDark: '#5b21b6',
  primarySurface: '#1f1b3c',
  
  // Backgrounds (Matches web [data-theme="dark"]: --color-bg: #0d1117, --color-surface: #161b22)
  background: '#0d1117',    // Deep dark background
  surface: '#161b22',       // Dark card surface
  surfaceHover: '#1f242c',
  surfaceBorder: '#30363d', // Subtle border matching GitHub/web dark

  // Typography (Matches web --color-text: #f0f6fc, --color-text-muted: #8b949e)
  text: '#f0f6fc',          // Crisp white text
  textMuted: '#8b949e',     // Light muted slate
  textLight: '#6e7681',     // Secondary gray
  textInverse: '#0d1117',

  // Status Tones (Soft translucent badges matching web dark)
  approved: '#34d399',      // Emerald
  approvedBg: 'rgba(5, 150, 105, 0.22)',
  approvedBorder: 'rgba(5, 150, 105, 0.45)',

  rejected: '#f87171',      // Red
  rejectedBg: 'rgba(220, 38, 38, 0.22)',
  rejectedBorder: 'rgba(220, 38, 38, 0.45)',

  pending: '#fbbf24',       // Amber
  pendingBg: 'rgba(217, 119, 6, 0.22)',
  pendingBorder: 'rgba(217, 119, 6, 0.45)',

  missing: '#9ca3af',       // Gray
  missingBg: 'rgba(156, 163, 175, 0.18)',
  missingBorder: 'rgba(156, 163, 175, 0.35)',

  // Input & Action controls
  inputBg: '#090d13',
  inputBorder: '#30363d',
  inputFocus: '#8b5cf6',
  divider: '#30363d',

  // Shadows
  shadow: '#000000',
};

// Default colors (fallback / department heads)
export const colors = lightColors;
