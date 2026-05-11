import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { notificationApi } from '../../services/api';

export default function NotificationSettingsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    requests: true,
    messages: true,
    replies: true,
    nearbyUsers: true,
    nearbyPosts: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await notificationApi.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error('Failed to load notification settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await notificationApi.updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings', error);
      // Revert if failed
      setSettings(settings);
    }
  };

  const renderToggle = (key: string, title: string, description: string) => (
    <View style={[styles.toggleRow, { backgroundColor: colors.surfaceContainerLow }]}>
      <View style={styles.toggleTextContainer}>
        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={(settings as any)[key]}
        onValueChange={(val) => handleToggle(key, val)}
        trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
        thumbColor={colors.surface}
      />
    </View>
  );

  return (
    <ScreenWrapper>
      <Header title="Notification Settings" showBack onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          {renderToggle('requests', 'Connection Requests', 'Get notified when someone wants to connect with you')}
          {renderToggle('messages', 'New Messages', 'Get notified when you receive a new direct message')}
          {renderToggle('replies', 'Post Replies', 'Get notified when someone replies to your post')}
          {renderToggle('nearbyUsers', 'New Users Nearby', 'Get notified when a new player joins in your area')}
          {renderToggle('nearbyPosts', 'New Posts Nearby', 'Get notified when someone posts looking to play in your area')}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
});
