/**
 * ProfileScreen — v3 (compact redesign)
 *
 * Profile card changes vs v2:
 *  - Removed oversized cover band — replaced with a slim 4px primary accent
 *    strip at the top of the card
 *  - Avatar sits LEFT in a horizontal row with name + email to the right
 *    (no photo → Avatar component shows initials automatically, e.g. "P")
 *  - Edit Profile button is compact and sits inside the card, right-aligned
 *  - Chips row below the row, wraps naturally
 *  - Rating shows inline only if user has been rated
 *  - Stat boxes keep the animated counter with a coloured top-accent border
 *  - Menu groups and action row unchanged from v2
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@env';
import { profileApi, authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  LogOut,
  Info,
  ChevronRight,
  Bell,
  Shield,
  FileText,
  Trash2,
  Bookmark,
  Ban,
  BadgeCheck,
  Mail,
  Star,
  Users,
  ClipboardList,
  Pencil,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

// ─── Animated counting stat tile (tappable) ───────────────────────────────────
function AnimatedStat({
  value,
  label,
  color,
  tint,
  icon,
  onPress,
}: {
  value: number;
  label: string;
  color: string;
  tint: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { colors, typography } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: value, duration: 700, useNativeDriver: false }).start();
    const id = anim.addListener(({ value: v }) => setDisplayed(Math.round(v)));
    return () => anim.removeListener(id);
  }, [value]);

  // NOTE: background must be fully opaque — Android draws `elevation` shadows
  // *through* translucent fills, which produced the grey boxes.
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[statStyles.box, { backgroundColor: colors.surface }]}
    >
      <View style={[statStyles.iconRing, { backgroundColor: tint }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: '700' }]}>
          {displayed}
        </Text>
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Inline star rating ───────────────────────────────────────────────────────
function StarRating({ avg, count }: { avg: number; count: number }) {
  const { colors, typography } = useTheme();
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          color="#D69E2E"
          fill={s <= Math.round(avg) ? '#D69E2E' : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
      <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginLeft: 4 }]}>
        {avg.toFixed(1)} · {count} {count === 1 ? 'rating' : 'ratings'}
      </Text>
    </View>
  );
}
const starStyles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 } });

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const { logout, user } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [postCount, setPostCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const cardAnim = useRef(new Animated.Value(0)).current;

  const formatSkillLevel = (level: string) => ({
    beginner: 'Beginner',
    lowIntermediate: 'Low Intermediate',
    highIntermediate: 'High Intermediate',
    advanced: 'Advanced',
    professional: 'Pro',
  }[level] || level);

  const formatPlayStyle = (style: string) => ({
    singles: 'Singles',
    doubles: 'Doubles',
    mixed: 'Mixed',
    any: 'Any Style',
  }[style] || style);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cardAnim.setValue(0);
      profileApi
        .getProfile()
        .then((res) => {
          setProfileData(res.data);
          setUnreadCount(res.unreadNotificationsCount || 0);
          setPostCount(res.postCount ?? 0);
          setConnectionCount(res.connectionCount ?? 0);
          Animated.timing(cardAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        })
        .catch((err) => console.error('Failed to load profile', err))
        .finally(() => setLoading(false));
    }, [])
  );

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error('Logout failed', err); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This permanently deletes your account and all data and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await authApi.deleteAccount();
              await logout();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const avatarUrl = profileData?.avatar
    ? `${API_BASE_URL.replace(/\/api$/, '')}${profileData.avatar}`
    : undefined;
  // No photo → Avatar component automatically shows name initials (e.g. "P" for Pankaj)
  const userName = profileData?.user?.name || user?.name || 'Pickleball Player';
  const userEmail = profileData?.user?.email || user?.email || '';
  const hasRating = (profileData?.ratingCount ?? 0) > 0;

  // ─── Menu groups ──────────────────────────────────────────────────────────
  const menuGroups: Array<
    Array<{ icon: React.ReactNode; iconBg: string; label: string; onPress: () => void; badge?: number }>
  > = [
    [
      {
        icon: <Bookmark size={sizes.iconSmall} color={colors.primary} />,
        iconBg: colors.primaryContainer,
        label: 'Saved Posts',
        onPress: () => navigation.navigate('SavedPosts'),
      },
      {
        icon: <Bell size={sizes.iconSmall} color={colors.tertiary} />,
        iconBg: colors.tertiaryContainer,
        label: 'Notifications',
        onPress: () => navigation.navigate('Notifications'),
        badge: unreadCount > 0 ? unreadCount : undefined,
      },
      {
        icon: <Settings size={sizes.iconSmall} color={colors.onSurfaceVariant} />,
        iconBg: colors.surfaceContainerHigh,
        label: 'Notification Settings',
        onPress: () => navigation.navigate('NotificationSettings'),
      },
      {
        icon: <Ban size={sizes.iconSmall} color={colors.error} />,
        iconBg: colors.errorContainer,
        label: 'Blocked Users',
        onPress: () => navigation.navigate('BlockedUsers'),
      },
    ],
    [
      profileData?.user?.emailVerified
        ? {
            icon: <BadgeCheck size={sizes.iconSmall} color={colors.success} />,
            iconBg: '#E8F5E9',
            label: 'Email Verified',
            onPress: () => {},
          }
        : {
            icon: <Mail size={sizes.iconSmall} color={colors.tertiary} />,
            iconBg: colors.tertiaryContainer,
            label: 'Verify Email',
            onPress: () => navigation.navigate('VerifyEmail'),
          },
      {
        icon: <Shield size={sizes.iconSmall} color={colors.primary} />,
        iconBg: colors.primaryContainer,
        label: 'Privacy Policy',
        onPress: () => navigation.navigate('PrivacyPolicyInfo'),
      },
      {
        icon: <FileText size={sizes.iconSmall} color={colors.secondary} />,
        iconBg: colors.secondaryContainer,
        label: 'Terms & Conditions',
        onPress: () => navigation.navigate('TermsInfo'),
      },
      {
        icon: <Info size={sizes.iconSmall} color={colors.onSurfaceVariant} />,
        iconBg: colors.surfaceContainerHigh,
        label: 'About the App',
        onPress: () => navigation.navigate('About'),
      },
    ],
  ];

  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ─── Profile card ─────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.profileCard,
              { backgroundColor: colors.surface, opacity: cardAnim },
            ]}
          >
            {/* Horizontal row: avatar left, text right */}
            <View style={styles.identityRow}>
              {/*
               * Avatar: shows user photo if uploaded.
               * No photo → Avatar component automatically renders name initials
               * (e.g. "P" for Pankaj) in a colored circle — no blank space.
               */}
              <Avatar name={userName} uri={avatarUrl} size={72} />

              <View style={styles.identityText}>
                <Text
                  style={[typography.titleLarge, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {userName}
                </Text>
                <Text
                  style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}
                  numberOfLines={1}
                >
                  {userEmail}
                </Text>
                {hasRating && (
                  <StarRating avg={profileData.avgRating} count={profileData.ratingCount} />
                )}
              </View>

              {/* Compact edit icon button — top-right corner */}
              <TouchableOpacity
                style={[styles.editIconBtn, { backgroundColor: colors.primaryContainer }]}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.7}
              >
                <Pencil size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Chip row below the identity row */}
            {(profileData?.skillLevel || profileData?.state || profileData?.playStyle) && (
              <View style={styles.chipRow}>
                {profileData?.skillLevel && (
                  <Badge label={formatSkillLevel(profileData.skillLevel)} variant="primary" size="small" />
                )}
                {(profileData?.city || profileData?.state) && (
                  <Badge
                    label={profileData.city ? `${profileData.city}, ${profileData.state}` : profileData.state}
                    variant="secondary"
                    size="small"
                  />
                )}
                {profileData?.playStyle && (
                  <Badge label={formatPlayStyle(profileData.playStyle)} variant="tertiary" size="small" />
                )}
              </View>
            )}
          </Animated.View>

          {/* ─── Real stats ───────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <AnimatedStat
              value={postCount}
              label="My Posts"
              color={colors.primary}
              tint={colors.primaryContainer}
              icon={<ClipboardList size={20} color={colors.primary} />}
              onPress={() => navigation.navigate('My Posts')}
            />
            <AnimatedStat
              value={connectionCount}
              label="Connections"
              color={colors.brandGreen}
              tint={colors.brandGreenContainer}
              icon={<Users size={20} color={colors.brandGreen} />}
              onPress={() => navigation.navigate('Messages')}
            />
          </View>

          {/* ─── Menu blocks ──────────────────────────────────────────── */}
          {menuGroups.map((group, gi) => (
            <View
              key={gi}
              style={[styles.menuBlock, { backgroundColor: colors.surface }]}
            >
              {group.map((item, ii) => (
                <React.Fragment key={ii}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={item.onPress}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: item.iconBg }]}>
                      {item.icon}
                    </View>
                    <Text style={[typography.bodyLarge, { color: colors.onSurface, flex: 1, fontWeight: '500' }]}>
                      {item.label}
                    </Text>
                    {item.badge != null && (
                      <View style={[styles.badgePill, { backgroundColor: colors.tertiary }]}>
                        <Text style={[typography.labelSmall, { color: colors.onTertiary, fontSize: 10 }]}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                    <ChevronRight size={18} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  {ii < group.length - 1 && (
                    <View
                      style={[
                        styles.innerDivider,
                        {
                          backgroundColor: colors.outlineVariant,
                          marginLeft: spacing.lg + 38 + spacing.md,
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
          ))}

          {/* ─── Log out / Delete ─────────────────────────────────────── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.outline }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={17} color={colors.primary} />
              <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: spacing.sm }]}>
                Log Out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.errorContainer, backgroundColor: colors.errorContainer }]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Trash2 size={17} color={colors.error} />
              <Text style={[typography.labelLarge, { color: colors.error, marginLeft: spacing.sm }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              typography.labelSmall,
              { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.massive },
            ]}
          >
            Senior Pickleball Partners v1.0.0
          </Text>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: spacing.massive },

  // ─── Profile card
  profileCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  identityText: {
    flex: 1,
  },
  editIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },

  // ─── Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  // ─── Menu
  menuBlock: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badgePill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.sm,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginRight: spacing.lg,
  },

  // ─── Action row
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
  },
});
