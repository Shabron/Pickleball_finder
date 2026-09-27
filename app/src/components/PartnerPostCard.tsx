/**
 * PartnerPostCard — feed card (v2)
 *
 *  - Clean white card, shadow only (no accent bars / borders)
 *  - Colour-coded skill chip + play-style chip instead of "Level advanced"
 *  - Location with icon, distance highlighted
 *  - Press feedback: card gently scales down while touched
 *  - Actions: Reply (with live count) · Save · Message (primary CTA)
 *  - Hides the author's own Message button on their own post
 */
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated, Alert } from 'react-native';
import { MessageSquare, Bookmark, CornerUpLeft, MapPin } from 'lucide-react-native';
import Avatar from './common/Avatar';
import InlineReplies, { InlineRepliesHandle } from './InlineReplies';
import { postApi, getToken } from '../services/api';
import { getSkillLevelLabel } from '../constants/skillLevels';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme/spacing';

export interface PartnerPostData {
  id: string;
  name: string;
  level: string;
  timeAgo: string;
  content: string;
  avatarUri?: string;
  playStyle?: string;
  location?: string;
  /** e.g. "3.2 mi away" — shown highlighted next to the location */
  distance?: string;
  replyCount?: number;
  isOwn?: boolean;
}

interface PartnerPostCardProps {
  post: PartnerPostData;
  initialSaved?: boolean;
  onMessage?: () => void;
  onPress?: () => void;
}

const PLAY_STYLE_LABELS: Record<string, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
  mixed: 'Mixed',
  any: 'Any style',
};

function PartnerPostCard({ post, initialSaved = false, onMessage, onPress }: PartnerPostCardProps) {
  const { colors, typography } = useTheme();
  const inlineRepliesRef = useRef<InlineRepliesHandle>(null);
  const [saved, setSaved] = useState(initialSaved);
  const scale = useRef(new Animated.Value(1)).current;

  // Skill → colour, all from the existing palette
  const skillTone: Record<string, { bg: string; fg: string }> = {
    beginner: { bg: colors.brandGreenContainer, fg: colors.onBrandGreenContainer },
    lowIntermediate: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
    highIntermediate: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
    advanced: { bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer },
    professional: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  };
  const tone = skillTone[post.level] || { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant };

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  const handleSaveToggle = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Sign in required', 'Please log in to save this post.');
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    try {
      if (next) await postApi.savePost(post.id);
      else await postApi.unsavePost(post.id);
    } catch (error: any) {
      setSaved(!next);
      Alert.alert('Error', error.message || 'Failed to update saved post');
    }
  };

  const replyCount = post.replyCount ?? 0;

  return (
    <Animated.View style={[styles.shadowWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPress ? pressIn : undefined}
        onPressOut={onPress ? pressOut : undefined}
        style={[styles.card, { backgroundColor: colors.surface }]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Avatar name={post.name} uri={post.avatarUri} size={44} />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={[typography.titleSmall, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>
                {post.name}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginLeft: spacing.sm }]}>
                {post.timeAgo}
              </Text>
            </View>
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: tone.bg }]}>
                <Text style={[typography.labelSmall, { color: tone.fg }]}>{getSkillLevelLabel(post.level)}</Text>
              </View>
              {post.playStyle && PLAY_STYLE_LABELS[post.playStyle] && (
                <View style={[styles.chip, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    {PLAY_STYLE_LABELS[post.playStyle]}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Content ── */}
        <Text style={[typography.bodyLarge, styles.content, { color: colors.onSurface }]} numberOfLines={4}>
          {post.content}
        </Text>

        {/* ── Location ── */}
        {!!post.location && (
          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: 4 }]} numberOfLines={1}>
              {post.location}
            </Text>
            {!!post.distance && (
              <Text style={[typography.labelMedium, { color: colors.primary, marginLeft: 6 }]}>· {post.distance}</Text>
            )}
          </View>
        )}

        {/* ── Actions ── */}
        <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => inlineRepliesRef.current?.openReply()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
          >
            <CornerUpLeft size={18} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelLarge, styles.actionLabel, { color: colors.onSurfaceVariant }]}>
              {replyCount > 0 ? `Reply · ${replyCount}` : 'Reply'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSaveToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
          >
            <Bookmark
              size={18}
              color={saved ? colors.primary : colors.onSurfaceVariant}
              fill={saved ? colors.primary : 'none'}
            />
            <Text
              style={[typography.labelLarge, styles.actionLabel, { color: saved ? colors.primary : colors.onSurfaceVariant }]}
            >
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          {!post.isOwn && onMessage && (
            <TouchableOpacity
              style={[styles.messageBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={onMessage}
              activeOpacity={0.7}
            >
              <MessageSquare size={16} color={colors.primary} />
              <Text style={[typography.labelLarge, styles.actionLabel, { color: colors.primary }]}>Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Inline replies ── */}
        <InlineReplies ref={inlineRepliesRef} postId={post.id} initialCount={replyCount} />
      </Pressable>
    </Animated.View>
  );
}

// Memoised: FlatList re-renders stay cheap while scrolling
export default React.memo(PartnerPostCard);

const styles = StyleSheet.create({
  shadowWrap: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  content: {
    marginTop: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    marginLeft: 6,
  },
  messageBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
});
