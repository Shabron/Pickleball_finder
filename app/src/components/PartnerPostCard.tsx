/**
 * PartnerPostCard — Post card with inline collapsible replies
 *
 * Follows Stitch "No-Line Rule" — uses tonal layering for action separator.
 * XL corners, theme-aware colors, accessible touch targets.
 * Replies expand inline Facebook-style below the card actions.
 */
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MessageSquare, Bookmark, CornerUpLeft } from 'lucide-react-native';
import Card from './common/Card';
import Avatar from './common/Avatar';
import InlineReplies, { InlineRepliesHandle } from './InlineReplies';
import { postApi, getToken } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';

export interface PartnerPostData {
  id: string;
  name: string;
  level: string;
  timeAgo: string;
  content: string;
  avatarUri?: string;
  playStyle?: string;
  location?: string;
}

interface PartnerPostCardProps {
  post: PartnerPostData;
  initialSaved?: boolean;
  onMessage?: () => void;
  onPress?: () => void;
}

export default function PartnerPostCard({
  post,
  initialSaved = false,
  onMessage,
  onPress,
}: PartnerPostCardProps) {
  const { colors, typography } = useTheme();
  const inlineRepliesRef = useRef<InlineRepliesHandle>(null);
  const [saved, setSaved] = useState(initialSaved);

  const handleSaveToggle = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Sign in required', 'Please log in to save this post.');
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    try {
      if (nextSaved) {
        await postApi.savePost(post.id);
      } else {
        await postApi.unsavePost(post.id);
      }
    } catch (error: any) {
      setSaved(!nextSaved);
      Alert.alert('Error', error.message || 'Failed to update saved post');
    }
  };

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <View style={styles.cardAccentWrapper}>
        {/* Green left accent bar */}
        <View style={[styles.leftAccentBar, { backgroundColor: colors.brandGreen }]} />
        <Card style={{ marginBottom: 0 }}>
        {/* Header: Avatar + Name + Time */}
        <View style={styles.header}>
          <Avatar name={post.name} uri={post.avatarUri} size={46} />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                {post.name}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                {post.timeAgo}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.tertiary, marginRight: 4, opacity: 0.8 }} />
                <Text style={[typography.labelMedium, { color: colors.onSurface }]}>Level {post.level}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <Text style={[typography.bodyLarge, { color: colors.onSurface, marginBottom: spacing.lg }]}>
          {post.content}
        </Text>

        {/* Location */}
        {post.location && (
          <Text
            style={[
              typography.labelMedium,
              { color: colors.onSurfaceVariant, marginBottom: spacing.md },
            ]}
          >
            📍 {post.location}
          </Text>
        )}

        {/* Actions — separated by tonal shift */}
        <View
          style={[
            styles.actions,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          {/* Reply action — clicking opens compose inline */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              // Stop card press from firing
              e.stopPropagation?.();
              inlineRepliesRef.current?.openReply();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CornerUpLeft size={18} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.xs }]}>
              Reply
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation?.();
              handleSaveToggle();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bookmark
              size={18}
              color={saved ? colors.primary : colors.onSurfaceVariant}
              fill={saved ? colors.primary : 'none'}
            />
            <Text
              style={[
                typography.labelMedium,
                { color: saved ? colors.primary : colors.onSurfaceVariant, marginLeft: spacing.xs },
              ]}
            >
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onMessage}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageSquare size={18} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.xs }]}>
              Message
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Inline Replies (Facebook-style) ── */}
        <InlineReplies ref={inlineRepliesRef} postId={post.id} />
      </Card>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardAccentWrapper: {
    position: 'relative',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  leftAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderRadius: 16,
    marginTop: spacing.xs,
    marginHorizontal: -spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
