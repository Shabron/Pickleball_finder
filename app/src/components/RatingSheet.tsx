/**
 * RatingSheet — Rate a player after connecting
 *
 * Star selector (1-5) + optional tag chips + optional comment. Upserts via
 * ratingApi.rateUser — rating again updates the existing rating. Only usable
 * from an accepted chat thread (enforced by the caller and the backend).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { X, Star, Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme/spacing';
import { ratingApi } from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

const RATING_TAGS = ['Great partner', 'Reliable', 'Skilled', 'Good communicator', 'No-show', 'Poor communication'];

interface RatingSheetProps {
  visible: boolean;
  userId: string;
  userName: string;
  conversationId?: string;
  onClose: () => void;
  onRated?: () => void;
}

export default function RatingSheet({ visible, userId, userName, conversationId, onClose, onRated }: RatingSheetProps) {
  const { colors, typography } = useTheme();
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setError(null);
      setLoading(true);
      ratingApi
        .getRating(userId)
        .then((res) => {
          if (res.success && res.myRating) {
            setStars(res.myRating.stars || 0);
            setTags(res.myRating.tags || []);
            setComment(res.myRating.comment || '');
          } else {
            setStars(0);
            setTags([]);
            setComment('');
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, userId]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (!stars) return;
    setSubmitting(true);
    setError(null);
    try {
      await ratingApi.rateUser(userId, { stars, tags, comment: comment.trim() || undefined, conversationId });
      onRated?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.handle, { backgroundColor: colors.outline }]} />

        <View style={[styles.sheetHeader, { borderBottomColor: colors.outlineVariant }]}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700' }]}>Rate {userName}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {!loading && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setStars(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                  <Star size={38} color={colors.tertiary} fill={n <= stars ? colors.tertiary : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
              What stood out? (optional)
            </Text>
            <View style={styles.chipRow}>
              {RATING_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surfaceContainerHigh, borderColor: active ? colors.primary : colors.outline }]}
                  >
                    {active && <Check size={12} color={colors.onPrimary} style={{ marginRight: 4 }} />}
                    <Text style={[typography.labelMedium, { color: active ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: active ? '700' : '500' }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
              Comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="How was playing with them?"
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              maxLength={300}
              style={[styles.commentInput, { color: colors.onSurface, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerHigh }]}
            />

            {error && <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.sm }]}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: stars ? colors.primary : colors.outlineVariant }]}
              activeOpacity={0.85}
              disabled={!stars || submitting}
              onPress={handleSubmit}
            >
              <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '800' }]}>
                {submitting ? 'Saving…' : 'Submit Rating'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  commentInput: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 54,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
