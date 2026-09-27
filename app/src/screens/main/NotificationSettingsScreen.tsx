/**
 * NotificationSettingsScreen — v2
 *
 *  - Push status card: clear on/off line, "Turn on" when off
 *  - All five toggles in one card with hairline dividers (no stack of cards)
 *  - Visible switch thumb when off; revert + message if saving fails
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking, ScrollView, Alert } from 'react-native';
import { BellRing, BellOff } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { notificationApi } from '../../services/api';
import { hasNotificationPermission, requestNotificationPermission, registerPushToken } from '../../services/push';

type Key = 'requests' | 'messages' | 'replies' | 'nearbyUsers' | 'nearbyPosts';

const ROWS: { key: Key; title: string; desc: string }[] = [
  { key: 'requests', title: 'Connection requests', desc: 'Someone wants to connect with you' },
  { key: 'messages', title: 'New messages', desc: 'You receive a direct message' },
  { key: 'replies', title: 'Replies to your posts', desc: 'Someone replies to your post' },
  { key: 'nearbyUsers', title: 'New players nearby', desc: 'A new player joins in your area' },
  { key: 'nearbyPosts', title: 'New posts nearby', desc: 'Someone near you is looking to play' },
];

export default function NotificationSettingsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<Record<Key, boolean>>({
    requests: true,
    messages: true,
    replies: true,
    nearbyUsers: true,
    nearbyPosts: true,
  });

  useEffect(() => {
    notificationApi
      .getSettings()
      .then((res: any) => {
        if (res?.success && res.data) setSettings(prev => ({ ...prev, ...res.data }));
      })
      .catch((e: any) => console.warn('Failed to load notification settings', e))
      .finally(() => setLoading(false));
    hasNotificationPermission().then(setPushEnabled);
  }, []);

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    setPushEnabled(granted);
    if (granted) registerPushToken();
    else Linking.openSettings();
  };

  const handleToggle = async (key: Key, value: boolean) => {
    const prev = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await notificationApi.updateSettings(next);
    } catch (e) {
      console.warn('Failed to update settings', e);
      setSettings(prev);
      Alert.alert("Couldn't save", 'Please check your connection and try again.');
    }
  };

  const bar = { backgroundColor: colors.surfaceContainerHigh, borderRadius: 6 };

  return (
    <ScreenWrapper>
      <Header title="Notification Settings" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Push status */}
        <View style={[styles.card, styles.pushRow, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.pushIcon,
              { backgroundColor: pushEnabled === false ? colors.surfaceContainerHigh : colors.brandGreenContainer },
            ]}
          >
            {pushEnabled === false ? (
              <BellOff size={20} color={colors.onSurfaceVariant} />
            ) : (
              <BellRing size={20} color={colors.brandGreen} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '700' }]}>
              {pushEnabled === false ? 'Push notifications are off' : 'Push notifications are on'}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              {pushEnabled === false
                ? "You won't get alerts when the app is closed."
                : 'Choose below what you want to hear about.'}
            </Text>
          </View>
          {pushEnabled === false && (
            <TouchableOpacity
              onPress={handleEnablePush}
              style={[styles.enableBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>Turn on</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[typography.labelLarge, styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
          Notify me when
        </Text>

        {/* Toggles in one card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {ROWS.map((r, i) => (
            <React.Fragment key={r.key}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  {loading ? (
                    <>
                      <View style={[bar, { height: 14, width: '55%' }]} />
                      <View style={[bar, { height: 11, width: '80%', marginTop: 8 }]} />
                    </>
                  ) : (
                    <>
                      <Text style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '500' }]}>
                        {r.title}
                      </Text>
                      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                        {r.desc}
                      </Text>
                    </>
                  )}
                </View>
                <Switch
                  value={settings[r.key]}
                  disabled={loading}
                  onValueChange={val => handleToggle(r.key, val)}
                  trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                  thumbColor={settings[r.key] ? '#FFFFFF' : '#F4F4F4'}
                />
              </View>
              {i < ROWS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.massive,
  },
  card: {
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  pushIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enableBtn: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
});
