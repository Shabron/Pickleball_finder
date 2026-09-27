/**
 * MyPostsScreen — v2
 *
 *  - Open posts first, closed posts dimmed in a "Closed" group
 *  - Card tap → Post Detail (read + answer replies)
 *  - One ⋮ menu (Edit / Close or Reopen / Delete with confirm)
 *  - Real reply counts + "last reply 2h ago"
 *  - Posts open > 30 days get a gentle "Still looking?" nudge
 *  - Skeletons, pull-to-refresh, retry state, empty state with CTA
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Pressable,
  Alert,
  Animated,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, MoreVertical, MessageCircle, ChevronRight, MapPin, Pencil, CheckCircle2, RotateCcw, Trash2, PenSquare } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import { postApi, profileApi } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { getSkillLevelLabel, getPlayStyleLabel } from '../../constants/skillLevels';
import { timeAgo } from '../../utils/playerHelpers';

const STALE_DAYS = 30;

const postedOn = (iso: string) => {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
};

export default function MyPostsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuPost, setMenuPost] = useState<any>(null);
  const pulse = useRef(new Animated.Value(0.5)).current;

  const fetchPosts = useCallback(async () => {
    try {
      const res = await postApi.getMyPosts();
      setPosts(res?.data?.posts || []);
      setError(false);
      profileApi
        .getProfile()
        .then((p: any) => {
          if (p?.success) setUnreadCount(p.unreadNotificationsCount || 0);
        })
        .catch(() => {});
    } catch (e) {
      console.warn('MyPosts: load failed', e);
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  React.useEffect(() => {
    if (loaded) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loaded, pulse]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const toggleStatus = async (post: any) => {
    const next = post.status === 'Closed' ? 'Open' : 'Closed';
    setBusyId(post._id);
    setPosts(prev => prev.map(p => (p._id === post._id ? { ...p, status: next } : p)));
    try {
      const res = await postApi.updatePost(post._id, { status: next });
      if (!res?.success) throw new Error(res?.message);
    } catch (e: any) {
      setPosts(prev => prev.map(p => (p._id === post._id ? { ...p, status: post.status } : p)));
      Alert.alert("Couldn't update post", e?.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = (post: any) =>
    Alert.alert('Delete this post?', 'Its replies will be deleted too. This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const snapshot = posts;
          setPosts(prev => prev.filter(p => p._id !== post._id));
          try {
            await postApi.deletePost(post._id);
          } catch (e: any) {
            setPosts(snapshot);
            Alert.alert("Couldn't delete post", e?.message || 'Please try again.');
          }
        },
      },
    ]);

  const openPost = (post: any) => navigation.navigate('PostDetail', { postId: post._id });
  const createPost = () => navigation.navigate('CreatePost');

  // ── Card ────────────────────────────────────────────────────────────────
  const renderPost = ({ item }: { item: any }) => {
    const open = item.status !== 'Closed';
    const replies = item.replyCount || 0;
    const ageDays = (Date.now() - new Date(item.createdAt).getTime()) / 86400000;
    const stale = open && ageDays > STALE_DAYS;
    const style = getPlayStyleLabel(item.playStyle);
    const place = [item.city, item.state].filter(Boolean).join(', ');
    const busy = busyId === item._id;

    return (
      <Pressable
        onPress={() => openPost(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, transform: [{ scale: pressed ? 0.985 : 1 }] },
        ]}
      >
        <View style={{ opacity: open ? 1 : 0.6 }}>
          {/* Status row */}
          <View style={styles.inline}>
            <View style={[styles.dot, { backgroundColor: open ? colors.success : colors.onSurfaceVariant }]} />
            <Text style={[typography.labelMedium, { color: open ? colors.success : colors.onSurfaceVariant, fontWeight: '600' }]}>
              {open ? 'Open' : 'Closed'}
            </Text>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, flex: 1 }]}> · Posted {postedOn(item.createdAt)}</Text>
          </View>

          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', marginTop: spacing.sm }]} numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.description && (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 21 }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {(style || item.skillLevel || place) && (
            <View style={styles.tags}>
              {!!style && (
                <View style={[styles.tag, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>{style}</Text>
                </View>
              )}
              {!!item.skillLevel && (
                <View style={[styles.tag, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[typography.labelMedium, { color: colors.onPrimaryContainer }]}>{getSkillLevelLabel(item.skillLevel)}</Text>
                </View>
              )}
              {!!place && (
                <View style={[styles.tag, styles.inline, { backgroundColor: colors.surfaceContainer }]}>
                  <MapPin size={12} color={colors.onSurfaceVariant} />
                  <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: 4 }]}>{place}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Replies row */}
        <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
          <MessageCircle size={16} color={replies ? colors.primary : colors.onSurfaceVariant} />
          <Text
            style={[
              typography.labelLarge,
              { color: replies ? colors.primary : colors.onSurfaceVariant, marginLeft: 6, fontWeight: replies ? '700' : '500', flex: 1 },
            ]}
          >
            {replies ? `${replies} repl${replies === 1 ? 'y' : 'ies'}` : 'No replies yet'}
            {replies && item.lastReplyAt ? (
              <Text style={{ color: colors.onSurfaceVariant, fontWeight: '400' }}> · last {timeAgo(item.lastReplyAt).toLowerCase()}</Text>
            ) : null}
          </Text>
          {open ? (
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          ) : busy ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={() => toggleStatus(item)} hitSlop={10}>
              <Text style={[typography.labelLarge, { color: colors.primary, fontWeight: '700' }]}>Reopen</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stale nudge */}
        {stale && (
          <View style={[styles.nudge, { backgroundColor: colors.surfaceDim }]}>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, flex: 1 }]}>
              Still looking? Close this post if you found a partner.
            </Text>
            <TouchableOpacity onPress={() => toggleStatus(item)} hitSlop={8} disabled={busy}>
              <Text style={[typography.labelMedium, { color: colors.primary, fontWeight: '700' }]}>{busy ? '…' : 'Close post'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ⋮ */}
        <TouchableOpacity onPress={() => setMenuPost(item)} hitSlop={12} style={styles.more} activeOpacity={0.6}>
          <MoreVertical size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </Pressable>
    );
  };

  // ── Body ────────────────────────────────────────────────────────────────
  const openPosts = posts.filter(p => p.status !== 'Closed');
  const closedPosts = posts.filter(p => p.status === 'Closed');
  const sections = [
    ...(openPosts.length ? [{ title: '', data: openPosts }] : []),
    ...(closedPosts.length ? [{ title: 'Closed', data: closedPosts }] : []),
  ];

  const emptyCard = (title: string, text: string, cta: string, onPress: () => void, icon: React.ReactNode) => (
    <View style={[styles.empty, { backgroundColor: colors.surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}>{icon}</View>
      <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>{text}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
        <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>{cta}</Text>
      </TouchableOpacity>
    </View>
  );

  let body: React.ReactNode;
  if (!loaded) {
    body = (
      <Animated.View style={[styles.list, { opacity: pulse }]}>
        {[0, 1].map(i => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={{ width: '35%', height: 12, borderRadius: 6, backgroundColor: colors.surfaceContainer }} />
            <View style={{ width: '80%', height: 16, borderRadius: 6, marginTop: 14, backgroundColor: colors.surfaceContainer }} />
            <View style={{ width: '95%', height: 12, borderRadius: 6, marginTop: 10, backgroundColor: colors.surfaceContainer }} />
            <View style={{ width: '50%', height: 12, borderRadius: 6, marginTop: 18, backgroundColor: colors.surfaceContainer }} />
          </View>
        ))}
      </Animated.View>
    );
  } else if (error && posts.length === 0) {
    body = (
      <View style={styles.list}>
        {emptyCard(
          "Couldn't load your posts",
          'The server may be waking up. This can take up to 30 seconds.',
          'Try again',
          () => {
            setLoaded(false);
            fetchPosts();
          },
          <MessageCircle size={26} color={colors.primary} />
        )}
      </View>
    );
  } else {
    body = (
      <SectionList
        sections={sections}
        keyExtractor={i => i._id}
        renderItem={renderPost}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text style={[typography.labelMedium, styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              {section.title.toUpperCase()}
            </Text>
          ) : null
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ListEmptyComponent={emptyCard(
          'No posts yet',
          'Tell nearby players when and how you like to play — they can reply or connect with you.',
          'Create your first post',
          createPost,
          <PenSquare size={26} color={colors.primary} />
        )}
      />
    );
  }

  // ── Menu sheet ──────────────────────────────────────────────────────────
  const menuRow = (icon: React.ReactNode, label: string, onPress: () => void, color = colors.onSurface) => (
    <TouchableOpacity
      key={label}
      activeOpacity={0.7}
      style={[styles.menuRow, { backgroundColor: colors.surfaceContainer }]}
      onPress={() => {
        setMenuPost(null);
        setTimeout(onPress, 150);
      }}
    >
      {icon}
      <Text style={[typography.bodyLarge, { color, fontWeight: '600', marginLeft: spacing.md }]}>{label}</Text>
    </TouchableOpacity>
  );

  const menuOpen = !!menuPost && menuPost.status !== 'Closed';

  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <View style={styles.titleRow}>
        <Text style={[typography.titleLarge, { color: colors.onSurface, fontWeight: '700' }]}>My Posts</Text>
        {loaded && openPosts.length > 0 && (
          <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>{openPosts.length} open</Text>
        )}
      </View>

      {body}

      {loaded && posts.length > 0 && (
        <TouchableOpacity onPress={createPost} activeOpacity={0.85} style={[styles.fab, { backgroundColor: colors.primary }]}>
          <Plus color={colors.onPrimary} size={22} />
          <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700', marginLeft: 6 }]}>New post</Text>
        </TouchableOpacity>
      )}

      <Modal visible={!!menuPost} transparent animationType="fade" onRequestClose={() => setMenuPost(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuPost(null)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginBottom: spacing.md }]} numberOfLines={1}>
            {menuPost?.title}
          </Text>
          <View style={{ gap: spacing.sm }}>
            {menuRow(<Pencil size={20} color={colors.onSurface} />, 'Edit post', () => navigation.navigate('CreatePost', { post: menuPost }))}
            {menuOpen
              ? menuRow(<CheckCircle2 size={20} color={colors.onSurface} />, 'Close post · found a partner', () => toggleStatus(menuPost))
              : menuRow(<RotateCcw size={20} color={colors.onSurface} />, 'Reopen post', () => toggleStatus(menuPost))}
            {menuRow(<Trash2 size={20} color={colors.error} />, 'Delete post', () => confirmDelete(menuPost), colors.error)}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110,
    flexGrow: 1,
  },
  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.6,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  more: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.sm,
    padding: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtn: {
    marginTop: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
});
