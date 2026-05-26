/**
 * MyPostsScreen — User's own posts management
 *
 * Shows user's active/closed posts with management actions.
 * Uses tonal layering, themed components, no border dividers.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { postApi, profileApi } from '../../services/api';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import FAB from '../../components/common/FAB';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

interface MyPost {
  id: string;
  title: string;
  content: string;
  status: 'Open' | 'Closed';
  timeAgo: string;
  responseCount: number;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function MyPostsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        try {
          const res = await postApi.getMyPosts();
          setPosts(res.data.posts);
          
          const profileRes = await profileApi.getProfile();
          if (profileRes.success) {
            setUnreadCount(profileRes.unreadNotificationsCount || 0);
          }
        } catch (error) {
          console.error("Failed to load my posts", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPosts();
    }, [])
  );

  const renderPostItem = ({ item }: { item: any }) => (
    <Card elevation={2}>
      {/* Status + Time */}
      <View style={styles.postHeader}>
        <Badge
          label={item.status}
          variant={item.status === 'Open' ? 'success' : 'surface'}
        />
        <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>

      {/* Title + Content */}
      <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.xs }]}>
        {item.title}
      </Text>
      <Text
        style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.lg }]}
        numberOfLines={3}
      >
        {item.description}
      </Text>

      {/* Response Count */}
      <Text style={[typography.labelMedium, { color: colors.secondary, marginBottom: spacing.md }]}>
        0 responses
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.secondaryContainer }]}
          onPress={() => navigation.navigate('CreatePost', { post: item })}
        >
          <Edit2 size={16} color={colors.onSecondaryContainer} />
          <Text
            style={[
              typography.labelMedium,
              { color: colors.onSecondaryContainer, marginLeft: spacing.xs },
            ]}
          >
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.errorContainer + '60' }]}
        >
          <Trash2 size={16} color={colors.error} />
          <Text
            style={[
              typography.labelMedium,
              { color: colors.error, marginLeft: spacing.xs },
            ]}
          >
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <View style={styles.headerContainer}>
        <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
          My Posts ({posts.length} Active)
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderPostItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              You haven't posted yet.{'\n'}Tap + to find a partner!
            </Text>
          </View>
        }
      />
      )}

      <FAB
        icon={<Plus color={colors.surfaceContainerLowest} size={24} />}
        onPress={() => navigation.navigate('CreatePost')}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  emptyState: {
    paddingTop: spacing.giant,
    alignItems: 'center',
  },
});
