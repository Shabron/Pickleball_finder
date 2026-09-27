/**
 * SavedPostsScreen — v2
 *
 *  - Same PartnerPostCard as Home (reply count, tags, own-post aware)
 *  - Unsaving from the card removes it from this list on next focus
 *  - Skeletons, pull-to-refresh, error state with retry
 *  - Empty state points back to Home
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bookmark } from 'lucide-react-native';
import { postApi, messageApi, getAvatarUrl } from '../../services/api';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PartnerPostCard from '../../components/PartnerPostCard';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { timeAgo } from '../../utils/playerHelpers';

function SkeletonCard({ pulse }: { pulse: Animated.Value }) {
  const { colors } = useTheme();
  const block = (w: number | string, h: number, extra: object = {}) => (
    <View style={[{ width: w as any, height: h, borderRadius: 6, backgroundColor: colors.surfaceContainerHigh }, extra]} />
  );
  return (
    <Animated.View style={[styles.skeleton, { backgroundColor: colors.surface, opacity: pulse }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerHigh }} />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          {block('45%', 14)}
          {block('30%', 12, { marginTop: 8 })}
        </View>
      </View>
      {block('90%', 14, { marginTop: spacing.lg })}
      {block('70%', 14, { marginTop: 8 })}
    </Animated.View>
  );
}

export default function SavedPostsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const fetchSaved = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(false);
    try {
      const res = await postApi.getSavedPosts();
      if (!res?.success) throw new Error('bad response');
      // Deleted posts can leave a null author behind — skip those.
      setPosts((res.data?.posts || []).filter((p: any) => p && p.author));
    } catch (e) {
      console.warn('Failed to load saved posts', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [fetchSaved]),
  );

  const handleMessage = async (authorId: string, authorName: string) => {
    try {
      const res = await messageApi.sendMessage(authorId, 'Hi! I saw your post on Senior Pickleball Partners.');
      if (res.success) {
        navigation.navigate('ChatThread', { conversationId: res.conversationId, userId: authorId, name: authorName });
      } else {
        Alert.alert("Couldn't send message", res.message || 'Please try again.');
      }
    } catch (e: any) {
      Alert.alert("Couldn't send message", e?.message || 'Please try again.');
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.list}>
          <SkeletonCard pulse={pulse} />
          <SkeletonCard pulse={pulse} />
        </View>
      );
    }
    if (error && posts.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
            Couldn't load saved posts
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
            The server may be waking up. Give it a few seconds.
          </Text>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setLoading(true);
              fetchSaved();
            }}
            activeOpacity={0.8}
          >
            <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={posts}
        keyExtractor={item => item._id}
        contentContainerStyle={[styles.list, posts.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSaved(true)}
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
              timeAgo: timeAgo(item.createdAt),
              content: item.description,
              playStyle: item.playStyle,
              location: `${item.city ? item.city + ', ' : ''}${item.state || ''}`,
              avatarUri: getAvatarUrl(item.author?.avatar),
              replyCount: item.replyCount,
              isOwn: !!user?._id && item.author?._id === user._id,
            }}
            initialSaved
            onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
            onMessage={() => handleMessage(item.author._id, item.author.name)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}>
              <Bookmark size={28} color={colors.primary} />
            </View>
            <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
              No saved posts yet
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
              Tap the bookmark on any post to keep it here for later.
            </Text>
            <TouchableOpacity
              style={[styles.pillBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
              activeOpacity={0.8}
            >
              <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>Browse posts</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Saved Posts" showBack onBack={() => navigation.goBack()} />
      {renderBody()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  skeleton: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
