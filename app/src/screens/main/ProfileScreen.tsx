/**
 * ProfileScreen — v2 Redesign
 *
 * Visual changes:
 *  - Blue court-line cover header with avatar overlapping the seam
 *  - Real stats wired from backend (posts count, accepted connections)
 *  - Star rating shown only when user has been rated
 *  - Animated stat counters on mount (pure RN Animated — no Reanimated yet)
 *  - Menu items grouped into visual card blocks with inner dividers
 *  - Inline action buttons (Log Out / Delete) instead of full-width pills
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
} from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

// ─── Animated counting stat box ───────────────────────────────────────────────
function AnimatedStat({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  const { colors, typography } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value: v }) => setDisplayed(Math.round(v)));
    return () => anim.removeListener(id);
  }, [value]);

  return (
    <View style={[statStyles.box, { backgroundColor: colors.surfaceContainerLowest }]}>
      <View style={[statStyles.iconRing, { backgroundColor: color + '1A' }]}>{icon}</View>
      <Text style={[typography.headlineSmall, { color, marginTop: spacing.xs }]}>{displayed}</Text>
      <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
        {label}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Star rating strip ────────────────────────────────────────────────────────
function StarRating({
  avg,
  count,
  colors,
  typography,
}: {
  avg: number;
  count: number;
  colors: any;
  typography: any;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={15}
          color="#D69E2E"
          fill={s <= Math.round(avg) ? '#D69E2E' : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
      <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.xs }]}>
        {avg.toFixed(1)} · {count} {count === 1 ? 'rating' : 'ratings'}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const { logout, user } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [postCount, setPostCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const coverFade = useRef(new Animated.Value(0)).current;

  const formatSkillLevel = (level: string) => {
    const map: Record<string, string> = {
      beginner: 'Beginner',
      lowIntermediate: 'Low Intermediate',
      highIntermediate: 'High Intermediate',
      advanced: 'Advanced',
      professional: 'Pro',
    };
    return map[level] || level;
  };

  const formatPlayStyle = (style: string) => {
    const map: Record<string, string> = {
      singles: 'Singles',
      doubles: 'Doubles',
      mixed: 'Mixed',
      any: 'Any Style',
    };
    return map[style] || style;
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      coverFade.setValue(0);

      profileApi
        .getProfile()
        .then((res) => {
          setProfileData(res.data);
          setUnreadCount(res.unreadNotificationsCount || 0);
          setPostCount(res.postCount ?? 0);
          setConnectionCount(res.connectionCount ?? 0);
          Animated.timing(coverFade, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }).start();
        })
        .catch((err) => console.error('Failed to load profile', err))
        .finally(() => setLoading(false));
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all data? This cannot be undone.',
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

  // ─── Derived values
  const avatarUrl = profileData?.avatar
    ? `${API_BASE_URL.replace(/\/api$/, '')}${profileData.avatar}`
    : undefined;
  const userName = profileData?.user?.name || user?.name || 'Pickleball Player';
  const userEmail = profileData?.user?.email || user?.email || '';
  const hasRating = (profileData?.ratingCount ?? 0) > 0;

  // ─── Menu groups (two visual blocks) ─────────────────────────────────────
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
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ─── Profile card with blue cover ─── */}
          <Animated.View
            style={[
              styles.profileCard,
              { backgroundColor: colors.surfaceContainerLowest, opacity: coverFade },
            ]}
          >
            {/* Court-patterned cover band */}
            <View style={[styles.coverBand, { backgroundColor: colors.primary }]}>
              <View style={[styles.courtHorizLine, { borderColor: 'rgba(255,255,255,0.15)' }]} />
              <View style={[styles.courtVertLine,  { borderColor: 'rgba(255,255,255,0.15)' }]} />
              <View style={[styles.courtCircle,    { borderColor: 'rgba(255,255,255,0.12)' }]} />
            </View>

            {/* Avatar overlapping cover / body seam */}
            <View style={styles.avatarAnchor}>
              <View style={[styles.avatarRing, { borderColor: colors.surfaceContainerLowest }]}>
                <Avatar name={userName} uri={avatarUrl} size={sizes.avatarXLarge} />
              </View>
            </View>

            {/* Name, email, chips, edit button */}
            <View style={styles.profileBody}>
              <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>{userName}</Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                {userEmail}
              </Text>

              {hasRating && (
                <StarRating
                  avg={profileData.avgRating}
                  count={profileData.ratingCount}
                  colors={colors}
                  typography={typography}
                />
              )}

              <View style={styles.chipRow}>
                {profileData?.skillLevel && (
                  <Badge label={formatSkillLevel(profileData.skillLevel)} variant="primary" size="large" />
                )}
                {(profileData?.city || profileData?.state) && (
                  <Badge
                    label={profileData.city ? `${profileData.city}, ${profileData.state}` : profileData.state}
                    variant="secondary"
                    size="large"
                    style={{ marginLeft: spacing.xs }}
                  />
                )}
                {profileData?.playStyle && (
                  <Badge
                    label={formatPlayStyle(profileData.playStyle)}
                    variant="tertiary"
                    size="large"
                    style={{ marginLeft: spacing.xs }}
                  />
                )}
              </View>

              <Button
                title="Edit Profile"
                onPress={() => navigation.navigate('EditProfile')}
                variant="outline"
                style={{ width: '100%', marginTop: spacing.lg }}
              />
            </View>
          </Animated.View>

          {/* ─── Real stats ─── */}
          <View style={styles.statsRow}>
            <AnimatedStat
              value={postCount}
              label="My Posts"
              color={colors.primary}
              icon={<ClipboardList size={20} color={colors.primary} />}
            />
            <AnimatedStat
              value={connectionCount}
              label="Connections"
              color={colors.success}
              icon={<Users size={20} color={colors.success} />}
            />
          </View>

          {/* ─── Menu blocks ─── */}
          {menuGroups.map((group, gi) => (
            <View
              key={gi}
              style={[styles.menuBlock, { backgroundColor: colors.surfaceContainerLowest }]}
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
                    <Text
                      style={[typography.bodyLarge, { color: colors.onSurface, flex: 1, fontWeight: '500' }]}
                    >
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

          {/* ─── Log out / Delete ─── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.outline }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={18} color={colors.primary} />
              <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: spacing.sm }]}>
                Log Out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { borderColor: colors.errorContainer, backgroundColor: colors.errorContainer },
              ]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={colors.error} />
              <Text style={[typography.labelLarge, { color: colors.error, marginLeft: spacing.sm }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              typography.labelSmall,
              { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.massive },
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: spacing.massive,
  },

  // ─── Profile card
  profileCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: spacing.lg,
  },

  // Cover band
  coverBand: {
    height: 130,
    overflow: 'hidden',
    position: 'relative',
  },
  courtHorizLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 65,
    borderTopWidth: 1.5,
  },
  courtVertLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    borderLeftWidth: 1.5,
  },
  courtCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    top: 65 - 45,
    left: '50%',
    marginLeft: -45,
  },

  // Avatar overlapping seam
  avatarAnchor: {
    alignItems: 'center',
    marginTop: -52,
    zIndex: 10,
  },
  avatarRing: {
    borderWidth: 4,
    borderRadius: 999,
    padding: 3,
  },

  // Body below avatar
  profileBody: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  // Menu block
  menuBlock: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
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
    height: 1,
    marginRight: 0,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
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
