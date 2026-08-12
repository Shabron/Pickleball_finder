/**
 * FAB — Floating Action Button
 *
 * Ambient shadow per Stitch spec (24px blur, 6% opacity).
 * Primary color, large touch target (56px).
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { sizes, spacing } from '../../theme/spacing';

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  /** Optional label — when provided, the FAB extends into a labeled pill instead of a plain circle */
  label?: string;
}

export default function FAB({ icon, onPress, style, label }: FABProps) {
  const { colors, typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.fab,
        label ? styles.fabExtended : null,
        { backgroundColor: colors.primary },
        style,
      ]}
    >
      {icon}
      {label && (
        <Text
          style={[
            typography.labelLarge,
            { color: colors.onPrimary, fontWeight: '700', marginLeft: spacing.sm },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: sizes.touchTarget / 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Ambient shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  fabExtended: {
    flexDirection: 'row',
    width: undefined,
    paddingHorizontal: spacing.xl,
    borderRadius: sizes.touchTarget / 2,
  },
});
