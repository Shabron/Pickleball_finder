/**
 * Pickleball Finder — "Sunlit Court" Design System Colors
 *
 * Based on the Stitch design system with Material 3 color tokens.
 * All screens consume these via ThemeContext for easy theme switching.
 */

// ─── Light Theme (Default — "Sunlit Court") ──────────────────────────
export const lightColors = {
  // Primary — Pickleball Green
  primary: '#324100',
  primaryContainer: '#ccf05f',
  primaryDim: '#283500',
  onPrimary: '#aacc3f',
  onPrimaryContainer: '#455900',

  // Secondary — Cool Blue
  secondary: '#006c90',
  secondaryContainer: '#c2e8ff',
  secondaryDim: '#005f80',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#005876',

  // Tertiary — Warm Orange (highlights, notifications)
  tertiary: '#905800',
  tertiaryContainer: '#faa73c',
  tertiaryDim: '#7f4d00',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#512f00',

  // Error
  error: '#b23d21',
  errorContainer: '#fa7150',
  onError: '#ffffff',
  onErrorContainer: '#671200',

  // Surfaces — Tonal Layering (no explicit borders!)
  surface: '#fbffe2',
  surfaceBright: '#fbffe2',
  surfaceDim: '#d2ee7f',
  surfaceContainer: '#ebfbba',
  surfaceContainerHigh: '#e3f6a7',
  surfaceContainerHighest: '#dbf294',
  surfaceContainerLow: '#f4ffcb',
  surfaceContainerLowest: '#ffffff',
  surfaceTint: '#324100',
  surfaceVariant: '#dbf294',

  // On-Surface Text
  onSurface: '#2f3d00',
  onSurfaceVariant: '#596b1d',
  inverseSurface: '#0b1000',
  inverseOnSurface: '#99a17e',
  inversePrimary: '#d7fc69',

  // Outlines (use sparingly — prefer tonal layering)
  outline: '#748837',
  outlineVariant: '#acc26a',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',

  // Utility
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  scrim: 'rgba(11, 16, 0, 0.32)',
} as const;

/** Color theme type */
export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

// ─── Dark Theme ──────────────────────────────────────────────────────
export const darkColors: ThemeColors = {
  primary: '#ccf05f',
  primaryContainer: '#455900',
  primaryDim: '#bfe252',
  onPrimary: '#1a2400',
  onPrimaryContainer: '#ccf05f',

  secondary: '#9fddff',
  secondaryContainer: '#004d66',
  secondaryDim: '#80d0f5',
  onSecondary: '#003546',
  onSecondaryContainer: '#c2e8ff',

  tertiary: '#faa73c',
  tertiaryContainer: '#5d3700',
  tertiaryDim: '#ea9a2f',
  onTertiary: '#291600',
  onTertiaryContainer: '#faa73c',

  error: '#fa7150',
  errorContainer: '#821a01',
  onError: '#3e0600',
  onErrorContainer: '#fa7150',

  surface: '#131800',
  surfaceBright: '#2a3200',
  surfaceDim: '#0b1000',
  surfaceContainer: '#1a2100',
  surfaceContainerHigh: '#222b00',
  surfaceContainerHighest: '#2a3400',
  surfaceContainerLow: '#161d00',
  surfaceContainerLowest: '#0b1000',
  surfaceTint: '#ccf05f',
  surfaceVariant: '#3a4500',

  onSurface: '#dbf294',
  onSurfaceVariant: '#acc26a',
  inverseSurface: '#dbf294',
  inverseOnSurface: '#2f3d00',
  inversePrimary: '#324100',

  outline: '#8a9f4e',
  outlineVariant: '#596b1d',

  success: '#34D399',
  warning: '#FBBF24',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.52)',
};
