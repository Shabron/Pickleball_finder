/**
 * PlayerProfileCard — Compact player row for the Matchmaking feed
 *
 * Sized so at least 3 cards are visible on screen at once (no more than
 * ~150px tall), rather than the old near-full-screen card. Full details
 * (bio, etc.) live on the "View Profile" screen instead of here.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { MapPin, CircleCheck, Zap, Star } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../theme/spacing';
import { getSkillLevelLabel } from '../constants/skillLevels';
import Avatar from './common/Avatar';

export interface PlayerProfileData {
  id: string;
  name: string;
  level: string;
  /** GPS distance label (e.g. "1.2 mi"), only meaningful in Nearby search mode */
  distance: string;
  /** City/state, used as the location line when there's no GPS distance (state/zip search) */
  city?: string;
  state?: string;
  avatarUri?: string;
  matchScore?: number;
  playStyle?: string;
  age?: number;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  conversationId?: string;
  /** Approximate location, when known, for plotting on the nearby-players map */
  coordinate?: { latitude: number; longitude: number };
  avgRating?: number;
  ratingCount?: number;
  emailVerified?: boolean;
}

interface PlayerProfileCardProps {
  player: PlayerProfileData;
  onConnect?: () => void;
  onViewProfile?: () => void;
  style?: ViewStyle;
}

export default function PlayerProfileCard({
  player,
  onConnect,
  onViewProfile,
  style,
}: PlayerProfileCardProps) {
  const { colors, typography } = useTheme();

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const primaryPlayStyle = player.playStyle ? player.playStyle.split('/')[0].trim() : null;

  const cityState = [player.city, player.state].filter(Boolean).join(', ');
  const locationLabel =
    player.distance && player.distance !== 'Unknown'
      ? `${player.distance} away`
      : cityState || null;

  const scoreColor =
    (player.matchScore ?? 0) >= 85
      ? colors.success
      : (player.matchScore ?? 0) >= 70
      ? colors.secondary
      : colors.tertiary;

  const connectLabel =
    player.connectionStatus === 'accepted' ? 'Message' :
    player.connectionStatus === 'pending_sent' ? 'Requested' :
    player.connectionStatus === 'pending_received' ? 'Accept' :
    'Connect';

  return (
    <Animated.View
      style={[
        styles.cardShadowWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={[styles.leftAccentBar, { backgroundColor: colors.brandGreen }]} />

        <View style={styles.topRow}>
          <TouchableOpacity onPress={onViewProfile} activeOpacity={0.8}>
            <Avatar name={player.name} uri={player.avatarUri} size={sizes.avatarLarge} />
          </TouchableOpacity>

          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text
                style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '800' }]}
                numberOfLines={1}
              >
                {player.name}{player.age ? `, ${player.age}` : ''}
              </Text>
              {player.emailVerified && (
                <CircleCheck size={16} color={colors.secondary} style={{ marginLeft: 4 }} />
              )}
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.levelChip, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer, fontWeight: '700' }]}>
                  🏓 {getSkillLevelLabel(player.level)}
                </Text>
              </View>
              {!!player.ratingCount && (
                <View style={styles.ratingInline}>
                  <Star size={12} color={colors.tertiary} fill={colors.tertiary} />
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginLeft: 2 }]}>
                    {player.avgRating?.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {(locationLabel || primaryPlayStyle) && (
              <View style={styles.metaRow}>
                {locationLabel && (
                  <>
                    <MapPin size={13} color={colors.onSurfaceVariant} />
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 3 }]} numberOfLines={1}>
                      {locationLabel}
                    </Text>
                  </>
                )}
                {primaryPlayStyle && (
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: locationLabel ? 6 : 0 }]} numberOfLines={1}>
                    {locationLabel ? `· ${primaryPlayStyle}` : primaryPlayStyle}
                  </Text>
                )}
              </View>
            )}
          </View>

          {player.matchScore !== undefined && (
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '22' }]}>
              <Zap size={11} color={scoreColor} />
              <Text style={[typography.labelSmall, { color: scoreColor, fontWeight: '700', marginLeft: 2 }]}>
                {player.matchScore}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={onViewProfile}
            style={[styles.btnOutline, { borderColor: colors.primary }]}
            activeOpacity={0.75}
          >
            <Text style={[typography.labelMedium, { color: colors.primary, fontWeight: '700' }]}>
              View Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConnect}
            style={[
              styles.btnFilled,
              { backgroundColor: player.connectionStatus === 'pending_sent' ? colors.surfaceContainerHighest : colors.primary }
            ]}
            activeOpacity={0.8}
            disabled={player.connectionStatus === 'pending_sent'}
          >
            <Text style={[
              typography.labelMedium,
              { color: player.connectionStatus === 'pending_sent' ? colors.onSurfaceVariant : colors.onPrimary, fontWeight: '700' }
            ]}>
              {connectLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardShadowWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  leftAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  levelChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  ratingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnOutline: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFilled: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
