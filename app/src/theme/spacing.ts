/**
 * Pickleball Finder — Spacing & Shape System
 *
 * Responsive spacing that scales with device width.
 * Includes border radius tokens matching Stitch roundness presets.
 */
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;

/**
 * Scales a spacing value relative to the base device width.
 * Clamps between 85%-115% for consistency across devices.
 */
export function responsiveSize(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const clampedScale = Math.min(Math.max(scale, 0.85), 1.15);
  return Math.round(PixelRatio.roundToNearestPixel(size * clampedScale));
}

// ─── Spacing Scale ───────────────────────────────────────────────────
export const spacing = {
  /** 2px */  xxs: responsiveSize(2),
  /** 4px */  xs: responsiveSize(4),
  /** 8px */  sm: responsiveSize(8),
  /** 12px */ md: responsiveSize(12),
  /** 16px */ lg: responsiveSize(16),
  /** 20px */ xl: responsiveSize(20),
  /** 24px */ xxl: responsiveSize(24),
  /** 32px */ xxxl: responsiveSize(32),
  /** 40px */ huge: responsiveSize(40),
  /** 48px */ massive: responsiveSize(48),
  /** 64px */ giant: responsiveSize(64),
} as const;

// ─── Border Radius ───────────────────────────────────────────────────
export const borderRadius = {
  /** 4px — subtle rounding */
  xs: 4,
  /** 8px — small elements, chips */
  sm: 8,
  /** 12px — standard cards */
  md: 12,
  /** 16px — medium cards */
  lg: 16,
  /** 20px — large cards */
  xl: 20,
  /** 28px — hero cards */
  xxl: 28,
  /** 48px/9999 — fully round (pills, FABs) */
  full: 9999,
} as const;

// ─── Common Sizes ────────────────────────────────────────────────────
export const sizes = {
  /** Minimum touch target (48dp per a11y) */
  touchTargetMin: 48,
  /** Preferred touch target for seniors (56dp) */
  touchTarget: 56,
  /** Bottom tab bar height */
  tabBarHeight: responsiveSize(72),
  /** Standard header height */
  headerHeight: responsiveSize(56),
  /** Icon size — default */
  iconDefault: 24,
  /** Icon size — small */
  iconSmall: 20,
  /** Icon size — large */
  iconLarge: 28,
  /** Avatar sizes */
  avatarSmall: responsiveSize(40),
  avatarMedium: responsiveSize(56),
  avatarLarge: responsiveSize(80),
  avatarXLarge: responsiveSize(100),
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Sizes = typeof sizes;
