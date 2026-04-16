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
  Image,
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
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = SCREEN_WIDTH * 0.38;

// ─── Mock data keyed by userId ─────────────────────────────────────────────

const USER_PROFILES: Record<string, any> = {
  '1': {
    name: 'Arthur S.',
    fullName: 'Arthur Stevenson',
    age: 67,
    level: '3.0',
    distance: '1.2 mi',
    matchScore: 92,
    playStyle: ['Doubles', 'Mixed'],
    bio: 'Retired teacher who loves the game. Looking for a consistent doubles partner for weekend mornings at Riverside courts. I believe in friendly competition and always enjoy a good laugh between points!',
    location: 'Riverside Courts, FL',
    memberSince: 'March 2024',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/men/67.jpg',
    stats: { matches: 24, wins: 18, partners: 6 },
  },
  '2': {
    name: 'Betty L.',
    fullName: 'Betty Lawson',
    age: 63,
    level: '3.5',
    distance: '2.5 mi',
    matchScore: 85,
    playStyle: ['Singles', 'Doubles'],
    bio: 'Former tennis player transitioning to pickleball. I play 4× a week and love competitive but friendly matches. Net play is my specialty — dinking with the best of them!',
    location: 'Sunrise Park, FL',
    memberSince: 'January 2024',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/women/52.jpg',
    stats: { matches: 31, wins: 22, partners: 9 },
  },
  '3': {
    name: 'Clara M.',
    fullName: 'Clara Monroe',
    age: 71,
    level: '2.5',
    distance: '0.8 mi',
    matchScore: 78,
    playStyle: ['Doubles'],
    bio: 'Just started playing 6 months ago. Looking for patient partners who enjoy the social side of the game. I am still learning but improving every week!',
    location: 'Community Center, FL',
    memberSince: 'October 2024',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/women/71.jpg',
    stats: { matches: 8, wins: 3, partners: 4 },
  },
  '4': {
    name: 'David K.',
    fullName: 'David Kim',
    age: 59,
    level: '4.0',
    distance: '3.1 mi',
    matchScore: 65,
    playStyle: ['Singles'],
    bio: 'Competitive player training for local tournaments. I have a strong baseline game and am working on my third-shot drop. Looking for strong singles opponents to sharpen my game.',
    location: 'Sports Complex, FL',
    memberSince: 'June 2023',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/men/44.jpg',
    stats: { matches: 58, wins: 41, partners: 3 },
  },
  '5': {
    name: 'Eleanor R.',
    fullName: 'Eleanor Reynolds',
    age: 68,
    level: '3.0',
    distance: '1.8 mi',
    matchScore: 88,
    playStyle: ['Doubles', 'Any'],
    bio: 'Love the camaraderie that comes with pickleball! Active in the senior community and always up for a match. Let\'s hit some dinks together!',
    location: 'Lakeview Courts, FL',
    memberSince: 'February 2024',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/women/68.jpg',
    stats: { matches: 19, wins: 13, partners: 7 },
  },
  '6': {
    name: 'Frank T.',
    fullName: 'Frank Torres',
    age: 74,
    level: '2.0',
    distance: '4.0 mi',
    matchScore: 72,
    playStyle: ['Doubles'],
    bio: 'New to the sport but very enthusiastic. My grandchildren got me into it — best decision ever! Looking for patient, encouraging partners.',
    location: 'Westside Park, FL',
    memberSince: 'December 2024',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/men/74.jpg',
    stats: { matches: 4, wins: 1, partners: 2 },
  },
};

const DEFAULT_PROFILE = USER_PROFILES['1'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProfileScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const userId = route?.params?.userId ?? '1';
  const player = USER_PROFILES[userId] ?? DEFAULT_PROFILE;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(barAnim, {
        toValue: (player.matchScore ?? 0) / 100,
        duration: 900,
        delay: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

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
                <Image
                  source={{ uri: player.avatarUri }}
                  style={[styles.avatar, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}
                />
              </View>
            </View>
          </View>

          {/* Name + age + verified */}
          <View style={styles.nameRow}>
            <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: '800' }]}>
              {player.fullName}
            </Text>
            <Text style={[typography.headlineSmall, { color: colors.onSurfaceVariant, fontWeight: '400', marginLeft: 6 }]}>
              {player.age}
            </Text>
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
            onPress={() => navigation.navigate('ChatThread', { userId, name: player.fullName })}
          >
            <MessageCircle size={18} color={colors.primary} />
            <Text style={[typography.labelLarge, { color: colors.primary, fontWeight: '700', marginLeft: 6 }]}>
              Message
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnConnect, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>
              👋 Connect
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
