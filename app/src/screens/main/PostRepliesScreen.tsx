/**
 * PostRepliesScreen — Public reply thread for a post
 *
 * - Anyone can view replies (public)
 * - Authenticated users can post replies
 * - Compact post summary shown at top
 * - Replies ordered oldest-first
 * - Compose bar pinned at bottom
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CornerUpLeft, Send } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import { postApi, getToken } from '../../services/api';
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

export default function PostRepliesScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const { postId, postTitle, postAuthorName, postContent } = route?.params || {};

  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchReplies = useCallback(async () => {
    try {
      const res = await postApi.getReplies(postId);
      setReplies(res.data.replies || []);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const handleSubmit = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    const token = await getToken();
    if (!token) {
      Alert.alert('Sign in required', 'Please log in to reply to this post.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await postApi.addReply(postId, trimmed);
      if (res.success) {
        setReplies(prev => [...prev, res.data]);
        setReplyText('');
        // Scroll to bottom after a short delay to let the list update
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        Alert.alert('Error', res.message || 'Failed to post reply');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReply = ({ item }: { item: any }) => (
    <View style={[styles.replyRow, { borderBottomColor: colors.outlineVariant }]}>
      <Avatar name={item.author?.name || '?'} size={38} />
      <View style={styles.replyBody}>
        <View style={styles.replyMeta}>
          <Text style={[typography.labelMedium, { color: colors.onSurface }]}>
            {item.author?.name || 'Unknown'}
          </Text>
          <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        <Text style={[typography.bodyMedium, { color: colors.onSurface, marginTop: 2 }]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <Header
        title="Replies"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ─── Post Summary ─── */}
        <View style={[styles.postSummary, { backgroundColor: colors.primaryContainer }]}>
          <View style={styles.postSummaryInner}>
            <CornerUpLeft size={16} color={colors.onPrimaryContainer} style={{ marginRight: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text
                style={[typography.labelMedium, { color: colors.onPrimaryContainer }]}
                numberOfLines={1}
              >
                {postAuthorName} · {postTitle}
              </Text>
              <Text
                style={[typography.bodySmall, { color: colors.onPrimaryContainer, opacity: 0.8 }]}
                numberOfLines={2}
              >
                {postContent}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Reply List ─── */}
        {loadingReplies ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={replies}
            keyExtractor={(item) => item._id}
            renderItem={renderReply}
            contentContainerStyle={replies.length === 0 ? styles.emptyContainer : styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyInner}>
                <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                  No replies yet.{'\n'}Be the first to reply! 🏓
                </Text>
              </View>
            }
          />
        )}

        {/* ─── Compose Bar ─── */}
        <View
          style={[
            styles.composeBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.outlineVariant,
            },
          ]}
        >
          <TextInput
            style={[
              styles.composeInput,
              {
                backgroundColor: colors.surfaceContainerLow,
                color: colors.onSurface,
                borderColor: colors.outlineVariant,
              },
            ]}
            placeholder="Write a reply…"
            placeholderTextColor={colors.onSurfaceVariant}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  replyText.trim().length > 0 ? colors.primary : colors.surfaceContainerLow,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting || replyText.trim().length === 0}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send
                size={20}
                color={replyText.trim().length > 0 ? '#fff' : colors.onSurfaceVariant}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  postSummary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  postSummaryInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  replyBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  replyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  composeInput: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
