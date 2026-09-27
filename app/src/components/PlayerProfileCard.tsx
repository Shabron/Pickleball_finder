/**
 * PlayerProfileCard — compact player row (v2)
 *
 *  - Whole card opens the profile (no separate "View Profile" button)
 *  - One context-aware action: Connect / Requested / Accept / Message
 *  - Match % replaced by a plain-language reason ("Same level", …)
 *  - White card, shadow only; press feedback via scale
 */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated, ViewStyle } from 'react-native';
import { MapPin, CircleCheck, Star, Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme/spacing';
import { getSkillLevelLabel, PLAY_STYLE_LABELS } from '../constants/skillLevels';
import { matchReason } from '../utils/playerHelpers';
import Avatar from './common/Avatar';

export interface PlayerProfileData {
  id: string;
  name: string;
  level: string;
  /** GPS distance label (e.g. "1.2 mi"), or 'Unknown' */
  distance: string;
  /** Raw distance in miles, for sectioning/sorting */
  distanceMi?: number;
  city?: string;
  state?: string;
  avatarUri?: string;
  matchScore?: number;
  playStyle?: string;
  age?: number;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  conversationId?: string;
  coordinate?: { latitude: number; longitude: number };
  avgRating?: number;
  ratingCount?: number;
  emailVerified?: boolean;
}

interface Props {
  player: PlayerProfileData;
  /** Signed-in user's own profile, used to explain why this is a good match */
  me?: { skillLevel?: string; playStyle?: string };
  onConnect?: () => void;
  onViewProfile?: () => void;
  style?: ViewStyle;
}

const STYLE_LABELS = PLAY_STYLE_LABELS;

export default function PlayerProfileCard({ player, me, onConnect, onViewProfile, style }: Props) {
  const { colors, typography } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const skillTone: Record<string, { bg: string; fg: string }> = {
    beginner: { bg: colors.brandGreenContainer, fg: colors.onBrandGreenContainer },
    lowIntermediate: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
    highIntermediate: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
    advanced: { bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer },
    professional: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  };
  const tone = skillTone[player.level] || { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant };

  const playStyleLabel = player.playStyle ? STYLE_LABELS[player.playStyle.toLowerCase()] : undefined;
  const cityState = [player.city, player.state].filter(Boolean).join(', ');
  const hasDistance = !!player.distance && player.distance !== 'Unknown';
  const reason = matchReason(player, me);

  const status = player.connectionStatus || 'none';
  const cta =
    status === 'accepted' ? { label: 'Message', filled: true } :
    status === 'pending_sent' ? { label: 'Requested', filled: false } :
    status === 'pending_received' ? { label: 'Accept', filled: true } :
    { label: 'Connect', filled: true };

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Animated.View style={[styles.shadowWrap, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onViewProfile}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.card, { backgroundColor: colors.surface }]}
      >
        <Avatar name={player.name} uri={player.avatarUri} size={52} />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[typography.titleSmall, { color: colors.onSurface, flexShrink: 1 }]} numberOfLines={1}>
              {player.name.trim()}
            </Text>
            {player.emailVerified && <CircleCheck size={14} color={colors.secondary} style={{ marginLeft: 4 }} />}
            {!!player.ratingCount && (
              <View style={styles.rating}>
                <Star size={11} color={colors.tertiary} fill={colors.tertiary} />
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginLeft: 2 }]}>
                  {player.avgRating?.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.chip, { backgroundColor: tone.bg }]}>
              <Text style={[typography.labelSmall, { color: tone.fg }]} numberOfLines={1}>
                {getSkillLevelLabel(player.level)}
              </Text>
            </View>
            {playStyleLabel && (
              <View style={[styles.chip, { backgroundColor: colors.surfaceContainer, marginLeft: 6 }]}>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {playStyleLabel}
                </Text>
              </View>
            )}
          </View>

          {(hasDistance || !!cityState) && (
            <View style={styles.row}>
              <MapPin size={12} color={colors.onSurfaceVariant} />
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 3, flexShrink: 1 }]} numberOfLines={1}>
                {hasDistance ? <Text style={{ color: colors.primary, fontWeight: '600' }}>{player.distance}</Text> : null}
                {hasDistance && cityState ? ' · ' : ''}
                {cityState}
              </Text>
            </View>
          )}

          {reason && (
            <View style={styles.row}>
              <Sparkles size={12} color={colors.brandGreen} />
              <Text style={[typography.labelSmall, { color: colors.brandGreen, marginLeft: 3 }]} numberOfLines={1}>
                {reason}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onConnect}
          disabled={status === 'pending_sent'}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.cta, { backgroundColor: cta.filled ? colors.primary : colors.surfaceContainer }]}
        >
          <Text style={[typography.labelMedium, { color: cta.filled ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: '700' }]}>
            {cta.label}
          </Text>
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  cta: {
    minWidth: 92,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
