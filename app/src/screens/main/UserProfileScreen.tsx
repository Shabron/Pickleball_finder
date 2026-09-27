/**
 * UserProfileScreen — v2 (another player's profile)
 *
 *  - Compact header card: avatar, name, level/style tags, real distance,
 *    plain-language match reason (no fake %)
 *  - Real content instead of fake stats: About, "Usually plays" schedule,
 *    and this player's open posts (tap → Post Detail)
 *  - Fixed bottom Connect / Message bar (shared logic with Post Detail)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MapPin, CircleCheck, Calendar, MoreVertical, Star, Sparkles, Clock, ChevronRight } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import ReportBlockSheet from '../../components/ReportBlockSheet';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { getSkillLevelLabel, getPlayStyleLabel } from '../../constants/skillLevels';
import { profileApi, postApi, getAvatarUrl } from '../../services/api';
import { formatMiles, matchReason, summarizeAvailability, timeAgo } from '../../utils/playerHelpers';
import { ConnectionStatus, connectLabel, runConnect } from '../../utils/connect';

export default function UserProfileScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const userId: string | undefined = route?.params?.userId;

  const [p, setP] = useState<any>(null);
  const [me, setMe] = useState<{ skillLevel?: string; playStyle?: string } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('none');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const pulse = useRef(new Animated.Value(0.5)).current;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setFailed(false);
    try {
      const [profRes, meRes, postsRes] = await Promise.all([
        profileApi.getProfileByUserId(userId),
        profileApi.getProfile().catch(() => null),
        postApi.getPosts({ author: userId, status: 'Open', limit: '5' }).catch(() => null),
      ]);
      if (!profRes?.success || !profRes.data) throw new Error('not found');
      setP(profRes.data);
      setStatus(profRes.data.connectionStatus || 'none');
      setConversationId(profRes.data.conversationId || null);
      if (meRes?.data) setMe({ skillLevel: meRes.data.skillLevel, playStyle: meRes.data.playStyle });
      setPosts(postsRes?.data?.posts || []);
    } catch (e) {
      console.warn('UserProfile: load failed', e);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const name: string = p?.user?.name?.trim() || 'Player';
  const firstName = name.split(/\s+/)[0];

  const handleConnect = async () => {
    if (!userId || connecting) return;
    setConnecting(true);
    await runConnect({ userId, name, status, conversationId }, navigation, patch => {
      setStatus(patch.status);
      if (patch.conversationId !== undefined) setConversationId(patch.conversationId);
    });
    setConnecting(false);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    const bar = (w: string, h: number, mt = 0) => (
      <View style={{ width: w as any, height: h, marginTop: mt, borderRadius: 6, backgroundColor: colors.surfaceContainer }} />
    );
    return (
      <ScreenWrapper>
        <Header title="" showBack onBack={() => navigation.goBack()} />
        <Animated.View style={{ opacity: pulse, paddingHorizontal: spacing.lg }}>
          <View style={[styles.card, styles.heroRow, { backgroundColor: colors.surface }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceContainer }} />
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              {bar('60%', 18)}
              {bar('45%', 12, 10)}
              {bar('70%', 12, 8)}
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {bar('25%', 12)}
            {bar('90%', 12, 12)}
            {bar('70%', 12, 8)}
          </View>
        </Animated.View>
      </ScreenWrapper>
    );
  }

  if (failed || !p) {
    return (
      <ScreenWrapper>
        <Header title="" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={[typography.titleSmall, { color: colors.onSurface, textAlign: 'center' }]}>Couldn't load this profile</Text>
          <TouchableOpacity onPress={load} style={[styles.pillBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
            <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const distance = formatMiles(p.distanceKm);
  const place = [p.city, p.state].filter(Boolean).join(', ');
  const styleLabel = getPlayStyleLabel(p.playStyle);
  const reason = matchReason(
    { level: p.skillLevel, playStyle: p.playStyle, distanceMi: p.distanceKm != null ? p.distanceKm / 1.609344 : undefined },
    me
  );
  const schedule = summarizeAvailability(p.availability);
  const memberSince = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  const skillTone: Record<string, { bg: string; fg: string }> = {
    beginner: { bg: colors.brandGreenContainer, fg: colors.onBrandGreenContainer },
    lowIntermediate: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
    highIntermediate: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
    advanced: { bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer },
    professional: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  };
  const tone = skillTone[p.skillLevel] || { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant };

  return (
    <ScreenWrapper>
      <Header
        title=""
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => setShowSheet(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.moreBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.75}
          >
            <MoreVertical size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Identity ── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.heroRow}>
            <Avatar name={name} uri={getAvatarUrl(p.avatar)} size={80} />
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <View style={styles.inline}>
                <Text style={[typography.titleLarge, { color: colors.onSurface, fontWeight: '700', flexShrink: 1 }]} numberOfLines={2}>
                  {name}
                </Text>
                {p.user?.emailVerified && <CircleCheck size={18} color={colors.secondary} style={{ marginLeft: 6 }} />}
              </View>
              {!!p.ageRange && (
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>Age {p.ageRange}</Text>
              )}
              <View style={[styles.inline, { marginTop: spacing.sm, flexWrap: 'wrap', gap: 6 }]}>
                {!!p.skillLevel && (
                  <View style={[styles.tag, { backgroundColor: tone.bg }]}>
                    <Text style={[typography.labelMedium, { color: tone.fg }]}>{getSkillLevelLabel(p.skillLevel)}</Text>
                  </View>
                )}
                {!!styleLabel && (
                  <View style={[styles.tag, { backgroundColor: colors.surfaceContainer }]}>
                    <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>{styleLabel}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {(distance || place || reason || !!p.ratingCount) && (
            <View style={[styles.metaBlock, { borderTopColor: colors.outlineVariant }]}>
              {(distance || place) && (
                <View style={styles.inline}>
                  <MapPin size={15} color={colors.onSurfaceVariant} />
                  <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: 6, flexShrink: 1 }]} numberOfLines={1}>
                    {distance ? <Text style={{ color: colors.primary, fontWeight: '600' }}>{distance} away</Text> : null}
                    {distance && place ? ' · ' : ''}
                    {place}
                  </Text>
                </View>
              )}
              {!!p.ratingCount && (
                <View style={[styles.inline, { marginTop: 6 }]}>
                  <Star size={15} color={colors.tertiary} fill={colors.tertiary} />
                  <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
                    {p.avgRating?.toFixed(1)} · {p.ratingCount} rating{p.ratingCount === 1 ? '' : 's'}
                  </Text>
                </View>
              )}
              {reason && (
                <View style={[styles.inline, { marginTop: 6 }]}>
                  <Sparkles size={15} color={colors.brandGreen} />
                  <Text style={[typography.bodyMedium, { color: colors.brandGreen, marginLeft: 6, fontWeight: '600' }]}>{reason}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── About ── */}
        {!!p.bio && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginBottom: 6 }]}>About</Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 22 }]}>{p.bio}</Text>
          </View>
        )}

        {/* ── Schedule ── */}
        {schedule.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginBottom: spacing.sm }]}>Usually plays</Text>
            {schedule.map(s => (
              <View key={s.days} style={[styles.inline, { marginTop: 4 }]}>
                <Clock size={14} color={colors.primary} />
                <Text style={[typography.bodyMedium, { color: colors.onSurface, marginLeft: 8, fontWeight: '600' }]}>{s.days}</Text>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}> · {s.hours}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Open posts ── */}
        {posts.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, paddingBottom: spacing.sm }]}>
            <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginBottom: 4 }]}>{firstName}'s open posts</Text>
            {posts.map((post, i) => (
              <Pressable
                key={post._id}
                onPress={() => navigation.push('PostDetail', { postId: post._id })}
                style={({ pressed }) => [
                  styles.postRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]} numberOfLines={1}>
                    {post.title}
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>
                    {[getPlayStyleLabel(post.playStyle), timeAgo(post.createdAt)].filter(Boolean).join(' · ')}
                    {post.replyCount ? ` · ${post.replyCount} repl${post.replyCount === 1 ? 'y' : 'ies'}` : ''}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            ))}
          </View>
        )}

        {memberSince && (
          <View style={[styles.inline, { justifyContent: 'center', marginTop: spacing.xs }]}>
            <Calendar size={13} color={colors.onSurfaceVariant} />
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>Member since {memberSince}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Connect / Message bar ── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={handleConnect}
          disabled={status === 'pending_sent' || connecting}
          activeOpacity={0.85}
          style={[styles.cta, { backgroundColor: status === 'pending_sent' ? colors.surfaceContainer : colors.primary }]}
        >
          {connecting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text
              style={[
                typography.labelLarge,
                { color: status === 'pending_sent' ? colors.onSurfaceVariant : colors.onPrimary, fontWeight: '700', fontSize: 16 },
              ]}
            >
              {status === 'none' ? `Connect with ${firstName}` : connectLabel(status)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ReportBlockSheet
        visible={showSheet}
        userId={userId as string}
        userName={name}
        context="profile"
        onClose={() => setShowSheet(false)}
        onBlocked={() => navigation.goBack()}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  metaBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  cta: {
    height: 50,
    borderRadius: 25,
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
