/**
 * Badge — Glassmorphic pill badge
 *
 * Used for skill levels, status indicators, match compatibility, etc.
 * Follows the Stitch "Partner Match Badge" spec: glassmorphic pill
 * using primaryContainer with low opacity.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius } from '../../theme/spacing';

type BadgeVariant = 'primary' | 'secondary' | 'tertiary' | 'success' | 'error' | 'surface';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** Small = compact padding, large = standard */
  size?: 'small' | 'large';
  style?: ViewStyle;
  /** Optional icon to render before the label */
  icon?: React.ReactNode;
}

export default function Badge({
  label,
  variant = 'primary',
  size = 'small',
  style,
  icon,
}: BadgeProps) {
  const { colors, typography } = useTheme();

  const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: colors.primaryContainer, text: colors.onPrimaryContainer },
    secondary: { bg: colors.secondaryContainer, text: colors.onSecondaryContainer },
    tertiary: { bg: colors.tertiaryContainer, text: colors.onTertiaryContainer },
    success: { bg: colors.success + '20', text: colors.success },
    error: { bg: colors.errorContainer, text: colors.onErrorContainer },
    surface: { bg: colors.surfaceContainerHighest, text: colors.onSurface },
  };

  const { bg, text } = variantStyles[variant];
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingHorizontal: isLarge ? 16 : 10,
          paddingVertical: isLarge ? 8 : 4,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          isLarge ? typography.labelLarge : typography.labelSmall,
          { color: text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
});
