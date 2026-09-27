/**
 * PostDetailScreen — v2
 *
 *  - Author row is tappable → opens their profile
 *  - Post content with readable tags (Mixed / Advanced / Edison, CA)
 *  - Schedule collapsed ("Mon – Fri · 8:00 AM – 12:00 PM")
 *  - Comments-style replies: tap a name to open that profile, "Reply" to
 *    mention someone, new replies appear instantly (optimistic)
 *  - Fixed bottom bar: reply box + Connect/Message (one button, real logic)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MapPin, Clock, ChevronRight, Send, CircleCheck, MessageCircle } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import { postApi, profileApi, getAvatarUrl, getToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { getSkillLevelLabel, getPlayStyleLabel } from '../../constants/skillLevels';
import { summarizeAvailability, timeAgo } from '../../utils/playerHelpers';
import { ConnectionStatus, connectLabel, runConnect } from '../../utils/connect';

export default function PostDetailScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const { user } = useAuth();
  const postId = route?.params?.postId;

  const [post, setPost] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus>('none');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [replies, setReplies] = useState<any[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pulse = useRef(new Animated.Value(0.5)).current;

  // ── Load post, then author profile + replies in parallel ────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!postId) return;
        const postRes = await postApi.getPostById(postId);
        if (cancelled) return;
        const p = postRes.data;
        setPost(p);
        const aid = p?.author?._id;
        await Promise.all([
          aid
            ? profileApi
                .getProfileByUserId(aid)
                .then((r: any) => {
                  if (cancelled || !r?.data) return;
                  setProfile(r.data);
                  setStatus(r.data.connectionStatus || 'none');
                  setConversationId(r.data.conversationId || null);
                })
                .catch((e: any) => console.warn('PostDetail: author profile failed', e))
            : Promise.resolve(),
          postApi
            .getReplies(postId)
            .then((r: any) => {
              if (!cancelled) setReplies(r?.data?.replies || []);
            })
            .catch((e: any) => console.warn('PostDetail: replies failed', e))
            .finally(() => {
              if (!cancelled) setRepliesLoading(false);
            }),
        ]);
      } catch (e) {
        console.warn('PostDetail: post failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loading, pulse]);

  const authorId: string | undefined = post?.author?._id;
  const isOwn = !!user?._id && authorId === user._id;

  const openProfile = useCallback(
    (uid?: string) => {
      if (!uid) return;
      if (uid === user?._id) {
        navigation.navigate('MainTabs', { screen: 'Profile' });
        return;
      }
      navigation.push('UserProfile', { userId: uid });
    },
    [navigation, user?._id]
  );

  // ── Connect / Message ────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!authorId || connecting) return;
    setConnecting(true);
    await runConnect(
      { userId: authorId, name: post.author.name, status, conversationId },
      navigation,
      patch => {
        setStatus(patch.status);
        if (patch.conversationId !== undefined) setConversationId(patch.conversationId);
      }
    );
    setConnecting(false);
  };

  // ── Replies ──────────────────────────────────────────────────────────────
  const startReplyTo = (name: string) => {
    const first = (name || '').trim().split(/\s+/)[0];
    setReplyText(prev => (prev.startsWith(`@${first} `) ? prev : `@${first} ${prev}`));
    inputRef.current?.focus();
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || sending) return;
    if (!(await getToken())) {
      Alert.alert('Sign in required', 'Please log in to reply.');
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      content: text,
      createdAt: new Date().toISOString(),
      author: { _id: user?._id, name: user?.name || 'You' },
      pending: true,
    };
    setReplies(prev => [...prev, optimistic]);
    setReplyText('');
    setSending(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const res = await postApi.addReply(postId, text);
      if (res.success && res.data) {
        setReplies(prev => prev.map(r => (r._id === tempId ? res.data : r)));
      } else {
        throw new Error(res.message || 'Failed to post reply');
      }
    } catch (e: any) {
      setReplies(prev => prev.filter(r => r._id !== tempId));
      setReplyText(text);
      Alert.alert("Couldn't post reply", e?.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) {
    const bar = (w: string, h: number, mt = 0) => (
      <View style={{ width: w as any, height: h, marginTop: mt, borderRadius: 6, backgroundColor: colors.surfaceContainer }} />
    );
    return (
      <ScreenWrapper>
        <Header title="Post" showBack onBack={() => navigation.goBack()} />
        <Animated.View style={{ opacity: pulse, padding: spacing.lg, paddingTop: spacing.xs }}>
          <View style={[styles.card, styles.authorRow, { backgroundColor: colors.surface }]}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceContainer }} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              {bar('50%', 14)}
              {bar('70%', 12, 8)}
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {bar('30%', 12)}
            {bar('85%', 18, 14)}
            {bar('95%', 12, 12)}
            {bar('60%', 12, 8)}
          </View>
        </Animated.View>
      </ScreenWrapper>
    );
  }

  if (!post) {
    return (
      <ScreenWrapper>
        <Header title="Post" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={[typography.titleSmall, { color: colors.onSurface }]}>This post is no longer available</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.pillBtn, { backgroundColor: colors.primary }]}>
            <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const authorName: string = post.author?.name || 'Player';
  const authorLevel = profile?.skillLevel;
  const authorPlace = [profile?.city, profile?.state].filter(Boolean).join(', ');
  const postPlace = [post.city, post.state].filter(Boolean).join(', ') || authorPlace;
  const postStyle = getPlayStyleLabel(post.playStyle);
  const schedule = summarizeAvailability(profile?.availability);
  const isOpen = post.status !== 'Closed';
  const canSend = replyText.trim().length > 0;

  const tag = (label: string, bg: string, fg: string, icon?: React.ReactNode) => (
    <View key={label} style={[styles.tag, { backgroundColor: bg }]}>
      {icon}
      <Text style={[typography.labelMedium, { color: fg, marginLeft: icon ? 4 : 0 }]}>{label}</Text>
    </View>
  );

  return (
    <ScreenWrapper>
      <Header title="Post" showBack onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Author (tappable) ── */}
          <Pressable
            onPress={() => openProfile(authorId)}
            style={({ pressed }) => [styles.card, styles.authorRow, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <Avatar name={authorName} uri={getAvatarUrl(profile?.avatar || post.author?.avatar)} size={48} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={styles.inline}>
                <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', flexShrink: 1 }]} numberOfLines={1}>
                  {authorName}
                </Text>
                {profile?.user?.emailVerified && <CircleCheck size={14} color={colors.secondary} style={{ marginLeft: 4 }} />}
              </View>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>
                {[authorLevel && getSkillLevelLabel(authorLevel), authorPlace].filter(Boolean).join(' · ') || 'View profile'}
              </Text>
              {!!profile?.bio && (
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]} numberOfLines={2}>
                  {profile.bio}
                </Text>
              )}
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          {/* ── Post ── */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.inline}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? colors.success : colors.onSurfaceVariant }]} />
              <Text style={[typography.labelMedium, { color: isOpen ? colors.success : colors.onSurfaceVariant }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}> · {timeAgo(post.createdAt)}</Text>
            </View>

            <Text style={[typography.titleLarge, { color: colors.onSurface, fontWeight: '700', marginTop: spacing.sm }]}>
              {post.title}
            </Text>
            <Text style={[typography.bodyLarge, { color: colors.onSurface, marginTop: spacing.sm, lineHeight: 24 }]}>
              {post.description}
            </Text>

            <View style={styles.tagRow}>
              {postStyle ? tag(postStyle, colors.surfaceContainer, colors.onSurfaceVariant) : null}
              {post.skillLevel ? tag(getSkillLevelLabel(post.skillLevel), colors.primaryContainer, colors.onPrimaryContainer) : null}
              {postPlace
                ? tag(postPlace, colors.surfaceContainer, colors.onSurfaceVariant, <MapPin size={12} color={colors.onSurfaceVariant} />)
                : null}
            </View>

            {schedule.length > 0 && (
              <View style={[styles.schedule, { backgroundColor: colors.surfaceDim }]}>
                <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: 6 }]}>
                  {authorName.split(' ')[0]} usually plays
                </Text>
                {schedule.map(s => (
                  <View key={s.days} style={[styles.inline, { marginTop: 2 }]}>
                    <Clock size={13} color={colors.primary} />
                    <Text style={[typography.bodyMedium, { color: colors.onSurface, marginLeft: 6, fontWeight: '600' }]}>{s.days}</Text>
                    <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}> · {s.hours}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Replies ── */}
          <View style={styles.repliesHeader}>
            <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700' }]}>Replies</Text>
            {replies.length > 0 && (
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>{replies.length}</Text>
            )}
          </View>

          {repliesLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : replies.length === 0 ? (
            <Pressable
              onPress={() => inputRef.current?.focus()}
              style={[styles.card, styles.emptyReplies, { backgroundColor: colors.surface }]}
            >
              <MessageCircle size={22} color={colors.primary} />
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.sm, flex: 1 }]}>
                No replies yet — be the first to say hi.
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, paddingVertical: spacing.xs }]}>
              {replies.map((r, i) => {
                const rid = r.author?._id;
                const rname = r.author?.name || 'Player';
                const isAuthor = !!rid && rid === authorId;
                return (
                  <View
                    key={r._id}
                    style={[
                      styles.reply,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant },
                      r.pending && { opacity: 0.55 },
                    ]}
                  >
                    <Pressable onPress={() => openProfile(rid)} hitSlop={6}>
                      <Avatar name={rname} uri={getAvatarUrl(r.author?.avatar)} size={34} />
                    </Pressable>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <View style={styles.inline}>
                        <Text
                          onPress={() => openProfile(rid)}
                          style={[typography.labelLarge, { color: colors.onSurface, fontWeight: '700', flexShrink: 1 }]}
                          numberOfLines={1}
                        >
                          {rname}
                        </Text>
                        {isAuthor && (
                          <View style={[styles.authorBadge, { backgroundColor: colors.primaryContainer }]}>
                            <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer }]}>Author</Text>
                          </View>
                        )}
                        <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
                          {r.pending ? 'Sending…' : timeAgo(r.createdAt)}
                        </Text>
                      </View>
                      <Text style={[typography.bodyMedium, { color: colors.onSurface, marginTop: 2, lineHeight: 21 }]}>
                        {r.content}
                      </Text>
                      {!r.pending && rid !== user?._id && (
                        <Text
                          onPress={() => startReplyTo(rname)}
                          suppressHighlighting
                          style={[typography.labelMedium, { color: colors.primary, marginTop: 4, fontWeight: '600' }]}
                        >
                          Reply
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ── Fixed bottom bar: reply box + Connect ── */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
          <TextInput
            ref={inputRef}
            value={replyText}
            onChangeText={setReplyText}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={isOwn ? 'Write a reply…' : `Reply to ${authorName.split(' ')[0]}…`}
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            maxLength={500}
            style={[typography.bodyMedium, styles.input, { backgroundColor: colors.surfaceContainer, color: colors.onSurface }]}
          />
          {canSend || inputFocused || isOwn ? (
            <TouchableOpacity
              onPress={sendReply}
              disabled={!canSend || sending}
              activeOpacity={0.8}
              style={[styles.sendBtn, { backgroundColor: canSend ? colors.primary : colors.surfaceContainer }]}
            >
              <Send size={18} color={canSend ? colors.onPrimary : colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleConnect}
              disabled={status === 'pending_sent' || connecting}
              activeOpacity={0.85}
              style={[styles.connectBtn, { backgroundColor: status === 'pending_sent' ? colors.surfaceContainer : colors.primary }]}
            >
              {connecting ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text
                  style={[
                    typography.labelLarge,
                    { color: status === 'pending_sent' ? colors.onSurfaceVariant : colors.onPrimary, fontWeight: '700' },
                  ]}
                >
                  {connectLabel(status)}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  schedule: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  emptyReplies: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reply: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  authorBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: 11,
    paddingBottom: 11,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: {
    minWidth: 120,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  pillBtn: {
    marginTop: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
