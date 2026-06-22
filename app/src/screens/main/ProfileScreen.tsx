/**
 * ProfileScreen — User profile view
 *
 * Themed profile card, badges, menu items with tonal layering.
 * Links to Edit Profile, About, Notifications, Settings, Logout.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@env';
import { profileApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Settings, LogOut, Info, ChevronRight, Bell, Edit, Shield, FileText } from 'lucide-react-native';
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
  const { logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const formatSkillLevel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Beginner',
      lowIntermediate: 'Low Intermediate',
      highIntermediate: 'High Intermediate',
      advanced: 'Advanced',
      professional: 'Pro',
    };
    return levels[level] || level;
  };

  const formatPlayStyle = (style: string) => {
    const styles: Record<string, string> = {
      singles: 'Singles',
      doubles: 'Doubles',
      mixed: 'Mixed',
      any: 'Any Style',
    };
    return styles[style] || style;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const res = await profileApi.getProfile();
          setProfileData(res.data);
          setUnreadCount(res.unreadNotificationsCount || 0);
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout', error);
    }
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
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      icon: <Settings size={sizes.iconSmall} color={colors.onSurfaceVariant} />,
      label: 'Notification Settings',
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      icon: <Shield size={sizes.iconSmall} color={colors.primary} />,
      label: 'Privacy Policy',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      icon: <FileText size={sizes.iconSmall} color={colors.secondary} />,
      label: 'Terms & Conditions',
      onPress: () => navigation.navigate('Terms'),
    },
    {
      icon: <Info size={sizes.iconSmall} color={colors.onSurfaceVariant} />,
      label: 'About the App',
      onPress: () => navigation.navigate('About'),
    },
  ];

  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Profile Card ─── */}
          <Card elevation={2} padding={spacing.xxl}>
            <View style={styles.profileHeaderContent}>
              <Avatar
                name={profileData?.user?.name || 'User'}
                uri={profileData?.avatar ? `${API_BASE_URL.replace(/\/api$/, '')}${profileData.avatar}` : undefined}
                size={sizes.avatarLarge}
              />

              <Text
                style={[typography.headlineSmall, { color: colors.onSurface, marginTop: spacing.md }]}
              >
                {profileData?.user?.name || 'Unknown User'}
              </Text>
              <Text
                style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xxs }]}
              >
                {profileData?.user?.email || ''}
              </Text>

              <View style={styles.badgeRow}>
                {profileData?.skillLevel && (
                  <Badge label={formatSkillLevel(profileData.skillLevel)} variant="primary" size="large" />
                )}
                {profileData?.state && (
                  <Badge
                    label={profileData.state}
                    variant="secondary"
                    size="large"
                    style={{ marginLeft: spacing.sm }}
                  />
                )}
                {profileData?.playStyle && (
                  <Badge
                    label={formatPlayStyle(profileData.playStyle)}
                    variant="tertiary"
                    size="large"
                    style={{ marginLeft: spacing.sm }}
                  />
                )}
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
      )}
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
