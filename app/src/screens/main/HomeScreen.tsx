/**
 * HomeScreen — Partner Posts feed (v2)
 *
 * Not bound to a single state: shows every open post, nearest-first by real
 * distance from the signed-in user's profile location. Posts without a
 * resolvable distance (or before a location is known) fall back to
 * newest-first so nothing silently disappears.
 *
 * v2:
 *  - Small personal greeting shown once per day, fades out after a few
 *    seconds or on first scroll; "Partner Posts" is the permanent title
 *  - Skeleton cards on FIRST load only; returning to the tab refreshes
 *    silently in the background (no more blank-screen spinner = no lag feel)
 *  - Pull-to-refresh
 *  - Friendly empty + error states with a call to action
 *  - FAB collapses to an icon while scrolling down, expands on scroll up
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutAnimation,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postApi, messageApi, profileApi, getAvatarUrl } from '../../services/api';
import { ensurePushRegistration } from '../../services/push';
import { useAuth } from '../../context/AuthContext';
import { Plus, Users, WifiOff } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PartnerPostCard from '../../components/PartnerPostCard';
import FAB from '../../components/common/FAB';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── Skeleton card (pulsing placeholder) ─────────────────────────────────────
function SkeletonCard({ pulse }: { pulse: Animated.Value }) {
  const { colors } = useTheme();
  const block = (w: number | string, h: number, extra: object = {}) => (
    <View style={[{ width: w as any, height: h, borderRadius: 6, backgroundColor: colors.surfaceContainer }, extra]} />
  );
  return (
    <Animated.View style={[styles.skeleton, { backgroundColor: colors.surface, opacity: pulse }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainer }} />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          {block('45%', 14)}
          {block('30%', 12, { marginTop: 8 })}
        </View>
      </View>
      {block('90%', 14, { marginTop: spacing.lg })}
      {block('70%', 14, { marginTop: 8 })}
      {block('40%', 12, { marginTop: spacing.md })}
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [fabExtended, setFabExtended] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const greetingDismissed = useRef(false);

  const coordsRef = useRef<{ lat?: number; lng?: number }>({});
  const lastOffset = useRef(0);
  const pulse = useRef(new Animated.Value(0.5)).current;

  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  // Ask for notification permission once the user has reached the dashboard
  useEffect(() => {
    ensurePushRegistration();
  }, []);

  // Greeting: once per user per calendar day
  useEffect(() => {
    if (!user?._id) return;
    const key = `@greeting_seen_${user._id}`;
    const today = new Date().toDateString();
    AsyncStorage.getItem(key).then((seen) => {
      if (seen === today) return;
      AsyncStorage.setItem(key, today);
      setShowGreeting(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Start the 4s fade-out only once posts are on screen — a slow server
  // wake-up shouldn't eat the greeting while skeletons are showing.
  useEffect(() => {
    if (!showGreeting || initialLoading) return;
    const timer = setTimeout(dismissGreeting, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGreeting, initialLoading]);

  const dismissGreeting = () => {
    if (greetingDismissed.current) return;
    greetingDismissed.current = true;
    Animated.timing(greetingOpacity, { toValue: 0, duration: 300, useNativeDriver: false }).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowGreeting(false);
    });
  };

  // Skeleton pulse
  useEffect(() => {
    if (!initialLoading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [initialLoading, pulse]);

  const loadFeed = useCallback(async () => {
    try {
      // Profile (for location + unread) and saved ids in parallel
      const [profileRes, savedRes] = await Promise.allSettled([
        profileApi.getProfile(),
        postApi.getSavedPosts(),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        setUnreadCount(profileRes.value.unreadNotificationsCount || 0);
        const c = profileRes.value.data?.location?.coordinates;
        // GeoJSON is [longitude, latitude]
        if (Array.isArray(c) && c.length === 2) coordsRef.current = { lat: c[1], lng: c[0] };
      }
      if (savedRes.status === 'fulfilled' && savedRes.value?.success) {
        setSavedPostIds(new Set(savedRes.value.data.posts.map((p: any) => p._id)));
      }

      const res = await postApi.getPosts({ status: 'Open', ...coordsRef.current });
      setPosts(res.data.posts);
      setError(false);
    } catch (err) {
      console.error('Failed to load feed:', err);
      setError(true);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh on focus — silently (existing list stays visible)
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleMessage = async (authorId: string, authorName: string) => {
    try {
      const res = await messageApi.sendMessage(authorId, 'Hi! I saw your post on Senior Pickleball Partners.');
      if (res.success) {
        navigation.navigate('ChatThread', { conversationId: res.conversationId, userId: authorId, name: authorName });
      } else {
        Alert.alert('Could not send message', res.message);
      }
    } catch (err: any) {
      Alert.alert('Could not send message', err.message);
    }
  };

  // Collapse FAB label while scrolling down, expand when scrolling up / near top
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (showGreeting && y > 10) dismissGreeting();
    const goingDown = y > lastOffset.current + 4;
    const goingUp = y < lastOffset.current - 4;
    lastOffset.current = y;
    const shouldExtend = y < 40 || goingUp ? true : goingDown ? false : fabExtended;
    if (shouldExtend !== fabExtended) {
      LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
      setFabExtended(shouldExtend);
    }
  };

  const nearbyCount = posts.length;

  const ListHeader = (
    <View style={styles.intro}>
      {showGreeting && (
        <Animated.Text
          style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: 2, opacity: greetingOpacity }]}
        >
          {greeting()}{firstName ? `, ${firstName}` : ''} 👋
        </Animated.Text>
      )}
      <Text style={[typography.titleLarge, { color: colors.onSurface }]}>Partner Posts</Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
        {initialLoading
          ? 'Finding players near you…'
          : nearbyCount > 0
            ? `${nearbyCount} ${nearbyCount === 1 ? 'player is' : 'players are'} looking for a partner`
            : 'No open posts right now'}
      </Text>
    </View>
  );

  const EmptyState = (
    <View style={[styles.empty, { backgroundColor: colors.surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: error ? colors.errorContainer : colors.primaryContainer }]}>
        {error ? <WifiOff size={28} color={colors.error} /> : <Users size={28} color={colors.primary} />}
      </View>
      <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: spacing.md, textAlign: 'center' }]}>
        {error ? "Couldn't load posts" : 'Be the first to post today'}
      </Text>
      <Text
        style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' }]}
      >
        {error
          ? 'Our server may be waking up — this can take up to a minute.'
          : 'Let nearby players know when and where you want to play.'}
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        onPress={error ? onRefresh : () => navigation.navigate('CreatePost')}
        activeOpacity={0.8}
      >
        <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>{error ? 'Try again' : 'Create a post'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {initialLoading ? (
        <View style={styles.listContainer}>
          {ListHeader}
          <SkeletonCard pulse={pulse} />
          <SkeletonCard pulse={pulse} />
          <SkeletonCard pulse={pulse} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          onScroll={onScroll}
          scrollEventThrottle={32}
          initialNumToRender={4}
          windowSize={7}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <PartnerPostCard
              post={{
                id: item._id,
                name: item.author?.name || 'Player',
                level: item.skillLevel || '',
                timeAgo: formatTimeAgo(item.createdAt),
                content: item.description,
                playStyle: item.playStyle,
                location: `${item.city ? item.city + ', ' : ''}${item.state}`,
                distance: item.distanceKm != null ? `${(item.distanceKm * 0.621371).toFixed(1)} mi` : undefined,
                avatarUri: getAvatarUrl(item.author?.avatar),
                replyCount: item.replyCount,
                isOwn: !!user?._id && item.author?._id === user._id,
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
        label={fabExtended ? 'New Post' : undefined}
        onPress={() => navigation.navigate('CreatePost')}
        style={{ bottom: spacing.lg, right: spacing.lg }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110, // clear the FAB
  },
  intro: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  skeleton: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginTop: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
  },
});
