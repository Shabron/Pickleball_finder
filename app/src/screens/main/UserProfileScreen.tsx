/**
 * UserProfileScreen — View another player's full profile
 *
 * Shown when tapping "View Profile" from the Matchmaking feed.
 * Displays the player's photo, stats, bio, play style, and
 * a prominent "👋 Connect" CTA.
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  MessageCircle,
  CircleCheck,
  Zap,
  Trophy,
  Users,
  Calendar,
  ChevronLeft,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = SCREEN_WIDTH * 0.38;

import { profileApi, messageApi } from '../../services/api';
import { API_BASE_URL } from '@env';

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProfileScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const userId = route?.params?.userId;
  
  const [player, setPlayer] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        if (!userId) return;
        const res = await profileApi.getProfileByUserId(userId);
        if (res.success && res.data) {
          const p = res.data;
          setPlayer({
            id: p.user?._id || userId,
            name: p.user?.name || 'Unknown',
            fullName: p.user?.name || 'Unknown',
            age: p.ageRange || 'N/A',
            level: p.skillLevel || 'N/A',
            distance: 'Nearby', // Mocked for now
            matchScore: 85, // Mocked for now
            playStyle: Array.isArray(p.playStyle) ? p.playStyle : (p.playStyle ? [p.playStyle] : []),
            bio: p.bio || 'No bio provided.',
            location: `${p.city ? p.city + ', ' : ''}${p.state || ''}`,
            memberSince: new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
            isOnline: true,
            avatarUri: p.avatar ? `${API_BASE_URL.replace('/api', '')}${p.avatar}` : undefined,
            stats: { matches: 0, wins: 0, partners: 0 },
            connectionStatus: p.connectionStatus || 'none',
            conversationId: p.conversationId,
          });
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!player) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(barAnim, {
        toValue: (player.matchScore ?? 0) / 100,
        duration: 900,
        delay: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [player, fadeAnim, barAnim]);

  const handleConnect = async () => {
    try {
      if (player.connectionStatus === 'accepted') {
        navigation.navigate('ChatThread', {
          conversationId: player.conversationId,
          userId: player.id,
          name: player.fullName,
        });
        return;
      }

      if (player.connectionStatus === 'pending_received' && player.conversationId) {
        const res = await messageApi.acceptRequest(player.conversationId);
        if (res.success) {
          setPlayer(prev => ({ ...prev, connectionStatus: 'accepted' }));
          navigation.navigate('ChatThread', {
            conversationId: player.conversationId,
            userId: player.id,
            name: player.fullName,
          });
        }
        return;
      }

      if (player.connectionStatus === 'pending_sent') {
        return; // Already sent, do nothing
      }

      // Default: Send an automated intro message
      const res = await messageApi.sendMessage(
        player.id,
        "Hi! I saw you on Pickleball Finder. Let's play!"
      );
      if (res.success) {
        setPlayer(prev => ({ ...prev, connectionStatus: 'pending_sent', conversationId: res.conversationId }));
      } else {
        alert('Failed to send message: ' + res.message);
      }
    } catch (error: any) {
      console.error('Failed to connect:', error);
      alert('Failed to connect: ' + error.message);
    }
  };

  if (loading || !player) {
    return (
      <ScreenWrapper>
        <Header showLogo title="Senior Pickleball" showBack onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const scoreColor =
    (player.matchScore ?? 0) >= 85
      ? colors.success
      : (player.matchScore ?? 0) >= 70
      ? colors.secondary
      : colors.tertiary;

  return (
    <ScreenWrapper>
      <Header
        showLogo
        title="Senior Pickleball"
        showBack
        onBack={() => navigation.goBack()}
      />

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero card ─── */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          {/* Online badge */}
          {player.isOnline && (
            <View style={[styles.onlineBadge, { backgroundColor: colors.success + '22' }]}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[typography.labelSmall, { color: colors.success, fontWeight: '700' }]}>
                Online Now
              </Text>
            </View>
          )}

          {/* Match score badge */}
          {player.matchScore && (
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '22' }]}>
              <Zap size={13} color={scoreColor} />
              <Text style={[typography.labelSmall, { color: scoreColor, fontWeight: '700', marginLeft: 3 }]}>
                {player.matchScore}% Match
              </Text>
            </View>
          )}

          {/* Avatar with double ring */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarOuterRing, { borderColor: colors.primary + '40' }]}>
              <View style={[styles.avatarInnerRing, { borderColor: colors.tertiary + '60' }]}>
                <Avatar name={player.fullName} uri={player.avatarUri} size={AVATAR_SIZE} />
              </View>
            </View>
          </View>

          {/* Name + age + verified */}
          <View style={styles.nameRow}>
            <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: '800' }]}>
              {player.fullName}
            </Text>
            {player.age && player.age !== 'N/A' && (
              <Text style={[typography.headlineSmall, { color: colors.onSurfaceVariant, fontWeight: '400', marginLeft: 6 }]}>
                {player.age}
              </Text>
            )}
            <CircleCheck size={20} color={colors.secondary} style={{ marginLeft: 6 }} />
          </View>

          {/* Skill level */}
          <View style={[styles.levelChip, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[typography.labelMedium, { color: colors.onPrimaryContainer, fontWeight: '700' }]}>
              🏓 Level {player.level}
            </Text>
          </View>

          {/* Compatibility bar */}
          {player.matchScore && (
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
                      width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Distance + location */}
          <View style={styles.locationRow}>
            <MapPin size={15} color={colors.onSurfaceVariant} />
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: 5 }]}>
              {player.distance} · {player.location}
            </Text>
          </View>

          {/* Play style chips */}
          <View style={styles.chipsRow}>
            {player.playStyle.map((style: string) => (
              <View key={style} style={[styles.chip, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[typography.labelSmall, { color: colors.onSecondaryContainer, fontWeight: '600' }]}>
                  {style}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Stats ─── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Matches', value: player.stats.matches, icon: <Trophy size={18} color={colors.tertiary} />, color: colors.tertiary },
            { label: 'Wins', value: player.stats.wins, icon: <Zap size={18} color={colors.success} />, color: colors.success },
            { label: 'Partners', value: player.stats.partners, icon: <Users size={18} color={colors.secondary} />, color: colors.secondary },
          ].map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              {stat.icon}
              <Text style={[typography.headlineMedium, { color: stat.color, fontWeight: '800', marginTop: 4 }]}>
                {stat.value}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── About ─── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', marginBottom: spacing.sm }]}>
            About
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 24 }]}>
            {player.bio}
          </Text>
        </View>

        {/* ─── Member since ─── */}
        <View style={[styles.memberRow, { backgroundColor: colors.surfaceDim }]}>
          <Calendar size={16} color={colors.onSurfaceVariant} />
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 8 }]}>
            Member since {player.memberSince}
          </Text>
        </View>

        {/* ─── Actions ─── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btnMessage, { borderColor: colors.primary }]}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ChatThread', { userId, name: player.fullName, conversationId: player.conversationId })}
          >
            <MessageCircle size={18} color={colors.primary} />
            <Text style={[typography.labelLarge, { color: colors.primary, fontWeight: '700', marginLeft: 6 }]}>
              Message
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnConnect,
              { backgroundColor: player.connectionStatus === 'pending_sent' ? colors.surfaceContainerHighest : colors.primary }
            ]}
            activeOpacity={0.8}
            onPress={handleConnect}
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
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
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
  avatar: {
    resizeMode: 'cover',
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnMessage: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnConnect: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D628B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
