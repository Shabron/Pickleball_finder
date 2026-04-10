/**
 * Pickleball Finder — "Ocean Wave" Design System Colors
 *
 * Updated neutral/blue theme based on the new design screenshot.
 */

// ─── Light Theme ──────────────────────────────────────────────────────
export const lightColors = {
  // Primary — Deep Blue (used for FAB, active states)
  primary: '#1D628B',
  primaryContainer: '#DDF0FF',
  primaryDim: '#154A6B',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#08253A',

  // Secondary — Calm Light Blue
  secondary: '#3182CE',
  secondaryContainer: '#EBF8FF',
  secondaryDim: '#2B6CB0',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#1A365D',

  // Tertiary — Orange (for badges, accents)
  tertiary: '#DD6B20',
  tertiaryContainer: '#FEEBC8',
  tertiaryDim: '#C05621',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#4A2311',

  // Error
  error: '#C53030',
  errorContainer: '#FED7D7',
  onError: '#FFFFFF',
  onErrorContainer: '#4A0D0D',

  // Surfaces — Clean Neutral
  surface: '#FFFFFF',
  surfaceBright: '#FFFFFF',
  surfaceDim: '#F7FAFC',
  surfaceContainer: '#EDF2F7',
  surfaceContainerHigh: '#E2E8F0',
  surfaceContainerHighest: '#CBD5E0',
  surfaceContainerLow: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceTint: '#1D628B',
  surfaceVariant: '#E2E8F0',

  // On-Surface Text
  onSurface: '#1A202C',
  onSurfaceVariant: '#4A5568',
  inverseSurface: '#1A202C',
  inverseOnSurface: '#EDF2F7',
  inversePrimary: '#63B3ED',

  // Outlines
  outline: '#CBD5E0',
  outlineVariant: '#E2E8F0',

  // Semantic
  success: '#38A169',
  warning: '#D69E2E',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.32)',
} as const;

/** Color theme type */
export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

// ─── Dark Theme ──────────────────────────────────────────────────────
export const darkColors: ThemeColors = {
  primary: '#63B3ED',
  primaryContainer: '#08253A',
  primaryDim: '#4299E1',
  onPrimary: '#1A365D',
  onPrimaryContainer: '#DDF0FF',

  secondary: '#90CDF4',
  secondaryContainer: '#1A365D',
  secondaryDim: '#63B3ED',
  onSecondary: '#1A365D',
  onSecondaryContainer: '#EBF8FF',

  tertiary: '#F6AD55',
  tertiaryContainer: '#4A2311',
  tertiaryDim: '#DD6B20',
  onTertiary: '#4A2311',
  onTertiaryContainer: '#FEEBC8',

  error: '#FC8181',
  errorContainer: '#4A0D0D',
  onError: '#4A0D0D',
  onErrorContainer: '#FED7D7',

  surface: '#1A202C',
  surfaceBright: '#2D3748',
  surfaceDim: '#171923',
  surfaceContainer: '#2D3748',
  surfaceContainerHigh: '#4A5568',
  surfaceContainerHighest: '#718096',
  surfaceContainerLow: '#1A202C',
  surfaceContainerLowest: '#171923',
  surfaceTint: '#63B3ED',
  surfaceVariant: '#4A5568',

  onSurface: '#F7FAFC',
  onSurfaceVariant: '#CBD5E0',
  inverseSurface: '#F7FAFC',
  inverseOnSurface: '#1A202C',
  inversePrimary: '#1D628B',

  outline: '#4A5568',
  outlineVariant: '#2D3748',

  success: '#68D391',
  warning: '#F6E05E',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.52)',
};
