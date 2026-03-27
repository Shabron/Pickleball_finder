/**
 * ProfileScreen — User profile view
 *
 * Themed profile card, badges, menu items with tonal layering.
 * Links to Edit Profile, About, Notifications, Settings, Logout.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Settings, LogOut, Info, ChevronRight, Bell, Edit, Shield } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

export default function ProfileScreen({ navigation }: any) {
  const { colors, typography, toggleTheme, isDark } = useTheme();

  const handleLogout = () => {
    navigation.replace('Login');
  };

  const menuItems = [
    {
      icon: <Edit size={sizes.iconSmall} color={colors.secondary} />,
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: <Bell size={sizes.iconSmall} color={colors.tertiary} />,
      label: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
      badge: 3,
    },
    {
      icon: <Settings size={sizes.iconSmall} color={colors.onSurfaceVariant} />,
      label: 'Account Settings',
      onPress: () => {},
    },
    {
      icon: <Shield size={sizes.iconSmall} color={colors.onSurfaceVariant} />,
      label: `${isDark ? 'Light' : 'Dark'} Mode`,
      onPress: toggleTheme,
    },
    {
      icon: <Info size={sizes.iconSmall} color={colors.secondary} />,
      label: 'About the App',
      onPress: () => navigation.navigate('About'),
    },
  ];

  return (
    <ScreenWrapper>
      <Header title="Profile" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Profile Card ─── */}
        <Card elevation={2} padding={spacing.xxl}>
          <View style={styles.profileHeaderContent}>
            <Avatar name="Arthur Smith" size={sizes.avatarLarge} />

            <Text
              style={[typography.headlineSmall, { color: colors.onSurface, marginTop: spacing.md }]}
            >
              Arthur Smith
            </Text>
            <Text
              style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xxs }]}
            >
              arthur.s@example.com
            </Text>

            <View style={styles.badgeRow}>
              <Badge label="Level 3.0" variant="primary" size="large" />
              <Badge
                label="Florida"
                variant="secondary"
                size="large"
                style={{ marginLeft: spacing.sm }}
              />
              <Badge
                label="Doubles"
                variant="tertiary"
                size="large"
                style={{ marginLeft: spacing.sm }}
              />
            </View>

            <Button
              title="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
              variant="outline"
              style={{ width: '100%', marginTop: spacing.lg }}
            />
          </View>
        </Card>

        {/* ─── Stats ─── */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[typography.headlineMedium, { color: colors.primary }]}>12</Text>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>Matches</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[typography.headlineMedium, { color: colors.secondary }]}>5</Text>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>Posts</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[typography.headlineMedium, { color: colors.tertiary }]}>8</Text>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>Chats</Text>
          </View>
        </View>

        {/* ─── Menu Items ─── */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surfaceContainerLowest }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
              >
                {item.icon}
              </View>
              <Text
                style={[typography.bodyLarge, { color: colors.onSurface, flex: 1, fontWeight: '500' }]}
              >
                {item.label}
              </Text>
              {item.badge ? (
                <View style={[styles.menuBadge, { backgroundColor: colors.tertiary }]}>
                  <Text style={[typography.labelSmall, { color: colors.onTertiary, fontSize: 10 }]}>
                    {item.badge}
                  </Text>
                </View>
              ) : null}
              <ChevronRight color={colors.onSurfaceVariant} size={sizes.iconSmall} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Logout ─── */}
        <Button
          title="LOGOUT"
          onPress={handleLogout}
          variant="error"
          style={{ marginTop: spacing.lg }}
          icon={<LogOut color={colors.onError} size={18} />}
        />

        {/* Version */}
        <Text
          style={[
            typography.labelSmall,
            { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.lg },
          ]}
        >
          Senior Pickleball v1.0.0
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.massive,
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  menuSection: {
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: spacing.sm,
  },
});
