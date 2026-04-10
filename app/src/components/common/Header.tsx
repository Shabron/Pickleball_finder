/**
 * Header — App-wide header bar
 *
 * Displays app title/logo with optional back button and right actions.
 * Uses theme-aware colors with glassmorphic style.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Image } from 'react-native';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, sizes } from '../../theme/spacing';

interface HeaderProps {
  /** Screen title (defaults to app name) */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button press handler */
  onBack?: () => void;
  /** Right side action element */
  rightAction?: React.ReactNode;
  /** Style override */
  style?: ViewStyle;
  /** Show app logo instead of text title */
  showLogo?: boolean;
  /** Show notification bell */
  showNotificationBell?: boolean;
  /** Notification bell press handler */
  onNotificationPress?: () => void;
  /** Unread notification count */
  notificationCount?: number;
}

export default function Header({
  title = 'Senior Pickleball',
  showBack = false,
  onBack,
  rightAction,
  style,
  showLogo = false,
  showNotificationBell = false,
  onNotificationPress,
  notificationCount = 0,
}: HeaderProps) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: '#FFFFFF' },
        style,
      ]}
    >
      {/* Left */}
      {showBack ? (
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
          >
            <ChevronLeft color={colors.onSurface} size={sizes.iconLarge} />
          </TouchableOpacity>
        </View>
      ) : !showLogo ? (
        <View style={styles.leftSection}>
          <View style={styles.backPlaceholder} />
        </View>
      ) : null}

      {/* Center */}
      <View style={styles.centerSection}>
        {showLogo && (
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <Text
          style={[typography.titleLarge, { color: '#0F2C4C', marginLeft: showLogo ? 6 : 0 }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Right */}
      <View style={styles.rightSection}>
        {showNotificationBell && (
          <TouchableOpacity
            onPress={onNotificationPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.bellContainer}
          >
            <Bell color={colors.onSurface} size={sizes.iconDefault} />
            {notificationCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: colors.tertiary }]}>
                <Text style={[typography.labelSmall, { color: colors.onTertiary, fontSize: 9 }]}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logo: {
    width: 60,
    height: 60,
    transform: [{ scale: 1.6 }],
  },
  backButton: {
    padding: spacing.xs,
  },
  backPlaceholder: {
    width: 28,
  },
  bellContainer: {
    position: 'relative',
    padding: spacing.xs,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
});
