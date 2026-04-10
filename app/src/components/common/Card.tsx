/**
 * Card — Tonal layering container
 *
 * Follows Stitch "No-Line Rule": no 1px borders.
 * Depth achieved via background tonal shifts and ambient shadows.
 * XL rounded corners (28px) for a friendly, approachable feel.
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing } from '../../theme/spacing';

type CardElevation = 0 | 1 | 2;

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Tonal elevation level: 0 = surface, 1 = containerLow, 2 = containerLowest (white) */
  elevation?: CardElevation;
  /** Override padding */
  padding?: number;
}

export default function Card({ children, style, elevation = 2, padding }: CardProps) {
  const { colors } = useTheme();

  const bgMap: Record<CardElevation, string> = {
    0: colors.surfaceContainer,
    1: colors.surfaceContainerLow,
    2: colors.surfaceContainerLowest,
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgMap[elevation],
          padding: padding ?? spacing.lg,
        },
        // Ambient shadow only for elevated cards
        elevation > 0 && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xxl,
    marginBottom: spacing.lg,
  },
  shadow: {
    // Ambient shadow per Stitch: 24px blur, 6% opacity, tinted with onSurface
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
});
