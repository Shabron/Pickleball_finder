/**
 * HomeScreen — Posts & Location Filter
 *
 * Matches Stitch "Posts & Location Filter" design:
 * - Filter bar with state dropdown and distance slider
 * - Partner post cards with tonal layering
 * - FAB for creating new posts
 * - Responsive layout
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { postApi, messageApi, profileApi } from '../../services/api';
import { ensurePushRegistration } from '../../services/push';
import { Plus } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PartnerPostCard, { PartnerPostData } from '../../components/PartnerPostCard';
import Dropdown from '../../components/common/Dropdown';
import FAB from '../../components/common/FAB';
import Slider from '../../components/common/Slider';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { US_STATES } from '../../constants/states';

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
  const [location, setLocation] = useState('FL');
  const [distance, setDistance] = useState(10);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  // Ask for notification permission here — once the user has actually reached the
  // dashboard — rather than interrupting the signup flow with an OS dialog.
  useEffect(() => {
    ensurePushRegistration();
  }, []);

  // Fetch unread notifications count and saved post ids whenever home is focused
  useFocusEffect(
    React.useCallback(() => {
      const fetchUnreadCount = async () => {
        try {
          const res = await profileApi.getProfile();
          if (res.success) {
            setUnreadCount(res.unreadNotificationsCount || 0);
          }
        } catch (error) {
          console.error('Failed to fetch unread notifications count:', error);
        }
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
      fetchUnreadCount();
      fetchSavedPostIds();
    }, [])
  );

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await postApi.getPosts({ state: location });
        setPosts(res.data.posts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [location]);
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
      


      {/* ─── Filter Section ─── */}
      <View
        style={[
          styles.filterSection,
          {
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 3,
            borderBottomColor: colors.brandGreen,
          },
        ]}
      >
        <Text
          style={[typography.labelLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}
        >
          Showing posts in:
        </Text>
        <Dropdown
          options={US_STATES}
          value={location}
          onSelect={setLocation}
          placeholder="Select State"
        />

        {/* Distance indicator */}
        <Slider
          min={1}
          max={50}
          value={distance}
          onValueChange={setDistance}
          label={`Within ${distance} mi`}
        />
      </View>

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
                location: `${item.city ? item.city + ', ' : ''}${item.state}`,
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
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
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
