/**
 * InlineReplies — Facebook-style collapsible reply section
 *
 * - Renders inline below a post card (no navigation needed)
 * - Tap "View N replies" / "Hide replies" to toggle
 * - Replies list with avatar, name, time, content
 * - Inline compose bar — requires auth to post (graceful alert if not)
 * - Optimistic append on submit
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronDown, ChevronUp, Send, MessageCircle } from 'lucide-react-native';
import Avatar from './common/Avatar';
import { postApi, getToken } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme/spacing';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

interface InlineRepliesProps {
  postId: string;
  /** Initial reply count hint (e.g. from a cached post object) */
  initialCount?: number;
}

export default function InlineReplies({ postId, initialCount = 0 }: InlineRepliesProps) {
  const { colors, typography } = useTheme();

  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [fetched, setFetched] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [count, setCount] = useState(initialCount);

  const inputRef = useRef<TextInput>(null);

  // Fetch once on first expand
  const fetchReplies = useCallback(async () => {
    if (fetched) return;
    setLoadingReplies(true);
    try {
      const res = await postApi.getReplies(postId);
      const loaded = res.data.replies || [];
      setReplies(loaded);
      setCount(loaded.length);
      setFetched(true);
    } catch (err) {
      console.error('InlineReplies: fetch error', err);
    } finally {
      setLoadingReplies(false);
    }
  }, [postId, fetched]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!expanded) {
      fetchReplies();
    }
    setExpanded(prev => !prev);
  };

  const handleReplyButtonPress = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Sign in required', 'Please log in to reply to this post.');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!expanded) {
      fetchReplies();
      setExpanded(true);
    }
    setShowCompose(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleSubmit = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await postApi.addReply(postId, trimmed);
      if (res.success) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setReplies(prev => [...prev, res.data]);
        setCount(prev => prev + 1);
        setReplyText('');
        if (!expanded) setExpanded(true);
      } else {
        Alert.alert('Error', res.message || 'Failed to post reply');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const replyLabel = count === 0
    ? 'Be the first to reply'
    : expanded
      ? `Hide ${count} ${count === 1 ? 'reply' : 'replies'}`
      : `View ${count} ${count === 1 ? 'reply' : 'replies'}`;

  return (
    <View style={styles.wrapper}>
      {/* ── Toggle row ── */}
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={handleToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MessageCircle size={14} color={colors.primary} />
        <Text style={[typography.labelSmall, { color: colors.primary, marginLeft: 5 }]}>
          {replyLabel}
        </Text>
        {count > 0 && (
          expanded
            ? <ChevronUp size={14} color={colors.primary} style={{ marginLeft: 3 }} />
            : <ChevronDown size={14} color={colors.primary} style={{ marginLeft: 3 }} />
        )}
      </TouchableOpacity>

      {/* ── Expanded section ── */}
      {expanded && (
        <View style={[styles.expandedContainer, { borderLeftColor: colors.outlineVariant }]}>
          {/* Loading */}
          {loadingReplies && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {/* Reply list */}
          {!loadingReplies && replies.map((reply) => (
            <View key={reply._id} style={styles.replyRow}>
              {/* Thread line connector */}
              <View style={[styles.threadLine, { backgroundColor: colors.outlineVariant }]} />

              <Avatar name={reply.author?.name || '?'} size={30} />

              <View style={[styles.replyBubble, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.replyHeader}>
                  <Text style={[typography.labelMedium, { color: colors.onSurface, fontSize: 12 }]}>
                    {reply.author?.name || 'Unknown'}
                  </Text>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, fontSize: 11, marginLeft: spacing.xs }]}>
                    · {formatTimeAgo(reply.createdAt)}
                  </Text>
                </View>
                <Text style={[typography.bodyMedium, { color: colors.onSurface, fontSize: 13, marginTop: 2 }]}>
                  {reply.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Empty state */}
          {!loadingReplies && fetched && replies.length === 0 && !showCompose && (
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: spacing.md, marginBottom: spacing.sm }]}>
              No replies yet — start the conversation!
            </Text>
          )}

          {/* Reply CTA / Compose toggle */}
          {!showCompose && (
            <TouchableOpacity
              style={[styles.writeReplyRow, { borderTopColor: colors.outlineVariant }]}
              onPress={handleReplyButtonPress}
              activeOpacity={0.7}
            >
              <Avatar name="You" size={24} />
              <View style={[styles.composePlaceholder, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
                  Write a reply…
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Compose box */}
          {showCompose && (
            <View style={[styles.composeRow, { borderTopColor: colors.outlineVariant }]}>
              <Avatar name="You" size={28} />
              <View style={[styles.composeInputWrapper, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.composeInput, { color: colors.onSurface }]}
                  placeholder="Write a reply…"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  maxLength={500}
                  returnKeyType="default"
                  onBlur={() => {
                    if (!replyText.trim()) setShowCompose(false);
                  }}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: replyText.trim() ? colors.primary : colors.surfaceContainerLow },
                ]}
                onPress={handleSubmit}
                disabled={submitting || !replyText.trim()}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Send size={16} color={replyText.trim() ? '#fff' : colors.onSurfaceVariant} />
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  expandedContainer: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
  },
  loadingRow: {
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  threadLine: {
    position: 'absolute',
    left: 14,
    top: 30,
    bottom: -spacing.sm,
    width: 1.5,
  },
  replyBubble: {
    flex: 1,
    marginLeft: spacing.sm,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  writeReplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  composePlaceholder: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  composeInputWrapper: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  composeInput: {
    fontSize: 13,
    maxHeight: 100,
    minHeight: 32,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
