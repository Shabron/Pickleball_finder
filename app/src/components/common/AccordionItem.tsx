/**
 * AccordionItem — tap-to-open section used by Privacy Policy and Terms.
 * Title row with icon + chevron; body expands with a short layout animation.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  title: string;
  icon?: React.ReactNode;
  initiallyOpen?: boolean;
  showDivider?: boolean;
  children: React.ReactNode;
}

export default function AccordionItem({ title, icon, initiallyOpen = false, showDivider = true, children }: Props) {
  const { colors, typography } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
    setOpen(o => !o);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        {icon ? <View style={[styles.icon, { backgroundColor: colors.primaryContainer }]}>{icon}</View> : null}
        <Text style={[typography.bodyLarge, { flex: 1, color: colors.onSurface, fontWeight: '600' }]}>{title}</Text>
        <ChevronDown
          size={20}
          color={colors.onSurfaceVariant}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {open && <View style={styles.body}>{children}</View>}
      {showDivider && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
    </View>
  );
}

/** Body paragraph styled for policy text. */
export function PolicyText({ children }: { children: React.ReactNode }) {
  const { colors, typography } = useTheme();
  return (
    <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 22 }]}>{children}</Text>
  );
}

/** Bullet line styled for policy text. */
export function PolicyBullet({ children }: { children: React.ReactNode }) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.bulletRow}>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 22 }]}>•  </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 22, flex: 1 }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.md + 34 + spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
});
