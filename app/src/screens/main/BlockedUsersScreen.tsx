/**
 * BlockedUsersScreen — Manage blocked players
 *
 * Lists everyone the signed-in user has blocked, with an unblock action.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { safetyApi } from '../../services/api';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

interface BlockedUser {
  _id: string;
  name: string;
  email: string;
}

export default function BlockedUsersScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchBlocked = async () => {
        try {
          setLoading(true);
          const res = await safetyApi.getBlockedUsers();
          if (res.success) setUsers(res.data || []);
        } catch (error) {
          console.error('Failed to load blocked users', error);
        } finally {
          setLoading(false);
        }
      };
      fetchBlocked();
    }, [])
  );

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock this player?',
      `${user.name} will be able to message you and appear in your search results again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setUnblockingId(user._id);
            try {
              await safetyApi.unblockUser(user._id);
              setUsers(prev => prev.filter(u => u._id !== user._id));
            } catch (error: any) {
              Alert.alert('Something went wrong', error.message || 'Failed to unblock user.');
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Blocked Users" showBack onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}>
              <Avatar name={item.name} size={44} />
              <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600', flex: 1, marginLeft: spacing.md }]}>
                {item.name}
              </Text>
              <TouchableOpacity
                style={[styles.unblockBtn, { borderColor: colors.primary }]}
                activeOpacity={0.75}
                disabled={unblockingId === item._id}
                onPress={() => handleUnblock(item)}
              >
                <Text style={[typography.labelMedium, { color: colors.primary, fontWeight: '700' }]}>
                  {unblockingId === item._id ? 'Unblocking…' : 'Unblock'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                You haven't blocked anyone.
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  unblockBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  emptyState: {
    paddingTop: spacing.giant,
    alignItems: 'center',
  },
});
