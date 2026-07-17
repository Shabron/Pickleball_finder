/**
 * Senior Pickleball Partners — "Ocean Wave" Design System Colors
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

  // Brand Green (Pickleball themed green)
  brandGreen: '#2E7D32',
  brandGreenContainer: '#E8F5E9',
  onBrandGreenContainer: '#1B5E20',
  homeBackground: '#F0F7F4',
  screenBackground: '#EAF4FC',

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
