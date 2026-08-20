/**
 * ReportBlockSheet — Report / Block action sheet
 *
 * Slides up from the bottom, same pattern as FilterBottomSheet. Two entry
 * points from the "menu" step: Report (reason chips + optional details +
 * "also block" checkbox, pre-checked) and Block (simple confirm). Used from
 * both ChatThreadScreen and UserProfileScreen.
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
  Platform,
  Dimensions,
} from 'react-native';
import { X, Flag, Ban, Check, AlertTriangle, Star } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme/spacing';
import { safetyApi } from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

const REPORT_REASONS: { key: string; label: string }[] = [
  { key: 'harassment', label: 'Harassment or abuse' },
  { key: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { key: 'fake_profile', label: 'Fake profile' },
  { key: 'no_show', label: "Didn't show up to a match" },
  { key: 'safety_concern', label: 'Safety concern' },
  { key: 'other', label: 'Other' },
];

interface ReportBlockSheetProps {
  visible: boolean;
  userId: string;
  userName: string;
  context: 'profile' | 'chat';
  onClose: () => void;
  onBlocked?: () => void;
  /** When provided, shows a "Rate Player" row on the menu step above Report/Block. */
  onRate?: () => void;
}

type Mode = 'menu' | 'report' | 'blockConfirm';

export default function ReportBlockSheet({ visible, userId, userName, context, onClose, onBlocked, onRate }: ReportBlockSheetProps) {
  const { colors, typography } = useTheme();
  const [mode, setMode] = useState<Mode>('menu');
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMode('menu');
      setReason(null);
      setDetails('');
      setAlsoBlock(true);
      setError(null);
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
  }, [visible]);

  const handleSubmitReport = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      await safetyApi.reportUser({ reportedUserId: userId, reason, details: details.trim() || undefined, context, alsoBlock });
      if (alsoBlock) onBlocked?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBlock = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await safetyApi.blockUser(userId);
      onBlocked?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to block user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'report' ? 'Report User' : mode === 'blockConfirm' ? 'Block User' : userName;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.handle, { backgroundColor: colors.outline }]} />

        <View style={[styles.sheetHeader, { borderBottomColor: colors.outlineVariant }]}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700' }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {mode === 'menu' && (
            <View style={{ gap: spacing.sm }}>
              {onRate && (
                <TouchableOpacity
                  style={[styles.menuRow, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}
                  activeOpacity={0.75}
                  onPress={() => {
                    onClose();
                    onRate();
                  }}
                >
                  <Star size={20} color={colors.tertiary} />
                  <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600', marginLeft: spacing.md }]}>
                    Rate {userName}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.menuRow, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}
                activeOpacity={0.75}
                onPress={() => setMode('report')}
              >
                <Flag size={20} color={colors.onSurface} />
                <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600', marginLeft: spacing.md }]}>
                  Report {userName}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuRow, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}
                activeOpacity={0.75}
                onPress={() => setMode('blockConfirm')}
              >
                <Ban size={20} color={colors.error} />
                <Text style={[typography.bodyMedium, { color: colors.error, fontWeight: '600', marginLeft: spacing.md }]}>
                  Block {userName}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'report' && (
            <View>
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}>
                Why are you reporting {userName}?
              </Text>
              <View style={{ gap: spacing.sm }}>
                {REPORT_REASONS.map(r => {
                  const active = reason === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      activeOpacity={0.75}
                      onPress={() => setReason(r.key)}
                      style={[
                        styles.reasonRow,
                        { backgroundColor: active ? colors.primaryContainer : colors.surfaceContainerHigh, borderColor: active ? colors.primary : colors.outlineVariant },
                      ]}
                    >
                      <Text style={[typography.bodyMedium, { color: active ? colors.onPrimaryContainer : colors.onSurface, flex: 1, fontWeight: active ? '700' : '500' }]}>
                        {r.label}
                      </Text>
                      {active && (
                        <View style={[styles.reasonCheck, { backgroundColor: colors.primary }]}>
                          <Check size={12} color={colors.onPrimary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                Additional details (optional)
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Tell us what happened…"
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                numberOfLines={4}
                maxLength={1000}
                style={[styles.detailsInput, { color: colors.onSurface, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerHigh }]}
              />

              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.75}
                onPress={() => setAlsoBlock(v => !v)}
              >
                <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: alsoBlock ? colors.primary : 'transparent' }]}>
                  {alsoBlock && <Check size={14} color={colors.onPrimary} />}
                </View>
                <Text style={[typography.bodyMedium, { color: colors.onSurface, marginLeft: spacing.sm, flex: 1 }]}>
                  Also block this user
                </Text>
              </TouchableOpacity>

              {error && (
                <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.sm }]}>{error}</Text>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: reason ? colors.primary : colors.outlineVariant }]}
                activeOpacity={0.85}
                disabled={!reason || submitting}
                onPress={handleSubmitReport}
              >
                <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '800' }]}>
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'blockConfirm' && (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <AlertTriangle size={40} color={colors.error} />
              <Text style={[typography.bodyMedium, { color: colors.onSurface, textAlign: 'center', marginTop: spacing.lg }]}>
                {userName} won't be able to message you, and they won't appear in your search results anymore.
              </Text>
              {error && (
                <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.sm, textAlign: 'center' }]}>{error}</Text>
              )}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.error, marginTop: spacing.xl, width: '100%' }]}
                activeOpacity={0.85}
                disabled={submitting}
                onPress={handleConfirmBlock}
              >
                <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '800' }]}>
                  {submitting ? 'Blocking…' : `Block ${userName}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  reasonCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsInput: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    height: 54,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
