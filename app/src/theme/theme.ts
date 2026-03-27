/**
 * Pickleball Finder — Theme Barrel
 *
 * Central re-export of all theme tokens.
 * Import from here for convenience:
 *   import { useTheme, spacing, borderRadius } from '../theme/theme';
 */

// Context & hook (primary way to access theme in components)
export { ThemeProvider, useTheme, makeStyles } from './ThemeContext';
export type { Theme } from './ThemeContext';

// Color tokens & types
export { lightColors, darkColors } from './colors';
export type { ThemeColors } from './colors';

// Typography scale
export { typography, responsiveFontSize } from './typography';
export type { Typography } from './typography';

// Spacing, shape, and sizes
export { spacing, borderRadius, sizes, responsiveSize } from './spacing';
export type { Spacing, BorderRadius, Sizes } from './spacing';
