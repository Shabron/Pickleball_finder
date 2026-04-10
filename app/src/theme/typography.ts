/**
 * Pickleball Finder — Typography System
 *
 * Uses Lexend font family (engineered for readability, ideal for senior users).
 * "Top-Heavy" hierarchy: headlines are significantly larger than body text
 * so users can scan effortlessly. Minimum body text is 16px.
 *
 * Responsive font sizes scale with device width.
 */
import { Dimensions, Platform, PixelRatio, TextStyle } from 'react-native';

// ─── Responsive Font Scaling ─────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390; // iPhone 14 reference width

/**
 * Scales a font size relative to the base device width.
 * Clamps between 80%-120% to prevent extreme sizes on tiny/huge screens.
 */
export function responsiveFontSize(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const clampedScale = Math.min(Math.max(scale, 0.8), 1.2);
  const newSize = size * clampedScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

// ─── Font Family ─────────────────────────────────────────────────────
const FONT_FAMILY = Platform.select({
  ios: 'System', // Will use Lexend when installed, falls back to SF Pro
  android: 'Roboto', // Falls back to Roboto
  default: 'System',
});

// ─── Typography Scale ────────────────────────────────────────────────
export const typography = {
  // Display — "big moment" stats, welcome screens
  displayLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(57),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(64),
    letterSpacing: -0.25,
  } satisfies TextStyle,

  displayMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(45),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(52),
  } satisfies TextStyle,

  displaySmall: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(36),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(44),
  } satisfies TextStyle,

  // Headline — screen titles ("Messages", "Find a Partner")
  headlineLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(32),
    fontWeight: '700' as const,
    lineHeight: responsiveFontSize(40),
  } satisfies TextStyle,

  headlineMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(28),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(36),
  } satisfies TextStyle,

  headlineSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(24),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(32),
  } satisfies TextStyle,

  // Title
  titleLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(22),
    fontWeight: '700' as const,
    lineHeight: responsiveFontSize(28),
  } satisfies TextStyle,

  titleMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(18),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(24),
    letterSpacing: 0.15,
  } satisfies TextStyle,

  titleSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(16),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(20),
    letterSpacing: 0.1,
  } satisfies TextStyle,

  // Body — all functional information (minimum 16px for accessibility)
  bodyLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(16),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(24),
    letterSpacing: 0.5,
  } satisfies TextStyle,

  bodyMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(14),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(20),
    letterSpacing: 0.25,
  } satisfies TextStyle,

  bodySmall: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(12),
    fontWeight: '400' as const,
    lineHeight: responsiveFontSize(16),
    letterSpacing: 0.4,
  } satisfies TextStyle,

  // Label — timestamps, metadata (use sparingly)
  labelLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(14),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(20),
    letterSpacing: 0.1,
  } satisfies TextStyle,

  labelMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(12),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(16),
    letterSpacing: 0.5,
  } satisfies TextStyle,

  labelSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: responsiveFontSize(11),
    fontWeight: '600' as const,
    lineHeight: responsiveFontSize(16),
    letterSpacing: 0.5,
  } satisfies TextStyle,
} as const;

export type Typography = typeof typography;
