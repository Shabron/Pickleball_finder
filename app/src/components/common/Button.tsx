/**
 * Button — Primary action component
 *
 * Supports primary, secondary, outline, ghost, and error variants.
 * All touch targets are at least 56px (senior-friendly per Stitch spec).
 * Fully round shape per "Sunlit Court" design system.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, sizes } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Optional icon to render before the title */
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, typography } = useTheme();

  const variantConfig = {
    primary: {
      bg: colors.primary,
      text: colors.surfaceContainerLowest,
      border: colors.transparent,
      loadingColor: colors.surfaceContainerLowest,
    },
    secondary: {
      bg: colors.secondaryContainer,
      text: colors.onSecondaryContainer,
      border: colors.transparent,
      loadingColor: colors.onSecondaryContainer,
    },
    outline: {
      bg: colors.transparent,
      text: colors.primary,
      border: colors.outline,
      loadingColor: colors.primary,
    },
    ghost: {
      bg: colors.transparent,
      text: colors.onSurface,
      border: colors.transparent,
      loadingColor: colors.onSurface,
    },
    error: {
      bg: colors.error,
      text: colors.onError,
      border: colors.transparent,
      loadingColor: colors.onError,
    },
  };

  const config = variantConfig[variant];

  const flattenedStyle = StyleSheet.flatten(style);
  const flattenedTextStyle = StyleSheet.flatten(textStyle);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        flattenedStyle,
        disabled && {
          backgroundColor: colors.surfaceContainerHigh,
          borderColor: colors.transparent,
          borderWidth: 0,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={config.loadingColor} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              typography.titleSmall,
              styles.text,
              {
                color: config.text,
                marginLeft: icon ? 8 : 0,
              },
              flattenedTextStyle,
              disabled && {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  text: {
    letterSpacing: 0.5,
  },
});
