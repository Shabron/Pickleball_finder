/**
 * Input — Text input field
 *
 * Uses surfaceContainerHighest background per Stitch spec.
 * Always-visible labels (no disappearing placeholders).
 * Accessible touch targets and font sizes.
 */
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, ViewStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, sizes } from '../../theme/spacing';

interface InputProps extends TextInputProps {
  /** Left icon */
  icon?: React.ReactNode;
  /** Password toggle */
  isPassword?: boolean;
  /** Always-visible label above the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Container style override */
  containerStyle?: ViewStyle;
  /** style prop maps to containerStyle for backward compatibility */
  style?: ViewStyle;
}

export default function Input({
  icon,
  isPassword,
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [secureText, setSecureText] = useState(isPassword);
  const { colors, typography: typo } = useTheme();

  return (
    <View style={[containerStyle || style]}>
      {label && (
        <Text style={[typo.titleSmall, { color: colors.onSurface, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: '#FFFFFF',
            borderColor: error ? colors.error : '#D1D5DB',
            borderWidth: 1,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <TextInput
          style={[
            typo.bodyLarge,
            styles.input,
            { color: colors.onSurface },
          ]}
          placeholderTextColor={colors.onSurfaceVariant}
          secureTextEntry={secureText}
          autoCapitalize="none"
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setSecureText(!secureText)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {secureText ? (
              <EyeOff color={colors.onSurfaceVariant} size={sizes.iconDefault} />
            ) : (
              <Eye color={colors.onSurfaceVariant} size={sizes.iconDefault} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[typo.bodySmall, { color: colors.error, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
});
