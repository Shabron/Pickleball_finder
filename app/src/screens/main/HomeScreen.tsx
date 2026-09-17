/**
 * HomeScreen — Partner Posts feed
 *
 * Not bound to a single state: shows every open post, nearest-first by real
 * distance from the signed-in user's profile location. Posts without a
 * resolvable distance (or before a location is known) fall back to
 * newest-first so nothing silently disappears.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { postApi, messageApi, profileApi, getAvatarUrl } from '../../services/api';
import { ensurePushRegistration } from '../../services/push';
import { Plus } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PartnerPostCard, { PartnerPostData } from '../../components/PartnerPostCard';
import FAB from '../../components/common/FAB';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  // Ask for notification permission here — once the user has actually reached the
  // dashboard — rather than interrupting the signup flow with an OS dialog.
  useEffect(() => {
    ensurePushRegistration();
  }, []);

  // Fetch profile (unread count + location), saved post ids, and the
  // nearest-first post feed whenever Home is focused.
  useFocusEffect(
    React.useCallback(() => {
      const fetchPosts = async (params: { lat?: number; lng?: number }) => {
        setLoading(true);
        try {
          const res = await postApi.getPosts({ status: 'Open', ...params });
          setPosts(res.data.posts);
        } catch (error) {
          console.error('Failed to fetch posts:', error);
        } finally {
          setLoading(false);
        }
      };

      const fetchProfileAndPosts = async () => {
        try {
          const res = await profileApi.getProfile();
          if (res.success) {
            setUnreadCount(res.unreadNotificationsCount || 0);
            const coords = res.data?.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2) {
              // GeoJSON stores coordinates as [longitude, latitude]
              await fetchPosts({ lat: coords[1], lng: coords[0] });
              return;
            }
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
        await fetchPosts({});
      };

      const fetchSavedPostIds = async () => {
        try {
          const res = await postApi.getSavedPosts();
          if (res.success) {
            setSavedPostIds(new Set(res.data.posts.map((p: any) => p._id)));
          }
        } catch (error) {
          console.error('Failed to fetch saved posts:', error);
        }
      };

      fetchProfileAndPosts();
      fetchSavedPostIds();
    }, [])
  );

  const { colors, typography } = useTheme();

  const handleMessage = async (authorId: string, authorName: string) => {
    try {
      const res = await messageApi.sendMessage(
        authorId,
        "Hi! I saw your post on Senior Pickleball Partners."
      );
      if (res.success) {
        navigation.navigate('ChatThread', {
          conversationId: res.conversationId,
          userId: authorId,
          name: authorName,
        });
      } else {
        Alert.alert('Failed to send message: ' + res.message);
      }
    } catch (error: any) {
      console.error('Failed to message:', error);
      Alert.alert('Failed to message: ' + error.message);
    }
  };



  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
        style={{ backgroundColor: 'transparent' }}
      />


      {/* ─── Post List ─── */}
      <View style={styles.listHeader}>
        <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
          Partner Posts
        </Text>
        <View style={[styles.activeBadge, { backgroundColor: colors.brandGreenContainer }]}>
          <View style={[styles.activeDot, { backgroundColor: colors.brandGreen }]} />
          <Text style={[typography.labelMedium, { color: colors.onBrandGreenContainer, fontWeight: '600' }]}>
            {posts.length} active posts
          </Text>
        </View>
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
          renderItem={({ item }) => (
            <PartnerPostCard
              post={{
                id: item._id,
                name: item.author.name,
                level: item.skillLevel || 'Unknown',
                timeAgo: formatTimeAgo(item.createdAt),
                content: item.description,
                playStyle: item.playStyle,
                location: `${item.city ? item.city + ', ' : ''}${item.state}${
                  item.distanceKm != null ? ` · ${(item.distanceKm * 0.621371).toFixed(1)} mi away` : ''
                }`,
                avatarUri: getAvatarUrl(item.author?.avatar),
              }}
              initialSaved={savedPostIds.has(item._id)}
              onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
              onMessage={() => handleMessage(item.author._id, item.author.name)}
            />
          )}
        />
      )}

      <FAB
        icon={<Plus color={colors.onPrimary} size={22} strokeWidth={2.5} />}
        label="New Post"
        onPress={() => navigation.navigate('CreatePost')}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heroLogoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  heroLogo: {
    width: 280,
    height: 160,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
});
