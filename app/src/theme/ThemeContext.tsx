/**
 * Senior Pickleball Partners — Theme Context
 *
 * Provides global theme access via React Context.
 * All components use the `useTheme()` hook instead of importing colors directly.
 * The app supports light mode only — system dark mode is ignored.
 *
 * Usage:
 *   const { colors } = useTheme();
 */
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { lightColors, ThemeColors } from './colors';
import { typography, Typography } from './typography';
import { spacing, borderRadius, sizes, Spacing, BorderRadius, Sizes } from './spacing';

// ─── Theme Shape ─────────────────────────────────────────────────────
export interface Theme {
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  sizes: Sizes;
}

// ─── Context ─────────────────────────────────────────────────────────
const ThemeContext = createContext<Theme | null>(null);

// ─── Provider ────────────────────────────────────────────────────────
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const value = useMemo<Theme>(
    () => ({
      colors: lightColors,
      typography,
      spacing,
      borderRadius,
      sizes,
    }),
    []
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────
/**
 * Access the current theme. Must be used inside a ThemeProvider.
 *
 * @example
 * const { colors, typography, spacing } = useTheme();
 */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ─── Convenience: create themed styles ───────────────────────────────
/**
 * Helper to create styles that depend on theme.
 *
 * @example
 * const styles = makeStyles((theme) => ({
 *   container: { backgroundColor: theme.colors.surface },
 * }));
 * // In component: const s = styles(theme);
 */
export function makeStyles<T>(factory: (theme: Theme) => T): (theme: Theme) => T {
  return factory;
}
