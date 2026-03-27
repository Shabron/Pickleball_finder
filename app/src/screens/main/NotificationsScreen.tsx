/**
 * NotificationsScreen — Notification history
 *
 * Type-based icons with unread indicators.
 * Tonal layering for unread vs read items.
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Heart, MessageSquare, Users, FileText } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

interface Notification {
  id: string;
  type: 'match_request' | 'match_accepted' | 'new_message' | 'new_post';
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'match_request', title: 'New Partner Request!', body: 'Martha wants to play with you', timeAgo: '5m ago', read: false },
  { id: '2', type: 'match_accepted', title: "It's a Match! 🎉", body: 'Robert accepted your request.', timeAgo: '1h ago', read: false },
  { id: '3', type: 'new_message', title: 'New Message', body: 'Martha: See you at the court tomorrow!', timeAgo: '2h ago', read: false },
  { id: '4', type: 'new_post', title: 'New Post in Florida', body: 'Looking for doubles partner in Miami', timeAgo: '3h ago', read: true },
  { id: '5', type: 'new_message', title: 'New Message', body: 'Walter: Hey, great game yesterday!', timeAgo: 'Yesterday', read: true },
  { id: '6', type: 'match_request', title: 'New Partner Request!', body: 'Clara wants to play with you', timeAgo: '2 days ago', read: true },
];

export default function NotificationsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  const getIcon = (type: Notification['type']) => {
    const iconMap = {
      match_request: <Heart size={22} color={colors.tertiary} />,
      match_accepted: <Users size={22} color={colors.primary} />,
      new_message: <MessageSquare size={22} color={colors.secondary} />,
      new_post: <FileText size={22} color={colors.onSurfaceVariant} />,
    };
    return iconMap[type];
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notifRow,
        {
          backgroundColor: item.read
            ? colors.transparent
            : colors.surfaceContainerLow,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
        {getIcon(item.type)}
      </View>

      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text
            style={[
              typography.titleSmall,
              {
                color: colors.onSurface,
                flex: 1,
                fontWeight: item.read ? '400' : '700',
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
            {item.timeAgo}
          </Text>
        </View>
        <Text
          style={[
            typography.bodyMedium,
            { color: item.read ? colors.onSurfaceVariant : colors.onSurface },
          ]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
      </View>

      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.tertiary }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <Header title="Notifications" showBack onBack={() => navigation.goBack()} />

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text
              style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
            >
              No notifications yet.
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.massive,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
  },
  emptyState: {
    paddingTop: spacing.giant,
    alignItems: 'center',
  },
});
