/**
 * AuthHeader — back arrow + normal-size title + one-line subtitle,
 * with a small logo on the right. Shared by Log in, Sign up,
 * Forgot password and Reset password (replaces the big logo + hero title).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function AuthHeader({ title, subtitle, onBack }: Props) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.back, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.back} />
        )}
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: '700', marginTop: spacing.lg }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
  },
});
