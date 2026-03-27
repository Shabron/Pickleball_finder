/**
 * Pickleball Finder — Theme Context
 *
 * Provides global theme access via React Context.
 * All components use the `useTheme()` hook instead of importing colors directly.
 * Supports light/dark mode switching.
 *
 * Usage:
 *   const { colors, isDark, toggleTheme } = useTheme();
 */
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';
import { typography, Typography } from './typography';
import { spacing, borderRadius, sizes, Spacing, BorderRadius, Sizes } from './spacing';

// ─── Theme Shape ─────────────────────────────────────────────────────
export interface Theme {
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  sizes: Sizes;
  isDark: boolean;
}

interface ThemeContextValue extends Theme {
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

// ─── Context ─────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────
interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: 'light' | 'dark' | 'system';
}

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(initialMode);

  const value = useMemo<ThemeContextValue>(() => {
    let isDark: boolean;
    if (themeMode === 'system') {
      isDark = systemScheme === 'dark';
    } else {
      isDark = themeMode === 'dark';
    }

    return {
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      borderRadius,
      sizes,
      isDark,
      toggleTheme: () => {
        setThemeMode((prev) => {
          if (prev === 'light') return 'dark';
          if (prev === 'dark') return 'light';
          // If system, toggle to opposite of current system scheme
          return systemScheme === 'dark' ? 'light' : 'dark';
        });
      },
      setThemeMode,
    };
  }, [themeMode, systemScheme]);

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
export function useTheme(): ThemeContextValue {
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
