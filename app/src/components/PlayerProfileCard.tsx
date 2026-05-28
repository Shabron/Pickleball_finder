/**
 * PlayerProfileCard — Enlarged player card for Matchmaking feed
 *
 * Full-width, tall card (≈80% viewport height) inspired by Hinge/Bumble.
 * Features:
 *  - Large circular avatar with gradient ring border
 *  - Name, verified badge, skill level
 *  - Animated match compatibility progress bar
 *  - Play style chips, distance, 2-line bio
 *  - Big "Connect" + "View Profile" action buttons
 *  - Fade + slide-up entrance animation
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { MapPin, CircleCheck, Zap } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../theme/spacing';
import Avatar from './common/Avatar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PlayerProfileData {
  id: string;
  name: string;
  level: string;
  distance: string;
  avatarUri?: string;
  matchScore?: number;
  playStyle?: string;
  bio?: string;
  isOnline?: boolean;
  age?: number;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  conversationId?: string;
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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate match score bar
    if (player.matchScore) {
      Animated.timing(barAnim, {
        toValue: player.matchScore / 100,
        duration: 800,
        delay: 300,
        useNativeDriver: false,
      }).start();
    }
  }, []);

  const playStyles = player.playStyle ? player.playStyle.split('/').map(s => s.trim()) : [];

  const scoreColor =
    (player.matchScore ?? 0) >= 85
      ? colors.success
      : (player.matchScore ?? 0) >= 70
      ? colors.secondary
      : colors.tertiary;

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
      <View style={[styles.cardAccentWrapper, { backgroundColor: colors.surface }]}>
        {/* Green left accent bar */}
        <View style={[styles.leftAccentBar, { backgroundColor: colors.brandGreen }]} />
      {/* ─── Match Score Badge (top-right) ─── */}
      {player.matchScore !== undefined && (
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '22' }]}>
          <Zap size={13} color={scoreColor} />
          <Text style={[typography.labelSmall, { color: scoreColor, fontWeight: '700', marginLeft: 3 }]}>
            {player.matchScore}% Match
          </Text>
        </View>
      )}

      {/* ─── Online badge (top-left) ─── */}
      {player.isOnline && (
        <View style={[styles.onlineBadge, { backgroundColor: colors.success + '22' }]}>
          <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
          <Text style={[typography.labelSmall, { color: colors.success, fontWeight: '600' }]}>Online</Text>
        </View>
      )}

      {/* ─── Avatar with decorative ring ─── */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarOuterRing, { borderColor: colors.primary + '40' }]}>
          <View style={[styles.avatarInnerRing, { borderColor: colors.tertiary + '60' }]}>
            <TouchableOpacity onPress={onViewProfile} activeOpacity={0.8}>
              <Avatar
                name={player.name}
                uri={player.avatarUri}
                size={sizes.avatarXLarge + 40}
                showOnline={player.isOnline}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Name + Verified + Age ─── */}
      <View style={styles.nameRow}>
        <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: '800' }]}>
          {player.name}
        </Text>
        {player.age && (
          <Text style={[typography.headlineSmall, { color: colors.onSurfaceVariant, fontWeight: '400', marginLeft: 6 }]}>
            {player.age}
          </Text>
        )}
        <CircleCheck size={20} color={colors.secondary} style={{ marginLeft: 6 }} />
      </View>

      {/* ─── Skill Level ─── */}
      <View style={[styles.levelChip, { backgroundColor: colors.primaryContainer }]}>
        <Text style={[typography.labelMedium, { color: colors.onPrimaryContainer, fontWeight: '700' }]}>
          🏓 Level {player.level}
        </Text>
      </View>

      {/* ─── Match score bar ─── */}
      {player.matchScore !== undefined && (
        <View style={styles.barSection}>
          <View style={styles.barLabelRow}>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Compatibility</Text>
            <Text style={[typography.labelSmall, { color: scoreColor, fontWeight: '700' }]}>
              {player.matchScore}%
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  backgroundColor: scoreColor,
                  width: barAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* ─── Distance ─── */}
      <View style={styles.distanceRow}>
        <MapPin size={15} color={colors.onSurfaceVariant} />
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: 5 }]}>
          {player.distance} away
        </Text>
      </View>

      {/* ─── Play Style Chips ─── */}
      {playStyles.length > 0 && (
        <View style={styles.chipsRow}>
          {playStyles.map((style) => (
            <View
              key={style}
              style={[styles.chip, { backgroundColor: colors.secondaryContainer }]}
            >
              <Text style={[typography.labelSmall, { color: colors.onSecondaryContainer, fontWeight: '600' }]}>
                {style}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ─── Bio ─── */}
      {player.bio && (
        <View style={[styles.bioBox, { backgroundColor: colors.surfaceDim }]}>
          <Text
            style={[typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 22 }]}
            numberOfLines={3}
          >
            {player.bio}
          </Text>
        </View>
      )}

      {/* ─── Action Buttons ─── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={onViewProfile}
          style={[styles.btnOutline, { borderColor: colors.primary }]}
          activeOpacity={0.75}
        >
          <Text style={[typography.labelLarge, { color: colors.primary, fontWeight: '700' }]}>
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
            typography.labelLarge,
            { color: player.connectionStatus === 'pending_sent' ? colors.onSurfaceVariant : colors.onPrimary, fontWeight: '700' }
          ]}>
            {player.connectionStatus === 'accepted' ? '💬 Message' :
             player.connectionStatus === 'pending_sent' ? '⏳ Requested' :
             player.connectionStatus === 'pending_received' ? '✅ Accept Request' :
             '👋 Connect'}
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
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xxl,
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  cardAccentWrapper: {
    width: '100%',
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    position: 'relative',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  leftAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  scoreBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  onlineBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  avatarSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  avatarOuterRing: {
    borderWidth: 3,
    borderRadius: 9999,
    padding: 5,
  },
  avatarInnerRing: {
    borderWidth: 2,
    borderRadius: 9999,
    padding: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  barSection: {
    width: '100%',
    marginBottom: spacing.md,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bioBox: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  btnOutline: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFilled: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
