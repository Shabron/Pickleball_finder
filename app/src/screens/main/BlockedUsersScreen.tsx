/**
 * BlockedUsersScreen — v2
 *
 *  - Blocked players in one white card (avatar, name, Unblock), no borders
 *  - Friendly empty state explaining what blocking does
 *  - Skeletons while loading, error state with retry
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ShieldCheck } from 'lucide-react-native';
import { safetyApi, getAvatarUrl } from '../../services/api';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

interface BlockedUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function BlockedUsersScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlocked = useCallback(async () => {
    setError(false);
    try {
      const res = await safetyApi.getBlockedUsers();
      if (!res?.success) throw new Error('bad response');
      setUsers(res.data || []);
    } catch (e) {
      console.warn('Failed to load blocked users', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlocked();
    }, [fetchBlocked]),
  );

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      `Unblock ${user.name?.trim() || 'this player'}?`,
      'They will be able to message you and appear in your search results again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setUnblockingId(user._id);
            try {
              await safetyApi.unblockUser(user._id);
              setUsers(prev => prev.filter(u => u._id !== user._id));
            } catch (e: any) {
              Alert.alert("Couldn't unblock", e?.message || 'Please try again.');
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ],
    );
  };

  const bar = { backgroundColor: colors.surfaceContainerHigh, borderRadius: 6 };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {[0, 1].map(i => (
            <View key={i} style={styles.row}>
              <View style={[bar, { width: 44, height: 44, borderRadius: 22 }]} />
              <View style={[bar, { height: 14, width: '45%', marginLeft: spacing.md }]} />
            </View>
          ))}
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
            Couldn't load this list
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
            The server may be waking up. Give it a few seconds.
          </Text>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setLoading(true);
              fetchBlocked();
            }}
            activeOpacity={0.8}
          >
            <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (users.length === 0) {
      return (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}>
            <ShieldCheck size={28} color={colors.primary} />
          </View>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
            You haven't blocked anyone
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
            If someone bothers you, open their profile, tap ⋮ and choose Block. They won't be able to message
            you or see you in search.
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {users.map((u, i) => (
          <React.Fragment key={u._id}>
            <View style={styles.row}>
              <Avatar name={u.name} uri={getAvatarUrl(u.avatar)} size={44} />
              <Text
                style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '600', flex: 1, marginLeft: spacing.md }]}
                numberOfLines={1}
              >
                {u.name?.trim() || 'Player'}
              </Text>
              <TouchableOpacity
                style={[styles.unblockBtn, { backgroundColor: colors.primaryContainer }]}
                activeOpacity={0.75}
                disabled={unblockingId === u._id}
                onPress={() => handleUnblock(u)}
              >
                {unblockingId === u._id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[typography.labelLarge, { color: colors.primary }]}>Unblock</Text>
                )}
              </TouchableOpacity>
            </View>
            {i < users.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Blocked Users" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {renderBody()}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 44 + spacing.md,
    marginRight: spacing.md,
  },
  unblockBtn: {
    minWidth: 88,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.giant,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pillBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
  },
});
