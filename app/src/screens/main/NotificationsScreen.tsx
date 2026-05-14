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
import { notificationApi } from '../../services/api';

interface Notification {
  id: string;
  type: 'request_sent' | 'request_accepted' | 'new_message' | 'new_reply' | 'new_post_nearby' | 'new_user_nearby' | string;
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
  referenceId?: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      if (res.success && res.data) {
        const mapped = res.data.map((n: any) => ({
          id: n._id,
          type: n.type,
          title: n.title,
          body: n.body,
          timeAgo: new Date(n.createdAt).toLocaleDateString(), // simplified
          read: n.read,
          referenceId: n.referenceId,
        }));
        setNotifications(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async (item: Notification) => {
    if (!item.read) {
      try {
        await notificationApi.markAsRead(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      } catch (error) {
        console.error('Failed to mark read', error);
      }
    }

    // Navigation logic based on notification type
    if (item.type === 'request_sent' || item.type === 'request_accepted' || item.type === 'new_message') {
      navigation.navigate('MainTabs', { screen: 'Messages' });
    } else if (item.type === 'new_post_nearby' || item.type === 'new_reply') {
      if (item.referenceId) navigation.navigate('PostDetail', { postId: item.referenceId });
    } else if (item.type === 'new_user_nearby') {
      if (item.referenceId) navigation.navigate('UserProfile', { userId: item.referenceId });
    }
  };

  const getIcon = (type: Notification['type']) => {
    const iconMap: any = {
      request_sent: <Heart size={22} color={colors.tertiary} />,
      request_accepted: <Users size={22} color={colors.primary} />,
      new_message: <MessageSquare size={22} color={colors.secondary} />,
      new_reply: <MessageSquare size={22} color={colors.secondary} />,
      new_post_nearby: <FileText size={22} color={colors.onSurfaceVariant} />,
      new_user_nearby: <Users size={22} color={colors.primary} />,
    };
    return iconMap[type] || <Heart size={22} color={colors.tertiary} />;
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
      onPress={() => handlePress(item)}
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
        data={notifications}
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
              {loading ? 'Loading...' : 'No notifications yet.'}
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
